import { execSync } from "node:child_process";
import path from "node:path";

import { rootPrisma } from "@/lib/prisma";

const TENANT_NAME_RE = /^[a-z][a-z0-9_]{0,62}$/;

export function isValidTenantName(name: string) {
  return TENANT_NAME_RE.test(name);
}

function buildConnectionString(dbName: string) {
  const host = process.env.TENANT_DB_HOST;
  const port = process.env.TENANT_DB_PORT ?? "5432";
  const user = process.env.TENANT_DB_USER;
  const password = process.env.TENANT_DB_PASSWORD;
  if (!host || !user || !password) {
    throw new Error("TENANT_DB_HOST / TENANT_DB_USER / TENANT_DB_PASSWORD must be set");
  }
  const encUser = encodeURIComponent(user);
  const encPass = encodeURIComponent(password);
  return `postgresql://${encUser}:${encPass}@${host}:${port}/${dbName}`;
}

export async function createTenant(name: string) {
  if (!isValidTenantName(name)) {
    throw new Error(
      `Invalid tenant name "${name}". Use lowercase letters, digits, underscores; must start with a letter.`
    );
  }

  // 1. Create the per-tenant database. Name is validated, but quote for safety.
  await rootPrisma.$executeRawUnsafe(`CREATE DATABASE "${name}"`);

  // 2. Build the connection string and register in the central DB.
  const connectionString = buildConnectionString(name);

  const tenant = await rootPrisma.tenant.create({
    data: { name, connectionString },
  });

  // 3. Apply tenant migrations to the new DB.
  const schemaPath = path.join(process.cwd(), "prisma/tenant/schema.prisma");
  execSync(`npx prisma migrate deploy --schema "${schemaPath}"`, {
    env: { ...process.env, DATABASE_URL: connectionString },
    stdio: "pipe",
  });

  return tenant;
}

export async function syncAllTenants() {
  const tenants = await rootPrisma.tenant.findMany();
  const schemaPath = path.join(process.cwd(), "prisma/tenant/schema.prisma");
  for (const tenant of tenants) {
    execSync(`npx prisma migrate deploy --schema "${schemaPath}"`, {
      env: { ...process.env, DATABASE_URL: tenant.connectionString },
      stdio: "pipe",
    });
  }
}
