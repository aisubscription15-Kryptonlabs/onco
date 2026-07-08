"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type DropdownMenuItem = {
  label: string;
  onSelect: () => void;
};

type DropdownMenuProps = {
  label: string;
  items: DropdownMenuItem[];
  className?: string;
};

export function DropdownMenu({ label, items, className }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn("relative", className)}>
      <button
        className="onco-button-outline min-h-0 rounded-full px-3 py-2 text-xs"
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        {label}
      </button>
      {open ? (
        <div className="absolute right-0 z-50 mt-2 min-w-48 rounded-2xl border border-onco-line bg-white p-2 shadow-onco">
          {items.map((item) => (
            <button
              className="block w-full rounded-xl px-3 py-2 text-left text-sm text-onco-ink hover:bg-onco-cream"
              key={item.label}
              type="button"
              onClick={() => {
                item.onSelect();
                setOpen(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

