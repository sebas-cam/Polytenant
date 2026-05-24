import { rootPrisma, getTenantPrisma } from "@/lib/prisma";

export type TenantDesign = {
  primaryColor: string;
  secondaryColor: string;
  headline: string;
  description: string;
};

const SINGLETON_ID = "singleton";

async function tenantByName(name: string) {
  const tenant = await rootPrisma.tenant.findUnique({ where: { name } });
  if (!tenant) throw new Error(`Tenant "${name}" not found`);
  return tenant;
}

// Builds a tenant connection string from env vars without consulting admin.
// Works because in the current architecture: subdomain === tenant.name === db name.
//
// Trade-offs vs. going through admin (rootPrisma.tenant.findUnique):
//   - No way to read tenant.status (suspended / deleted) before serving.
//   - No way to support custom domains (e.g. empresa.com → tenant_x).
//   - No way to move a tenant to a different host/instance later.
// When any of those become real requirements, replace this with an admin lookup
// backed by an in-memory cache (TTL ~60s) — that keeps latency similar.
function buildTenantConnString(name: string) {
  const host = process.env.TENANT_DB_HOST;
  const port = process.env.TENANT_DB_PORT ?? "5432";
  const user = process.env.TENANT_DB_USER;
  const password = process.env.TENANT_DB_PASSWORD;
  if (!host || !user || !password) {
    throw new Error("TENANT_DB_HOST / TENANT_DB_USER / TENANT_DB_PASSWORD must be set");
  }
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${name}`;
}

export async function getTenantDesign(name: string): Promise<TenantDesign> {
  const tenant = await tenantByName(name);
  const client = getTenantPrisma(tenant.connectionString);
  // upsert handles tenants that existed before this feature was added
  const row = await client.tenantSettings.upsert({
    where: { id: SINGLETON_ID },
    create: { id: SINGLETON_ID, headline: tenant.name },
    update: {},
  });
  return {
    primaryColor: row.primaryColor,
    secondaryColor: row.secondaryColor,
    headline: row.headline,
    description: row.description,
  };
}

// Landing-page variant: skips the admin DB lookup and goes straight to the tenant DB.
// One round-trip instead of two. Used by /preview/[name] (rendered on tenant subdomains).
// If the tenant DB doesn't exist, the Postgres connection will throw — the caller
// is expected to map that to a 404.
//
// Use getTenantDesign() (above) from superadmin contexts where you also need
// tenant metadata (id, createdAt, etc.). Use this one for the public landing.
export async function getLandingDesign(name: string): Promise<TenantDesign> {
  const client = getTenantPrisma(buildTenantConnString(name));
  const row = await client.tenantSettings.upsert({
    where: { id: SINGLETON_ID },
    create: { id: SINGLETON_ID, headline: name },
    update: {},
  });
  return {
    primaryColor: row.primaryColor,
    secondaryColor: row.secondaryColor,
    headline: row.headline,
    description: row.description,
  };
}

export async function updateTenantDesign(name: string, design: TenantDesign): Promise<TenantDesign> {
  const tenant = await tenantByName(name);
  const client = getTenantPrisma(tenant.connectionString);
  const row = await client.tenantSettings.upsert({
    where: { id: SINGLETON_ID },
    create: { id: SINGLETON_ID, ...design },
    update: design,
  });
  return {
    primaryColor: row.primaryColor,
    secondaryColor: row.secondaryColor,
    headline: row.headline,
    description: row.description,
  };
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export function validateDesign(input: unknown): TenantDesign {
  if (!input || typeof input !== "object") throw new Error("Invalid body");
  const { primaryColor, secondaryColor, headline, description } = input as Record<string, unknown>;

  if (typeof primaryColor !== "string" || !HEX_RE.test(primaryColor))
    throw new Error("primaryColor must be a #RRGGBB hex");
  if (typeof secondaryColor !== "string" || !HEX_RE.test(secondaryColor))
    throw new Error("secondaryColor must be a #RRGGBB hex");
  if (typeof headline !== "string" || !headline.trim() || headline.length > 120)
    throw new Error("headline is required (≤ 120 chars)");
  if (typeof description !== "string" || description.length > 1000)
    throw new Error("description must be ≤ 1000 chars");

  return { primaryColor, secondaryColor, headline: headline.trim(), description };
}
