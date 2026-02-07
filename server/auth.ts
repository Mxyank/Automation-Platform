import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import connectPg from "connect-pg-simple";
import { RedisStore } from "connect-redis";
import { pool } from "./db";
import { logger } from "./logger";
import { redis } from "./redis";

declare global {
  namespace Express {
    interface User extends SelectUser { }
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  // Use Redis for sessions if available, otherwise fall back to PostgreSQL
  // Use Redis for sessions if available, otherwise fall back to PostgreSQL, then MemoryStore
  let sessionStore;
  try {
    if (redis.isConnected() && redis.getClient()) {
      sessionStore = new RedisStore({
        client: redis.getClient(),
        prefix: "prometix:sess:",
      });
      logger.info('Using Redis session store');
    } else {
      throw new Error('Redis not available');
    }
  } catch (redisError) {
    try {
      logger.warn('Redis unavailable, falling back to PostgreSQL sessions');
      const PostgresSessionStore = connectPg(session);
      sessionStore = new PostgresSessionStore({
        pool,
        createTableIfMissing: true
      });
      logger.info('Using PostgreSQL session store');
    } catch (pgError) {
      logger.error('PostgreSQL session store failed, falling back to MemoryStore', pgError);
      sessionStore = new session.MemoryStore();
    }
  }

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "devops-cloud-secret-key",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: 'email' },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user) {
            logger.auth('login', email, false, undefined, 'User not found');
            return done(null, false);
          }

          if (!user.password) {
            logger.auth('login', email, false, undefined, 'User has no password (likely OAuth user)');
            return done(null, false);
          }

          const isValid = await comparePasswords(password, user.password);
          if (!isValid) {
            logger.auth('login', email, false, undefined, 'Invalid password');
            return done(null, false);
          }

          logger.auth('login', email, true);
          return done(null, user);
        } catch (error) {
          logger.error('Authentication error', error);
          return done(error);
        }
      }
    ),
  );

  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: process.env.REPLIT_DOMAINS
            ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}/api/auth/google/callback`
            : "http://localhost:5002/api/auth/google/callback"
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;
            if (!email) {
              logger.error('Google OAuth error: No email provided');
              return done(null, false);
            }

            // Check if user already exists with this Google ID
            let user = await storage.getUserByGoogleId(profile.id);

            if (user) {
              logger.auth('google-login', email, true, String(user.id));
              return done(null, user);
            }

            // Check if user exists with same email (from local auth)
            const existingUser = await storage.getUserByEmail(email);
            if (existingUser) {
              // Link Google account to existing user
              logger.auth('google-link', email, true, String(existingUser.id));
              return done(null, existingUser);
            }

            // Create new user from Google profile
            user = await storage.createGoogleUser(profile);
            logger.auth('google-register', email, true, String(user.id));
            return done(null, user);
          } catch (error) {
            logger.error('Google OAuth error', error);
            return done(error as Error, false);
          }
        }
      )
    );
  }

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, email, password } = req.body;

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        logger.auth('register', email, false, req.ip, 'Email already exists');
        return res.status(400).json({ message: "Email already exists" });
      }

      const user = await storage.createUser({
        username,
        email,
        password: await hashPassword(password),
      });

      logger.auth('register', email, true, req.ip);
      logger.info('New user registered', { userId: user.id, username, email });

      req.login(user, (err) => {
        if (err) {
          logger.error('Login after registration failed', err, user.id);
          return next(err);
        }
        res.status(201).json(user);
      });
    } catch (error) {
      logger.error('Registration error', error);
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: "Invalid email or password" });
      req.login(user, (err) => {
        if (err) return next(err);
        return res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    const userId = (req as any).user?.id;
    const email = (req as any).user?.email;

    req.logout((err) => {
      if (err) {
        logger.error('Logout error', err, userId);
        return next(err);
      }
      logger.auth('logout', email || 'unknown', true, req.ip);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });

  // Google OAuth routes
  app.get("/api/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
  );

  app.get("/api/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/auth?error=oauth_failed" }),
    (req, res) => {
      // Successful authentication, redirect to dashboard
      logger.info('Google OAuth callback successful', { user: req.user?.email }, req.user?.id);
      res.redirect("/dashboard");
    }
  );
}
