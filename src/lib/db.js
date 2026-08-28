import { PrismaClient } from '@prisma/client';

/**
 * على Vercel قد تُضاف روابط Postgres بأسماء تلقائية (Prisma Postgres / Neon).
 * إن لم يكن DATABASE_URL مضبوطاً، نستخدم أحدها تلقائياً.
 */
if (typeof process !== 'undefined' && !process.env.DATABASE_URL) {
  const fallback =
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_URL ||
    process.env.PRISMA_POSTGRES_URL ||
    process.env.PRISMA_DATABASE_URL;
  if (fallback) process.env.DATABASE_URL = fallback;
}

const globalForPrisma = globalThis;
export const prisma = globalForPrisma.prisma || new PrismaClient({ log: ['error'] });
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
