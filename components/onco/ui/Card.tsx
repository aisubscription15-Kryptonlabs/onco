import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  tone?: "cream" | "sage" | "sand" | "white";
};

export function Card({ className, tone = "white", ...props }: CardProps) {
  const tones = {
    white: "onco-card",
    cream: "rounded-onco border border-onco-line bg-[#F4F1E9] p-4",
    sage: "onco-card-sage",
    sand: "rounded-onco border border-onco-sage/15 bg-onco-sage-soft p-4 text-onco-sage",
  };

  return <div className={cn(tones[tone], className)} {...props} />;
}
