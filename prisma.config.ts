import "dotenv/config"

import { defineConfig } from "prisma/config"

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  // Read directly rather than via env(): generate and validate must work
  // without a database, migrate/seed report a clear error when it is missing.
  // Hosted Postgres usually gives the app a pooled URL (DATABASE_URL); migrations need
  // a direct connection, so the CLI prefers DIRECT_URL when it is set.
  datasource: { url: process.env.DIRECT_URL || process.env.DATABASE_URL },
})
