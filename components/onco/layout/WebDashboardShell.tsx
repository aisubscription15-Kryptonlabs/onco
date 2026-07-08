"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DemoBanner } from "@/components/onco/demo/DemoBanner";
import { RoleGuard } from "@/components/onco/demo/RoleGuard";
import { cn } from "@/lib/utils";
import type { DemoRole } from "@/lib/onco/demo/demo-types";

type NavItem = {
  label: string;
  href: string;
};

type WebDashboardShellProps = {
  title: string;
  role: DemoRole[];
  nav: NavItem[];
  children: React.ReactNode;
};

export function WebDashboardShell({ title, role, nav, children }: WebDashboardShellProps) {
  const pathname = usePathname();

  return (
    <RoleGuard allowed={role}>
      <main className="onco-page min-h-ios-screen">
        <DemoBanner />
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[240px_1fr]">
          <aside className="h-fit rounded-onco-lg bg-onco-sage p-4 text-onco-cream shadow-onco">
            <Link className="onco-display block text-xl font-extrabold" href="/">
              OncoMotionRx
            </Link>
            <p className="mt-1 text-xs text-[#A9C5B4]">{title}</p>
            <nav className="mt-6 space-y-1">
              {nav.map((item) => (
                <Link
                  className={cn(
                    "block rounded-2xl px-3 py-2 text-sm font-semibold text-[#C7D8CC] hover:bg-onco-cream/10",
                    pathname === item.href && "bg-onco-cream text-onco-sage hover:bg-onco-cream",
                  )}
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>
          <section className="min-w-0">{children}</section>
        </div>
      </main>
    </RoleGuard>
  );
}
