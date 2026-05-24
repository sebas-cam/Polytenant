import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { rootPrisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function DesignIndexPage() {
  const tenants = await rootPrisma.tenant.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Design</h1>
        <p className="text-sm text-muted-foreground">
          Edit the landing page branding (colors, headline, description) for each tenant. Settings live
          inside that tenant&apos;s database and render on its public subdomain.
        </p>
      </div>

      {tenants.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            No tenants yet. Create one from the Tenants page.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {tenants.map((tenant) => (
            <Link key={tenant.id} href={`/design/${tenant.name}`}>
              <Card className="transition-colors hover:bg-accent/40">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle>{tenant.name}</CardTitle>
                    <CardDescription>Edit landing branding →</CardDescription>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground" />
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
