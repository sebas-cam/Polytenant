import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { getTenantDesign } from "@/lib/design";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DesignForm } from "@/components/design-form";

export const dynamic = "force-dynamic";

export default async function DesignEditPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;

  let design;
  try {
    design = await getTenantDesign(name);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/design"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            All tenants
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
          <p className="text-sm text-muted-foreground">
            These settings are stored in the <code>{name}</code> tenant database.
          </p>
        </div>
        <Link
          href={`/preview/${name}`}
          target="_blank"
          className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
        >
          Open preview
          <ExternalLink className="size-3.5" />
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Branding</CardTitle>
          <CardDescription>
            Colors, headline, and description used by the tenant&apos;s public landing page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DesignForm tenantName={name} initial={design} />
        </CardContent>
      </Card>
    </div>
  );
}
