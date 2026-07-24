"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { demoStore, useDemoStore } from "@/lib/onco/demo/demo-store";
import { Button } from "@/components/onco/ui/Button";
import { CareTeamCodeModal, SelfStartModal } from "@/components/onco/demo/PatientScreens";

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
  useDemoStore();
  const [careCodeOpen, setCareCodeOpen] = useState(false);
  const [careCodeStage, setCareCodeStage] = useState<"entry" | "forgot">("entry");
  const [selfStartOpen, setSelfStartOpen] = useState(false);

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

































