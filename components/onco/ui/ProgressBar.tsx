import { cn } from "@/lib/utils";

type ProgressBarProps = {
  value: number;
  max: number;
  className?: string;
  indicatorClassName?: string;
};

export function ProgressBar({ value, max, className, indicatorClassName }: ProgressBarProps) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-[#ECE8DC]", className)}>
      <div
        className={cn("h-full rounded-full bg-onco-sage", indicatorClassName)}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

