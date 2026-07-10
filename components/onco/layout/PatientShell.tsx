"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PatientProfileMenu } from "@/components/onco/demo/PatientProfileMenu";
import { cn } from "@/lib/utils";
import { useDemoStore } from "@/lib/onco/demo/demo-store";
import type { PatientTab } from "@/types/onco";
import { BottomNav } from "../ui/BottomNav";

type PatientShellProps = {
  children: ReactNode;
  activeTab?: PatientTab;
  bottomNav?: boolean;
  inverted?: boolean;
  className?: string;
  requireRole?: boolean;
  showPatientHeader?: boolean;
  hidePatientHeader?: boolean;
};

export function PatientShell({
  children,
  activeTab = "today",
  bottomNav = true,
  inverted = false,
  className,
  requireRole = false,
  showPatientHeader = false,
  hidePatientHeader = false,
}: PatientShellProps) {
  const router = useRouter();
  const { patientProfile, role } = useDemoStore();

  useEffect(() => {
    if (requireRole && role !== "patient") {
      router.replace("/");
    }
  }, [requireRole, role, router]);

  if (requireRole && role !== "patient") {
    return (
      <main className="onco-page flex min-h-ios-screen items-center justify-center p-6">
        <div className="onco-card max-w-sm text-center">
          <p className="onco-display text-xl font-extrabold">Patient login required</p>
          <p className="mt-2 text-sm text-onco-muted">Redirecting...</p>
        </div>
      </main>
    );
  }

  return (
    <main
      className={cn(
        "onco-page ios-patient-page flex justify-center overflow-x-hidden",
        inverted && "bg-onco-sage text-onco-cream",
        className,
      )}
    >
      <div
        className={cn(
          "ios-patient-viewport min-h-ios-screen w-full max-w-[430px] safe-area-px safe-area-pt",
          bottomNav ? "patient-bottom-space" : "safe-area-pb",
        )}
      >
        {!inverted && !hidePatientHeader && (requireRole || showPatientHeader) ? (
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex-1">
              <div className="mb-3 rounded-full bg-white/85 px-3 py-2 text-center text-[11px] font-semibold text-onco-muted shadow-onco">
                {patientProfile.name || "Patient"} care plan
              </div>
            </div>
            <PatientProfileMenu />
          </div>
        ) : null}
        {children}
      </div>
      {bottomNav ? <BottomNav active={activeTab} /> : null}
    </main>
  );
}
