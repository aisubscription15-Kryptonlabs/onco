import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type PillProps = HTMLAttributes<HTMLSpanElement> & {
  active?: boolean;
  icon?: ReactNode;
};

export function Pill({ active = false, className, children, icon, onClick, ...props }: PillProps) {
  return (
    <span className={cn("onco-pill", active && "onco-pill-active", onClick && "cursor-pointer", className)} onClick={onClick} {...props}>
      {icon}
      {children}
    </span>
  );
}


