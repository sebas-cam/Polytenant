import "dotenv/config";
import { defineConfig, env } from "@prisma/config";

// Prisma 7 removed `url` from schema.prisma datasource blocks.
// Migrate reads the connection from this config file; PrismaClient gets it via an adapter at runtime.
// The DATABASE_URL env var is overridden per-tenant at the command line during `prisma migrate deploy`.
export default defineConfig({
  datasource: {
    url: env("DATABASE_URL"),
    shadowDatabaseUrl: env("SHADOW_DATABASE_URL"),
  },
});
