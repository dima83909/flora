import "server-only"

import { PrismaPg } from "@prisma/adapter-pg"

import { PrismaClient } from "@/generated/prisma/client"

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

function createClient() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env and point it at PostgreSQL.")
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) })
}

/**
 * Shared Prisma client. Created on first use so importing this module never
 * requires a database (e.g. during a build that does not query it); reused
 * across hot reloads in development to avoid exhausting connections.
 */
export function getDb() {
  globalForPrisma.prisma ??= createClient()
  return globalForPrisma.prisma
}
