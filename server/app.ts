import express, { type Request, type Response, type NextFunction } from "express";
import { registerRoutes } from "./routes";
import { log } from "./vite";
import { logger } from "./logger";
import { redis } from "./redis";

export async function createApp() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }

        if (logLine.length > 80) {
          logLine = logLine.slice(0, 79) + "…";
        }

        log(logLine);
        
        // Enhanced logging with new logger
        const userId = (req as any).user?.id;
        logger.access(req.method, path, res.statusCode, duration, userId, capturedJsonResponse);
      }
    });

    next();
  });

  // Initialize Redis connection
  if (!redis.isConnected()) {
    await redis.connect();
    logger.info('Redis service initialized');
  }

  const server = await registerRoutes(app);

  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    // Log the error
    const userId = (req as any).user?.id;
    logger.error(`${req.method} ${req.path} - ${message}`, err, userId);

    res.status(status).json({ message });
    throw err;
  });

  return { app, server };
}
