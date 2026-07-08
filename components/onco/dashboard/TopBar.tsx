"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { logoutDemo } from "@/lib/onco/demo/demo-auth";
import { useDemoStore } from "@/lib/onco/demo/demo-store";
import { Modal } from "@/components/onco/ui/Modal";

export function TopBar({ title }: { title: string }) {
  const router = useRouter();
  const { users, userId, role } = useDemoStore();
  const [open, setOpen] = useState(false);
  const user = users.find((item) => item.id === userId);

  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="onco-display text-3xl font-extrabold">{title}</h1>
          <p className="mt-1 text-sm text-onco-muted">
            {user ? `${user.name} · ${user.title}` : "Demo role"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-onco-sage-soft px-3 py-1 text-xs font-semibold text-onco-sage">
            Frontend demo
          </span>
          <button
            className="min-h-11 rounded-full border border-onco-line bg-white px-4 py-2 text-sm font-semibold text-onco-ink shadow-onco"
            type="button"
            onClick={() => setOpen(true)}
          >
            {user?.name || "Demo user"}
          </button>
        </div>
      </div>
      <Modal open={open} title="Demo account" onClose={() => setOpen(false)}>
        <div className="space-y-3 text-sm text-onco-muted">
          <p>
            <strong className="text-onco-ink">Current role:</strong>{" "}
            {role?.replace("-", " ") || "none"}
          </p>
          <p>
            <strong className="text-onco-ink">Current user:</strong>{" "}
            {user?.name || "No active user"}
          </p>
        </div>
        <div className="mt-5 grid gap-3">
          <button
            className="onco-button-primary"
            type="button"
            onClick={() => {
              logoutDemo();
              setOpen(false);
              router.push("/");
            }}
          >
            Logout
          </button>
        </div>
      </Modal>
    </>
  );
}
