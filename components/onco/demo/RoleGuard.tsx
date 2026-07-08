"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useDemoStore } from "@/lib/onco/demo/demo-store";
import type { DemoRole } from "@/lib/onco/demo/demo-types";

type RoleGuardProps = {
  allowed: DemoRole[];
  children: React.ReactNode;
};

export function RoleGuard({ allowed, children }: RoleGuardProps) {
  const router = useRouter();
  const { role } = useDemoStore();

  useEffect(() => {
    if (!role || !allowed.includes(role)) {
      router.replace("/");
    }
  }, [allowed, role, router]);

  if (!role || !allowed.includes(role)) {
    return (
      <main className="onco-page flex min-h-ios-screen items-center justify-center p-6">
        <div className="onco-card max-w-sm text-center">
          <p className="onco-display text-xl font-extrabold">Demo role required</p>
          <p className="mt-2 text-sm text-onco-muted">Redirecting...</p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
