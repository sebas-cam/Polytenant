import "dotenv/config";
import { syncAllTenants } from "../lib/tenants";
import { rootPrisma } from "../lib/prisma";

async function main() {
  const tenants = await rootPrisma.tenant.findMany({ select: { name: true } });
  console.log(`Syncing ${tenants.length} tenant(s): ${tenants.map((t) => t.name).join(", ") || "(none)"}`);
  await syncAllTenants();
  console.log("Done.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => rootPrisma.$disconnect());
