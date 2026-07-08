"use client";

import { useDemoStore } from "@/lib/onco/demo/demo-store";

type DemoBannerProps = {
  compact?: boolean;
};

export function DemoBanner({ compact = false }: DemoBannerProps) {
  const { users, userId, role } = useDemoStore();
  const user = users.find((item) => item.id === userId);

  if (compact) {
    return (
      <div className="mb-3 rounded-full bg-white/85 px-3 py-2 text-center text-[11px] font-semibold text-onco-muted shadow-onco">
        {user?.name || role || "No role selected"}
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-40 border-b border-onco-line bg-onco-cream/95 px-4 py-2 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-onco-sage px-3 py-1 text-xs font-semibold text-onco-cream">
            OncoMotionRx workspace
          </span>
          <span className="text-xs text-onco-muted">
            {user ? `${user.name} - ${user.title}` : "No role selected"}
          </span>
        </div>
        <span className="text-xs font-semibold text-onco-muted">Care program workspace</span>
      </div>
    </div>
  );
}
