import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

// Auto-fallback from Vercel Postgres / Neon integration env vars
if (!process.env.DATABASE_URL) {
  if (process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING) {
    process.env.DATABASE_URL =
      process.env.POSTGRES_PRISMA_URL ||
      process.env.POSTGRES_URL ||
      process.env.POSTGRES_URL_NON_POOLING
  }
}

// If DATABASE_URL is not provided or is SQLite, handle serverless read-only filesystem
const isRemoteDb =
  process.env.DATABASE_URL &&
  (process.env.DATABASE_URL.startsWith('postgres') || process.env.DATABASE_URL.startsWith('mysql'))

if (!isRemoteDb) {
  if (process.env.VERCEL) {
    const tmpDbPath = '/tmp/dev.db'
    if (!fs.existsSync(tmpDbPath)) {
      const bundledDbPath = path.join(process.cwd(), 'prisma', 'dev.db')
      if (fs.existsSync(bundledDbPath)) {
        try {
          fs.copyFileSync(bundledDbPath, tmpDbPath)
        } catch (e) {
          console.warn('Failed to copy bundled db to /tmp:', e)
        }
      }
    }
    process.env.DATABASE_URL = `file:${tmpDbPath}`
  } else if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'file:./dev.db'
  }
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({ log: ['query'] })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
