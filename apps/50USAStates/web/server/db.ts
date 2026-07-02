import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../shared/schema";

function cleanEnv(value?: string): string {
  return (value || "").replace(/\\r?\\n/g, "").trim();
}

const databaseUrl = cleanEnv(process.env.DATABASE_URL);

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new pg.Pool({ connectionString: databaseUrl });

export const db = drizzle(pool, { schema });
