import { Card } from "@/components/onco/ui/Card";

export function MetricTrendCard({ label, value, trend }: { label: string; value: string; trend: string }) {
  return (
    <Card className="p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-onco-muted-light">{label}</p>
      <p className="onco-display mt-2 text-3xl font-extrabold">{value}</p>
      <p className="mt-1 text-xs text-onco-terracotta">{trend}</p>
    </Card>
  );
}

