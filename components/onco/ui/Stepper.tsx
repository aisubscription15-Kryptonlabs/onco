import { cn } from "@/lib/utils";

type StepperProps = {
  current: number;
  total: number;
  className?: string;
};

export function Stepper({ current, total, className }: StepperProps) {
  return (
    <div className={cn("onco-stepper", className)} aria-label={`Step ${current} of ${total}`}>
      {Array.from({ length: total }, (_, index) => (
        <span data-active={index < current} key={index} />
      ))}
    </div>
  );
}

