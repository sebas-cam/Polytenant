import Link from "next/link";
import { Building2, Users } from "lucide-react";

import { rootPrisma } from "@/lib/prisma";
import { SidebarNavClient } from "@/components/sidebar-nav-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function Home() {
  const tenantCount = await rootPrisma.tenant.count();

  return (
    <div className="flex min-h-screen w-full bg-background">
      <SidebarNavClient />
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex h-14 items-center border-b px-6 text-sm font-medium">
          Superadmin dashboard
        </header>
        <main className="flex-1 p-6">
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
              <p className="text-sm text-muted-foreground">Multi-tenant control plane.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Link href="/tenants">
                <Card className="transition-colors hover:bg-accent/40">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tenants</CardTitle>
                    <Building2 className="size-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-semibold">{tenantCount}</div>
                    <CardDescription>Manage tenants and create new databases.</CardDescription>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/users">
                <Card className="transition-colors hover:bg-accent/40">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Users</CardTitle>
                    <Users className="size-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-semibold">View</div>
                    <CardDescription>Aggregated users across all tenant DBs.</CardDescription>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
