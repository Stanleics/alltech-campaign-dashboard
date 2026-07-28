import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // CLI commands (migrate, studio, generate) need a direct/session-mode
    // connection — Supabase's transaction-mode pooler (DATABASE_URL) doesn't
    // support the prepared statements/DDL these require. The running app
    // (src/lib/prisma.ts) still connects via DATABASE_URL directly.
    // `||` (not `??`) because an unset-but-present DIRECT_URL in .env
    // (`DIRECT_URL=`) loads as an empty string, not undefined.
    url: process.env.DIRECT_URL || process.env.DATABASE_URL,
  },
});
