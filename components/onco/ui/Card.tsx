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
    sand: "rounded-onco bg-onco-clay p-4 text-[#6B4F36]",
  };

  return <div className={cn(tones[tone], className)} {...props} />;
}

