import { PrismaClient as RootPrismaClient } from "../node_modules/.prisma/root-client";
import { PrismaClient as TenantPrismaClient } from "../node_modules/.prisma/tenant-client";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
  var __rootPrisma: RootPrismaClient | undefined;
}

function makeRootClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new RootPrismaClient({ adapter });
}

export const rootPrisma: RootPrismaClient =
  globalThis.__rootPrisma ?? makeRootClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__rootPrisma = rootPrisma;
}

const tenantClientCache = new Map<string, TenantPrismaClient>();

export function getTenantPrisma(connectionString: string): TenantPrismaClient {
  let client = tenantClientCache.get(connectionString);
  if (!client) {
    const adapter = new PrismaPg({ connectionString });
    client = new TenantPrismaClient({ adapter });
    tenantClientCache.set(connectionString, client);
  }
  return client;
}

export type { RootPrismaClient, TenantPrismaClient };
