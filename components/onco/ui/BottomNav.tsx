"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { PatientTab } from "@/types/onco";
import {
  CalendarIcon,
  ChartIcon,
  ClipboardIcon,
  HomeIcon,
  MessageIcon,
} from "./icons";

type BottomNavProps = {
  active: PatientTab;
};

const navItems = [
  { label: "Today", href: "/today", tab: "today", icon: <HomeIcon /> },
  { label: "Prescription", href: "/prescription", tab: "prescription", icon: <ClipboardIcon /> },
  { label: "Sessions", href: "/sessions", tab: "sessions", icon: <CalendarIcon /> },
  { label: "Progress", href: "/progress", tab: "progress", icon: <ChartIcon /> },
  { label: "Artie", href: "/artie", tab: "artie", icon: <MessageIcon /> },
] satisfies Array<{ label: string; href: string; tab: PatientTab; icon: React.ReactNode }>;

export function BottomNav({ active }: BottomNavProps) {
  return (
    <nav className="onco-bottom-nav" aria-label="Patient navigation">
      {navItems.map((item) => {
        const isActive = item.tab === active;

        return (
          <Link
            className={cn(
              "flex min-h-[46px] min-w-0 flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium text-[#A8AEA8]",
              isActive && "font-semibold text-onco-sage",
            )}
            href={item.href}
            key={item.tab}
          >
            <span className="text-[22px]">{item.icon}</span>
            <span className="max-w-full truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
