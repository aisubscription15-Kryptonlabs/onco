"use client";

import { useEffect, useState } from "react";
import { useDemoStore } from "@/lib/onco/demo/demo-store";

export function ToastViewport() {
  const { toast } = useDemoStore();
  const [visibleId, setVisibleId] = useState<number | null>(null);

  useEffect(() => {
    if (!toast) return;
    setVisibleId(toast.id);
    const timer = window.setTimeout(() => setVisibleId(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  if (!toast || visibleId !== toast.id) return null;

  return (
    <div className="fixed right-4 ios-toast-top z-[80] max-w-sm rounded-2xl border border-onco-line bg-white px-4 py-3 text-sm font-semibold text-onco-ink shadow-onco">
      {toast.message}
    </div>
  );
}
