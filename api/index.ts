
import { createApp } from "../server/app";
import { type Request, type Response } from "express";

let appCache: any = null;

// Vercel serverless function entry point
export default async function handler(req: Request, res: Response) {
    if (!appCache) {
        const { app } = await createApp();
        appCache = app;
    }
    appCache(req, res);
}
