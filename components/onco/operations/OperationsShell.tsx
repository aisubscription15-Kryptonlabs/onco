"use client";

import { RoleGuard } from "@/components/onco/demo/RoleGuard";
import { TopBar } from "@/components/onco/dashboard/TopBar";
import type { DemoRole } from "@/lib/onco/demo/demo-types";
import { OperationsNav, type OperationsNavItem } from "./OperationsNav";
import { SiteScopeBanner } from "./SiteScopeBanner";

export function OperationsShell({
  title,
  nav,
  allowedRoles,
  scope,
  children,
}: {
  title: string;
  nav: OperationsNavItem[];
  allowedRoles: DemoRole[];
  scope: "site" | "platform";
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowed={allowedRoles}>
      <main className="onco-page min-h-ios-screen">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[280px_1fr]">
          <OperationsNav items={nav} title={title} />
          <section className="min-w-0">
            <TopBar title={title} />
            <SiteScopeBanner scope={scope} />
            {children}
          </section>
        </div>
      </main>
    </RoleGuard>
  );
}
