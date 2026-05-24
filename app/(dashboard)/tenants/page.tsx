import { rootPrisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreateTenantForm } from "@/components/create-tenant-form";
import { SyncTenantsButton } from "@/components/sync-tenants-button";

export const dynamic = "force-dynamic";

export default async function TenantsPage() {
  const tenants = await rootPrisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Tenants</h1>
        <p className="text-sm text-muted-foreground">
          Each tenant gets its own Postgres database, registered in the central DB and migrated on creation.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create tenant</CardTitle>
          <CardDescription>
            Creates the database, registers it, and runs <code>prisma migrate deploy</code> against it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateTenantForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle>Registered tenants</CardTitle>
            <CardDescription>{tenants.length} total</CardDescription>
          </div>
          <SyncTenantsButton />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Database</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No tenants yet.
                  </TableCell>
                </TableRow>
              ) : (
                tenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-medium">{tenant.name}</TableCell>
                    <TableCell>{tenant.createdAt.toLocaleString()}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {redactConnString(tenant.connectionString)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function redactConnString(conn: string) {
  return conn.replace(/:\/\/([^:]+):[^@]+@/, "://$1:***@");
}
