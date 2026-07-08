"use client";

import { cn } from "@/lib/utils";

type TabItem<T extends string> = {
  label: string;
  value: T;
};

type TabsProps<T extends string> = {
  value: T;
  items: TabItem<T>[];
  onChange: (value: T) => void;
};

export function Tabs<T extends string>({ value, items, onChange }: TabsProps<T>) {
  return (
    <div className="inline-flex rounded-full border border-onco-line bg-white p-1">
      {items.map((item) => (
        <button
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-semibold text-onco-muted transition",
            value === item.value && "bg-onco-sage text-onco-cream",
          )}
          key={item.value}
          type="button"
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

