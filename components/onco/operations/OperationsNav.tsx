"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type OperationsNavItem = {
  label: string;
  href: string;
};

export function OperationsNav({ items, title }: { items: OperationsNavItem[]; title: string }) {
  const pathname = usePathname();
  return (
    <aside className="h-fit rounded-onco-lg bg-onco-sage p-4 text-onco-cream shadow-onco">
      <Link className="onco-display block text-xl font-extrabold" href="/">
        OncoMotionRx
      </Link>
      <p className="mt-1 text-xs text-[#A9C5B4]">{title}</p>
      <nav className="mt-6 space-y-1">
        {items.map((item) => (
          <Link
            className={cn(
              "block min-h-11 rounded-2xl px-3 py-3 text-sm font-semibold text-[#C7D8CC] hover:bg-onco-cream/10",
              pathname === item.href && "bg-onco-cream text-onco-sage hover:bg-onco-cream",
            )}
            href={item.href}
            key={`${item.href}:${item.label}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
