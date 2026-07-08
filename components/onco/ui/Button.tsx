import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "outline" | "cream" | "sage";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  icon?: ReactNode;
};

const variantClass: Record<ButtonVariant, string> = {
  primary: "onco-button-primary",
  outline: "onco-button-outline",
  cream: "onco-button-cream",
  sage: "bg-onco-sage text-onco-cream hover:bg-[#234B3D] onco-button-primary",
};

export function Button({ className, children, icon, variant = "primary", ...props }: ButtonProps) {
  return (
    <button className={cn(variantClass[variant], className)} type="button" {...props}>
      {icon}
      {children}
    </button>
  );
}

