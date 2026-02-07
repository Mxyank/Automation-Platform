# macOS and Docker Setup Guide

## Port Conflict Resolution (macOS)
macOS uses ports 5000 and 5001 for "AirPlay Receiver". This app has been moved to port **5002** to avoid conflicts.

## Prerequisites
- Docker Desktop installed
- Node.js 20+ installed

## Local Development (No Docker)
1. Install dependencies: `npm install`
2. Set up environment variables in a `.env` file (see `.env.example`)
3. Run the app: `npm run dev`
4. Access at: `http://localhost:5002`

## Docker Setup
1. Create a `.env` file with your `DATABASE_URL` and `SESSION_SECRET`.
2. Build and start the containers:
   ```bash
   docker-compose up --build
   ```
3. The app will be available at `http://localhost:5002`.
4. To run in background: `docker-compose up -d`.

## Environment Variables
- `DATABASE_URL`: Your PostgreSQL connection string.
- `SESSION_SECRET`: A long random string for session security.
- `REDIS_URL`: (Optional) Redis connection string if not using the compose service.
