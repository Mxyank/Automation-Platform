
import { createApp } from "../server/app";
import { type Request, type Response } from "express";

// Vercel serverless function entry point
export default async function handler(req: Request, res: Response) {
    const { app } = await createApp();
    app(req, res);
}
