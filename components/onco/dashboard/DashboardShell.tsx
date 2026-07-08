"use client";

import { RoleGuard } from "@/components/onco/demo/RoleGuard";
import type { DemoRole } from "@/lib/onco/demo/demo-types";
import { SidebarNav, type DashboardNavItem } from "./SidebarNav";
import { TopBar } from "./TopBar";

export function DashboardShell({
  title,
  nav,
  allowedRoles,
  children,
}: {
  title: string;
  nav: DashboardNavItem[];
  allowedRoles: DemoRole[];
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowed={allowedRoles}>
      <main className="onco-page min-h-ios-screen">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[250px_1fr]">
          <SidebarNav items={nav} title={title} />
          <section className="min-w-0">
            <TopBar title={title} />
            {children}
          </section>
        </div>
      </main>
    </RoleGuard>
  );
}
