import { SidebarNavClient } from "@/components/sidebar-nav-client";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <SidebarNavClient />
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex h-14 items-center border-b px-6 text-sm font-medium">
          Superadmin dashboard
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
