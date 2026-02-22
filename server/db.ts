import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },

  // 🔒 Neon + Docker tuning
  max: 3,
  connectionTimeoutMillis: 30000,  // 30s for Neon cold starts
  idleTimeoutMillis: 30000,
});

// Prevent unhandled pool errors from crashing the process
pool.on("error", (err) => {
  console.error("[DB Pool Error] Background client error:", err.message);
});

export const db = drizzle({ client: pool, schema });
