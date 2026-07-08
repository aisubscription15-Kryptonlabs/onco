import { Card } from "./Card";

type StatCardProps = {
  label: string;
  value: string;
  detail?: string;
};

export function StatCard({ label, value, detail }: StatCardProps) {
  return (
    <Card className="p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-onco-muted-light">{label}</p>
      <p className="onco-display mt-2 text-3xl font-extrabold">{value}</p>
      {detail ? <p className="mt-1 text-xs text-onco-muted-light">{detail}</p> : null}
    </Card>
  );
}

