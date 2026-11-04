import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

export const db =
  globalThis.prisma ||
  (typeof window === "undefined"
    ? new PrismaClient()
    : ({} as PrismaClient));

if (process.env.NODE_ENV !== "production") globalThis.prisma = db;
