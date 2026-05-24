import { NextResponse } from "next/server";

import { getTenantDesign, updateTenantDesign, validateDesign } from "@/lib/design";

export async function GET(_request: Request, ctx: { params: Promise<{ name: string }> }) {
  const { name } = await ctx.params;
  try {
    const design = await getTenantDesign(name);
    return NextResponse.json({ design });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load design";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}

export async function PUT(request: Request, ctx: { params: Promise<{ name: string }> }) {
  const { name } = await ctx.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const design = validateDesign(body);
    const updated = await updateTenantDesign(name, design);
    return NextResponse.json({ design: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update design";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
