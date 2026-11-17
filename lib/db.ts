import { PrismaClient } from "@prisma/client";

/**
 * Prisma singleton — safe across Next.js hot-reload in dev.
 *
 * Production (Hostinger shared hosting): MySQL runs on the same server
 * at localhost:3306 — zero network latency, connection pool handled by MySQL.
 * No need for connection poolers like PgBouncer.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
