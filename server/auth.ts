import { storage } from "./storage";
import { logger } from "./logger";
import { redis } from "./redis";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import type { Express } from "express";
import { type User, insertUserSchema } from "@shared/schema";
import { sendOTP, verifyOTP, sendResetLink } from "./services/email";

import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const scryptAsync = promisify(scrypt);
const PostgresStore = connectPg(session);

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
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "development-secret-key-12345",
    resave: false,
    saveUninitialized: false,
    store: new PostgresStore({
      pool: pool,
      createTableIfMissing: true,
    }),
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      secure: app.get("env") === "production",
      httpOnly: true,
      sameSite: "lax",
    },
  };

  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
  }

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email);
        if (!user || !user.password || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid email or password" });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }),
  );

  // Google OAuth Strategy
  const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

  if (googleClientId && googleClientSecret) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: googleClientId,
          clientSecret: googleClientSecret,
          callbackURL: process.env.GOOGLE_REDIRECT_URL || `${process.env.APP_URL || 'http://localhost:5002'}/api/auth/google/callback`
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;
            if (!email) {
              logger.error('Google OAuth error: No email provided');
              return done(null, false);
            }

            let user = await storage.getUserByGoogleId(profile.id);
            if (user) return done(null, user);

            const existingUser = await storage.getUserByEmail(email);
            if (existingUser) return done(null, existingUser);

            user = await storage.createGoogleUser(profile);
            return done(null, user);
          } catch (error) {
            return done(error as Error, false);
          }
        }
      )
    );
  } else {
    // Register a dummy strategy for "google" so passport doesn't crash with "Unknown strategy"
    // But this strategy will always fail if called
    const dummyStrategy: any = new LocalStrategy((u, p, d) => d(new Error("Google OAuth not configured in .env")));
    dummyStrategy.name = 'google';
    passport.use('google', dummyStrategy);
    logger.warn("Google OAuth credentials missing - Google login will be disabled");
  }

  passport.serializeUser((user, done) => done(null, (user as User).id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // OTP routes
  app.post("/api/auth/send-otp", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ message: "Email is required" });

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) return res.status(400).json({ message: "Invalid email format" });

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser && req.path.includes("send-otp")) {
        // If it's registration, block existing emails
        return res.status(400).json({ message: "An account with this email already exists." });
      }

      const result = await sendOTP(email);
      if (!result.success) return res.status(429).json({ message: result.message });

      res.json({ message: result.message });
    } catch (error) {
      res.status(500).json({ message: "Failed to send code" });
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, email, password, otpCode } = req.body;

      if (!username || !email || !password || !otpCode) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const otpResult = verifyOTP(email, otpCode);
      if (!otpResult.valid) return res.status(400).json({ message: otpResult.message });

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) return res.status(400).json({ message: "Email already exists" });

      const user = await storage.createUser({
        username,
        email,
        password: await hashPassword(password),
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error) {
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
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });

  // Password Reset routes
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ message: "Email is required" });

      const user = await storage.getUserByEmail(email);
      // For security, don't reveal if user exists
      if (!user) return res.json({ message: "If an account exists, a reset link has been sent." });

      // Generate a secure random token
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await storage.setPasswordResetToken(user.id, token, expiresAt);

      const result = await sendResetLink(email, token);
      res.json({ message: result.message });
    } catch (error) {
      logger.error("Forgot password error", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) return res.status(400).json({ message: "Token and new password are required" });

      const user = await storage.getUserByResetToken(token);
      if (!user) return res.status(400).json({ message: "Invalid or expired reset link. Please request a new one." });

      const hashed = await hashPassword(newPassword);
      await storage.updateUserPassword(user.id, hashed);

      res.json({ message: "Password reset successful! You can now log in with your new password." });
    } catch (error) {
      logger.error("Reset password error", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Google OAuth routes
  app.get("/api/auth/google", (req, res, next) => {
    if (!googleClientId || !googleClientSecret) {
      return res.status(400).json({ message: "Google OAuth is not configured in .env. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET." });
    }
    passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
  });

  app.get("/api/auth/google/callback", (req, res, next) => {
    if (!googleClientId || !googleClientSecret) {
      return res.redirect("/auth?error=google_not_configured");
    }
    passport.authenticate("google", { failureRedirect: "/auth?error=oauth_failed" })(req, res, next);
  }, (req, res) => {
    res.redirect("/dashboard");
  });
}
