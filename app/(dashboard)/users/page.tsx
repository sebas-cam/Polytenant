import { rootPrisma, getTenantPrisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const tenants = await rootPrisma.tenant.findMany({ orderBy: { name: "asc" } });

  const tenantData = await Promise.all(
    tenants.map(async (tenant) => {
      try {
        const client = getTenantPrisma(tenant.connectionString);
        const users = await client.user.findMany({ orderBy: { createdAt: "desc" } });
        return { tenant, users, error: null as null | string };
      } catch (err) {
        return {
          tenant,
          users: [],
          error: err instanceof Error ? err.message : "Failed to load users",
        };
      }
    })
  );

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Users by tenant</h1>
        <p className="text-sm text-muted-foreground">
          One section per tenant DB. Read directly from each tenant Prisma client.
        </p>
      </div>

      {tenantData.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            No tenants yet. Create one from the Tenants page.
          </CardContent>
        </Card>
      ) : (
        tenantData.map(({ tenant, users, error }) => (
          <Card key={tenant.id}>
            <CardHeader>
              <CardTitle>{tenant.name}</CardTitle>
              <CardDescription>{users.length} user(s)</CardDescription>
            </CardHeader>
            <CardContent>
              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          No users.
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.email}</TableCell>
                          <TableCell>{u.name ?? "—"}</TableCell>
                          <TableCell>{u.createdAt.toLocaleString()}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
