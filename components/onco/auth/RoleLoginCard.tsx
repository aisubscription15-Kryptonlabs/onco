"use client";

import { cn } from "@/lib/utils";
import type { DemoRole } from "@/lib/onco/demo/demo-types";

export type LoginRole = {
  role: DemoRole;
  short: string;
  label: string;
  description: string;
};

export function RoleLoginCard({
  role,
  selected,
  onSelect,
}: {
  role: LoginRole;
  selected: boolean;
  onSelect: (role: DemoRole) => void;
}) {
  return (
    <button
      className={cn(
        "min-h-[132px] rounded-2xl border border-onco-line bg-white p-4 text-left transition focus:ring-2 focus:ring-onco-sage/30",
        selected && "border-2 border-onco-sage bg-onco-sage-soft/55",
      )}
      type="button"
      onClick={() => onSelect(role.role)}
      aria-pressed={selected}
    >
      <span
        className={cn(
          "inline-flex rounded-lg bg-onco-cream px-2 py-1 text-xs font-black text-onco-muted",
          selected && "bg-onco-terracotta text-onco-paper",
        )}
      >
        {role.short}
      </span>
      <p className="mt-4 text-base font-extrabold text-onco-ink">{role.label}</p>
      <p className="mt-1 text-sm font-semibold leading-5 text-onco-muted-light">{role.description}</p>
    </button>
  );
}

