import { NextResponse } from "next/server";

import { rootPrisma } from "@/lib/prisma";
import { createTenant } from "@/lib/tenants";

export async function GET() {
  const tenants = await rootPrisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ tenants });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = (body as { name?: unknown })?.name;
  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  try {
    const tenant = await createTenant(name.trim());
    return NextResponse.json({ tenant }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create tenant";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
