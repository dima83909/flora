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
  datasource: { url: process.env.DATABASE_URL },
})
