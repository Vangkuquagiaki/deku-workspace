import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

const defaultDatabaseUrl =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_tAyTO48ksNPj@ep-quiet-butterfly-az2lsvql-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require";

export const db =
  globalThis.prisma ||
  (typeof window === "undefined"
    ? new PrismaClient({
        datasources: {
          db: {
            url: defaultDatabaseUrl
          }
        }
      })
    : ({} as PrismaClient));

globalThis.prisma = db;
