@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

- **Next.js 16.2.6** (App Router, Turbopack). See `AGENTS.md` — APIs differ from training data; consult `node_modules/next/dist/docs/` before writing Next-specific code.
- **React 19.2**, **Tailwind v4** (CSS-only config via `@theme inline` in `app/globals.css`, no `tailwind.config.*`).
- **Prisma 7.8** with the `@prisma/adapter-pg` driver adapter and direct `pg` for raw `CREATE DATABASE` calls.
- **shadcn/ui** (style: `new-york`, registered in `components.json`). No CLI was run — components live directly in `components/ui/`.

## Commands

```bash
npm run dev                # next dev (Turbopack)
npm run build              # production build
npm run lint               # eslint

# Prisma — always pass --schema; this repo has two schemas.
npx prisma generate --schema prisma/schema.prisma          # root client → node_modules/.prisma/root-client
npx prisma generate --schema prisma/tenant/schema.prisma   # tenant client → node_modules/.prisma/tenant-client

npx prisma migrate deploy --schema prisma/schema.prisma                          # apply to central DB
DATABASE_URL="postgresql://.../<tenant_db>" \
  npx prisma migrate deploy --schema prisma/tenant/schema.prisma                 # apply tenant schema to one tenant DB

# Generating a new tenant migration (no live DB required):
DATABASE_URL="postgres://x" npx prisma migrate diff \
  --from-migrations prisma/tenant/migrations \
  --to-schema prisma/tenant/schema.prisma \
  --script -o prisma/tenant/migrations/<NNNN_name>/migration.sql
```

## Architecture

This is a multi-tenant control plane where the **superadmin app talks to a central Postgres DB**, and **each tenant gets its own Postgres database** on the same instance. The schemas of the two are intentionally separate Prisma projects.

### Two Prisma schemas, two generated clients

| | `prisma/schema.prisma` | `prisma/tenant/schema.prisma` |
|---|---|---|
| Purpose | Tenant registry (`Tenant` model) | Per-tenant data (`User`, …) |
| Generated client output | `node_modules/.prisma/root-client` | `node_modules/.prisma/tenant-client` |
| Migrations dir | `prisma/migrations/` | `prisma/tenant/migrations/` |
| Imported as | `RootPrismaClient` in `lib/prisma.ts` | `TenantPrismaClient` in `lib/prisma.ts` |

When changing the **tenant** schema, create a new migration in `prisma/tenant/migrations/` and call `syncAllTenants()` (`lib/tenants.ts`) — it iterates `Tenant` rows and runs `prisma migrate deploy` against each `connectionString`.

### Prisma 7 — non-obvious breaking changes already absorbed here

- **`url` was removed from `datasource db { ... }`.** Both schemas only declare `provider = "postgresql"`. The connection comes from `prisma.config.ts` (for the CLI: Migrate, db push, etc.) and from a `PrismaPg` adapter passed to `new PrismaClient({ adapter })` at runtime.
- **`prisma.config.ts` does not auto-load `.env`.** It imports `dotenv/config` explicitly. If you add another root-level Prisma config or migration script, do the same.
- **`prisma migrate diff` flag rename:** `--to-schema-datamodel` is gone, use `--to-schema` (and `--from-schema`).

### Tenant creation flow (`lib/tenants.ts`)

`createTenant(name)`:
1. Validates `name` against `^[a-z][a-z0-9_]{0,62}$` (the value is interpolated into `CREATE DATABASE "<name>"` via `$executeRawUnsafe`; **do not relax this regex without quoting**).
2. `CREATE DATABASE "<name>"` on the central connection.
3. Inserts a `Tenant` row with a `connectionString` built from `TENANT_DB_HOST/PORT/USER/PASSWORD` env vars.
4. `execSync("npx prisma migrate deploy --schema prisma/tenant/schema.prisma", { env: { ..., DATABASE_URL: connectionString } })`.

This runs synchronously inside the API route (`app/api/tenants/route.ts`). For production scale, lift step 4 into a background job — leaving it inline is an intentional MVP trade-off.

### Prisma client lifetime (`lib/prisma.ts`)

- `rootPrisma` is a module-level singleton (with a `globalThis.__rootPrisma` guard for dev HMR).
- `getTenantPrisma(connectionString)` memoizes one `TenantPrismaClient` per connection string in `tenantClientCache`. **Never construct a fresh `TenantPrismaClient` per request** — each one opens a `pg.Pool`.

### Routing

- `app/page.tsx` — overview, renders its **own** sidebar/header (not in the `(dashboard)` group).
- `app/(dashboard)/layout.tsx` — sidebar+header chrome for `/tenants` and `/users`.
- `app/(dashboard)/users/page.tsx` reads from **every** tenant DB in parallel (`Promise.all` over `Tenant` rows). Failures are caught per-tenant and shown inline.
- API: `app/api/tenants/route.ts` (`GET` list, `POST` create).

### Environment

`.env` keys (all required server-side; none are `NEXT_PUBLIC_`):
- `DATABASE_URL` — central DB
- `TENANT_DB_HOST`, `TENANT_DB_PORT`, `TENANT_DB_USER`, `TENANT_DB_PASSWORD` — used by `buildConnectionString()` when a tenant is created

The Postgres user must have `CREATEDB` privilege.
