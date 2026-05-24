"use client";

import { usePathname } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";

export function SidebarNavClient() {
  const pathname = usePathname() ?? "/";
  return <AppSidebar pathname={pathname} />;
}
