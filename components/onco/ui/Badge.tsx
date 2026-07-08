import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "sage" | "sand" | "terracotta" | "cream" | "danger";

const tones: Record<BadgeTone, string> = {
  sage: "bg-onco-sage-soft text-onco-sage",
  sand: "bg-onco-clay text-[#7A3B1E]",
  terracotta: "bg-onco-terracotta text-onco-paper",
  cream: "bg-onco-cream text-onco-muted",
  danger: "bg-[#F0D9CE] text-[#8A3317]",
};

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

export function Badge({ tone = "sage", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", tones[tone], className)}
      {...props}
    />
  );
}

