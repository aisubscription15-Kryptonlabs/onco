"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { demoStore, useDemoStore } from "@/lib/onco/demo/demo-store";
import { logoutDemo } from "@/lib/onco/demo/demo-auth";
import { Modal } from "@/components/onco/ui/Modal";
import { initials } from "@/lib/utils";

export function PatientProfileMenu() {
  const router = useRouter();
  const state = useDemoStore();
  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState<string | null>(null);
  const support = state.onboarding.supportPerson;
  const patientName = state.patientProfile.name || "Patient";

  return (
    <div className="relative">
      <button
        className="flex h-9 w-9 items-center justify-center rounded-full bg-onco-sage text-sm font-bold text-onco-cream"
        type="button"
        aria-label="Open profile menu"
        onClick={() => setOpen((value) => !value)}
      >
        {initials(patientName)}
      </button>
      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-56 rounded-2xl border border-onco-line bg-white p-2 text-sm shadow-onco">
          {["Profile", "Connected devices", "Notifications", "Privacy & sharing"].map((item) => (
            <button
              className="block w-full rounded-xl px-3 py-2 text-left hover:bg-onco-cream"
              key={item}
              type="button"
              onClick={() => {
                if (item === "Profile") router.push("/profile");
                if (item === "Connected devices") router.push("/devices");
                if (item === "Notifications") router.push("/notifications");
                if (item === "Privacy & sharing") router.push("/privacy-sharing");
                setOpen(false);
              }}
            >
              {item}
            </button>
          ))}
          <button
            className="block w-full rounded-xl px-3 py-2 text-left text-onco-terracotta hover:bg-onco-cream"
            type="button"
            onClick={() => {
              logoutDemo();
              router.push("/");
            }}
          >
            Log out
          </button>
        </div>
      ) : null}
      <Modal open={modal !== null} title={modal || "Profile"} onClose={() => setModal(null)}>
        <p className="text-sm leading-6 text-onco-muted">
          {modal === "Connected devices"
            ? `Tracking: ${state.onboarding.trackingType}. Manage connection and sync preferences.`
            : modal === "Support person"
              ? support
                ? `${support.name} · ${support.relationship} · Invite sent · pending`
                : "No support person added yet."
              : modal === "Privacy & sharing"
                ? "Review who can see your plan, progress, and reminders."
                : `${patientName} - ${state.onboarding.cancerType} - Phase 1 movement program.`}
        </p>
      </Modal>
    </div>
  );
}
