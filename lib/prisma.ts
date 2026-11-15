import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import os from "os";

function getResolvedDatabaseUrl(): string | undefined {
  const envUrl = process.env.DATABASE_URL;

  // Remote database URL (PostgreSQL, Supabase, Turso, Neon)
  if (envUrl && !envUrl.startsWith("file:")) {
    return envUrl;
  }

  // Serverless execution environment (Vercel, AWS Lambda) where task root is read-only
  const isServerless =
    Boolean(process.env.VERCEL) ||
    Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME) ||
    process.env.NODE_ENV === "production";

  if (isServerless) {
    const tmpDbPath = path.join(os.tmpdir(), "grandpal_dev.db");

    // Copy template database to /tmp if it doesn't already exist
    if (!fs.existsSync(tmpDbPath)) {
      const templatePath = path.join(process.cwd(), "prisma", "dev.db");
      if (fs.existsSync(/*turbopackIgnore: true*/ templatePath)) {
        try {
          fs.copyFileSync(templatePath, tmpDbPath);
        } catch (copyErr) {
          console.error("Failed to copy SQLite database to /tmp:", copyErr);
        }
      }
    }

    if (fs.existsSync(tmpDbPath)) {
      return `file:${tmpDbPath}`;
    }
  }

  // Local development: use absolute path to ensure Prisma finds dev.db
  const localDbPath = path.resolve(process.cwd(), "prisma", "dev.db");
  if (fs.existsSync(localDbPath)) {
    return `file:${localDbPath}`;
  }

  return envUrl || "file:./prisma/dev.db";
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

const resolvedUrl = getResolvedDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: resolvedUrl ? { db: { url: resolvedUrl } } : undefined,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
