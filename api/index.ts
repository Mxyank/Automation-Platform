
import { createApp } from "../server/app";
import { type Request, type Response } from "express";

let appCache: any = null;

// Vercel serverless function entry point
export default async function handler(req: Request, res: Response) {
    try {
        if (!appCache) {
            const { app } = await createApp();
            appCache = app;
        }
        appCache(req, res);
    } catch (error: any) {
        console.error("Critical Server Startup Error:", error);
        res.status(500).json({
            error: "Server Startup Failed",
            details: error.message,
            code: "STARTUP_ERROR",
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}
