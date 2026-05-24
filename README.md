# Polytenant

> A superadmin control plane for provisioning and managing **one Postgres database per tenant** — built with Next.js 16, Prisma 7, and shadcn/ui.

Polytenant gives you a single dashboard where you create tenants, and each tenant gets its **own real Postgres database** (not a shared schema, not a `tenant_id` column). When you evolve the tenant schema, one command fans the migrations out to every tenant DB.

---

## Why one database per tenant?

| Approach | Isolation | Per-tenant backup/restore | Noisy-neighbor blast radius | Per-tenant custom indexes/extensions |
|---|---|---|---|---|
| Shared table + `tenant_id` column | Logical only | Hard | App-wide | No |
| Shared DB, schema per tenant | Better | OK | DB-wide | Limited |
| **DB per tenant** *(this project)* | Strong | Trivial (`pg_dump <db>`) | DB-only | Yes |

Trade-off: you pay in connections and operational tooling. Polytenant keeps the tooling cost low by automating provisioning and schema sync.

---

## How it works

```
                       ┌───────────────────────────┐
                       │   Polytenant dashboard   │
                       │   (Next.js, superadmin)   │
                       └────────────┬──────────────┘
                                    │
                  ┌─────────────────┴──────────────────┐
                  │                                    │
        ┌─────────▼─────────┐               ┌──────────▼──────────┐
        │  Central DB       │               │  Tenant DBs         │
        │  (DATABASE_URL)   │               │  (one per tenant)   │
        │                   │               │                     │
        │  Tenant {         │   tracks ►    │  empresa_x          │
        │    id             │               │    User, ...        │
        │    name           │               │  acme_co            │
        │    connectionStr  │               │    User, ...        │
        │  }                │               │  ...                │
        └───────────────────┘               └─────────────────────┘
```

Two **separate** Prisma schemas, two generated clients:

| | Central | Per-tenant |
|---|---|---|
| Schema file | `prisma/schema.prisma` | `prisma/tenant/schema.prisma` |
| Generated client | `node_modules/.prisma/root-client` | `node_modules/.prisma/tenant-client` |
| Migrations | `prisma/migrations/` | `prisma/tenant/migrations/` |
| Imported as | `rootPrisma` | `getTenantPrisma(connStr)` |

### Creating a tenant

`POST /api/tenants { "name": "empresa_x" }` runs `createTenant()` in `lib/tenants.ts`:

1. Validate `name` against `^[a-z][a-z0-9_]{0,62}$` (the value is interpolated into raw SQL, so this is a security boundary).
2. `CREATE DATABASE "empresa_x"` on the central connection.
3. Insert a `Tenant` row in the central DB with a connection string built from `TENANT_DB_*` env vars.
4. `npx prisma migrate deploy --schema prisma/tenant/schema.prisma` with `DATABASE_URL` set to the new tenant's connection string.

The new DB is now fully migrated and registered.

### Updating one schema, syncing every tenant

1. Edit `prisma/tenant/schema.prisma`.
2. Generate a new migration file (no live DB required):
   ```bash
   DATABASE_URL="postgres://x" npx prisma migrate diff \
     --from-migrations prisma/tenant/migrations \
     --to-schema prisma/tenant/schema.prisma \
     --script -o prisma/tenant/migrations/0002_<name>/migration.sql
   ```
3. Regenerate the tenant client:
   ```bash
   npx prisma generate --schema prisma/tenant/schema.prisma
   ```
4. Call `syncAllTenants()` from `lib/tenants.ts` — it iterates every `Tenant` row and runs `prisma migrate deploy` against each connection string. `migrate deploy` is idempotent (it reads `_prisma_migrations` in each DB and only applies what's missing).

---

## Quick start

### Prerequisites

- Node 20+
- A Postgres instance reachable from your machine
- A Postgres user with **`CREATEDB`** privilege (required to provision tenant DBs)

### Setup

```bash
git clone <repo>
cd tenant-forge
npm install

cp .env.example .env
# Fill in DATABASE_URL and TENANT_DB_* (host/port/user/password used to build tenant connection strings)

npx prisma generate --schema prisma/schema.prisma
npx prisma generate --schema prisma/tenant/schema.prisma
npx prisma migrate deploy --schema prisma/schema.prisma   # creates the Tenant table

npm run dev
# → http://localhost:3000
```

Create a tenant from the **Tenants** page, then visit **Users** to see per-tenant data once you insert some.

### Environment variables

| Var | Purpose |
|---|---|
| `DATABASE_URL` | Central DB — stores the Tenant registry |
| `TENANT_DB_HOST` | Host used when building per-tenant connection strings |
| `TENANT_DB_PORT` | (default `5432`) |
| `TENANT_DB_USER` | Must have `CREATEDB` |
| `TENANT_DB_PASSWORD` | |

---

## Stack

- **Next.js 16.2** (App Router, Turbopack) — note: this version has breaking changes vs. older docs/training data; see `AGENTS.md`
- **React 19.2**
- **Tailwind v4** (CSS-only config, no `tailwind.config.*`)
- **Prisma 7.8** with **`@prisma/adapter-pg`** driver adapter — Prisma 7 removed `url` from `datasource` blocks; the connection now comes from `prisma.config.ts` (CLI) and from an adapter at runtime
- **shadcn/ui** (`new-york` style)
- **`pg`** for raw `CREATE DATABASE` calls

---

## Project layout

```
app/
  (dashboard)/
    layout.tsx          # sidebar + header for /tenants and /users
    tenants/page.tsx    # list + create form
    users/page.tsx      # aggregated users across every tenant DB
  api/tenants/route.ts  # GET (list) / POST (create)
  page.tsx              # overview (own chrome, not in the (dashboard) group)
components/
  ui/                   # shadcn primitives (button, input, card, table, ...)
  app-sidebar.tsx
  create-tenant-form.tsx
lib/
  prisma.ts             # rootPrisma singleton + getTenantPrisma(connStr) memoized cache
  tenants.ts            # createTenant() + syncAllTenants()
  utils.ts              # cn() helper
prisma/
  schema.prisma         # central — Tenant model
  migrations/           # central migrations
  tenant/
    schema.prisma       # per-tenant — User, ...
    migrations/         # tenant migrations (deployed to every tenant DB)
prisma.config.ts        # Prisma 7 config (loads .env, exposes DATABASE_URL to CLI)
```

---

## Production notes — known MVP trade-offs

These are intentional shortcuts. Address before going to production:

- **Provisioning runs inside the HTTP request.** `createTenant` calls `execSync('npx prisma migrate deploy ...')` from the API route. With many migrations or slow DBs this will exceed request timeouts. Move it to a background job (queue + worker) and return a job ID.
- **`syncAllTenants` is sequential and not exposed.** It's a function in `lib/tenants.ts` with no route or UI. Add an admin endpoint and parallelize with a bounded concurrency pool. Per-tenant failures should be collected, not abort the rest.
- **No rollback across tenants.** A failing migration on tenant N leaves tenants 1..N-1 already migrated. Use expand-then-contract migration patterns for anything destructive.
- **Orphaned databases on partial failure.** Between `CREATE DATABASE` and `tenant.create`, a crash leaves a physical DB with no registry row. Add a periodic cleanup that diffs `pg_database` vs. the `Tenant` table.
- **Connection pools per tenant.** `getTenantPrisma()` caches one `PrismaClient` (and underlying `pg.Pool`) per connection string indefinitely. With many tenants on one Node process you can exhaust Postgres `max_connections`. Add an LRU eviction or use external pooling (PgBouncer / Supavisor).
- **No authentication.** The dashboard and API are wide open. Put it behind an auth layer (e.g., NextAuth, Clerk, or a reverse proxy with mTLS) before exposing it.
- **The central `DATABASE_URL` user has `CREATEDB`.** That's necessary to provision tenants but means a compromised app can create unlimited DBs. Consider rate-limiting and monitoring.

---

## License

UNLICENSED — internal project.
