import { NextResponse } from "next/server";

import { rootPrisma } from "@/lib/prisma";
import { syncAllTenants } from "@/lib/tenants";

export async function POST() {
  const started = Date.now();
  const tenants = await rootPrisma.tenant.findMany({ select: { id: true, name: true } });

  try {
    await syncAllTenants();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed";
    return NextResponse.json({ error: message, attempted: tenants.length }, { status: 500 });
  }

  return NextResponse.json({
    synced: tenants.length,
    tenants: tenants.map((t) => t.name),
    durationMs: Date.now() - started,
  });
}
