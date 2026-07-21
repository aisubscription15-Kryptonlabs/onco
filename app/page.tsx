"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { loginDemo } from "@/lib/onco/demo/demo-auth";
import { demoStore, useDemoStore } from "@/lib/onco/demo/demo-store";
import type { DemoRole } from "@/lib/onco/demo/demo-types";
import { Button } from "@/components/onco/ui/Button";
import { CareTeamCodeModal, SelfStartModal } from "@/components/onco/demo/PatientScreens";
import { ChevronRightIcon, HomeIcon } from "@/components/onco/ui/icons";
import { cn } from "@/lib/utils";

type LandingRole = Extract<DemoRole, "doctor" | "admin" | "app-provider">;

const roleCards = [
  {
    role: "doctor",
    title: "Doctor",
    body: "Access and manage patient programs",
    icon: "doctor",
  },
  {
    role: "admin",
    title: "Admin",
    body: "Manage organization and staff",
    icon: "admin",
  },
  {
    role: "app-provider",
    title: "App provider",
    body: "Guide and support patients",
    icon: "provider",
  },
] satisfies Array<{
  role: LandingRole;
  title: string;
  body: string;
  icon: "doctor" | "admin" | "provider";
}>;

function StaffRoleIcon({ icon }: { icon: "doctor" | "admin" | "provider" }) {
  if (icon === "doctor") {
    return (
      <svg aria-hidden="true" className="h-8 w-8" fill="none" viewBox="0 0 32 32">
        <path d="M11 5v7a5 5 0 0 0 10 0V5" stroke="currentColor" strokeLinecap="round" strokeWidth="2.3" />
        <path d="M11 5H8M21 5h3" stroke="currentColor" strokeLinecap="round" strokeWidth="2.3" />
        <path d="M16 17v3a6 6 0 0 0 12 0v-1" stroke="currentColor" strokeLinecap="round" strokeWidth="2.3" />
        <circle cx="28" cy="18" r="2.3" stroke="currentColor" strokeWidth="2.3" />
      </svg>
    );
  }
  if (icon === "admin") {
    return (
      <svg aria-hidden="true" className="h-8 w-8" fill="none" viewBox="0 0 32 32">
        <path d="M8 27V10h16v17" stroke="currentColor" strokeLinejoin="round" strokeWidth="2.3" />
        <path d="M13 10V6h6v4M12 15h2M18 15h2M12 20h2M18 20h2M5 27h22" stroke="currentColor" strokeLinecap="round" strokeWidth="2.3" />
      </svg>
    );
  }
  return <HomeIcon className="h-8 w-8" />;
}


function LandingHeroImage() {
  return (
    <div className="relative mt-6 overflow-hidden rounded-[18px] bg-[#F2EADC] shadow-[0_10px_24px_-20px_rgba(30,58,45,0.38)]">
      <img
        alt=""
        className="block aspect-[2.08/1] w-full object-cover"
        src="/onco/landing-hero.png"
      />
    </div>
  );
}
export default function DemoLandingPage() {
  const router = useRouter();
  const { users } = useDemoStore();
  const [roleSheetOpen, setRoleSheetOpen] = useState(false);
  const [careCodeOpen, setCareCodeOpen] = useState(false);
  const [careCodeStage, setCareCodeStage] = useState<"entry" | "forgot">("entry");
  const [selfStartOpen, setSelfStartOpen] = useState(false);
  const staffUsers = useMemo(() => users.filter((user) => user.role !== "patient"), [users]);

  function openCareCode() {
    demoStore.preparePatientProgram();
    demoStore.beginCareCode();
    setCareCodeStage("entry");
    setCareCodeOpen(true);
  }

  function openForgotCode() {
    demoStore.preparePatientProgram();
    demoStore.beginCareCode();
    setCareCodeStage("forgot");
    setCareCodeOpen(true);
  }

  function startOnOwn() {
    demoStore.preparePatientProgram();
    demoStore.beginSelfStart();
    setSelfStartOpen(true);
  }

  function continueToOnboarding(step: number) {
    window.sessionStorage.setItem("oncoContinueOnboarding", "1");
    router.push(`/onboarding?step=${step}`);
  }


  function signInRole(role: LandingRole) {
    const selectedUser = staffUsers.find((user) => user.role === role) || users.find((user) => user.role === role);
    if (!selectedUser) return;
    router.push(loginDemo(selectedUser));
  }

  return (
    <main className="ios-patient-page bg-[#FBF7EF] text-[#174B38]">
      <section className="ios-patient-viewport mx-auto flex min-h-ios-screen w-full max-w-[430px] flex-col px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-7">

        <div className="mt-3 flex items-center gap-2 text-[#174B38]">
          <img alt="" className="h-8 w-8 rounded-lg object-cover" src="/onco/icons/oncomotionrx-icon.png" />
          <span className="onco-display text-[22px] font-extrabold leading-none text-[#174B38]">
            OncoMotionRx
          </span>
        </div>

        <LandingHeroImage />

        <section className="mt-7">
          <h1 className="onco-display text-[34px] font-extrabold leading-[0.98] text-onco-ink">
            Movement,<br />made for recovery.
          </h1>
          <p className="mt-4 text-[15px] leading-6 text-[#3F4B47]">
            A structured movement program built for life during and after cancer treatment - guided by <span className="font-bold text-[#174B38]">Artie</span>, your personal activity consultant.
          </p>
        </section>

        <div className="mt-auto space-y-2.5 pt-7">
          <Button className="w-full" type="button" onClick={openCareCode}>
            I have a care team code
          </Button>

          <Button className="w-full" variant="outline" type="button" onClick={startOnOwn}>
            Start on my own
          </Button>

          <button
            className="block w-full py-1 text-center text-xs font-semibold text-onco-sage hover:text-onco-ink"
            type="button"
            onClick={openForgotCode}
          >
            Need help finding your code?
          </button>

          <div className="flex items-center gap-4 py-1 text-xs font-semibold text-[#8A948E]">
            <span className="h-px flex-1 bg-[#DAD5CB]" />
            <span>Staff access</span>
            <span className="h-px flex-1 bg-[#DAD5CB]" />
          </div>

          <Button className="w-full" variant="outline" type="button" onClick={() => setRoleSheetOpen(true)}>
            Select roles
          </Button>
        </div>
      </section>

      <div className={cn("fixed inset-0 z-50 bg-transparent transition", roleSheetOpen ? "opacity-100" : "pointer-events-none opacity-0")} onClick={() => setRoleSheetOpen(false)} />
      <section
        className={cn(
          "ios-modal-panel fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[430px] overflow-y-auto rounded-t-[24px] border border-[#E0DBD2] bg-white px-5 pb-[max(1.4rem,env(safe-area-inset-bottom))] pt-4 shadow-[0_-18px_42px_-24px_rgba(30,36,33,0.5)] transition-transform sm:px-7",
          roleSheetOpen ? "translate-y-0" : "translate-y-full",
        )}
        aria-hidden={!roleSheetOpen}
      >
        <div className="mx-auto h-1.5 w-16 rounded-full bg-[#B9B8B1]" />
        <div className="mt-5 flex items-center justify-between gap-3">
          <h2 className="onco-display text-[24px] font-extrabold text-onco-ink">Select role</h2>
          <button className="grid h-10 w-10 cursor-pointer place-items-center rounded-full text-3xl leading-none text-[#0F1714]" type="button" onClick={() => setRoleSheetOpen(false)} aria-label="Close role selector">
            x
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {roleCards.map((role) => (
            <button
              className="flex min-h-[76px] w-full cursor-pointer items-center gap-4 rounded-xl border border-[#DDD8CF] bg-white px-4 py-3 text-left transition hover:bg-[#F3F7F0]"
              key={role.role}
              onClick={() => signInRole(role.role)}
              type="button"
            >
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#E7F0E5] text-[#174B38]">
                <StaffRoleIcon icon={role.icon} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[21px] font-semibold leading-6 text-[#174B38]">{role.title}</span>
                <span className="mt-1 block text-[16px] leading-5 text-[#555D59]">{role.body}</span>
              </span>
              <ChevronRightIcon className="shrink-0 text-2xl text-[#0F1714]" />
            </button>
          ))}
        </div>
      </section>

      <SelfStartModal
        open={selfStartOpen}
        onClose={() => setSelfStartOpen(false)}
        onSuccess={() => continueToOnboarding(1)}
      />
      <CareTeamCodeModal
        initialStage={careCodeStage}
        open={careCodeOpen}
        onClose={() => setCareCodeOpen(false)}
        onSuccess={(nextStep) => continueToOnboarding(nextStep)}
      />
    </main>
  );
}































