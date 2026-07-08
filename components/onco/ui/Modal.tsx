"use client";

import type { ReactNode } from "react";

type ModalProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
};

export function Modal({ open, title, children, onClose }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed ios-fixed-inset z-50 flex items-end justify-center bg-onco-ink/40 p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center">
      <div className="ios-modal-panel w-full max-w-lg overflow-y-auto rounded-onco-lg bg-onco-cream p-5 shadow-onco-phone">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="onco-display text-xl font-extrabold">{title}</h2>
          <button className="rounded-full px-3 py-1 text-sm text-onco-muted hover:bg-white" type="button" onClick={onClose}>
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
