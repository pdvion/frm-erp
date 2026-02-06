import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  
  // Durante o build, DATABASE_URL pode não estar disponível
  if (!connectionString) {
    console.warn("DATABASE_URL not defined, using mock PrismaClient for build");
    return new Proxy({} as PrismaClient, {
      get: () => {
        throw new Error("DATABASE_URL is not defined - cannot use Prisma at runtime without it");
      },
    });
  }

  // Pool com SSL para Supabase Supavisor
  const pool = new pg.Pool({ 
    connectionString,
    max: 3,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl: {
      rejectUnauthorized: false,
    },
  });
  
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
