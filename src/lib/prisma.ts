import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  
  // Durante o build, DATABASE_URL pode não estar disponível
  // Retornar um cliente "dummy" que será substituído em runtime
  if (!connectionString) {
    console.warn("DATABASE_URL not defined, using mock PrismaClient for build");
    return new Proxy({} as PrismaClient, {
      get: () => {
        throw new Error("DATABASE_URL is not defined - cannot use Prisma at runtime without it");
      },
    });
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
