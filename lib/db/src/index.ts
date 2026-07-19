import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  // Don't throw: in a serverless function this module is part of the shared
  // import graph, and a module-scope throw kills every route at cold start.
  // With no connection string the pool fails at query time instead, which
  // scopes the failure to the routes that actually hit the database.
  console.error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

export * from "./schema";
