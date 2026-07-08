import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  label: string;
  value: string;
  helper?: string;
  icon?: ReactNode;
  className?: string;
};

export function MetricCard({ label, value, helper, icon, className }: MetricCardProps) {
  return (
    <div className={cn("onco-card p-3.5", className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-onco-muted-light">
          {label}
        </p>
        {icon ? <span className="text-lg text-onco-terracotta">{icon}</span> : null}
      </div>
      <p className="onco-display mt-1 text-2xl font-extrabold">{value}</p>
      {helper ? <p className="mt-1 text-[11px] text-onco-muted-light">{helper}</p> : null}
    </div>
  );
}

