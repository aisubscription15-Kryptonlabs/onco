export function ActivityChart({ values, accent = "sage" }: { values: number[]; accent?: "sage" | "terracotta" }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex h-36 items-end gap-3">
      {values.map((value, index) => (
        <div className="flex flex-1 flex-col items-center gap-2" key={`${value}-${index}`}>
          <div
            className={accent === "sage" ? "w-full rounded-t-lg bg-onco-sage" : "w-full rounded-t-lg bg-onco-terracotta"}
            style={{ height: `${Math.max(8, (value / max) * 100)}%` }}
          />
          <span className="text-[10px] text-onco-muted-light">W{index + 1}</span>
        </div>
      ))}
    </div>
  );
}

