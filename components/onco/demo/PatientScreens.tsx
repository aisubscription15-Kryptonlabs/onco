"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { PatientShell } from "@/components/onco/layout/PatientShell";
import { ArtieAvatar } from "@/components/onco/ui/ArtieAvatar";
import { Badge } from "@/components/onco/ui/Badge";
import { Button } from "@/components/onco/ui/Button";
import { Card } from "@/components/onco/ui/Card";
import { DataTable } from "@/components/onco/ui/DataTable";
import { Modal } from "@/components/onco/ui/Modal";
import { Pill } from "@/components/onco/ui/Pill";
import { ProgressBar } from "@/components/onco/ui/ProgressBar";
import { Select } from "@/components/onco/ui/Select";
import { Stepper } from "@/components/onco/ui/Stepper";
import { Tabs } from "@/components/onco/ui/Tabs";
import { demoStore, useDemoStore } from "@/lib/onco/demo/demo-store";
import type { ActivityLog, CancerType, ConnectedDevice, OnboardingAnswers, PatientPlan, TrackingType, TreatmentStatus } from "@/lib/onco/demo/demo-types";
import { cn } from "@/lib/utils";
import { AiAgentIcon, ArrowUpIcon, AwardIcon, CalendarIcon, CheckIcon, ClipboardIcon, ClockIcon, FlameIcon, HeartIcon, MessageIcon, MicIcon, TargetIcon, WalkIcon } from "../ui/icons";

const redFlags = [
  "Chest pain or pressure",
  "Severe shortness of breath",
  "Dizziness or lightheadedness",
  "Fever",
  "New weakness or numbness",
  "Severe diarrhea/dehydration concern",
  "Uncontrolled pain",
];
const treatments = ["Surgery", "Chemotherapy", "Radiation", "Immunotherapy", "Hormone therapy", "Targeted therapy"];
const preferences = ["Walking", "Gardening", "Cycling", "Swimming", "Gym", "At home", "Stretching"];
const preferenceChips = ["Outdoors", "With others", "Alone", "Morning", "Evening"];
const barriers = ["Fatigue", "Numb feet / neuropathy", "Nausea", "Need bathrooms nearby", "Low motivation", "Fear of overdoing it", "Feeling self-conscious", "No safe place to walk", "Weather", "No time"];
const barrierAliases: Record<string, string[]> = {
  "Numb feet / neuropathy": ["Neuropathy"],
  "Need bathrooms nearby": ["Bathroom access"],
};
const environmentOptions = [
  { key: "Sidewalks nearby", label: "Sidewalks or paths near home", icon: "path" },
  { key: "Safe walking area", label: "I feel safe walking in my area", icon: "shield" },
  { key: "Bathrooms on route", label: "Bathrooms along my usual routes", icon: "bathroom" },
  { key: "Gym/community center access", label: "Access to a gym or community center", icon: "gym" },
  { key: "Indoor movement space", label: "Space to move indoors at home", icon: "stairs" },
] as const;
const trackingOptions: TrackingType[] = ["Apple Health", "Google Fit", "Garmin", "Fitbit", "Manual"];
const baselineIntensityOptions = ["Mostly light", "Some moderate", "Hard exercise sometimes"] as const;
const selfStartSteps = ["Start", "Identity", "Treatment", "Baseline", "Safety", "Preferences", "Barriers", "Environment", "Support", "Goal", "Tracking", "Plan"];
const updateProfileSteps = ["Baseline", "Safety", "Preferences", "Barriers", "Environment", "Support", "Goal + Tracking", "Plan"];
const careCodeSteps = updateProfileSteps;
const trailSuggestions = [
  { id: "lady-bird-boardwalk", zipCodes: ["78704", "78701", "78703"], area: "Austin, TX", name: "Lady Bird Lake Boardwalk", distance: "0.6 mi short loop", weather: "Best earlier in the day; mixed shade near the water", traffic: "Moderate foot and bike traffic", stretch: "Flat paved boardwalk and trail", time: "12-15 min", note: "Benches and easy turnaround points; keep right for bikes." },
  { id: "zilker-inner-loop", zipCodes: ["78704", "78746"], area: "Austin, TX", name: "Zilker Park Inner Loop", distance: "0.5 mi short loop", weather: "More sun exposure after midday", traffic: "Lighter on weekday mornings", stretch: "Mostly flat grass and paved paths", time: "10-14 min", note: "Nearby restrooms and many exit points if fatigue starts." },
  { id: "barton-springs", zipCodes: ["78704", "78746"], area: "Austin, TX", name: "Barton Springs Picnic Area Path", distance: "0.4 mi starter loop", weather: "Partial shade; can feel warm in afternoon", traffic: "Moderate near pool entrance", stretch: "Short paved and packed-surface path", time: "8-12 min", note: "Good choice when bathrooms and parking matter." },
  { id: "mueller-lake", zipCodes: ["78723", "78722"], area: "Austin, TX", name: "Mueller Lake Park Loop", distance: "0.7 mi loop", weather: "Partial shade with breezy open sections", traffic: "Moderate near playground and market days", stretch: "Flat paved loop", time: "14-18 min", note: "Bathroom access, benches, and clear loop landmarks." },
  { id: "shoal-creek", zipCodes: ["78705", "78756", "78757"], area: "Austin, TX", name: "Shoal Creek Trail Starter Walk", distance: "0.5 mi out-and-back", weather: "Good tree cover in many sections", traffic: "Light-to-moderate neighborhood use", stretch: "Mostly flat paved trail with a few uneven spots", time: "10-15 min", note: "Use the out-and-back format so turning around is easy." },
  { id: "walnut-creek", zipCodes: ["78753", "78758"], area: "Austin, TX", name: "Walnut Creek Metro Park Paved Segment", distance: "0.6 mi out-and-back", weather: "Shade varies by segment", traffic: "Moderate on weekends", stretch: "Paved starter segment; avoid steeper side trails", time: "12-16 min", note: "Stay on paved sections for a flatter recovery walk." },
  { id: "mckinney-falls", zipCodes: ["78744", "78747"], area: "Austin, TX", name: "McKinney Falls Picnic Area Walk", distance: "0.5 mi easy loop", weather: "Open sun in some areas; check heat before going", traffic: "Light-to-moderate depending on park hours", stretch: "Paved and packed-surface park path", time: "10-14 min", note: "Good for a short scenic walk when park access is available." },
  { id: "neighborhood-flat", zipCodes: ["default"], area: "Your area", name: "Flat neighborhood starter loop", distance: "0.4 mi starter loop", weather: "Check weather before leaving", traffic: "Choose low-traffic streets or sidewalks", stretch: "Flat sidewalks or indoor route preferred", time: "8-12 min", note: "Use this when a nearby trail is not available or does not feel safe." },
];

function trailsForZip(zipCode: string) {
  const normalized = zipCode.trim().slice(0, 5);
  const matches = normalized.length === 5 ? trailSuggestions.filter((trail) => trail.zipCodes.includes(normalized)) : [];
  return matches.length ? matches : trailSuggestions.filter((trail) => trail.zipCodes.includes("default"));
}

function estimateBaselineMetHours(onboarding: {
  weeklyWalkingMinutes: string;
  weeklyOtherActivityMinutes: string;
  baselineIntensity: string;
}) {
  const walkingMinutes = Number(onboarding.weeklyWalkingMinutes) || 0;
  const otherMinutes = Number(onboarding.weeklyOtherActivityMinutes) || 0;
  const intensityMet = onboarding.baselineIntensity === "Hard exercise sometimes" ? 4 : onboarding.baselineIntensity === "Some moderate" ? 3.3 : 2.3;
  return Number((((walkingMinutes * 2.5) + (otherMinutes * intensityMet)) / 60).toFixed(1));
}

export function OnboardingStateMachine() {
  const router = useRouter();
  const state = useDemoStore();
  const [step, setStep] = useState(0);
  const [supportOpen, setSupportOpen] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);
  const [codeInitialStage, setCodeInitialStage] = useState<"entry" | "forgot">("entry");
  const [selfOpen, setSelfOpen] = useState(false);
  const launchHandledRef = useRef(false);
  const isCareCodeFlow = state.onboardingMode === "care_code";
  const total = isCareCodeFlow ? 8 : 9;
  const stepNames = isCareCodeFlow ? careCodeSteps : selfStartSteps;
  const stepOffset = !isCareCodeFlow && state.onboardingMode !== "none" && step > 0 ? 1 : 0;
  const currentStepNumber = isCareCodeFlow ? step : Math.min(stepNames.length, step + 1 + stepOffset);
  const currentStepName = stepNames[currentStepNumber - 1] || "Start";
  const showLinkedPatientHeader = state.role === "patient" && state.patientProfile.careCodeLinked && state.patientProfile.inviteCodeType === "patient_invite";

  useEffect(() => {
    if (typeof window === "undefined" || launchHandledRef.current) return;
    launchHandledRef.current = true;

    if (window.sessionStorage.getItem("oncoOpenCareCode") === "1") {
      window.sessionStorage.removeItem("oncoOpenCareCode");
      demoStore.beginCareCode();
      setCodeInitialStage("entry");
      setCodeOpen(true);
      return;
    }

    if (window.sessionStorage.getItem("oncoOpenForgotCode") === "1") {
      window.sessionStorage.removeItem("oncoOpenForgotCode");
      demoStore.beginCareCode();
      setCodeInitialStage("forgot");
      setCodeOpen(true);
      return;
    }

    if (window.sessionStorage.getItem("oncoStartOnOwn") === "1") {
      window.sessionStorage.removeItem("oncoStartOnOwn");
      demoStore.beginSelfStart();
      setSelfOpen(true);
      return;
    }

    if (window.sessionStorage.getItem("oncoContinueOnboarding") === "1") {
      window.sessionStorage.removeItem("oncoContinueOnboarding");
      return;
    }

    router.replace("/");
  }, [router, state.users]);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const requestedStep = searchParams.get("step");
    if (!requestedStep) return;
    if (requestedStep === "tracking") {
      setStep(isCareCodeFlow ? 7 : 8);
      return;
    }
    const numericStep = Number(requestedStep);
    if (Number.isFinite(numericStep) && numericStep >= 0) {
      setStep(Math.min(total, numericStep));
    }
  }, [isCareCodeFlow, total]);
  const goBack = () => {
    if (step <= 1) {
      router.push("/");
      return;
    }
    setStep((value) => Math.max(1, value - 1));
  };

  function finishOnboarding() {
    demoStore.generatePatientPlan();
    if (state.patientProfile.onboardingStartMode === "self" || state.patientProfile.selfStarted) {
      demoStore.generateCareCode();
    } else {
      demoStore.completeLinkedPatientOnboarding();
    }
    router.push(state.onboarding.redFlags.length > 0 ? "/safety-pause" : "/plan-reveal");
  }

  function next() {
    if (step === 0 && state.role !== "patient") {
      const patientUser = state.users.find((user) => user.role === "patient");
      if (patientUser) demoStore.login("patient", patientUser.id);
    }
    if (step === total) {
      finishOnboarding();
      return;
    }
    setStep((value) => Math.min(total, value + 1));
  }

  function skip() {
    if (isCareCodeFlow) {
      if (step === total) finishOnboarding();
      else next();
      return;
    }
    if (step >= 3) {
      finishOnboarding();
      return;
    }
    next();
  }

  return (
    <PatientShell bottomNav={false} hidePatientHeader>
      <div className="flex min-h-ios-compact flex-col">
        {step > 0 ? (
          <div className="mb-6 space-y-4">
            <div className="flex items-center gap-3 text-onco-sage">
              <img alt="" className="h-10 w-10 rounded-xl object-cover shadow-sm" src="/onco/icons/oncomotionrx-icon.png" />
              <span className="onco-display text-[22px] font-extrabold leading-none">OncoMotionRx</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <p className="text-[13px] font-extrabold uppercase tracking-[0.14em] text-onco-sage">{currentStepName}</p>
              <p className="shrink-0 text-sm font-semibold text-onco-muted">Step {currentStepNumber} of {stepNames.length}</p>
            </div>
            <Stepper current={currentStepNumber} total={stepNames.length} />
          </div>
        ) : null}

        <div className="flex-1">
          {step === 1 && !isCareCodeFlow ? <TreatmentContext /> : null}
          {step === 2 && !isCareCodeFlow ? <Baseline /> : null}
          {step === 3 && !isCareCodeFlow ? <Safety /> : null}
          {step === 1 && isCareCodeFlow ? <Baseline /> : null}
          {step === 2 && isCareCodeFlow ? <Safety /> : null}
          {((step === 4 && !isCareCodeFlow) || (step === 3 && isCareCodeFlow)) ? <Preferences /> : null}
          {((step === 5 && !isCareCodeFlow) || (step === 4 && isCareCodeFlow)) ? <Barriers /> : null}
          {((step === 6 && !isCareCodeFlow) || (step === 5 && isCareCodeFlow)) ? <Environment /> : null}
          {((step === 7 && !isCareCodeFlow) || (step === 6 && isCareCodeFlow)) ? <Support onAdd={() => setSupportOpen(true)} /> : null}
          {((step === 8 && !isCareCodeFlow) || (step === 7 && isCareCodeFlow)) ? <GoalTracking /> : null}
          {((step === 9 && !isCareCodeFlow) || (step === 8 && isCareCodeFlow)) ? <ReadyToGenerate /> : null}
        </div>

        <div className="mt-5 space-y-2.5">
          {step > 0 ? (
            <>
              <Button className="w-full" onClick={next}>{step === total ? "Generate my plan" : "Continue"}</Button>
              <div className="mt-4 flex min-h-10 items-center justify-between px-1">
                <button className="inline-flex min-h-9 items-center gap-2 rounded-lg px-1 text-sm font-semibold text-onco-sage hover:text-onco-ink" type="button" onClick={goBack}>
                  <span className="text-lg leading-none">{"<"}</span>
                  Back
                </button>
                <button className="min-h-9 rounded-lg px-1 text-sm font-semibold text-onco-sage hover:text-onco-ink" type="button" onClick={skip}>
                  Skip for now
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
      <SupportModal open={supportOpen} onClose={() => setSupportOpen(false)} />
      <SelfStartModal open={selfOpen} onClose={() => { setSelfOpen(false); if (step === 0) router.push("/"); }} onSuccess={() => setStep(1)} />
      <CareTeamCodeModal initialStage={codeInitialStage} open={codeOpen} onClose={() => { setCodeOpen(false); if (step === 0) router.push("/"); }} onSuccess={(nextStep) => setStep(nextStep)} />
    </PatientShell>
  );
}

function TreatmentContext() {
  const { onboarding } = useDemoStore();
  return (
    <ScreenTitle title="Tell us a bit about your treatment" subtitle="This shapes your plan. Share only what you're comfortable with - everything here is optional." >
      <Select label="Cancer type" value={onboarding.cancerType} onChange={(cancerType) => demoStore.updateOnboarding({ cancerType })} options={["Colon cancer", "Breast cancer", "Prostate cancer", "Lung cancer", "Lymphoma", "Ovarian cancer", "Other"].map((value) => ({ label: value, value: value as CancerType }))} />
      <Select className="mt-4 block" label="Treatment status" value={onboarding.treatmentStatus} onChange={(treatmentStatus) => demoStore.updateOnboarding({ treatmentStatus })} options={["Before treatment", "In active treatment", "Finished treatment", "Surveillance"].map((value) => ({ label: value, value: value as TreatmentStatus }))} />
      <ChipGroup className="mt-4" label="Treatment included" values={treatments} selected={onboarding.treatments} onToggle={(value) => toggleList(onboarding.treatments, value, (treatments) => demoStore.updateOnboarding({ treatments }))} />
    </ScreenTitle>
  );
}

function Baseline() {
  const { onboarding } = useDemoStore();
  const options = ["Very active", "Some movement", "Not very active"];
  const baselineMet = estimateBaselineMetHours(onboarding);
  return (
    <ScreenTitle title="What did movement look like before cancer?" subtitle="Artie builds from wherever you are today.">
      <div className="space-y-2">
        {options.map((option) => (
          <Choice
            key={option}
            hideIndicator
            selected={onboarding.previousActivity === option}
            onClick={() => demoStore.updateOnboarding({ previousActivity: onboarding.previousActivity === option ? "" : option })}
          >
            {option}
          </Choice>
        ))}
      </div>
      <label className="mt-4 block">
        <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.05em] text-onco-muted-light">And right now?</span>
        <textarea className="onco-input min-h-24" value={onboarding.currentCapacity} onChange={(event) => demoStore.updateOnboarding({ currentCapacity: event.target.value })} />
      </label>
      <div className="mt-4 rounded-[14px] border border-onco-line bg-white p-3">
        <div className="mb-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-onco-ink">Starting point</p>
          <p className="mt-1 text-xs leading-5 text-onco-muted">A rough usual week is enough. Artie can refine this later.</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <NumberField label="Walking min/wk" value={onboarding.weeklyWalkingMinutes} onChange={(weeklyWalkingMinutes) => demoStore.updateOnboarding({ weeklyWalkingMinutes })} />
          <NumberField label="Other min/wk" value={onboarding.weeklyOtherActivityMinutes} onChange={(weeklyOtherActivityMinutes) => demoStore.updateOnboarding({ weeklyOtherActivityMinutes })} />
        </div>
        <Select
          className="mt-3 block"
          label="Usual intensity"
          value={onboarding.baselineIntensity}
          onChange={(baselineIntensity) => demoStore.updateOnboarding({ baselineIntensity })}
          options={baselineIntensityOptions.map((value) => ({ label: value, value }))}
        />
        <details className="mt-3 rounded-[14px] bg-[#F8F6EF] p-3">
          <summary className="cursor-pointer text-xs font-semibold text-onco-ink">Add steps or clinic test</summary>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <NumberField label="Avg steps/day" value={onboarding.averageDailySteps} onChange={(averageDailySteps) => demoStore.updateOnboarding({ averageDailySteps })} />
            <NumberField label="6-min walk ft" value={onboarding.sixMinuteWalk} onChange={(sixMinuteWalk) => demoStore.updateOnboarding({ sixMinuteWalk })} placeholder="Optional" />
          </div>
          <label className="mt-3 flex items-start gap-3">
            <input
              className="mt-1"
              type="checkbox"
              checked={onboarding.useFirstWeekAsBaseline}
              onChange={(event) => demoStore.updateOnboarding({ useFirstWeekAsBaseline: event.target.checked })}
            />
            <span className="text-xs leading-5 text-onco-muted">Use my first 7 days of tracking to refine this baseline.</span>
          </label>
        </details>
        <div className="mt-3 rounded-[14px] bg-onco-sage-soft p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.05em] text-onco-sage">Estimated baseline</p>
            <p className="shrink-0 text-sm font-bold text-onco-ink">{baselineMet || 0} MET-hrs/wk</p>
          </div>
          <p className="mt-1 text-xs leading-5 text-onco-muted">Used to build safely toward +10 MET-hrs/week above baseline.</p>
        </div>
      </div>
    </ScreenTitle>
  );
}

function Safety() {
  const { onboarding } = useDemoStore();
  const selectedFlags = onboarding.redFlags;
  const safetyMessage = selectedFlags.length
    ? `You checked ${formatSelectionList(selectedFlags.map((flag) => flag.toLowerCase()))}. We'll pause plan setup and suggest checking with your care team first - we'll help you know what to ask.`
    : "If none of these are happening today, Artie can keep building your plan gently.";
  return (
    <ScreenTitle title="Before we build your plan, a quick safety check" subtitle="Are you currently experiencing any of these? Be honest - this just helps us keep your plan safe.">
      <div className="space-y-2">
        {redFlags.map((flag) => {
          const isSelected = onboarding.redFlags.includes(flag);
          return (
            <SafetyOption key={flag} label={flag} selected={isSelected} onClick={() => toggleList(onboarding.redFlags, flag, (redFlags) => demoStore.updateOnboarding({ redFlags }))}>
              {flag}
            </SafetyOption>
          );
        })}
        <SafetyOption label="None of these" selected={onboarding.redFlags.length === 0} onClick={() => demoStore.updateOnboarding({ redFlags: [] })}>None of these</SafetyOption>
      </div>
      <div className={cn("mt-4 rounded-2xl border p-4 text-sm leading-6", selectedFlags.length ? "border-onco-sage/20 bg-onco-sage-soft text-onco-sage" : "border-onco-sage/15 bg-onco-sage-soft text-onco-sage")}>
        <p className="font-semibold">{selectedFlags.length ? "Safety note" : "Good to continue"}</p>
        <p className="mt-1">{safetyMessage}</p>
      </div>
    </ScreenTitle>
  );
}

function Preferences() {
  const { onboarding } = useDemoStore();
  const preferenceMessage = preferenceSupportMessage(onboarding.preferences, onboarding.preferenceChips, onboarding.currentCapacity);
  return (
    <ScreenTitle title="What kind of movement sounds doable?" subtitle="Pick anything that appeals - even a little. We'll start with one.">
      <ChipGrid values={preferences} selected={onboarding.preferences} onToggle={(value) => toggleList(onboarding.preferences, value, (preferences) => demoStore.updateOnboarding({ preferences }))} />
      <ChipGroup className="mt-4" label="How it should feel" values={preferenceChips} selected={onboarding.preferenceChips} onToggle={(value) => toggleList(onboarding.preferenceChips, value, (preferenceChips) => demoStore.updateOnboarding({ preferenceChips }))} />
      {preferenceMessage ? <SelectionNote>{preferenceMessage}</SelectionNote> : null}
    </ScreenTitle>
  );
}

function Barriers() {
  const { onboarding } = useDemoStore();
  const selectedBarriers = normalizeBarriers(onboarding.barriers);
  const barrierGroups = [
    { label: "Body", values: ["Fatigue", "Numb feet / neuropathy", "Nausea", "Need bathrooms nearby"] },
    { label: "Mind", values: ["Low motivation", "Fear of overdoing it", "Feeling self-conscious"] },
    { label: "Life", values: ["No safe place to walk", "Weather", "No time"] },
  ];
  const barrierMessage = barrierSupportMessage(selectedBarriers);
  return (
    <ScreenTitle title="What's most likely to get in the way?" subtitle="These aren't excuses - they're planning information. Artie designs around them.">
      <div className="space-y-5">
        {barrierGroups.map((group) => (
          <ChipGroup
            className="rounded-2xl"
            dense={false}
            key={group.label}
            label={group.label}
            values={group.values}
            selected={selectedBarriers}
            onToggle={(value) => demoStore.updateOnboarding({ barriers: toggleBarrier(onboarding.barriers, value) })}
          />
        ))}
      </div>
      {barrierMessage ? <SelectionNote>{barrierMessage}</SelectionNote> : null}
    </ScreenTitle>
  );
}

function Environment() {
  const { onboarding } = useDemoStore();
  const [zipDraft, setZipDraft] = useState(onboarding.environmentZipCode || "");
  useEffect(() => {
    if (onboarding.environmentZipCode && onboarding.environmentZipCode !== zipDraft) {
      setZipDraft(onboarding.environmentZipCode);
    }
  }, [onboarding.environmentZipCode, zipDraft]);
  const hasZip = zipDraft.trim().length === 5;
  const trails = trailsForZip(hasZip ? zipDraft : "");
  const visibleTrails = trails.slice(0, 2);
  const selectedTrail = visibleTrails.find((trail) => trail.id === onboarding.selectedTrailId) || visibleTrails[0];
  const hasExactZipRoutes = hasZip && visibleTrails.some((trail) => !trail.zipCodes.includes("default"));
  const environmentNote = environmentSupportMessage(onboarding.environment);
  function updateZip(value: string) {
    const nextZip = value.replace(/\D/g, "").slice(0, 5);
    setZipDraft(nextZip);
    demoStore.updateOnboarding({
      environmentZipCode: nextZip.length === 5 ? nextZip : "",
      selectedTrailId: nextZip.length === 5 ? "" : onboarding.selectedTrailId,
    });
  }
  return (
    <ScreenTitle title="Where will movement happen?" subtitle="Quick yes or no - this helps Artie suggest routes and backups that actually work for you.">
      <div className="space-y-2.5">
        {environmentOptions.map((option) => {
          const checked = Boolean(onboarding.environment[option.key]);
          return (
            <EnvironmentToggleRow
              checked={checked}
              icon={option.icon}
              key={option.key}
              label={option.label}
              onChange={(nextChecked) => demoStore.updateOnboarding({ environment: { ...onboarding.environment, [option.key]: nextChecked } })}
            />
          );
        })}
      </div>
      {environmentNote ? (
        <SelectionNote>{environmentNote}</SelectionNote>
      ) : null}
      <div className="mt-4">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.05em] text-onco-ink">Zip code for nearby trails</p>
        <div className="relative">
          <input
            className="onco-input font-semibold"
            inputMode="numeric"
            maxLength={5}
            value={zipDraft}
            onChange={(event) => updateZip(event.target.value)}
            placeholder="Enter 5-digit ZIP code"
          />
        </div>
      </div>
      {hasZip ? (
        <>
      <Card className="mt-4 rounded-[16px] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold">Nearby short route ideas</p>
            <p className="mt-1 text-xs leading-5 text-onco-muted">
              {hasExactZipRoutes ? `Showing 2 short options near ${zipDraft}.` : "No saved trail match yet, so here is a safe starter option."}
            </p>
          </div>
          {hasExactZipRoutes ? <span className="rounded-full bg-onco-sage-soft px-2 py-1 text-[10px] font-bold text-onco-sage">{selectedTrail.area}</span> : null}
        </div>
        <div className="mt-3 space-y-2">
          {visibleTrails.map((trail) => (
            <button
              className={cn("w-full rounded-[14px] border p-3 text-left transition", selectedTrail.id === trail.id ? "border-onco-sage bg-onco-sage-soft" : "border-onco-line bg-white")}
              key={trail.id}
              type="button"
              onClick={() => demoStore.updateOnboarding({ selectedTrailId: trail.id })}
            >
              <p className="font-semibold">{trail.name}</p>
              <p className="mt-1 text-xs text-onco-muted">{trail.distance} - {trail.time}</p>
            </button>
          ))}
        </div>
        <div className="mt-4 rounded-[14px] border border-onco-sage/15 bg-onco-sage-soft p-3">
          <p className="font-semibold">{selectedTrail.name}</p>
          <p className="mt-1 text-xs font-semibold text-onco-muted">{selectedTrail.area} - {selectedTrail.distance}</p>
          <div className="mt-3 grid gap-1.5 text-xs leading-5 text-onco-muted">
            <p><span className="font-semibold text-onco-ink">Weather fit:</span> {selectedTrail.weather}</p>
            <p><span className="font-semibold text-onco-ink">Traffic:</span> {selectedTrail.traffic}</p>
            <p><span className="font-semibold text-onco-ink">Stretch:</span> {selectedTrail.stretch}</p>
            <p><span className="font-semibold text-onco-ink">Time:</span> {selectedTrail.time}</p>
            <p>{selectedTrail.note}</p>
          </div>
        </div>
      </Card>
      <Card tone="sand" className="hidden">
        <p className="font-semibold">{selectedTrail.name}</p>
        <p className="mt-1 text-xs font-semibold text-onco-muted">{selectedTrail.area} - {selectedTrail.distance}</p>
        <div className="mt-3 grid gap-2 text-xs leading-5 text-onco-muted">
          <p><span className="font-semibold text-onco-ink">Weather fit:</span> {selectedTrail.weather}</p>
          <p><span className="font-semibold text-onco-ink">Typical traffic:</span> {selectedTrail.traffic}</p>
          <p><span className="font-semibold text-onco-ink">Stretch:</span> {selectedTrail.stretch}</p>
          <p><span className="font-semibold text-onco-ink">Time:</span> {selectedTrail.time}</p>
          <p>{selectedTrail.note}</p>
        </div>
      </Card>
        </>
      ) : !hasZip ? (
        <p className="mt-2 text-xs leading-5 text-onco-muted">Enter 5 digits to see nearby short route ideas.</p>
      ) : null}
    </ScreenTitle>
  );
}

function EnvironmentToggleRow({ checked, icon, label, onChange }: { checked: boolean; icon: (typeof environmentOptions)[number]["icon"]; label: string; onChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      className={cn(
        "onco-option-row",
        checked && "onco-option-row-active",
      )}
      onClick={() => onChange(!checked)}
    >
      <EnvironmentOptionIcon name={icon} selected={checked} />
      <span className="min-w-0 flex-1 pr-7 text-left">{label}</span>      {checked ? (
        <span className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full border border-onco-cream/70 text-[10px] text-onco-cream">
          <CheckIcon />
        </span>
      ) : null}
    </button>
  );
}

function EnvironmentOptionIcon({ name, selected }: { name: (typeof environmentOptions)[number]["icon"]; selected?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid h-8 w-8 shrink-0 place-items-center text-onco-sage",
        selected && "text-onco-cream",
      )}
    >
      <svg viewBox="0 0 40 40" className="h-6 w-6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        {name === "path" ? (
          <>
            <path d="M13 30V11" strokeWidth="2" />
            <path d="M25 30V11" strokeWidth="2" />
            <path d="m18.5 11-2 4M21.5 11l2 4M17 20h6M16 27h8" strokeWidth="1.6" />
          </>
        ) : null}
        {name === "shield" ? (
          <>
            <path d="M20 7.8 10.8 11.6v7.7c0 6 3.6 10.8 9.2 13.7 5.6-2.9 9.2-7.7 9.2-13.7v-7.7L20 7.8Z" strokeWidth="2" />
            <path d="m15.5 20.6 3.1 3 6.4-7" strokeWidth="2" />
          </>
        ) : null}
        {name === "bathroom" ? (
          <>
            <path d="M13 9h14v22H13Z" strokeWidth="2" />
            <path d="M16 12h8v7.5a4 4 0 0 1-4 4h-4V12Z" strokeWidth="1.7" />
            <path d="M27 16h3M16 31v4M13 35h10" strokeWidth="1.7" />
          </>
        ) : null}
        {name === "gym" ? (
          <>
            <path d="M8 20h24" strokeWidth="2" />
            <path d="M11 15v10M15 17v6M25 17v6M29 15v10" strokeWidth="2" />
          </>
        ) : null}
        {name === "stairs" ? (
          <>
            <path d="M9 31h6v-5h6v-5h6v-5h4" strokeWidth="2" />
            <path d="M10 24h4M16 19h4M22 14h4" strokeWidth="1.5" />
          </>
        ) : null}
      </svg>
    </span>
  );
}

function Support({ onAdd }: { onAdd: () => void }) {
  const { onboarding } = useDemoStore();
  return (
    <ScreenTitle title="Who's in your corner?" subtitle="People who move with support tend to stick with it. Totally optional - going solo is fine too.">
      {onboarding.supportPerson ? (
        <Card className="relative min-h-[54px] rounded-[14px] border-onco-sage bg-onco-sage px-4 py-3 pr-12 text-onco-cream">
          <p className="font-semibold">{onboarding.supportPerson.name}</p>
          <p className="text-sm text-onco-cream/80">{onboarding.supportPerson.relationship} - Invite sent - pending</p>
          <span className="absolute right-3 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded-full border border-onco-cream/70 text-[10px] text-onco-cream">
            <CheckIcon />
          </span>
        </Card>
      ) : <Card tone="sand">No support person yet.</Card>}
      <Button className="mt-4 w-full" variant="outline" onClick={onAdd}>Add support person</Button>
    </ScreenTitle>
  );
}

function GoalTracking() {
  const router = useRouter();
  const { onboarding } = useDemoStore();
  const standardGoalOptions = [
    "Rebuild stamina for gardening and errands.",
    "Feel less afraid of movement.",
    "Support my long-term health outcomes.",
  ];
  const goalOptions = [...standardGoalOptions, "Write my own..."];
  const goalParts = onboarding.goalAnchor.split(" | ").map((part) => part.trim()).filter(Boolean);
  const selectedGoals = standardGoalOptions.filter((goal) => goalParts.includes(goal));
  const customGoal = goalParts.find((goal) => !standardGoalOptions.includes(goal)) || "";
  const [customGoalOpen, setCustomGoalOpen] = useState(Boolean(customGoal));

  function updateGoalAnchor(nextSelectedGoals: string[], nextCustomGoal = customGoal) {
    const nextGoals = [...nextSelectedGoals, nextCustomGoal.trim()].filter(Boolean);
    demoStore.updateOnboarding({ goalAnchor: nextGoals.join(" | ") });
  }

  return (
    <ScreenTitle title="Last thing - what matters most to you?" subtitle="This becomes your anchor. Artie will bring it back to you on the hard days.">
      <div className="space-y-2.5">
        {goalOptions.map((goal) => {
          const isOwnOption = goal.includes("own");
          const isSelected = isOwnOption ? customGoalOpen || Boolean(customGoal) : selectedGoals.includes(goal);
          if (isOwnOption && isSelected) {
            return (
              <div className="space-y-2" key={goal}>
                <button
                  className="onco-option-row onco-option-row-active"
                  type="button"
                  onClick={() => {
                    setCustomGoalOpen(false);
                    updateGoalAnchor(selectedGoals, "");
                  }}
                >
                  <GoalAnchorIcon goal={goal} selected />
                  <span className="min-w-0 flex-1 pr-7">Write my own...</span>
                  <span className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full border border-onco-cream/70 text-[10px]">
                    <CheckIcon />
                  </span>
                </button>
                <textarea
                  autoFocus
                  aria-label="Write my own goal"
                  className="onco-input min-h-[112px] resize-y py-4 text-base font-semibold leading-6"
                  placeholder="Tell us what matters most to you..."
                  value={customGoal}
                  onChange={(event) => updateGoalAnchor(selectedGoals, event.target.value)}
                />
              </div>
            );
          }          return (
            <button
              className={cn(
                "onco-option-row",
                isSelected && "onco-option-row-active",
              )}
              key={goal}
              type="button"
              onClick={() => {
                if (isOwnOption) {
                  setCustomGoalOpen(true);
                  return;
                }
                updateGoalAnchor(
                  isSelected
                    ? selectedGoals.filter((selectedGoal) => selectedGoal !== goal)
                    : [...selectedGoals, goal],
                );
              }}
            >
              <GoalAnchorIcon goal={goal} selected={isSelected} />
              <span className="min-w-0 flex-1 pr-7">{goal}</span>
              {isSelected ? (
                <span className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full border border-onco-cream/70 text-[10px]">
                  <CheckIcon />
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <Select
        className="mt-5 block"
        label="Tracking source"
        value={onboarding.trackingType}
        onChange={(trackingType) => {
          demoStore.updateOnboarding({ trackingType });
          router.push(`/devices?from=onboarding&source=${encodeURIComponent(trackingType)}`);
        }}
        options={trackingOptions.map((value) => ({ label: value, value }))}
      />
    </ScreenTitle>
  );
}

function GoalAnchorIcon({ goal, selected }: { goal: string; selected: boolean }) {
  return (
    <span className={cn("onco-option-icon", selected && "text-onco-cream")} aria-hidden="true">
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9">
        {goal.includes("stamina") ? (
          <>
            <path d="M4 8h16v10H4z" />
            <path d="M7 11h1M10 11h1M13 11h1M16 11h1" />
            <path d="M7 15h10" />
          </>
        ) : null}
        {goal.includes("afraid") ? (
          <>
            <path d="M5 6.5 12 4l7 2.5v5.2c0 4.1-2.7 7.3-7 8.8-4.3-1.5-7-4.7-7-8.8V6.5Z" />
            <path d="m8.5 12 2.4 2.4 4.7-5" />
          </>
        ) : null}
        {goal.includes("long-term") ? (
          <>
            <path d="M4 20h16" />
            <path d="M6 20V9l6-4 6 4v11" />
            <path d="M10 20v-6h4v6" />
          </>
        ) : null}
        {goal.includes("own") ? (
          <>
            <path d="M6 18h12" />
            <path d="m8 14 7.8-7.8a2 2 0 0 1 2.8 2.8L10.8 16.8 7 17l1-3Z" />
          </>
        ) : null}
      </svg>
    </span>
  );
}

function TrackingTypeIcon({ trackingType }: { trackingType: TrackingType }) {
  return (
    <span className="grid h-7 w-7 place-items-center text-onco-sage" aria-hidden="true">
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9">
        {trackingType === "Apple Health" ? (
          <>
            <path d="M5 5h14v11H5z" />
            <path d="M8 19h8" />
            <path d="M12 16v3" />
            <path d="m8 10 2.2 2.2L12 8l2 5 1.5-3H18" />
          </>
        ) : null}
        {trackingType === "Google Fit" ? (
          <>
            <path d="M12 19s-7-4.4-7-9.4A3.7 3.7 0 0 1 11.3 7L12 7.8l.7-.8A3.7 3.7 0 0 1 19 9.6C19 14.6 12 19 12 19Z" />
          </>
        ) : null}
        {trackingType === "Garmin" ? (
          <>
            <rect x="7" y="4" width="10" height="16" rx="3" />
            <path d="M10 8h4" />
            <path d="M10 14h4" />
          </>
        ) : null}
        {trackingType === "Fitbit" ? (
          <>
            <circle cx="8" cy="8" r="1.1" fill="currentColor" stroke="none" />
            <circle cx="12" cy="8" r="1.1" fill="currentColor" stroke="none" />
            <circle cx="16" cy="8" r="1.1" fill="currentColor" stroke="none" />
            <circle cx="8" cy="12" r="1.1" fill="currentColor" stroke="none" />
            <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
            <circle cx="16" cy="12" r="1.1" fill="currentColor" stroke="none" />
            <circle cx="8" cy="16" r="1.1" fill="currentColor" stroke="none" />
            <circle cx="12" cy="16" r="1.1" fill="currentColor" stroke="none" />
            <circle cx="16" cy="16" r="1.1" fill="currentColor" stroke="none" />
          </>
        ) : null}
        {trackingType === "Manual" ? (
          <>
            <path d="M6 18h12" />
            <path d="m8 14 7.8-7.8a2 2 0 0 1 2.8 2.8L10.8 16.8 7 17l1-3Z" />
          </>
        ) : null}
      </svg>
    </span>
  );
}

function ReadyToGenerate() {
  const { onboarding } = useDemoStore();
  const baselineMet = estimateBaselineMetHours(onboarding);
  const selectedTrail = trailSuggestions.find((trail) => trail.id === onboarding.selectedTrailId);
  return (
    <ScreenTitle title="Ready to build your first plan." subtitle="Artie will adapt around your answers.">
      <Card tone="sage">
        <div className="flex items-center justify-between gap-3">
          <p className="font-semibold">Plan inputs</p>
          <AiBadge light />
        </div>
        <p className="mt-3 text-xs leading-5 text-[#C7D8CC]">Baseline: {baselineMet || 0} MET-hrs/week from usual movement.</p>
        {selectedTrail ? <p className="mt-2 text-xs leading-5 text-[#C7D8CC]">Route idea: {selectedTrail.name}, {selectedTrail.distance}, about {selectedTrail.time}.</p> : null}
        <p className="mt-2 text-sm text-[#C7D8CC]">{onboarding.preferences.join(", ")} - {onboarding.barriers.join(", ")}</p>
      </Card>
    </ScreenTitle>
  );
}

export function SafetyPauseClient() {
  const { onboarding } = useDemoStore();
  const router = useRouter();
  return (
    <PatientShell bottomNav={false} requireRole>
      <Card tone="sand" className="mt-10">
        <h1 className="onco-display text-2xl font-extrabold">Pause before starting</h1>
        <p className="mt-3 text-sm leading-6">You selected: {onboarding.redFlags.join(", ")}. Please acknowledge this safety pause before viewing your plan.</p>
      </Card>
      <Button className="mt-5 w-full" onClick={() => { demoStore.setSafetyPaused(false); router.push("/plan-reveal"); }}>I understand - show my plan</Button>
      <Link className="onco-button-outline mt-3 w-full" href="/doctor-summary" onClick={() => window.sessionStorage.removeItem("doctorSummaryBackTo")}>Share with my doctor first</Link>
    </PatientShell>
  );
}

export function PlanRevealClient() {
  const { onboarding, patientPlan, patientProfile, generatedCareCode } = useDemoStore();
  const baselineMet = estimateBaselineMetHours(onboarding);
  const firstName = patientProfile.name?.trim().split(/\s+/)[0] || "Patient";
  return (
    <PatientShell bottomNav={false} requireRole>
      <div className="mt-8 text-center">
        <ArtieAvatar className="mx-auto mb-4 h-12 w-12" />
        <h1 className="onco-display text-[28px] font-extrabold leading-[1.06] text-onco-ink">{firstName}, your first prescription is ready</h1>
        <p className="mx-auto mt-3 max-w-[320px] text-sm leading-6 text-onco-muted">
          It's small on purpose. We're building a foundation, not chasing a finish line.
        </p>
      </div>
      <Card tone="sage" className="mt-8 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#A9C5B4]">Week 1 prescription</p>
        <h1 className="onco-display mt-2 text-3xl font-extrabold">{patientPlan.activity} {patientPlan.minutes} minutes</h1>
        <p className="mt-1 text-sm text-[#C7D8CC]">{patientPlan.daysPerWeek} days/week - {patientPlan.intensity} - {patientPlan.metHours} MET-hrs/wk</p>
      </Card>
      <Card className="mt-4">
        <div className="flex items-center justify-between gap-3">
          <p className="font-semibold">Adapted for you</p>
          <AiBadge />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">{patientPlan.adaptations.map((item) => <Pill active key={item}>{item}</Pill>)}</div>
      </Card>
      <Card className="mt-4">
        <div className="flex items-center justify-between gap-3">
          <p className="font-semibold">Baseline used</p>
          <AiBadge />
        </div>
        <p className="mt-2 text-sm leading-6 text-onco-muted">
          Artie estimated {baselineMet || 0} MET-hrs/week from your usual movement. Phase I builds gradually toward +10 MET-hrs/week above baseline.
        </p>
      </Card>
      {patientProfile.selfStarted && patientProfile.careTeamCode ? (
        <Card className="mt-4">
          <p className="font-semibold">Linked clinic</p>
          <p className="mt-2 text-sm leading-6 text-onco-muted">{patientProfile.siteName || patientProfile.careTeam}</p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.05em] text-onco-muted-light">Team ID</p>
          <p className="onco-display mt-1 text-xl font-extrabold text-onco-ink">{patientProfile.careTeamCode}</p>
        </Card>
      ) : null}
      {generatedCareCode ? (
        <Card tone="sand" className="mt-4">
          <p className="onco-display text-xl font-extrabold">Your care code</p>
          <p className="mt-2 text-sm leading-6 text-onco-muted">Save this code somewhere easy to find. You can use it later to reconnect your plan or share it with your care team.</p>
          <p className="onco-display mt-4 text-3xl font-extrabold">{generatedCareCode}</p>
          <Button className="mt-4 w-full" variant="outline" onClick={() => { void navigator.clipboard?.writeText(generatedCareCode); demoStore.toast("Care Code copied"); }}>Copy code</Button>
        </Card>
      ) : null}
      <Link className="onco-button-primary mt-5 w-full" href="/today">Continue to Today</Link>
      <Link className="onco-button-outline mt-3 w-full" href="/doctor-summary" onClick={() => window.sessionStorage.removeItem("doctorSummaryBackTo")}>Share with my doctor first</Link>
    </PatientShell>
  );
}

export function TodayClient() {
  const state = useDemoStore();
  const [modal, setModal] = useState<"done" | "manual" | "fatigue" | "symptom" | null>(null);
  const totalMinutes = state.activityLogs.reduce((sum, log) => sum + log.duration, 0);
  const totalMet = state.activityLogs.reduce((sum, log) => sum + log.metHours, 0);
  const goal = state.patientPlan.minutes * state.patientPlan.daysPerWeek;
  return (
    <PatientShell activeTab="today" requireRole>
      <header className="flex items-start justify-between"><div><p className="text-[12px] font-semibold text-onco-terracotta">Good morning,</p><h1 className="onco-display text-[28px] font-extrabold">{state.patientProfile.name || "Patient"}</h1></div><ArtieAvatar /></header>
      <section className="onco-card-sage mt-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#A9C5B4]">Today's prescription</p>
        <h2 className="onco-display mt-3 text-[34px] font-extrabold leading-none">{state.patientPlan.activity} {state.patientPlan.minutes} min</h2>
        <p className="mt-2 text-sm text-[#C7D8CC]">{state.patientPlan.intensity}. {state.patientPlan.adaptations[0] || "Start easy."}</p>
        <div className="mt-5 grid grid-cols-2 gap-2"><Button variant="cream" onClick={() => setModal("done")}>I did it</Button><Link className="onco-button-cream bg-onco-cream/15 text-onco-cream" href="/guided-walk">Start walk</Link></div>
      </section>
      <div className="mt-4 grid grid-cols-2 gap-3"><Button variant="outline" onClick={() => setModal("fatigue")}>I'm too tired</Button><Button variant="outline" className="text-onco-terracotta" onClick={() => setModal("symptom")}>I have a symptom</Button></div>
      <Button className="mt-3 w-full" variant="outline" onClick={() => setModal("manual")}>Log something else</Button>
      <Card className="mt-4"><div className="flex justify-between"><p className="font-semibold">Weekly progress</p><p className="font-bold text-onco-terracotta">{totalMinutes}/{goal} min</p></div><ProgressBar className="mt-3" value={totalMinutes} max={goal} /><p className="mt-2 text-xs text-onco-muted">{totalMet.toFixed(2)} MET-hours earned</p></Card>
      <Card className="mt-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.06em] text-onco-muted-light">Next Artie session</p>
            <p className="mt-1 font-semibold">Session 3 - Goal setting</p>
            <p className="mt-1 text-xs leading-5 text-onco-muted">8 minutes to plan around fatigue and protect your weekly rhythm.</p>
          </div>
          <Link className="onco-button-outline min-h-0 shrink-0 py-2 text-xs" href="/sessions/3">Start</Link>
        </div>
      </Card>
      <ActivityModal type={modal} onClose={() => setModal(null)} />
    </PatientShell>
  );
}

function ActivityModal({ type, onClose }: { type: "done" | "manual" | "fatigue" | "symptom" | null; onClose: () => void }) {
  const state = useDemoStore();
  const [duration, setDuration] = useState(state.patientPlan.minutes);
  const [paceFeel, setPaceFeel] = useState("Easy");
  const [activity, setActivity] = useState("Walking");
  const [symptom, setSymptom] = useState("No");
  const red = /chest pain|dizzy|dizziness|faint|fever|severe shortness of breath|shortness of breath/i.test(symptom);
  if (!type) return null;
  if (type === "fatigue") return <Modal open title="Artie fatigue guidance" onClose={onClose}><p className="text-sm leading-6 text-onco-muted">Try a 5-minute easy version. If something feels off, pause and report a symptom.</p><Button className="mt-4" onClick={onClose}>Got it</Button></Modal>;
  if (type === "symptom") return <Modal open title="Report symptom" onClose={onClose}><input className="onco-input" value={symptom} onChange={(event) => setSymptom(event.target.value)} /><>{red ? <Card tone="sand" className="mt-3">Safety pause alert: stop activity and contact your care team.</Card> : null}</><Button className="mt-4" onClick={() => { demoStore.addSymptomReport({ symptom, redFlag: red }); onClose(); }}>Save symptom</Button></Modal>;
  return <Modal open title={type === "done" ? "Log completion" : "Manual activity log"} onClose={onClose}><Select label="Activity" value={activity} onChange={setActivity} options={["Walking", "Gardening", "Cycling", "Stretching"].map((value) => ({ label: value, value }))} /><label className="mt-3 block text-sm font-semibold">Duration<input className="onco-input mt-1" type="number" value={duration} onChange={(event) => setDuration(Number(event.target.value))} /></label><Select className="mt-3 block" label="Pace feel" value={paceFeel} onChange={setPaceFeel} options={["Easy", "A little breathless", "Hard"].map((value) => ({ label: value, value }))} /><Select className="mt-3 block" label="Symptoms?" value={symptom} onChange={setSymptom} options={["No", "Yes"].map((value) => ({ label: value, value }))} /><Button className="mt-4 w-full" onClick={() => { demoStore.addActivityLog({ activity, duration, paceFeel, symptoms: symptom === "Yes" }); onClose(); }}>Save activity</Button></Modal>;
}

export function PrescriptionClient() {
  const { patientPlan, onboarding } = useDemoStore();
  const [open, setOpen] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [showAllAdaptations, setShowAllAdaptations] = useState(false);
  const weeklyMinutes = patientPlan.minutes * patientPlan.daysPerWeek;
  const adaptationChips = patientPlan.adaptations.length ? patientPlan.adaptations : ["starts gently"];
  const visibleAdaptations = showAllAdaptations ? adaptationChips : adaptationChips.slice(0, 4);
  const hiddenAdaptationCount = Math.max(adaptationChips.length - visibleAdaptations.length, 0);
  const safetyItems = [
    { title: "Stop for chest pain", detail: "Pause activity and contact your care team if chest pain or pressure appears." },
    { title: "Hydrate", detail: "Keep water nearby and use a gentler version on tired days." },
    { title: "Use flat steady routes", detail: "Choose smooth, predictable paths and avoid pushing pace." },
    { title: "Choose bathroom loops", detail: "Use short loops near home or places with easy bathroom access." },
  ];
  return (
    <PatientShell activeTab="prescription" requireRole>
      <h1 className="onco-display text-[28px] font-extrabold">Your prescription</h1>
      <Card tone="sage" className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.06em] text-onco-cream/70">This week</p>
        <h2 className="onco-display mt-2 text-3xl font-extrabold">{patientPlan.activity} {patientPlan.minutes} minutes</h2>
        <p className="mt-2 text-sm text-onco-cream/80">{patientPlan.daysPerWeek} days/week - {patientPlan.intensity}</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-onco-cream/12 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-onco-cream/65">Weekly goal</p>
            <p className="mt-1 text-lg font-extrabold">{weeklyMinutes} min</p>
          </div>
          <div className="rounded-2xl bg-onco-cream/12 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-onco-cream/65">MET dose</p>
            <p className="mt-1 text-lg font-extrabold">{patientPlan.metHours}</p>
          </div>
        </div>
      </Card>
      <Card className="mt-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold">Adapted for you</p>
            <p className="mt-1 text-sm leading-5 text-onco-muted">Artie shaped this around your profile and comfort level.</p>
          </div>
          <AiBadge />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {visibleAdaptations.map((item) => <Pill active key={item}>{item}</Pill>)}
          {hiddenAdaptationCount ? (
            <Pill className="cursor-pointer" onClick={() => setShowAllAdaptations((value) => !value)}>
              {showAllAdaptations ? "Show less" : `+${hiddenAdaptationCount} more`}
            </Pill>
          ) : null}
        </div>
      </Card>
      <Card className="mt-4">
        <p className="font-semibold">Before you start</p>
        <div className="mt-3 divide-y divide-onco-line">
          {safetyItems.map((item) => (
            <button
              className="flex w-full items-start gap-3 py-3 text-left"
              key={item.title}
              onClick={() => setOpen(open === item.title ? null : item.title)}
              type="button"
            >
              <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-onco-sage-soft text-onco-sage">
                <CheckIcon className="text-sm" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{item.title}</span>
                {open === item.title ? <span className="mt-1 block text-xs leading-5 text-onco-muted">{item.detail}</span> : null}
              </span>
            </button>
          ))}
        </div>
      </Card>
      <Link
        className="onco-button-primary mt-4 w-full"
        href="/doctor-summary?from=prescription"
        onClick={() => window.sessionStorage.setItem("doctorSummaryBackTo", "prescription")}
      >
        Share with doctor
      </Link>
      <Button className="mt-3 w-full" variant="outline" onClick={() => demoStore.toast("Doctor review requested")}>Request doctor review</Button>
      <Button className="mt-3 w-full" variant="outline" onClick={() => setHistoryOpen(true)}>View prescription history</Button>
      <Modal open={historyOpen} title="Prescription history" onClose={() => setHistoryOpen(false)}>
        <div className="space-y-3 text-sm">
          <Card><p className="font-semibold">Week 1 active</p><p className="text-onco-muted">{patientPlan.activity} {patientPlan.minutes} minutes, {patientPlan.daysPerWeek} days/week.</p></Card>
          <Card><p className="font-semibold">Draft generated</p><p className="text-onco-muted">Adapted for {onboarding.barriers.length ? onboarding.barriers.join(", ") : "your current preferences"}.</p></Card>
        </div>
      </Modal>
    </PatientShell>
  );
}

export function LegacySessionsClient() {
  const { completedSessions } = useDemoStore();
  return (
    <PatientShell activeTab="sessions" requireRole>
      <h1 className="onco-display text-[28px] font-extrabold">Sessions</h1>
      {[1, 2, 3].map((id) => <Card key={id} className="mt-3 flex items-center justify-between"><div><p className="font-semibold">Session {id}{id === 3 ? " - Goal setting" : ""}</p><p className="text-xs text-onco-muted">{completedSessions.includes(id) ? "Completed" : "Available now"}</p></div>{id === 3 ? <Link className="onco-button-primary min-h-0 py-2" href="/sessions/3">Start session 3</Link> : <Badge>Done</Badge>}</Card>)}
    </PatientShell>
  );
}

export function LegacySessionThreeClient() {
  const router = useRouter();
  const state = useDemoStore();
  const progress = state.sessionProgress["3"] || 0;
  const firstName = state.patientProfile.name?.trim().split(/\s+/)[0] || "there";
  const messages = [`Nice to see you, ${firstName}. What got in the way this week?`, "That is information, not failure. Want to plan around fatigue?", "Great. I will update your goal to protect infusion days.", "Session complete."];
  return (
    <PatientShell bottomNav={false} requireRole>
      <h1 className="onco-display text-xl font-extrabold text-center">Session 3 - Goal setting</h1><Stepper className="mt-3" current={Math.min(progress + 1, 5)} total={5} />
      <div className="mt-6 space-y-3"><ChatBubble sender="artie" text={messages[Math.min(progress, messages.length - 1)]} />{progress < 3 ? <Button className="w-full" variant="outline" onClick={() => demoStore.setSessionProgress(3, progress + 1)}>{progress === 0 ? "Fatigue got in the way" : "Yes, plan around it"}</Button> : <Button className="w-full" onClick={() => { demoStore.completeSession(3); demoStore.toast("Session 3 completed"); router.push("/sessions"); }}>Finish session</Button>}</div>
    </PatientShell>
  );
}

export function SessionsClient() {
  const { completedSessions, programSessions } = useDemoStore();
  const completedCount = completedSessions.filter((sessionNumber) => sessionNumber <= 12).length;
  const completionPercent = Math.round((completedCount / 12) * 100);
  const sessionRows = [
    { number: 1, title: "Getting started", detail: "Monitoring intensity", completed: "Completed May 26" },
    { number: 2, title: "Safety + hydration", detail: "What to wear", completed: "Completed June 6" },
    { number: 3, title: "Goal setting", detail: "8 minutes", description: "Artie reviews your last 2 weeks, helps you set a goal that fits your energy, and updates your prescription." },
    { number: 4, title: "Tracking your movement", detail: "10 minutes", description: "Connect tracking habits so your minutes, steps, and MET dose stay easy to follow." },
    { number: 5, title: "Fitness check-in", detail: "10 minutes", description: "Review how your body is responding and adjust your plan around today's energy." },
    { number: 6, title: "Why movement helps recovery", detail: "10 minutes", description: "Learn how small, safe movement supports stamina, confidence, and daily routines." },
    { number: 7, title: "Overcoming barriers", detail: "10 minutes", description: "Plan around fatigue, bathrooms, weather, motivation, and other real-life blockers." },
    { number: 8, title: "Support and routines", detail: "10 minutes", description: "Choose support, reminders, and routine anchors that make the plan easier to keep." },
    { number: 9, title: "Enjoyment and confidence", detail: "10 minutes", description: "Keep movement connected to what feels doable and meaningful." },
    { number: 10, title: "Progress reflection", detail: "10 minutes", description: "Look back at your progress and decide what should change next." },
    { number: 11, title: "Doctor visit prep", detail: "10 minutes", description: "Prepare questions and a simple movement summary for your care team." },
    { number: 12, title: "Next phase plan", detail: "10 minutes", description: "Set up the next phase with a plan that can keep growing safely." },
  ];
  const completedSessionRows = sessionRows.filter((session) => completedSessions.includes(session.number));
  const currentSession = sessionRows.find((session) => !completedSessions.includes(session.number));
  const upcomingRows = currentSession ? sessionRows.filter((session) => session.number > currentSession.number) : [];
  return (
    <PatientShell activeTab="sessions" requireRole>
      <h1 className="onco-display text-[28px] font-extrabold">Sessions</h1>
      <div className="mt-1 flex items-center justify-between gap-3 text-sm text-onco-muted">
        <p>Phase 1: Building habits</p>
        <p className="shrink-0">{completedCount} of 12 complete</p>
      </div>
      <ProgressBar className="mt-3" value={completionPercent} max={100} />
      <div className="mt-5 space-y-3">
        {completedSessionRows.map((session) => (
          <Card key={session.number} className="flex min-h-[76px] items-center gap-3 p-4">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-onco-sage-soft text-onco-sage">
              <CheckIcon />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-tight">{session.number} - {session.title}</p>
              <p className="mt-1 text-xs text-onco-muted">{session.detail} - {session.completed || "Completed"}</p>
            </div>
          </Card>
        ))}

        {currentSession ? (
          <div className="rounded-[22px] bg-onco-sage p-4 text-onco-cream shadow-[0_14px_32px_-24px_rgba(30,36,33,0.65)]">
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-onco-cream/20 text-sm font-extrabold">{currentSession.number}</div>
              <div className="min-w-0 flex-1">
                <h2 className="font-extrabold leading-tight">{currentSession.title}</h2>
                <p className="mt-1 text-xs font-semibold text-onco-cream/80">{currentSession.detail} - Available now</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-onco-cream/90">{currentSession.description}</p>
            <Link className="mt-4 flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-onco-cream px-4 text-sm font-extrabold text-onco-ink" href={`/sessions/${currentSession.number}`}>
              <span className="grid h-5 w-5 place-items-center rounded-full border border-onco-sage/30 text-onco-sage" aria-hidden="true">
                <span className="ml-0.5 h-0 w-0 border-y-[5px] border-l-[7px] border-y-transparent border-l-current" />
              </span>
              Start session {currentSession.number}
            </Link>
          </div>
        ) : (
          <Card tone="sage" className="text-center">
            <CheckIcon className="mx-auto text-2xl" />
            <p className="mt-2 font-extrabold">All Phase 1 sessions complete</p>
            <p className="mt-1 text-sm text-onco-cream/80">Your next phase can open from your care plan.</p>
          </Card>
        )}
      </div>

      <div className="mt-5 space-y-4 px-3 pb-4">
        {upcomingRows.map((session) => (
          <div key={session.number} className="grid grid-cols-[42px_1fr] items-start gap-2 text-sm text-onco-muted">
            <span className="font-semibold tabular-nums">{session.number}</span>
            <span className="font-semibold leading-snug">{session.title}</span>
          </div>
        ))}
      </div>
      {false && programSessions.map((session) => {
        const done = completedSessions.includes(session.number);
        const available = done || session.number === 3;
        return (
          <Card key={session.id} className={cn("mt-3 flex items-center justify-between gap-3", !available && "opacity-60")}>
            <div>
              <p className="font-semibold">Session {session.number}: {session.title}</p>
              <p className="text-xs text-onco-muted">{done ? "Completed" : available ? `${session.estimatedMinutes} min - available now` : "Locked for later"}</p>
            </div>
            {done ? <Badge>Done</Badge> : available ? <Link className="onco-button-primary min-h-0 shrink-0 py-2 text-xs" href={`/sessions/${session.number}`}>Start</Link> : <Badge tone="sand">Locked</Badge>}
          </Card>
        );
      })}
    </PatientShell>
  );
}

export function SessionThreeClient() {
  return <SessionFlowClient sessionId={3} />;
}

export function SessionFlowClient({ sessionId }: { sessionId: number }) {
  const router = useRouter();
  const state = useDemoStore();
  const [typed, setTyped] = useState("");
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [sessionMessages, setSessionMessages] = useState<Array<{ sender: "artie" | "user"; text: string }>>([]);
  const session = state.programSessions.find((item) => item.number === sessionId) || state.programSessions[2];
  const progress = state.sessionProgress[String(sessionId)] || 0;
  const firstName = state.patientProfile.name?.trim().split(/\s+/)[0] || "there";
  const openingMessage = `Nice to see you, ${firstName}. Last week you completed 2 of your 3 walks - that's real progress. What got in the way on Thursday?`;
  const profileSuggestionChips = useMemo(() => {
    const suggestions: string[] = [];
    const selected = [...state.onboarding.barriers, ...state.onboarding.preferences, ...state.onboarding.preferenceChips];
    const has = (...values: string[]) => selected.some((item) => values.some((value) => item.toLowerCase().includes(value.toLowerCase())));
    if (has("Fatigue")) suggestions.push("Fatigue got in the way");
    if (has("Bathroom")) suggestions.push("Bathroom access");
    if (has("Fear of overdoing", "overdo")) suggestions.push("I was worried I would overdo it");
    if (has("Neuropathy", "Numb feet")) suggestions.push("My feet felt numb");
    if (has("Nausea")) suggestions.push("Nausea made it harder");
    if (has("No time")) suggestions.push("I did not have enough time");
    if (has("Weather")) suggestions.push("Weather got in the way");
    if (has("No safe place")) suggestions.push("I did not feel safe walking");
    if (has("Gardening")) suggestions.push("I want gardening to count");
    if (has("Walking")) suggestions.push("Walking felt doable");
    return Array.from(new Set(suggestions)).slice(0, 4).length
      ? Array.from(new Set(suggestions)).slice(0, 4)
      : ["Fatigue got in the way", "Bathroom access", "I was worried I would overdo it"];
  }, [state.onboarding.barriers, state.onboarding.preferenceChips, state.onboarding.preferences]);
  function artieSessionReply(answer: string) {
    if (/bathroom/i.test(answer)) return "That makes sense. Bathroom access is planning information, not an excuse. Want to build shorter loops with restroom stops?";
    if (/overdo|worried|afraid/i.test(answer)) return "That worry is valid. We can keep your next goal below your limit and use a stop-before-tired rule.";
    if (/neuropathy|numb|feet/i.test(answer)) return "Thanks for flagging that. We can favor flatter routes, shorter loops, and shoes or surfaces that feel steadier.";
    if (/nausea/i.test(answer)) return "Nausea days need a softer plan. We can use very short movement windows and avoid pushing on rough treatment days.";
    if (/weather/i.test(answer)) return "Weather is a real planning detail. I can suggest indoor backups or shaded, cooler route windows.";
    if (/safe/i.test(answer)) return "Safety comes first. We can use indoor movement, supported routes, or care-team-approved alternatives.";
    if (/garden/i.test(answer)) return "Gardening can count when it is paced safely. We can split it into short, gentle blocks.";
    if (/walking/i.test(answer)) return "Good. We'll keep walking as the anchor and adjust the dose around your current energy.";
    if (/fatigue|wiped|tired|infusion/i.test(answer)) return "That's not a failure - that's information. Infusion days are predictably hard. Want to plan your walks around your treatment schedule?";
    return "Thank you for telling me. I'll use that to shape a safer, more realistic goal for this week.";
  }
  function sendAnswer(answer: string) {
    const cleanAnswer = answer.trim();
    if (!cleanAnswer) return;
    setSessionMessages((current) => [
      ...current,
      { sender: "user", text: cleanAnswer },
      { sender: "artie", text: artieSessionReply(cleanAnswer) },
    ]);
    setTyped("");
    demoStore.setSessionProgress(sessionId, progress + 1);
  }
  function sendTypedAnswer() {
    sendAnswer(typed);
  }
  return (
    <PatientShell bottomNav={false} requireRole>
      <div className="flex min-h-ios-compact flex-col">
        <div>
          <div className="relative">
            <button
              aria-label="Back to goal setting"
              className="absolute left-0 top-1/2 grid h-9 w-9 -translate-y-1/2 cursor-pointer place-items-center rounded-full border border-onco-line bg-white text-xl font-bold text-onco-sage shadow-sm"
              onClick={() => router.push("/sessions")}
              type="button"
            >
              {"<"}
            </button>
            <h1 className="onco-display px-11 text-center text-xl font-extrabold">Session {session.number}: {session.title}</h1>
          </div>
          <Stepper className="mt-4" current={Math.min(progress + 1, 5)} total={5} />
        </div>
        <div className="mt-6 flex-1 space-y-3 pb-4">
          <ChatBubble sender="artie" text={openingMessage} />
          {sessionMessages.map((message, index) => (
            <ChatBubble key={`${message.sender}-${index}`} sender={message.sender} text={message.text} />
          ))}
          {progress < 3 ? (
            <div className="flex flex-wrap gap-2.5">
              {profileSuggestionChips.map((reply) => (
                <Pill className="cursor-pointer" key={reply} onClick={() => sendAnswer(reply)}>{reply}</Pill>
              ))}
            </div>
          ) : null}
        </div>
        {progress < 3 ? (
          <div className="sticky bottom-0 z-20 mt-auto bg-onco-paper/95 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
            <div className="flex min-h-[50px] items-center gap-2 rounded-full border border-onco-line bg-white p-2 shadow-[0_10px_28px_-22px_rgba(30,36,33,0.55)]">
              <input
                className="min-w-0 flex-1 bg-transparent px-2 text-[16px] outline-none placeholder:text-[#A9ADA8]"
                value={typed}
                onChange={(event) => setTyped(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") sendTypedAnswer();
                }}
                placeholder="Type an answer..."
              />
              <button className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-onco-sage" type="button" onClick={() => setVoiceOpen(true)} aria-label="Use microphone"><MicIcon className="text-lg" /></button>
              <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-onco-sage text-onco-cream disabled:opacity-40" type="button" disabled={!typed.trim()} onClick={sendTypedAnswer} aria-label="Send answer"><ArrowUpIcon /></button>
            </div>
          </div>
        ) : (
          <Button className="mb-[max(0.5rem,env(safe-area-inset-bottom))] mt-4 w-full" onClick={() => {
            demoStore.completeSession(sessionId);
            demoStore.toast(`Session ${sessionId} completed`);
            router.push("/sessions");
          }}>Finish session</Button>
        )}
      </div>
      <Modal open={voiceOpen} title="Voice input" onClose={() => setVoiceOpen(false)}>
        <p className="text-sm text-onco-muted">Use a short voice note to tell Artie what got in the way.</p>
        <Button className="mt-4" onClick={() => { setTyped("Fatigue got in the way"); setVoiceOpen(false); }}>Use sample answer</Button>
      </Modal>
    </PatientShell>
  );
}

export function ProgressClient() {
  const state = useDemoStore();
  const [range, setRange] = useState("This month");
  const [historyOpen, setHistoryOpen] = useState(false);
  const loggedMinutes = state.activityLogs.reduce((sum, log) => sum + log.duration, 0);
  const loggedMet = state.activityLogs.reduce((sum, log) => sum + log.metHours, 0);
  const loggedActiveDays = new Set(state.activityLogs.map((log) => log.dateLabel)).size;
  const weeklyMinuteGoal = state.patientPlan.minutes * state.patientPlan.daysPerWeek;
  const weeklyMetGoal = Number(Math.max(state.patientPlan.metHours, 1.2).toFixed(2));
  const rangeProfiles: Record<string, { weeks: number; minutes: number; met: number; activeDays: number; trend: number[] }> = {
    "This month": {
      weeks: 4,
      minutes: loggedMinutes,
      met: loggedMet,
      activeDays: loggedActiveDays,
      trend: [Math.max(4, loggedMinutes - 18), Math.max(8, loggedMinutes - 10), Math.max(10, loggedMinutes - 4), Math.max(0, loggedMinutes)],
    },
    "Last 4 weeks": {
      weeks: 4,
      minutes: loggedMinutes + 14,
      met: loggedMet + 0.46,
      activeDays: loggedActiveDays + 2,
      trend: [Math.max(8, loggedMinutes - 8), Math.max(14, loggedMinutes + 2), Math.max(18, loggedMinutes + 8), loggedMinutes + 14],
    },
    "Last 8 weeks": {
      weeks: 8,
      minutes: loggedMinutes + 42,
      met: loggedMet + 1.28,
      activeDays: loggedActiveDays + 5,
      trend: [Math.max(16, loggedMinutes + 4), Math.max(24, loggedMinutes + 14), Math.max(34, loggedMinutes + 28), loggedMinutes + 42],
    },
    "Since start": {
      weeks: 12,
      minutes: loggedMinutes + 78,
      met: loggedMet + 2.34,
      activeDays: loggedActiveDays + 9,
      trend: [Math.max(20, loggedMinutes + 12), Math.max(38, loggedMinutes + 30), Math.max(58, loggedMinutes + 54), loggedMinutes + 78],
    },
  };
  const rangeStats = rangeProfiles[range] || rangeProfiles["This month"];
  const totalMinutes = rangeStats.minutes;
  const totalMet = rangeStats.met;
  const activeDays = rangeStats.activeDays;
  const minuteGoal = Math.max(weeklyMinuteGoal * rangeStats.weeks, 1);
  const metGoal = Number((weeklyMetGoal * rangeStats.weeks).toFixed(2));
  const metPercent = Math.min(100, Math.round((totalMet / metGoal) * 100));
  const minutePercent = Math.min(100, Math.round((totalMinutes / Math.max(minuteGoal, 1)) * 100));
  const adherence = minutePercent;
  const completion = Math.min(100, Math.round((minutePercent + metPercent + adherence) / 3));
  const milestonesReached = [activeDays >= 3, totalMinutes >= 50, state.completedSessions.length >= 3].filter(Boolean).length;
  return (
    <PatientShell activeTab="progress" requireRole>
      <h1 className="onco-display text-[28px] font-extrabold leading-none">Goals & milestones</h1>
      <p className="mt-2 text-[13px] leading-5 text-onco-muted">Track how your movement goals are growing over time.</p>
      <Select className="mt-4 block" label="Date range" value={range} onChange={setRange} options={["This month", "Last 4 weeks", "Last 8 weeks", "Since start"].map((value) => ({ label: value, value }))} />
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        <GoalKpiCard
          icon={<ClockIcon />}
          label="Weekly minutes"
          value={`${totalMinutes}/${minuteGoal}`}
          detail={`${minutePercent}% of goal`}
        />
        <GoalKpiCard
          icon={<FlameIcon />}
          label="MET dose"
          value={`${totalMet.toFixed(2)}/${metGoal.toFixed(2)}`}
          detail={`${metPercent}% of goal`}
        />
        <GoalKpiCard
          icon={<TargetIcon />}
          label="Goal completion"
          value={`${completion}%`}
          detail="On track"
        />
        <GoalKpiCard
          icon={<AwardIcon />}
          label="Milestones reached"
          value={String(milestonesReached)}
          detail="Keep it up"
        />
      </div>
      <Card className="mt-3 p-4">
        <div className="flex items-center gap-4">
          <div
            className="grid h-20 w-20 shrink-0 place-items-center rounded-full"
            style={{ background: `conic-gradient(#2D5A4A ${completion}%, #EFEAE1 ${completion}% 100%)` }}
            aria-label={`${completion}% goal completion`}
          >
            <div className="grid h-14 w-14 place-items-center rounded-full bg-white">
              <span className="onco-display text-xl font-extrabold text-onco-ink">{completion}%</span>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="onco-display text-[19px] font-extrabold leading-tight">You are building toward your weekly target.</p>
            <p className="mt-1 text-xs leading-5 text-onco-muted">Small, safe increases count.</p>
          </div>
        </div>
      </Card>
      <Card className="mt-3 p-3">
        <p className="onco-display text-lg font-extrabold">Milestones</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <MilestoneCard icon={<CalendarIcon />} title={`${activeDays} active days`} />
          <MilestoneCard icon={<AwardIcon />} title={`${totalMinutes}/50 minutes`} />
          <MilestoneCard icon={<WalkIcon />} title={`${state.completedSessions.length} sessions done`} />
        </div>
      </Card>
      <Card className="mt-3 p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="onco-display text-lg font-extrabold">Goal trend</p>
          <div className="flex items-center gap-2 text-[10px] text-onco-muted">
            <span className="inline-flex items-center gap-1"><span className="h-0.5 w-5 rounded bg-onco-sage" />{range}</span>
            <span className="inline-flex items-center gap-1"><span className="h-0.5 w-5 border-t-2 border-dotted border-onco-muted-light" />Goal</span>
          </div>
        </div>
        <GoalTrendChart values={rangeStats.trend} goal={minuteGoal || 120} />
      </Card>
      <Card className="mt-3 flex items-center gap-3 p-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-onco-sage-soft text-2xl text-onco-sage"><HeartIcon /></div>
        <div>
          <p className="onco-display text-lg font-extrabold leading-tight">Small progress counts - keep going safely.</p>
          <p className="mt-1 text-xs leading-5 text-onco-muted">You're doing great work for your body and mind.</p>
        </div>
      </Card>
      <Button className="mt-3 w-full" onClick={() => demoStore.toast("Goal update saved.", "info")}>Update goals</Button>
      <Button className="mt-3 w-full" variant="outline" onClick={() => setHistoryOpen(true)}>Share progress</Button>
      <Modal open={historyOpen} title="Activity history" onClose={() => setHistoryOpen(false)}><ActivityTable logs={state.activityLogs} /></Modal>
    </PatientShell>
  );
}

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  abort?: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onresult: ((event: unknown) => void) | null;
};

export function ArtieClient() {
  const state = useDemoStore();
  const [input, setInput] = useState("");
  const [voice, setVoice] = useState(false);
  const [voiceListening, setVoiceListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceError, setVoiceError] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const voiceTranscriptRef = useRef("");
  const firstName = state.patientProfile.name?.trim().split(/\s+/)[0] || "there";
  const patientChatKey = getPatientChatKey(state);
  const plainGreetingPattern = /^(hi|hello|hey)$/i;
  const suggestionChips = buildArtieSuggestionChips(state.onboarding, state.patientPlan);
  const currentPatientMessages = state.chatMessages.filter((message) => message.patientKey === patientChatKey);
  const welcomeMessage = `Hi ${firstName}. Ask me anything about your plan, symptoms, or how to make movement fit today.`;
  const visibleChatMessages = currentPatientMessages.filter((message) => message.text !== welcomeMessage);
  function send(text: string) {
    const trimmedText = text.trim();
    if (!trimmedText) return;
    const greeting = /^(hi|hello|hey)$/i.test(trimmedText);
    const previousGreetingCount = currentPatientMessages.filter((message) => message.sender === "user" && plainGreetingPattern.test(message.text.trim())).length;
    const safety = /chest pain|dizzy|dizziness|faint|fever|severe shortness of breath/i.test(text);
    const response = safety
      ? "That can be a red flag. Stop activity and contact your care team before continuing."
      : greeting && previousGreetingCount === 0
        ? `Hi ${firstName}. I'm here. What would you like help with today?`
        : greeting
          ? "Still here. What can I help with?"
      : artieResponse(trimmedText, firstName, state.onboarding, state.patientPlan);
    demoStore.addChatMessage({ sender: "user", text: trimmedText, patientKey: patientChatKey });
    if (response) demoStore.addChatMessage({ sender: "artie", text: response, patientKey: patientChatKey });
    if (safety) {
      demoStore.addNotification({
        type: "safety",
        title: "Artie safety triage",
        detail: `"${text}" may need care-team review before more activity.`,
      });
      demoStore.setSafetyPaused(true);
    }
    setInput("");
  }

  function startVoiceCapture() {
    setVoice(true);
    setVoiceError("");
    setVoiceTranscript("");
    voiceTranscriptRef.current = "";
    const speechWindow = window as typeof window & {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const SpeechRecognitionCtor = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setVoiceListening(false);
      setVoiceError("Voice input is not supported in this browser. Try Chrome or Safari with microphone permission enabled.");
      return;
    }

    recognitionRef.current?.abort?.();
    const recognition = new SpeechRecognitionCtor();
    let spokenText = "";
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onstart = () => setVoiceListening(true);
    recognition.onerror = (event) => {
      setVoiceListening(false);
      setVoiceError(event.error === "not-allowed" ? "Microphone permission was blocked. Please allow microphone access and try again." : "I could not hear that clearly. Please try again.");
    };
    recognition.onresult = (event) => {
      const resultEvent = event as { results: ArrayLike<ArrayLike<{ transcript: string }>> };
      spokenText = Array.from(resultEvent.results)
        .map((result) => result[0]?.transcript || "")
        .join(" ")
        .trim();
      voiceTranscriptRef.current = spokenText;
      setVoiceTranscript(spokenText);
    };
    recognition.onend = () => {
      setVoiceListening(false);
      recognitionRef.current = null;
      const finalText = (voiceTranscriptRef.current || spokenText).trim();
      if (finalText) {
        setVoice(false);
        send(finalText);
        setVoiceTranscript("");
        voiceTranscriptRef.current = "";
      } else if (!voiceError) {
        setVoiceError("I did not catch a message. Please try again.");
      }
    };
    recognitionRef.current = recognition;
    recognition.start();
  }

  useEffect(() => () => {
    recognitionRef.current?.abort?.();
  }, []);

  return (
    <PatientShell activeTab="artie" requireRole>
      <section className="flex min-h-ios-artie flex-col">
        <header className="flex items-center gap-3">
          <ArtieAvatar size="lg" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="onco-display text-[24px] font-extrabold leading-none">Ask Artie</h1>
              <AiBadge />
            </div>
            <p className="mt-1 text-xs text-onco-muted">Your activity consultant</p>
          </div>
        </header>
        <div className="mt-4 flex flex-wrap gap-2">
          {suggestionChips.map((chip) => <Pill key={chip} onClick={() => send(chip)}>{chip}</Pill>)}
        </div>
        <div className="mt-5 flex-1 space-y-3 pb-2">
          <ChatBubble sender="artie" text={welcomeMessage} />
          {visibleChatMessages.map((message) => (
            <ChatBubble key={message.id} sender={message.sender} text={message.text.replace(/^Hi Sam\./, `Hi ${firstName}.`)} />
          ))}
        </div>
        <div className="mt-3 rounded-[28px] bg-onco-paper/95 pb-2 pt-2 backdrop-blur">
          <div className="flex min-h-[54px] items-center gap-2 rounded-full border border-onco-line bg-white p-2 shadow-[0_12px_30px_-20px_rgba(30,36,33,0.55)]">
            <input
              className="min-w-0 flex-1 bg-transparent px-3 text-[16px] outline-none placeholder:text-[#A9ADA8]"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter" || event.shiftKey || !input.trim()) return;
                event.preventDefault();
                send(input);
              }}
              placeholder="Ask anything..."
            />
            <button
              className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full transition", voiceListening ? "bg-onco-sage text-onco-cream" : "bg-onco-sage-soft text-onco-sage hover:bg-onco-sage hover:text-onco-cream")}
              type="button"
              onClick={startVoiceCapture}
              aria-label="Use microphone"
            >
              <MicIcon className="text-lg" />
            </button>
            <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-onco-sage text-onco-cream" type="button" onClick={() => input.trim() && send(input)} aria-label="Send message"><ArrowUpIcon /></button>
          </div>
        </div>
      </section>
      <Modal
        open={voice}
        title="Voice capture"
        onClose={() => {
          recognitionRef.current?.abort?.();
          setVoiceListening(false);
          setVoice(false);
        }}
      >
        <p className="text-sm text-onco-muted">
          {voiceListening ? "Recording your message with the system microphone. It will be sent to Artie when you stop." : voiceError || "Tap the microphone and allow access if your browser asks."}
        </p>
        {voiceTranscript ? (
          <Card className="mt-4 text-sm leading-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-onco-muted-light">Recorded message</p>
            <p className="mt-1">{voiceTranscript}</p>
          </Card>
        ) : null}
        {voiceError ? <Button className="mt-4 w-full" onClick={startVoiceCapture}>Try microphone again</Button> : null}
        {voiceTranscript && !voiceListening ? (
          <Button
            className="mt-4 w-full"
            onClick={() => {
              const finalText = voiceTranscript.trim();
              if (!finalText) return;
              setVoice(false);
              setVoiceTranscript("");
              voiceTranscriptRef.current = "";
              send(finalText);
            }}
          >
            Send recorded message
          </Button>
        ) : null}
        {voiceListening ? (
          <Button
            className="mt-4 w-full"
            onClick={() => {
              recognitionRef.current?.stop();
            }}
          >
            Stop and send
          </Button>
        ) : null}
      </Modal>
    </PatientShell>
  );
}

export function LegacyGuidedWalkClient() {
  const router = useRouter();
  const { patientPlan } = useDemoStore();
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [pace, setPace] = useState("Easy");
  const [stopOpen, setStopOpen] = useState(false);
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [running]);
  const earned = Number(((2.5 * Math.min(seconds / 60, patientPlan.minutes)) / 60).toFixed(2));
  function complete() {
    demoStore.addActivityLog({ activity: "Walking", duration: Math.max(1, Math.round(seconds / 60)), paceFeel: pace, symptoms: false });
    router.push("/guided-walk/success");
  }
  return (
    <PatientShell bottomNav={false} inverted requireRole>
      <div className="flex min-h-ios-compact flex-col justify-between text-center"><Link className="text-left text-sm text-[#C7D8CC]" href="/today">Close</Link><section><Badge tone="cream">Guided walk - Main walk</Badge><h1 className="onco-display mt-5 text-[64px] font-extrabold">{formatTime(seconds)}</h1><p className="text-[#A9C5B4]">of {patientPlan.minutes} minutes - {earned} MET dose</p><ProgressBar className="mt-5 bg-onco-cream/25" indicatorClassName="bg-onco-sand" value={seconds / 60} max={patientPlan.minutes} /></section><section><Card className="bg-onco-cream/10 text-left text-onco-cream border-none"><p>Talk test: can you talk comfortably?</p><div className="mt-3 grid grid-cols-3 gap-2">{["Easy", "A little breathless", "Struggling"].map((item) => <Button key={item} variant={pace === item ? "cream" : "outline"} className={pace !== item ? "border-onco-cream/20 text-onco-cream" : ""} onClick={() => setPace(item)}>{item}</Button>)}</div></Card><div className="mt-4 flex gap-3"><Button className="flex-1" variant="cream" onClick={() => setRunning((value) => !value)}>{running ? "Pause" : seconds ? "Resume" : "Start"}</Button><Button className="flex-1 bg-[#F0D9CE] text-[#7A3B1E]" onClick={() => setStopOpen(true)}>I need to stop</Button></div><Button className="mt-3 w-full" variant="outline" onClick={complete}>Complete walk</Button></section></div>
      <Modal open={stopOpen} title="Stop safely" onClose={() => setStopOpen(false)}><p className="text-sm text-onco-muted">Stop now. Sit if needed. If symptoms include chest pain, dizziness, or unusual shortness of breath, contact your care team.</p><Button className="mt-4" onClick={() => { demoStore.setSafetyPaused(true); setStopOpen(false); router.push("/today"); }}>Stop and save safety note</Button></Modal>
    </PatientShell>
  );
}

export function GuidedWalkClient() {
  const router = useRouter();
  const { patientPlan, patientProfile } = useDemoStore();
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [pace, setPace] = useState("Yes easily");
  const [stopOpen, setStopOpen] = useState(false);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  const earned = Number(((2.5 * Math.min(seconds / 60, patientPlan.minutes)) / 60).toFixed(2));
  const stage = seconds < 90 ? "Warm-up" : seconds < Math.max(120, patientPlan.minutes * 45) ? "Main walk" : "Cool-down";
  const steps = Math.round(seconds * 1.35);
  const firstName = patientProfile.name?.trim().split(/\s+/)[0] || "there";

  function complete() {
    demoStore.addActivityLog({ activity: "Walking", duration: Math.max(1, Math.round(seconds / 60)), paceFeel: pace, symptoms: false });
    router.push("/guided-walk/success");
  }

  return (
    <PatientShell bottomNav={false} requireRole>
      <div className="mx-auto flex h-[calc(100dvh-0.75rem)] max-h-[720px] min-h-[620px] w-full max-w-[390px] flex-col rounded-[28px] bg-onco-sage p-3 text-center text-onco-cream shadow-onco-phone">
        <Link className="self-start rounded-full px-2 py-2 text-xs font-semibold text-[#C7D8CC] hover:text-onco-cream" href="/today">Close</Link>
        <section>
          <Badge tone="cream">Guided walk - {stage}</Badge>
          <h1 className="onco-display mt-2 text-[48px] font-extrabold leading-none">{formatTime(seconds)}</h1>
          <p className="mt-2 text-sm text-[#C7D8CC]">of {patientPlan.minutes} minutes - {earned} MET dose - {steps} steps</p>
          <div className="mt-3 grid grid-cols-4 gap-2" aria-hidden="true">
            {[0, 1, 2, 3].map((index) => (
              <span key={index} className="h-1.5 overflow-hidden rounded-full bg-onco-cream/25">
                <span className="block h-full rounded-full bg-onco-sand" style={{ width: `${Math.min(100, Math.max(0, ((seconds / 60) / patientPlan.minutes) * 400 - index * 100))}%` }} />
              </span>
            ))}
          </div>
        </section>
        <section className="mt-4 flex flex-1 flex-col pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <Card className="border-none bg-onco-cream/15 p-3 text-left text-onco-cream">
            <div className="flex gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#C86B45] text-sm">
                <WalkIcon />
              </span>
              <div>
                <p className="text-sm font-extrabold leading-5">You're doing great, {firstName}.</p>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {["Yes easily", "A little breathless", "Struggling"].map((item) => (
                <Button
                  key={item}
                  variant={pace === item ? "cream" : "outline"}
                  className={cn(
                    "min-h-[42px] px-2 text-xs leading-4",
                    pace !== item && "border-onco-cream/15 bg-onco-cream/10 text-onco-cream hover:bg-onco-cream/15 hover:text-onco-cream",
                  )}
                  onClick={() => setPace(item)}
                >
                  {item}
                </Button>
              ))}
            </div>
          </Card>
          <div className="mt-2 flex gap-2">
            <Button className="flex-1" variant="cream" onClick={() => setRunning((value) => !value)}>{running ? "Pause" : seconds ? "Resume" : "Start"}</Button>
            <Button className="flex-1 bg-[#F0D9CE] text-[#7A3B1E]" onClick={() => setStopOpen(true)}>I need to stop</Button>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-left">
            <div className="rounded-[14px] bg-onco-cream/15 p-2.5">
              <p className="text-[10px] font-bold uppercase text-[#C7D8CC]">Steps</p>
              <p className="onco-display mt-1 text-xl font-extrabold">{steps}</p>
            </div>
            <div className="rounded-[14px] bg-onco-cream/15 p-2.5">
              <p className="text-[10px] font-bold uppercase text-[#C7D8CC]">Pace feel</p>
              <p className="onco-display mt-1 text-xl font-extrabold">{pace === "Yes easily" ? "Easy" : pace === "A little breathless" ? "Steady" : "Hard"}</p>
            </div>
            <div className="rounded-[14px] bg-onco-cream/15 p-2.5">
              <p className="text-[10px] font-bold uppercase text-[#C7D8CC]">Dose</p>
              <p className="onco-display mt-1 text-xl font-extrabold">{earned}</p>
            </div>
          </div>
          <div className="mt-auto pt-4">
            <Button className="w-full border-onco-cream/35 text-onco-cream hover:bg-onco-cream hover:text-onco-ink focus-visible:bg-onco-cream focus-visible:text-onco-ink active:bg-onco-cream active:text-onco-ink" variant="outline" onClick={() => setSeconds(patientPlan.minutes * 60)}>Complete session now</Button>
            <Button className="mt-3 w-full border-onco-cream/35 text-onco-cream hover:bg-onco-cream hover:text-onco-ink focus-visible:bg-onco-cream focus-visible:text-onco-ink active:bg-onco-cream active:text-onco-ink" variant="outline" onClick={complete}>Complete walk</Button>
          </div>
        </section>
      </div>
      <Modal open={stopOpen} title="Stop safely" onClose={() => setStopOpen(false)}>
        <p className="text-sm text-onco-muted">Stop now. Sit if needed. If symptoms include chest pain, dizziness, fainting, fever, or severe shortness of breath, contact your care team.</p>
        <Button className="mt-4" onClick={() => { demoStore.setSafetyPaused(true); setStopOpen(false); router.push("/today"); }}>Stop and save safety note</Button>
      </Modal>
    </PatientShell>
  );
}

export function GuidedWalkSuccessClient() {
  const { activityLogs } = useDemoStore();
  const latest = activityLogs[0];
  return <PatientShell bottomNav={false} requireRole><Card tone="sage" className="mt-10 text-center"><CheckIcon className="mx-auto text-4xl" /><h1 className="onco-display mt-3 text-3xl font-extrabold">Walk complete</h1><p className="mt-2 text-sm text-[#C7D8CC]">{latest?.duration || 1} minutes logged - {latest?.metHours.toFixed(2) || "0.04"} MET-hours earned</p></Card><Link className="onco-button-primary mt-5 w-full" href="/progress">View progress</Link></PatientShell>;
}

export function DoctorSummaryClient() {
  const state = useDemoStore();
  const searchParams = useSearchParams();
  const [share, setShare] = useState(false);
  const minutes = state.activityLogs.reduce((sum, log) => sum + log.duration, 0);
  const met = state.activityLogs.reduce((sum, log) => sum + log.metHours, 0);
  const baselineMet = estimateBaselineMetHours(state.onboarding);
  const baselineText = `${state.onboarding.previousActivity}. Current capacity: ${state.onboarding.currentCapacity} Baseline estimate: ${baselineMet || 0} MET-hrs/week, ${state.onboarding.weeklyWalkingMinutes || 0} walking min/wk, ${state.onboarding.weeklyOtherActivityMinutes || 0} other min/wk, ${state.onboarding.averageDailySteps || "not entered"} avg steps/day${state.onboarding.sixMinuteWalk ? `, 6-min walk ${state.onboarding.sixMinuteWalk} ft` : ""}.`;
  const symptoms = state.symptomReports.length ? state.symptomReports.map((item) => `${item.symptom}${item.redFlag ? " (red flag)" : ""}`).join(", ") : "No symptoms reported.";
  const safetyFlags = state.onboarding.redFlags.length ? state.onboarding.redFlags.join(", ") : "No onboarding red flags selected.";
  const summary = `OncoMotionRx summary for ${state.patientProfile.name || "Patient"}. Context: ${state.onboarding.cancerType}, ${state.onboarding.treatmentStatus}. Baseline: ${baselineText} Prescription: ${state.patientPlan.activity} ${state.patientPlan.minutes} min, ${state.patientPlan.daysPerWeek} days/week. Adherence: ${minutes} minutes, ${met.toFixed(2)} MET-hours. Symptoms: ${symptoms}. Safety flags: ${safetyFlags}. Barriers: ${state.onboarding.barriers.join(", ")}. Questions: activity restrictions, neuropathy fall risk, and stop symptoms.`;
  const [storedBackTo, setStoredBackTo] = useState("");
  useEffect(() => {
    if (searchParams.get("from") === "prescription") {
      window.sessionStorage.setItem("doctorSummaryBackTo", "prescription");
      setStoredBackTo("prescription");
      return;
    }
    setStoredBackTo(window.sessionStorage.getItem("doctorSummaryBackTo") || "");
  }, [searchParams]);
  const fromPrescription = searchParams.get("from") === "prescription" || storedBackTo === "prescription";
  const backHref = fromPrescription ? "/prescription" : "/onboarding";
  const backText = fromPrescription ? "Back to prescription" : "Back to start";
  const doctorName = state.patientProfile.assignedDoctor || "Dr. Maya Chen";
  const barriers = state.onboarding.barriers.length ? state.onboarding.barriers : ["No barriers selected"];
  const questions = ["Any activity restrictions?", "Is neuropathy affecting fall risk?", "Which symptoms should make me stop and call?"];
  return (
    <PatientShell bottomNav={false} requireRole>
      <Link className="mb-4 inline-flex min-h-10 items-center rounded-full bg-onco-sage-soft px-3 text-sm font-semibold text-onco-sage" href={backHref}>
        {"<"} {backText}
      </Link>
      <h1 className="onco-display text-[28px] font-extrabold">Doctor summary</h1>
      <p className="mt-1 text-sm leading-6 text-onco-muted">Ready to share with {doctorName}.</p>
      <Card tone="sage" className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.06em] text-onco-cream/70">Patient plan</p>
        <h2 className="onco-display mt-2 text-2xl font-extrabold">{state.patientProfile.name || "Patient"}</h2>
        <p className="mt-2 text-sm text-onco-cream/85">{state.patientPlan.activity} {state.patientPlan.minutes} min - {state.patientPlan.daysPerWeek} days/week</p>
        <div className="mt-4 rounded-2xl bg-onco-cream/12 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-onco-cream/65">Goal</p>
          <p className="mt-1 text-sm leading-5 text-onco-cream">{state.onboarding.goalAnchor}</p>
        </div>
      </Card>
      <Card className="mt-4">
        <DoctorSummarySection title="Safety" items={[symptoms, safetyFlags]} />
      </Card>
      <Card className="mt-4">
        <DoctorSummarySection
          title="Baseline"
          items={[
            `${state.onboarding.previousActivity || "Baseline not selected"} before cancer.`,
            state.onboarding.currentCapacity || "Current capacity not entered.",
            `${baselineMet || 0} MET-hrs/week baseline estimate.`,
            `${state.onboarding.weeklyWalkingMinutes || 0} walking min/wk, ${state.onboarding.weeklyOtherActivityMinutes || 0} other min/wk.`,
          ]}
        />
      </Card>
      <Card className="mt-4">
        <DoctorSummarySection
          title="Prescription"
          items={[
            `${state.patientPlan.activity} - ${state.patientPlan.minutes} min, ${state.patientPlan.daysPerWeek} days/week.`,
            `${state.patientPlan.intensity} - ${state.patientPlan.metHours} MET-hrs/wk.`,
            `${minutes} minutes logged - ${met.toFixed(2)} MET-hours earned.`,
          ]}
        />
      </Card>
      <Card className="mt-4">
        <DoctorSummarySection title="Patient context" items={[`${state.onboarding.cancerType}, ${state.onboarding.treatmentStatus}.`, `Barriers: ${barriers.join(", ")}.`]} />
      </Card>
      <Card className="mt-4">
        <DoctorSummarySection title="Questions for doctor" items={questions} />
      </Card>
      <div className="mt-5 grid gap-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <Button onClick={() => { void navigator.clipboard?.writeText(summary); demoStore.toast("Copied for MyChart"); }}>Copy for MyChart</Button>
        <Button variant="outline" onClick={() => demoStore.toast("PDF export prepared.", "info")}>Download PDF</Button>
        <Link className="onco-button-outline w-full" href={backHref}>{backText}</Link>
      </div>
      <Modal open={share} title="Share summary" onClose={() => setShare(false)}><p className="text-sm text-onco-muted">Send this summary to your care team for plan review.</p><Button className="mt-4" onClick={() => { demoStore.sharePatientDetailsWithDoctor(); setShare(false); }}>Send to doctor for review</Button></Modal>
    </PatientShell>
  );
}

function LegacyCareTeamCodeModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const state = useDemoStore();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  return (
    <Modal open={open} title="Care Code" onClose={onClose}>
      <p className="text-sm leading-6 text-onco-muted">Enter the Care Code from your care team.</p>
      <input
        className="onco-input mt-3"
        value={code}
        onChange={(event) => {
          setCode(event.target.value.toUpperCase());
          setError("");
        }}
        placeholder="SAM-GVOC-7429"
      />
      {error ? <p className="mt-2 text-xs font-semibold text-onco-terracotta">{error}</p> : null}
      <Button
        className="mt-4 w-full"
        onClick={() => {
          if (!demoStore.submitCareCode(code)) {
            setError("We could not find that care code. Please check the code from your care team.");
            return;
          }
          const patientUser = state.users.find((user) => user.role === "patient");
          if (patientUser) demoStore.login("patient", patientUser.id);
          onClose();
          onSuccess();
        }}
      >
        Continue
      </Button>
    </Modal>
  );
}

export function SelfStartModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const state = useDemoStore();
  const [firstName, setFirstName] = useState(state.patientIdentity?.firstName || state.patientProfile.name?.split(/\s+/)[0] || "");
  const [contact, setContact] = useState(state.patientIdentity?.contact || state.patientProfile.email || "");
  const [birthYear, setBirthYear] = useState(state.patientIdentity?.birthYear || "");
  const [error, setError] = useState("");
  useEffect(() => {
    if (!open) return;
    setFirstName(state.patientIdentity?.firstName || "");
    setContact(state.patientIdentity?.contact || "");
    setBirthYear(state.patientIdentity?.birthYear || "");
    setError("");
  }, [open, state.patientIdentity]);
  return (
    <Modal open={open} title="Start on my own" onClose={onClose}>
      <p className="text-sm leading-6 text-onco-muted">Add basic identity details to start your movement plan.</p>
      <input className="onco-input mt-3" value={firstName} onChange={(event) => { setFirstName(event.target.value); setError(""); }} placeholder="First name" />
      <input className="onco-input mt-3" value={contact} onChange={(event) => { setContact(event.target.value); setError(""); }} placeholder="Email or phone" />
      <input className="onco-input mt-3" inputMode="numeric" value={birthYear} onChange={(event) => { setBirthYear(event.target.value); setError(""); }} placeholder="Birth year" />
      {error ? <p className="mt-2 text-xs font-semibold text-onco-terracotta">{error}</p> : null}
      <Button className="mt-4 w-full" onClick={() => {
        if (!firstName.trim() || !contact.trim()) {
          setError("Enter a first name and email or phone to continue.");
          return;
        }
        if (!birthYear.trim()) {
          setError("Birth year is required to continue.");
          return;
        }
        if (!/^\d{4}$/.test(birthYear.trim())) {
          setError("Enter a valid 4-digit birth year.");
          return;
        }
        const patientUser = state.users.find((user) => user.role === "patient");
        if (patientUser) demoStore.login("patient", patientUser.id);
        demoStore.beginSelfStart();
        demoStore.saveSelfStartIdentity({ firstName, contact, birthYear });
        onClose();
        onSuccess();
      }}>
        Continue
      </Button>
    </Modal>
  );
}

export function CareTeamCodeModal({ initialStage = "entry", open, onClose, onSuccess }: { initialStage?: "entry" | "forgot"; open: boolean; onClose: () => void; onSuccess: (nextStep: number) => void }) {
  const state = useDemoStore();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [verify, setVerify] = useState("");
  const [stage, setStage] = useState<"entry" | "invite" | "confirm" | "updateChoice" | "forgot" | "otp" | "recovered">("entry");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [otp, setOtp] = useState("1234");
  const [recoveredCode, setRecoveredCode] = useState("");
  const [recoveryBusy, setRecoveryBusy] = useState(false);
  const [error, setError] = useState("");
  const patientName = state.patientProfile.name || state.patientIdentity?.firstName || "Patient";
  const patientShortName = patientName
    .trim()
    .split(/\s+/)
    .map((part, index) => (index === 0 ? part : `${part[0]?.toUpperCase() || ""}.`))
    .join(" ");
  const patientEmail = state.patientProfile.email || state.patientIdentity?.contact || "";
  const maskedEmail = patientEmail.includes("@") ? patientEmail.replace(/^(.).*(?=@)/, "$1***") : "Not provided";
  const needsTreatmentUpdate = state.onboarding.cancerType === "Other" && state.onboarding.treatmentStatus === "Before treatment" && state.onboarding.treatments.length === 0;
  const treatmentSummary = needsTreatmentUpdate ? "Profile details need update" : `${state.onboarding.cancerType || "Not selected"} - ${state.onboarding.treatmentStatus || "Not selected"}`;
  const treatmentIncluded = needsTreatmentUpdate ? "Treatment details will be collected if you update profile" : state.onboarding.treatments.length ? state.onboarding.treatments.join(" + ") : "Treatment details not added";
  const assignedDoctor = state.patientProfile.assignedDoctor || "Dr. Maya Chen";
  const clinicName = state.patientProfile.siteName || state.patientProfile.careTeam || "Care team not assigned";

  useEffect(() => {
    if (!open) return;
    setStage(initialStage);
    setError("");
    if (initialStage === "entry") {
      setCode("SAM-GVOC-7429");
      setVerify("");
    }
    if (initialStage === "forgot") {
      setRecoveryEmail("");
      setOtp("1234");
      setRecoveredCode("");
    }
  }, [initialStage, open]);

  function loginPatient() {
    const patientUser = state.users.find((user) => user.role === "patient");
    if (patientUser) demoStore.login("patient", patientUser.id);
  }

  function closeAndReset() {
    setStage("entry");
    setError("");
    setOtp("1234");
    setRecoveryBusy(false);
    onClose();
  }

  async function sendRecoveryOtp() {
    setRecoveryBusy(true);
    setError("");
    try {
      const foundCode = demoStore.findCareCodeByEmail(recoveryEmail);
      if (!foundCode) {
        setError("No care code found for this email in the patient records.");
        return;
      }
      setRecoveredCode(foundCode);
      setOtp("1234");
      demoStore.toast("Verification code sent.", "info");
      setStage("otp");
    } finally {
      setRecoveryBusy(false);
    }
  }

  async function verifyRecoveryOtp() {
    setRecoveryBusy(true);
    setError("");
    try {
      if (otp !== "1234") {
        setError("OTP did not match. Please check the code and try again.");
        return;
      }
      const newCode = demoStore.rotateCareCodeByEmail(recoveryEmail);
      if (!newCode) {
        setError("Could not generate a new care code for this email.");
        return;
      }
      setRecoveredCode(newCode);
      setStage("recovered");
    } finally {
      setRecoveryBusy(false);
    }
  }

  return (
    <Modal open={open} title="Care Code" onClose={closeAndReset}>
      {stage === "entry" ? (
        <>
          <p className="text-sm leading-6 text-onco-muted">Enter the Care Code from your care team.</p>
          <input className="onco-input mt-3" value={code} onChange={(event) => { setCode(event.target.value.toUpperCase()); setError(""); }} placeholder="Enter care code" />
          {error ? <p className="mt-2 text-xs font-semibold text-onco-terracotta">{error}</p> : null}
          <Button className="mt-4 w-full" onClick={() => {
            const normalized = code.trim().toUpperCase();
            if (demoStore.submitCareCode(normalized)) {
              setVerify(normalized === "SAM-GVOC-7429" ? "1974" : "");
              setStage("invite");
              return;
            }
            setError("We could not find that care code. Please check the code from your care team.");
          }}>
            Continue
          </Button>
          <button
            className="mt-3 min-h-11 w-full text-sm font-semibold text-onco-muted hover:text-onco-sage"
            type="button"
            onClick={() => {
              setError("");
              setRecoveryEmail("");
              setOtp("1234");
              setRecoveredCode("");
              setStage("forgot");
            }}
          >
            Forgot or lost your care code?
          </button>
        </>
      ) : null}
      {stage === "forgot" ? (
        <>
          <Card>
            <p className="onco-display text-xl font-extrabold">Forgot or lost your care code?</p>
            <p className="mt-3 text-sm leading-6 text-onco-muted">
              Enter the email used during signup. We'll verify it and generate a new linked care code.
            </p>
          </Card>
          <label className="mt-4 block">
            <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.05em] text-onco-muted-light">Email</span>
            <input className="onco-input" value={recoveryEmail} onChange={(event) => { setRecoveryEmail(event.target.value); setError(""); }} placeholder="name@example.com" />
          </label>
          {error ? <p className="mt-2 text-xs font-semibold text-onco-terracotta">{error}</p> : null}
          <Button className="mt-4 w-full" disabled={recoveryBusy} onClick={() => { void sendRecoveryOtp(); }}>
            {recoveryBusy ? "Sending..." : "Send OTP"}
          </Button>
          <button className="mt-3 min-h-11 w-full text-sm font-semibold text-onco-muted hover:text-onco-sage" type="button" onClick={() => { setError(""); setStage("entry"); }}>
            Back to care code
          </button>
        </>
      ) : null}
      {stage === "otp" ? (
        <>
          <Card tone="sand">
            <p className="font-semibold">Verification code</p>
            <p className="mt-2 text-sm leading-6 text-onco-muted">Enter the verification code for {recoveryEmail}.</p>
          </Card>
          <label className="mt-4 block">
            <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.05em] text-onco-muted-light">Enter OTP</span>
            <input className="onco-input" inputMode="numeric" value={otp} onChange={(event) => { setOtp(event.target.value.replace(/\D/g, "").slice(0, 4)); setError(""); }} placeholder="Enter code" />
          </label>
          {error ? <p className="mt-2 text-xs font-semibold text-onco-terracotta">{error}</p> : null}
          <Button className="mt-4 w-full" disabled={recoveryBusy} onClick={() => { void verifyRecoveryOtp(); }}>
            {recoveryBusy ? "Verifying..." : "Verify OTP"}
          </Button>
          <button className="mt-3 min-h-11 w-full text-sm font-semibold text-onco-muted hover:text-onco-sage" type="button" onClick={() => { void sendRecoveryOtp(); }}>
            Resend OTP
          </button>
        </>
      ) : null}
      {stage === "recovered" ? (
        <>
          <Card>
            <p className="onco-display text-xl font-extrabold">New care code generated</p>
            <p className="mt-3 text-sm leading-6 text-onco-muted">Save this new code before continuing. Your previous code is replaced in this demo.</p>
            <p className="onco-display mt-4 text-3xl font-extrabold text-onco-ink">{recoveredCode}</p>
          </Card>
          <Button className="mt-4 w-full" onClick={() => {
            setCode(recoveredCode);
            if (demoStore.submitCareCode(recoveredCode)) {
              setStage("invite");
              return;
            }
            setStage("entry");
          }}>
            Continue with this code
          </Button>
          <Button className="mt-3 w-full" variant="outline" onClick={() => { void navigator.clipboard?.writeText(recoveredCode); demoStore.toast("Care Code copied"); }}>
            Copy code
          </Button>
        </>
      ) : null}
      {stage === "invite" ? (
        <>
          <Card tone="sand">
            <p className="font-semibold">We found an invitation from {clinicName}.</p>
            <div className="mt-3 space-y-1 text-sm text-onco-muted">
              <p>Patient: {patientShortName}</p>
              <p>Doctor: {assignedDoctor}</p>
              <p>Email: {maskedEmail}</p>
            </div>
          </Card>
          <label className="mt-4 block">
            <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.05em] text-onco-muted-light">Enter birth year to verify</span>
            <input className="onco-input" value={verify} onChange={(event) => { setVerify(event.target.value); setError(""); }} placeholder="Birth year" />
          </label>
          {error ? <p className="mt-2 text-xs font-semibold text-onco-terracotta">{error}</p> : null}
          <Button className="mt-4 w-full" onClick={() => {
            if (!demoStore.verifyCareCode(verify)) {
              setError("Verification did not match. Please check the birth year.");
              return;
            }
            loginPatient();
            setStage("confirm");
          }}>
            Verify Care Code
          </Button>
          <button className="mt-3 min-h-11 w-full text-sm font-semibold text-onco-muted hover:text-onco-sage" type="button" onClick={() => { demoStore.continueExistingPatient(); closeAndReset(); router.push("/today"); }}>
            I already completed onboarding
          </button>
        </>
      ) : null}
      {stage === "confirm" ? (
        <>
          <Card tone="sand">
            <p className="onco-display text-xl font-extrabold">Confirm your clinic profile</p>
            <div className="mt-3 space-y-1 text-sm text-onco-muted">
              <p>{patientName}</p>
              <p>{treatmentSummary}</p>
              <p>{treatmentIncluded}</p>
              <p>Assigned doctor: {assignedDoctor}</p>
              <p>Clinic: {clinicName}</p>
            </div>
          </Card>
          <Button className="mt-4 w-full" onClick={() => {
            demoStore.confirmClinicProfile();
            setStage("updateChoice");
          }}>
            Looks correct
          </Button>
          <button className="mt-3 min-h-11 w-full text-sm font-semibold text-onco-muted hover:text-onco-sage" type="button" onClick={() => { demoStore.clearPatientInviteFlow(); setVerify(""); setStage("entry"); }}>
            This is not me
          </button>
        </>
      ) : null}
      {stage === "updateChoice" ? (
        <>
          <Card tone="sand">
            <p className="onco-display text-xl font-extrabold">Update your profile?</p>
            <p className="mt-3 text-sm leading-6 text-onco-muted">
              We'll show the same movement onboarding screens so your plan can refresh around today's answers.
            </p>
          </Card>
          <Button className="mt-4 w-full" onClick={() => {
            closeAndReset();
            onSuccess(1);
          }}>
            Yes, update my profile
          </Button>
          <Button className="mt-3 w-full" variant="outline" onClick={() => {
            demoStore.continueExistingPatient();
            closeAndReset();
            router.push("/today");
          }}>
            No, continue to my care plan
          </Button>
        </>
      ) : null}
    </Modal>
  );
}

export function ProfileClient() {
  const state = useDemoStore();
  const support = state.onboarding.supportPerson;
  return (
    <PatientShell requireRole>
      <h1 className="onco-display text-[28px] font-extrabold">Profile</h1>
      <Card className="mt-5 space-y-3">
        <Summary label="Name" text={state.patientProfile.name} />
        <Summary label="Email" text={state.patientProfile.email} />
        <Summary label="Phone" text={state.patientProfile.phone} />
        <Summary label="Care team" text={state.patientProfile.careTeam || "Not linked"} />
      </Card>
      <Card className="mt-4">
        <p className="font-semibold">Support person</p>
        <p className="mt-2 text-sm text-onco-muted">{support ? `${support.name} - ${support.relationship} - Invite sent - pending` : "No support person added yet."}</p>
      </Card>
      <Link className="onco-button-outline mt-4 w-full" href="/privacy-sharing">Privacy & sharing</Link>
    </PatientShell>
  );
}

export function DevicesClient() {
  const state = useDemoStore();
  const searchParams = useSearchParams();
  const fromOnboarding = searchParams.get("from") === "onboarding";
  const sourceParam = searchParams.get("source");
  const requestedSource = trackingOptions.find((option) => option === sourceParam);
  return <DeviceConnectivityContent fromOnboarding={fromOnboarding} requestedSource={requestedSource} state={state} />;
}

function DeviceConnectivityContent({ fromOnboarding, requestedSource, state }: { fromOnboarding?: boolean; requestedSource?: TrackingType; state: ReturnType<typeof useDemoStore> }) {
  const router = useRouter();
  const [selectedDevice, setSelectedDevice] = useState<ConnectedDevice | null>(null);
  const [handledSource, setHandledSource] = useState<TrackingType | null>(null);
  const [autoSync, setAutoSync] = useState(true);
  const [shareDose, setShareDose] = useState(true);
  const connected = state.connectedDevices.filter((device) => device.connected);
  const activeSource = connected.find((device) => device.name === state.onboarding.trackingType) || connected[0] || state.connectedDevices.find((device) => device.name === "Manual");
  const latestLog = state.activityLogs[0];
  const returnToTracking = fromOnboarding || Boolean(requestedSource);

  useEffect(() => {
    if (!requestedSource || handledSource === requestedSource) return;
    const requestedDevice = state.connectedDevices.find((device) => device.name === requestedSource);
    if (!requestedDevice) return;
    setSelectedDevice(requestedDevice);
    setHandledSource(requestedSource);
  }, [handledSource, requestedSource, state.connectedDevices]);

  function returnToOnboardingTracking() {
    window.sessionStorage.setItem("oncoContinueOnboarding", "1");
    router.push("/onboarding?step=tracking");
  }

  function connectAndClose(device: ConnectedDevice) {
    demoStore.connectDevice(device.name);
    setSelectedDevice(null);
    if (returnToTracking) returnToOnboardingTracking();
  }

  function syncAndClose(device: ConnectedDevice) {
    demoStore.syncDevice(device.name);
    setSelectedDevice(null);
    if (returnToTracking) returnToOnboardingTracking();
  }

  function useManualAndReturn() {
    demoStore.connectDevice("Manual");
    setSelectedDevice(null);
    if (returnToTracking) returnToOnboardingTracking();
  }

  return (
    <PatientShell bottomNav={!returnToTracking} hidePatientHeader={returnToTracking} requireRole>
      <h1 className="onco-display text-[28px] font-extrabold">Connected devices</h1>
      <p className="mt-1 text-sm leading-6 text-onco-muted">Choose how OncoMotionRx reads activity for your weekly movement plan.</p>
      <Card tone="sage" className="mt-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#A9C5B4]">Current source</p>
            <h2 className="onco-display mt-2 text-2xl font-extrabold">{activeSource?.name || "Manual"}</h2>
            <p className="mt-1 text-sm text-[#C7D8CC]">
              {activeSource?.connected ? `Last sync ${activeSource.lastSync || "not yet"}` : "No wearable connected yet"}
            </p>
          </div>
          <Badge tone={activeSource?.connected ? "sage" : "sand"}>{activeSource?.connected ? "Active" : "Manual"}</Badge>
        </div>
        <div className="mt-4 rounded-2xl bg-onco-cream/10 p-3 text-sm text-[#C7D8CC]">
          Latest detected activity: {latestLog ? `${latestLog.activity} ${latestLog.duration} min - ${latestLog.metHours.toFixed(2)} MET-hours` : "No activity yet"}
        </div>
      </Card>
      <Card className="mt-4 space-y-3">
        <ToggleRow label="Auto-sync activity" checked={autoSync} onChange={setAutoSync} />
        <ToggleRow label="Share MET dose with care team" checked={shareDose} onChange={setShareDose} />
      </Card>
      <div className="mt-5 space-y-3">
        {state.connectedDevices.map((device) => (
          <Card key={device.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-onco-sage-soft text-xl font-black text-onco-sage">
                  {device.name === "Manual" ? <ClipboardIcon /> : device.name.slice(0, 1)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold">{device.name}</p>
                  <p className="mt-1 text-xs leading-5 text-onco-muted">{device.connected ? `Connected - last sync ${device.lastSync || "not yet"}` : "Not connected"}</p>
                </div>
              </div>
              <Badge tone={device.connected ? "sage" : "sand"}>{device.connected ? "On" : "Off"}</Badge>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button variant={device.connected ? "outline" : "primary"} onClick={() => device.connected ? demoStore.disconnectDevice(device.name) : setSelectedDevice(device)}>{device.connected ? "Disconnect" : "Connect"}</Button>
              <Button variant="outline" onClick={() => device.connected ? demoStore.syncDevice(device.name) : setSelectedDevice(device)}>{device.connected ? "Sync now" : "Preview"}</Button>
            </div>
          </Card>
        ))}
      </div>
      {returnToTracking ? (
        <Button className="mt-5 w-full" onClick={returnToOnboardingTracking}>
          Back
        </Button>
      ) : null}
      <Modal open={Boolean(selectedDevice)} title={selectedDevice ? `Connect ${selectedDevice.name}` : "Connect device"} onClose={() => setSelectedDevice(null)}>
        {selectedDevice ? (
          <>
            <Card>
              <p className="font-semibold">Permissions requested</p>
              <div className="mt-3 space-y-2 text-sm text-onco-muted">
                <p>Read steps, walking minutes, and active energy.</p>
                <p>Estimate MET dose for your weekly prescription.</p>
                <p>Show sync status to you and your care team if sharing is enabled.</p>
              </div>
            </Card>
            <Card className="mt-3">
              <p className="font-semibold">Sample sync result</p>
              <p className="mt-2 text-sm leading-6 text-onco-muted">8 minutes easy walking - 0.33 MET-hours - no symptoms reported.</p>
            </Card>
            <div className="mt-4 grid gap-2">
              <Button className="w-full" onClick={() => connectAndClose(selectedDevice)}>Allow and connect</Button>
              <Button className="w-full" variant="outline" onClick={() => syncAndClose(selectedDevice)}>Connect and sync sample</Button>
              <Button className="w-full" variant="outline" onClick={useManualAndReturn}>Use manual tracking</Button>
            </div>
          </>
        ) : null}
      </Modal>
    </PatientShell>
  );
}

export function NotificationsClient() {
  const state = useDemoStore();
  const [active, setActive] = useState<string | null>(null);
  const selected = state.notifications.find((item) => item.id === active) || null;
  return (
    <PatientShell requireRole>
      <h1 className="onco-display text-[28px] font-extrabold">Notifications</h1>
      <div className="mt-5 space-y-3">
        {state.notifications.map((item) => (
          <Card key={item.id} className={cn(item.read && "opacity-65")}>
            <div className="flex items-start justify-between gap-3">
              <button className="text-left" type="button" onClick={() => { demoStore.markNotificationRead(item.id); setActive(item.id); }}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-onco-muted-light">{item.type} - {item.createdAt}</p>
                <p className="mt-1 font-semibold">{item.title}</p>
                <p className="mt-1 text-sm text-onco-muted">{item.detail}</p>
              </button>
              <button className="text-xs font-semibold text-onco-terracotta" type="button" onClick={() => demoStore.dismissNotification(item.id)}>Dismiss</button>
            </div>
          </Card>
        ))}
      </div>
      <Modal open={selected !== null} title={selected?.title || "Notification"} onClose={() => setActive(null)}>
        <p className="text-sm leading-6 text-onco-muted">{selected?.detail}</p>
      </Modal>
    </PatientShell>
  );
}

export function PrivacySharingClient() {
  const [doctorSharing, setDoctorSharing] = useState(true);
  const [supportSharing, setSupportSharing] = useState(false);
  return (
    <PatientShell requireRole>
      <h1 className="onco-display text-[28px] font-extrabold">Privacy & sharing</h1>
      <Card className="mt-5 space-y-4">
        <ToggleRow label="Share progress with care team" checked={doctorSharing} onChange={setDoctorSharing} />
        <ToggleRow label="Share reminders with support person" checked={supportSharing} onChange={setSupportSharing} />
      </Card>
      <Card tone="sand" className="mt-4 text-sm leading-6">You can adjust sharing at any time. Care-team sharing should match your consent preferences.</Card>
    </PatientShell>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button className="flex w-full items-center justify-between gap-3 text-left" type="button" onClick={() => onChange(!checked)}>
      <span className="text-sm font-semibold">{label}</span>
      <span
        className={cn(
          "grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 transition",
          checked ? "border-onco-sage bg-onco-sage text-onco-cream" : "border-[#C9CFC8] bg-white text-transparent",
        )}
        aria-hidden="true"
      >
        <CheckIcon className="text-xs" />
      </span>
    </button>
  );
}

function SupportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState("Maya Rivera");
  const [relationship, setRelationship] = useState("Sister");
  const [contact, setContact] = useState("maya@example.com");
  const [supportType, setSupportType] = useState("Reminders");
  return <Modal open={open} title="Add support person" onClose={onClose}><input className="onco-input" value={name} onChange={(event) => setName(event.target.value)} /><input className="onco-input mt-3" value={relationship} onChange={(event) => setRelationship(event.target.value)} /><input className="onco-input mt-3" value={contact} onChange={(event) => setContact(event.target.value)} /><Select className="mt-3 block" label="Support type" value={supportType} onChange={setSupportType} options={["Reminders", "Walking buddy", "Care updates"].map((value) => ({ label: value, value }))} /><Button className="mt-4 w-full" onClick={() => { if (!name || !contact) { demoStore.toast("Name and contact required", "warning"); return; } demoStore.setSupportPerson({ name, relationship, contact, supportType, invitePending: true }); demoStore.toast("Invite sent - pending"); onClose(); }}>Send invite</Button></Modal>;
}

function ScreenTitle({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <div><h1 className="onco-display text-[30px] font-extrabold leading-[1.05] tracking-normal text-onco-sage">{title}</h1><p className="onco-mobile-subtitle">{subtitle}</p>{children}</div>;
}

function ChipGroup({ label, values, selected, onToggle, className, dense = true }: { label: string; values: string[]; selected: string[]; onToggle: (value: string) => void; className?: string; dense?: boolean }) {
  return (
    <div className={className}>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.05em] text-onco-muted-light">{label}</p>
      <div className={cn("flex flex-wrap", dense ? "gap-2" : "gap-2.5")}>
        {values.map((value) => {
          const isSelected = selected.includes(value);
          return (
            <button
              type="button"
              key={value}
              className={cn(
                "inline-flex max-w-full items-center gap-2 rounded-full border border-onco-line bg-white text-left font-semibold leading-5 text-[#3A403C] shadow-sm transition",
                dense ? "min-h-10 px-3.5 py-2 text-[13px]" : "min-h-11 px-4 py-2.5 text-[13.5px]",
                isSelected && "border-onco-sage bg-onco-sage text-onco-cream",
              )}
              onClick={() => onToggle(value)}
            >
              {isSelected ? (
                <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full border border-current text-[9px]">
                  <CheckIcon />
                </span>
              ) : null}
              <span className="min-w-0 whitespace-normal">{value}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ChipGrid({ values, selected, onToggle }: { values: string[]; selected: string[]; onToggle: (value: string) => void }) {
  return (
    <div className="space-y-2.5">
      {values.map((value) => {
        const isSelected = selected.includes(value);
        return (
          <button
            type="button"
            key={value}
            className={cn(
              "onco-option-row",
              isSelected && "onco-option-row-active",
            )}
            onClick={() => onToggle(value)}
          >
            <MovementOptionIcon label={value} selected={isSelected} />
            <span className="min-w-0 flex-1 pr-7">{value}</span>
            {isSelected ? (
              <span className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full border border-onco-cream/70 text-[10px]">
                <CheckIcon />
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function BaselineActivityIcon({ label, selected }: { label: string; selected: boolean }) {
  const commonProps = {
    className: "h-8 w-8",
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 2.4,
    viewBox: "0 0 56 56",
  };

  return (
    <span aria-hidden="true" className={cn("grid h-9 w-9 shrink-0 place-items-center text-onco-sage", selected && "text-onco-cream")}>
      {label === "Very active" ? (
        <svg {...commonProps}>
          <circle cx="30" cy="10" r="3.5" fill="currentColor" stroke="none" />
          <path d="M29 16 23 27l8 5" />
          <path d="M24 26 15 31" />
          <path d="M31 32 42 42" />
          <path d="M28 31 19 44" />
          <path d="M28 18 39 22" />
          <path d="M13 43h8M37 43h8" />
        </svg>
      ) : null}
      {label === "Some movement" ? (
        <svg {...commonProps}>
          <circle cx="28" cy="11" r="3.4" fill="currentColor" stroke="none" />
          <path d="M27.5 17.5 23.5 28.5l6 4.5" />
          <path d="M24 28 17 37" />
          <path d="M30 33 38 44" />
          <path d="M27.5 20 36 24.5" />
        </svg>
      ) : null}
      {label === "Not very active" ? (
        <svg {...commonProps}>
          <circle cx="28" cy="11" r="3.4" fill="currentColor" stroke="none" />
          <path d="M23 18v13h13" />
          <path d="M20 34h18" />
          <path d="M23 44h14" />
          <path d="M23 25h-5v16" />
          <path d="M33 18v10" />
          <path d="M32 28h7" />
        </svg>
      ) : null}
    </span>
  );
}
function MovementOptionIcon({ label, selected }: { label: string; selected: boolean }) {
  const commonProps = {
    className: "h-8 w-8",
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 2.1,
    viewBox: "0 0 56 56",
  };

  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid h-10 w-10 shrink-0 place-items-center rounded-full bg-onco-sage-soft text-onco-sage transition-colors",
        selected && "bg-onco-cream/15 text-onco-cream",
      )}
    >
      {label === "Walking" ? (
        <svg {...commonProps}><circle cx="28" cy="13" r="3" fill="currentColor" stroke="none" /><path d="M27.2 18.5 23.2 27.5 28.5 31.5" /><path d="M24 26.5 18 32.5" /><path d="M28.5 31.5 35 40" /><path d="M26.2 31 21 41" /><path d="M27 20.5 34.5 24.5" /></svg>
      ) : null}
      {label === "Gardening" ? (
        <svg {...commonProps}><path d="M18 31h20l-2 10H20l-2-10Z" /><path d="M16.5 28h23" /><path d="M28 28V16" /><path d="M27.5 23c-5 .2-8.2-3-9.2-7.2 4.6-.4 8 1.8 9.4 6" /><path d="M28.5 23c5 .2 8.2-3 9.2-7.2-4.6-.4-8 1.8-9.4 6" /></svg>
      ) : null}
      {label === "Cycling" ? (
        <svg {...commonProps}><circle cx="18" cy="37" r="6.2" /><circle cx="38" cy="37" r="6.2" /><circle cx="30" cy="15" r="3" fill="currentColor" stroke="none" /><path d="M18 37h9l5-11h-8l-6 11Z" /><path d="M27 37 22 25M32 26l6 11M25 22h8" /></svg>
      ) : null}
      {label === "Swimming" ? (
        <svg {...commonProps}><circle cx="30" cy="17" r="3" fill="currentColor" stroke="none" /><path d="M20 25c3.5-3.5 8.5-3.8 15-1" /><path d="M11 31c4-3.5 8 3.5 12 0s8 3.5 12 0 8 3.5 12 0" /><path d="M11 38c4-3.5 8 3.5 12 0s8 3.5 12 0 8 3.5 12 0" /></svg>
      ) : null}
      {label === "Gym" ? (
        <svg {...commonProps}><path d="M12 28h32" /><path d="M13.5 22v12M19 19v18M37 19v18M42.5 22v12" /><path d="M24 28h8" /></svg>
      ) : null}
      {label === "At home" ? (
        <svg {...commonProps}><path d="M15 29 28 17l13 12" /><path d="M19 28.5V41h18V28.5" /><path d="M25 41v-7h6v7" /></svg>
      ) : null}
      {label === "Stretching" ? (
        <svg {...commonProps}><circle cx="28" cy="14" r="3" fill="currentColor" stroke="none" /><path d="M28 19v10" /><path d="M28 23 19 19" /><path d="M28 23l9-4" /><path d="M28 29 20 40" /><path d="M28 29l9 11" /></svg>
      ) : null}
    </span>
  );
}
function MovementWalkingIcon() {
  return (
    <svg className="h-9 w-9" viewBox="0 0 44 44" fill="none">
      <circle cx="22" cy="8" r="3" fill="#2D6A56" />
      <path d="M21 12 17 22l6 4 4 10M18 22l-5 7M23 15l5 5 5 1" stroke="#2D6A56" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 34c8 3 17 3 26 0" stroke="#E8C15D" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function MovementGardeningIcon() {
  return (
    <svg className="h-10 w-10" viewBox="0 0 52 52" fill="none">
      <path d="M36.5 31.8 43 18.5c.6-1.2 2.1-1.7 3.2-1.1 1.2.6 1.6 2.1 1 3.2l-6.5 13.3-4.2-2.1Z" fill="#E6A977" stroke="#C7835C" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M34.4 32.1c.5-2.3 2.8-3.9 5.1-3.4l3.2.7-2.2 10.3c-.5 2.3-2.8 3.9-5.1 3.4-2.3-.5-3.9-2.8-3.4-5.1l1.1-5.1c.1-.5.6-.9 1.3-.8Z" fill="#D7D5DB" stroke="#9B9BA4" strokeWidth="1.2" />
      <path d="M13.3 26.2h22.4l-2.5 16.4H15.8l-2.5-16.4Z" fill="#F2A779" stroke="#D07A57" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M11.7 24.2c0-1.9 1.5-3.4 3.4-3.4h18.8c1.9 0 3.4 1.5 3.4 3.4 0 1.9-1.5 3.4-3.4 3.4H15.1c-1.9 0-3.4-1.5-3.4-3.4Z" fill="#FFC093" stroke="#D07A57" strokeWidth="1.3" />
      <path d="M17 23c2.8-2.1 12.6-2.1 15.3 0" fill="#8B5135" />
      <path d="M24.5 22V9.3" stroke="#5DA258" strokeWidth="2.3" strokeLinecap="round" />
      <path d="M24.5 12.5c-6.3-5.7-13.2-2.3-13.2-2.3s4.3 8 13.2 5.2M24.8 11.7C29.9 2.9 38 5 38 5s1.2 9.1-12.8 11.2M24.5 18.5c-5.8-5-11.8-1.5-11.8-1.5s4.3 6.7 11.8 4M24.8 19.2c5.4-5.7 11.6-2.8 11.6-2.8s-3.5 7.3-11.6 5.6" fill="#A9D070" stroke="#6AA35A" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M24.5 36.3s-3.1-1.8-3.1-4.1c0-1.3 1.5-2 2.4-1l.7.6.7-.6c1-.9 2.4-.3 2.4 1 0 2.3-3.1 4.1-3.1 4.1Z" fill="#EF7B61" />
      <path d="M8.8 42c4.4-1.1 6.8-3.2 7.8-6.8M16.3 35.2c-5.4-1.1-8.3 2.2-8.3 2.2s3.8 3.1 8.3.5" fill="#A9D070" stroke="#6AA35A" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MovementCyclingIcon() {
  return (
    <svg className="h-9 w-9" viewBox="0 0 44 44" fill="none">
      <circle cx="13" cy="30" r="7" stroke="#2D6A56" strokeWidth="2" />
      <circle cx="31" cy="30" r="7" stroke="#2D6A56" strokeWidth="2" />
      <path d="M13 30h8l5-10h-7l-6 10ZM21 30l-5-12M24 20l5 10M18 15h7" stroke="#C66B3D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="28" cy="11" r="3" fill="#2D6A56" />
      <path d="M27 15 23 20" stroke="#2D6A56" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function MovementSwimmingIcon() {
  return (
    <svg className="h-9 w-9" viewBox="0 0 44 44" fill="none">
      <circle cx="25" cy="13" r="3" fill="#2D6A56" />
      <path d="M13 24c4-5 9-7 17-5M10 31c3-2.3 6-2.3 9 0s6 2.3 9 0 6-2.3 9 0M10 36c3-2.3 6-2.3 9 0s6 2.3 9 0 6-2.3 9 0" stroke="#6FA8C9" strokeWidth="2" strokeLinecap="round" />
      <path d="M19 22 14 18" stroke="#C66B3D" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function MovementGymIcon() {
  return (
    <svg className="h-9 w-9" viewBox="0 0 44 44" fill="none">
      <path d="M7 24h30M11 17v14M16 19v10M28 19v10M33 17v14" stroke="#2D6A56" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M19 24h6" stroke="#C66B3D" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function MovementHomeIcon() {
  return (
    <svg className="h-9 w-9" viewBox="0 0 44 44" fill="none">
      <path d="M9 22 22 11l13 11v14H13V22" fill="#F7F4ED" stroke="#2D6A56" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M19 36V25h6v11M13 19v-6h5" stroke="#2D6A56" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 34h28" stroke="#E8C15D" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function MovementStretchingIcon() {
  return (
    <svg className="h-12 w-12" viewBox="0 0 64 64" fill="none">
      <ellipse cx="31" cy="51" rx="22" ry="4" fill="#E7EEE4" />
      <path d="M16 44c5.8-5.8 13.2-5.7 22.1-.4 4.7 2.8 10.1 1.4 14.4-1.6 1.4-1 2.9.8 1.7 2.1-5 5.7-14.2 7-23.1 2.5-5.4-2.8-10.2-2.5-15.1-2.6Z" fill="#0D5E49" />
      <path d="M19.5 43.4c-7.4-4.1-12.2-3.5-15.6.2-1.1 1.2 0 3 1.7 2.8 8.8-1 14.1 1.2 20.9 3.2 7 2 13.2.8 18.1-3.4" fill="#0A4F40" />
      <path d="M26.8 31.6c-4 4.2-5.2 9.3-3.4 13.2h16.3c1.7-5.4-.2-9.7-4.7-13.2H26.8Z" fill="#6BA149" />
      <path d="M32.2 29.2c-2.9-5.1-.8-11.6 4.6-16.1 4.6-3.8 11.3-5.5 20-4.6 1.8.2 2.1 2.6.4 3.2-7.6 2.7-13.1 6.7-16.6 13.4" fill="#F4A26C" />
      <path d="M32.2 29.2c-2.9-5.1-.8-11.6 4.6-16.1 4.6-3.8 11.3-5.5 20-4.6" stroke="#D98557" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M39.8 31.3c3.9 7 8 10.7 15.2 10.5 1.8 0 2.4 2.3.8 3.1-7.6 3.6-15.2-.3-21.1-9" fill="#F4A26C" />
      <path d="M39.8 31.3c3.9 7 8 10.7 15.2 10.5" stroke="#D98557" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="38.3" cy="23" r="8.5" fill="#F4A26C" />
      <path d="M30.6 19.6c.2-6.6 7.2-10.7 13.1-7.7 4.1 0 6.7 3.3 6.3 7.2-.3 3-2.4 4.6-5.5 4.6-3.7 0-8.5-1.3-13.9-4.1Z" fill="#77451F" />
      <path d="M44.5 12.2c4.5.8 7.1 4.3 5.9 8.4-.8 2.8-3 3.7-5.9 3.1" fill="#6A3C1D" />
      <path d="M35.7 25.6c1.4 1.4 3.7 1.4 5.1 0M33.7 21.2c1.1-1.1 2.2-1.1 3.3 0M42 21.2c1.1-1.1 2.2-1.1 3.3 0" stroke="#6B331E" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M11.5 39c1.4-8.6-.3-16.8-4.4-24.2" stroke="#B8CC9B" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M11.8 32.4c-6.1-3.4-10-1.2-10-1.2s1.9 6.4 10 5.3M9.6 25.1c-6.5-5-9.2-3.4-9.2-3.4s1.2 6.3 10 6.8M11.5 20.5c1.9-7 6.2-8.8 6.2-8.8s2.5 5.9-5.3 12.2" fill="#B6D494" stroke="#9DBB82" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SafetyOption({ children, label, selected, onClick }: { children: React.ReactNode; label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className={cn(
        "onco-option-row",
        selected && "onco-option-row-active",
      )}
      onClick={onClick}
    >
      <SafetyFlagIcon label={label} selected={selected} />
      <span className="min-w-0 flex-1 pr-7">{children}</span>
      {selected ? (
        <span className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full border border-onco-cream/70 text-[10px] text-onco-cream">
          <CheckIcon />
        </span>
      ) : null}
    </button>
  );
}

function Choice({ children, selected, checkbox, hideIndicator, icon, onClick }: { children: React.ReactNode; selected: boolean; checkbox?: boolean; hideIndicator?: boolean; icon?: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      className={cn(
        "onco-option-row",
        selected && "onco-option-row-active",
      )}
      onClick={onClick}
    >
      {hideIndicator ? null : (
        <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center border-2", checkbox ? "rounded-md" : "rounded-full", selected ? "border-onco-cream bg-onco-sage" : "border-[#C9CFC8] bg-white")}>
          {selected ? checkbox ? <CheckIcon className="text-xs text-onco-cream" /> : <span className="h-1.5 w-1.5 rounded-full bg-onco-cream" /> : null}
        </span>
      )}
      {icon ? <span className="shrink-0">{icon}</span> : null}
      <span className="min-w-0 flex-1 pr-7">{children}</span>
      {selected && (hideIndicator || checkbox || icon) ? (
        <span className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full border border-onco-cream/70 text-[10px]">
          <CheckIcon />
        </span>
      ) : null}
    </button>
  );
}

function SafetyFlagIcon({ label, selected }: { label: string; selected: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid h-8 w-8 shrink-0 place-items-center text-onco-sage",
        selected ? "opacity-95" : "opacity-100",
        selected && "text-onco-cream",
      )}
    >
      {label === "Chest pain or pressure" ? <SafetyHeartIcon /> : null}
      {label === "Severe shortness of breath" ? <SafetyLungsIcon /> : null}
      {label === "Dizziness or lightheadedness" ? <SafetyDizzyIcon /> : null}
      {label === "Fever" ? <SafetyFeverIcon /> : null}
      {label === "New weakness or numbness" ? <SafetyWeaknessIcon /> : null}
      {label === "Severe diarrhea/dehydration concern" ? <SafetyDropIcon /> : null}
      {label === "Uncontrolled pain" ? <SafetyLightningIcon /> : null}
      {label === "None of these" ? <SafetyNoneIcon /> : null}
    </span>
  );
}

function SafetyHeartIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 40 40" fill="none">
      <path d="M20 32S8 25.4 8 16.7c0-4.6 5.3-7.1 8.9-3.8L20 15.8l3.1-2.9c3.6-3.3 8.9-.8 8.9 3.8C32 25.4 20 32 20 32Z" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 21h7.2l2-4.1 3.2 8.3 3.1-6.3H33" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SafetyLungsIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 40 40" fill="none">
      <path d="M20 7.5v11.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 18.7c-2.2 1.3-3.8 3.4-4.4 6.1M20 18.7c2.2 1.3 3.8 3.4 4.4 6.1" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16.6 17.3C11 19.5 8 25.8 8 31.5c0 2.6 1.5 4 3.8 3.1 4.1-1.6 6.1-5.7 6.1-11.3v-4.4c0-1.1-.4-1.9-1.3-1.6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M23.4 17.3c5.6 2.2 8.6 8.5 8.6 14.2 0 2.6-1.5 4-3.8 3.1-4.1-1.6-6.1-5.7-6.1-11.3v-4.4c0-1.1.4-1.9 1.3-1.6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SafetyDizzyIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 40 40" fill="none">
      <path d="M20 32.5c6.5 0 11.8-4.9 11.8-11 0-6.3-5.1-11.2-11.8-11.2S8.2 15.2 8.2 21.5c0 6.1 5.3 11 11.8 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15.3 21.2h.01M24.7 21.2h.01" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M16.2 26.2c2.4-1.5 5.2-1.5 7.6 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M11.6 9.2c-1.4-1.2-3.2-1.2-4.5 0M32.9 9.2c-1.4-1.2-3.2-1.2-4.5 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M13.7 6.5h.01M26.3 6.5h.01" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function SafetyFeverIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 40 40" fill="none">
      <path d="M22 23V9.7a4.5 4.5 0 0 0-9 0V23a8 8 0 1 0 9 0Z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
      <path d="M17.5 11.5v15" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="17.5" cy="28.2" r="3.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M26.2 12h3M26.2 17h4M26.2 22h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function SafetyWeaknessIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 40 40" fill="none">
      <path d="M12.5 29.5h10.2c3.4 0 6.1-2.7 6.1-6.1v-5.8c0-1.1-.8-1.9-1.9-1.9s-1.9.8-1.9 1.9v4.3" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M25 22V14c0-1.1-.8-1.9-1.9-1.9s-1.9.8-1.9 1.9v8" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21.2 22V12.8c0-1.1-.8-1.9-1.9-1.9s-1.9.8-1.9 1.9V22" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17.4 22v-6.3c0-1.1-.8-1.9-1.9-1.9s-1.9.8-1.9 1.9v10.8l-1.8-1.8c-.9-.9-2.2-.9-3 0-.8.8-.8 2.1 0 2.9l3.7 3.7c1.2 1.2 2.9 1.9 4.7 1.9h5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.2 16.2 6 14M10.7 11.8l-.8-2.7M31.4 12.2l2.2-2.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function SafetyDropIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 40 40" fill="none">
      <path d="M20 7s8.2 8.8 8.2 15.1a8.2 8.2 0 0 1-16.4 0C11.8 15.8 20 7 20 7Z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
      <path d="M8 32c2.2-1.7 4.4-1.7 6.6 0s4.4 1.7 6.6 0 4.4-1.7 6.6 0 4.4 1.7 6.6 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function SafetyLightningIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 40 40" fill="none">
      <path d="m22.2 6.8-10 15.1h7.1l-1.5 11.3 10-15.1h-7.1l1.5-11.3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.1 12.6 7.4 10M9 28.6l-3.5 1.5M29.9 12.6l2.7-2.6M31 28.6l3.5 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function SafetyNoneIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="13" stroke="currentColor" strokeWidth="1.9" />
      <path d="m14.3 20.4 3.6 3.6 7.9-8.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AiBadge({ light = false }: { light?: boolean }) {
  return (
    <span className={cn(
      "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em]",
      light ? "bg-onco-cream/15 text-onco-cream" : "bg-onco-sage-soft text-onco-sage",
    )}>
      <AiAgentIcon className="text-sm" />
      AI
    </span>
  );
}

function GoalKpiCard({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) {
  return (
    <Card className="relative min-h-[94px] overflow-hidden p-3">
      <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-onco-sage" />
      <div className="flex items-center gap-2.5">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-onco-sage-soft text-xl text-onco-sage">{icon}</div>
        <div className="min-w-0">
          <p className="truncate text-[9px] font-semibold uppercase tracking-[0.06em] text-onco-muted-light">{label}</p>
          <p className="onco-display mt-1 text-[20px] font-extrabold leading-none text-onco-ink">{value}</p>
          <p className="mt-1 text-[11px] font-semibold leading-4 text-onco-sage">{detail}</p>
        </div>
      </div>
    </Card>
  );
}

function MilestoneCard({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="rounded-2xl bg-[#F8F6EF] p-2 text-center">
      <div className="mx-auto grid h-9 w-9 place-items-center rounded-full bg-onco-sage-soft text-lg text-onco-sage">{icon}</div>
      <p className="mt-1.5 text-[10px] font-semibold leading-3 text-onco-ink">{title}</p>
      <p className="mt-1 text-[10px] font-semibold text-onco-sage">Achieved</p>
    </div>
  );
}

function GoalTrendChart({ values, goal }: { values: number[]; goal: number }) {
  const max = Math.max(goal, ...values, 1);

  return (
    <div className="mt-3">
      <div className="relative h-28 border-b border-l border-onco-line pl-2">
        <div className="absolute inset-x-2 top-[22%] border-t-2 border-dotted border-[#93A58F]" />
        <div className="absolute bottom-0 left-4 right-4 flex h-full items-end gap-3">
          {values.map((value, index) => (
            <div className="flex flex-1 flex-col items-center gap-2" key={index}>
              <div className="w-full rounded-t-lg bg-onco-sage" style={{ height: `${Math.max(10, (value / max) * 82)}px` }} />
              <span className="text-[10px] text-onco-muted">Week {index + 1}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NumberField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.05em] text-onco-muted-light">{label}</span>
      <input
        className="onco-input"
        inputMode="numeric"
        min="0"
        placeholder={placeholder}
        type="number"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function ChatBubble({ sender, text }: { sender: "user" | "artie"; text: string }) {
  if (sender === "artie") {
    return (
      <div className="flex items-start gap-2">
        <ArtieAvatar size="sm" className="mt-1" />
        <div className="max-w-[84%] rounded-2xl rounded-tl border border-onco-line bg-white px-4 py-3 text-sm leading-6">
          {text}
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-end">
      <div className="max-w-[84%] rounded-2xl rounded-tr bg-onco-sage px-4 py-3 text-sm leading-6 text-onco-cream">
        {text}
      </div>
    </div>
  );
}

function ActivityTable({ logs }: { logs: ActivityLog[] }) {
  return <DataTable rows={logs} getKey={(log) => log.id} columns={[{ header: "Activity", cell: (log) => log.activity }, { header: "Duration", cell: (log) => `${log.duration} min` }, { header: "MET", cell: (log) => log.metHours.toFixed(2) }]} />;
}

function Summary({ label, text }: { label: string; text: string }) {
  return <div className="p-1"><p className="text-[10.5px] font-extrabold uppercase tracking-[0.06em] text-onco-ink">{label}</p><p className="mt-1 text-[12.5px] leading-5 text-[#3A403C]">{text}</p></div>;
}

function DoctorSummarySection({ title, items }: { title: string; items: string[] }) {
  return (
    <section>
      <h2 className="font-extrabold">{title}</h2>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div className="flex gap-2 text-sm leading-6 text-onco-muted" key={item}>
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-onco-sage" />
            <p>{item}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function SelectionNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-2xl border border-onco-sage/15 bg-onco-sage-soft p-4 text-sm leading-6 text-onco-sage">
      <span className="font-semibold">Noted: </span>{children}
    </div>
  );
}

function toggleList(values: string[], value: string, update: (next: string[]) => void) {
  update(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
}

function normalizeBarriers(selected: string[]) {
  return selected.map((item) => {
    const canonical = Object.entries(barrierAliases).find(([, aliases]) => aliases.includes(item))?.[0];
    return canonical || item;
  });
}

function toggleBarrier(values: string[], value: string) {
  const aliases = barrierAliases[value] || [];
  const hasValue = values.includes(value) || aliases.some((alias) => values.includes(alias));
  return hasValue
    ? values.filter((item) => item !== value && !aliases.includes(item))
    : [...values.filter((item) => !aliases.includes(item)), value];
}

function formatSelectionList(items: string[]) {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function preferenceSupportMessage(selected: string[], feelChips: string[], currentCapacity: string) {
  if (selected.length === 0) return "";
  const movementText = formatSelectionList(selected.slice(0, 3));
  const feelText = feelChips.length ? ` It should feel ${formatSelectionList(feelChips.map((item) => item.toLowerCase()))}.` : "";
  if (selected.includes("Gardening") || /garden/i.test(currentCapacity)) {
    return `You mentioned ${movementText.toLowerCase()}. Gardening absolutely counts - we can build it into your plan.${feelText}`;
  }
  return `${movementText} can be part of your plan. Artie will start small and adjust around your energy.${feelText}`;
}

function barrierSupportMessage(selected: string[]) {
  if (selected.length === 0) return "";
  const selectedText = formatSelectionList(selected.slice(0, 3)).toLowerCase();
  const adjustments = [];
  if (selected.includes("Fatigue")) adjustments.push("shorter sessions");
  if (selected.includes("Numb feet / neuropathy")) adjustments.push("flat, steady routes");
  if (selected.includes("Need bathrooms nearby")) adjustments.push("bathroom-friendly loops");
  if (selected.includes("Fear of overdoing it")) adjustments.push("starts below your limit");
  if (selected.includes("No safe place to walk") || selected.includes("Weather")) adjustments.push("indoor backups");
  if (selected.includes("No time")) adjustments.push("smaller sessions");
  if (selected.includes("Low motivation")) adjustments.push("easy first steps");
  if (selected.includes("Feeling self-conscious")) adjustments.push("private options");
  if (selected.includes("Nausea")) adjustments.push("easy-to-pause movement");
  return `${selectedText} are planning details. Artie will use ${formatSelectionList(adjustments.slice(0, 3)) || "realistic adjustments"} so the plan feels safe and doable.`;
}

function environmentSupportMessage(environment: Record<string, boolean>) {
  const selected = environmentOptions.filter((option) => environment[option.key]).map((option) => option.label);
  if (selected.length === 0) return "";
  const routeSupports = [];
  if (environment["Sidewalks nearby"]) routeSupports.push("nearby sidewalks or paths");
  if (environment["Safe walking area"]) routeSupports.push("safer outdoor routes");
  if (environment["Bathrooms on route"]) routeSupports.push("bathroom-friendly loops");
  if (environment["Gym/community center access"]) routeSupports.push("gym or community center options");
  if (environment["Indoor movement space"]) routeSupports.push("indoor backups");
  return `${formatSelectionList(selected.slice(0, 3))} will shape the route ideas. Artie can use ${formatSelectionList(routeSupports.slice(0, 3))} when building the plan.`;
}

function buildArtieSuggestionChips(onboarding: OnboardingAnswers, plan: PatientPlan) {
  const chips: string[] = [];
  const add = (chip: string) => {
    if (!chips.includes(chip)) chips.push(chip);
  };

  if (onboarding.barriers.includes("Fatigue")) add("What if fatigue gets in the way?");
  if (onboarding.barriers.includes("Numb feet / neuropathy") || onboarding.redFlags.some((flag) => /numb/i.test(flag))) add("My feet are numb");
  if (onboarding.barriers.includes("Need bathrooms nearby") || onboarding.environment["Bathrooms on route"]) add("Can I choose a bathroom route?");
  if (onboarding.barriers.includes("Fear of overdoing it")) add("How do I know I am not overdoing it?");
  if (onboarding.barriers.includes("No safe place to walk") || onboarding.environment["Safe walking area"] === false) add("What if walking outside does not feel safe?");
  if (onboarding.barriers.includes("Weather")) add("What can I do when weather is bad?");
  if (onboarding.barriers.includes("Low motivation")) add("Help me restart today");
  if (onboarding.preferences.includes("Gardening") || plan.activity === "Gardening") add("Does gardening count?");
  if (onboarding.preferences.includes("Swimming") || plan.activity === "Swimming") add("Can I swim?");
  if (onboarding.preferences.includes("Cycling") || plan.activity === "Cycling") add("Can I bike instead?");
  if (onboarding.environment["Indoor movement space"] || onboarding.preferences.includes("At home")) add("Can I do this indoors?");
  add(`Why ${plan.minutes} minutes?`);
  add("Can I split the session?");

  return chips.slice(0, 4);
}

function getPatientChatKey(state: ReturnType<typeof useDemoStore>) {
  return (
    state.patientProfile.careTeamCode
    || state.generatedCareCode
    || state.careCode
    || state.patientProfile.email
    || state.patientIdentity?.contact
    || state.patientProfile.name
    || state.patientIdentity?.firstName
    || "current-patient"
  ).trim().toLowerCase();
}

function artieResponse(text: string, firstName = "there", onboarding?: OnboardingAnswers, plan?: PatientPlan) {
  const hasBarrier = (barrier: string) => onboarding?.barriers.includes(barrier) ?? false;
  const hasPreference = (preference: string) => onboarding?.preferences.includes(preference) ?? false;
  const currentPlan = plan ? `${plan.activity.toLowerCase()} ${plan.minutes} minutes` : "your current plan";
  if (/^(hi|hello|hey)$/i.test(text.trim())) return `Hi ${firstName}. What would you like help with today - your plan, symptoms, or making movement easier?`;
  if (/gardening/i.test(text)) return hasPreference("Gardening") || plan?.activity === "Gardening" ? `Yes. Gardening fits your profile, so keep it gentle and count it toward ${currentPlan} when it feels easy-to-moderate.` : "Yes. Light gardening can count if it is paced and safe. Start with short, easy tasks and stop if symptoms change.";
  if (/missed|restart/i.test(text)) return hasBarrier("Low motivation") ? "A missed week is information, not failure. Restart today with one tiny version of the plan, even 3-5 minutes, then rebuild gently." : "Missing a week is data, not failure. Restart with one short session and rebuild gently.";
  if (/feet|numb|neuropathy/i.test(text)) return "Because numb feet can affect balance, choose flat steady routes, supportive shoes, and avoid uneven ground. If numbness is new or suddenly worse, pause and contact your care team.";
  if (/swim/i.test(text)) return hasPreference("Swimming") || plan?.activity === "Swimming" ? "Swimming matches what you selected. Count it only if your care team has cleared water activity and any port, wound, or skin concerns are safe." : "Swimming can count if your care team has cleared it and your port, wounds, and skin are safe.";
  if (/bike|cycling/i.test(text)) return "Biking can count if it feels steady and safe. Keep the pace easy, avoid high-traffic routes, and use a stationary bike if balance or weather is a concern.";
  if (/fatigue/i.test(text)) return "Use the low-energy version: shorten the session, move at an easy pace, and stop before you feel drained. Consistency matters more than pushing.";
  if (/bathroom/i.test(text)) return "Yes. Since bathroom access matters, choose a short loop with a nearby restroom or an indoor backup where you can stop quickly.";
  if (/overdoing/i.test(text)) return "Use the talk test: you should be able to talk in short sentences. Chest pain, dizziness, fever, or severe shortness of breath means stop and contact your care team.";
  if (/outside|safe/i.test(text)) return "Use an indoor option instead: hallway laps, gentle marching, or a gym/community center if available. The plan should fit your safety, not fight it.";
  if (/weather/i.test(text)) return "Move the plan indoors on bad-weather days. A short indoor walk or gentle at-home movement can still count.";
  if (/indoors/i.test(text)) return "Yes. Indoor movement counts. Use hallway laps, light standing movement, or a short home route and keep the same easy-to-moderate effort.";
  if (/why .*minutes|minutes/i.test(text)) return plan ? `${plan.minutes} minutes is based on your baseline, barriers, and selected supports. It is meant to feel doable first, then build gradually.` : "The minutes are meant to start below your limit, then build gradually as your body gives feedback.";
  if (/split/i.test(text)) return plan ? `Yes. You can split ${plan.minutes} minutes into smaller pieces, like two short sessions, if that fits fatigue or schedule better.` : "Yes. Splitting a session into smaller pieces still counts when it helps you stay consistent.";
  if (plan && onboarding) {
    const barrierText = onboarding.barriers.length ? ` I will keep ${formatSelectionList(onboarding.barriers.slice(0, 2).map((item) => item.toLowerCase()))} in mind.` : "";
    const adaptationText = plan.adaptations.length ? ` Your plan already includes ${formatSelectionList(plan.adaptations.slice(0, 2).map((item) => item.toLowerCase()))}.` : "";
    return `I hear you. For your current ${currentPlan} plan, keep it easy-to-moderate and adjust based on how your body feels today.${barrierText}${adaptationText}`;
  }
  return "I hear you. Keep the movement easy-to-moderate, start smaller if needed, and stop if anything feels unsafe.";
}

function formatTime(seconds: number) {
  const min = Math.floor(seconds / 60).toString().padStart(2, "0");
  const sec = (seconds % 60).toString().padStart(2, "0");
  return `${min}:${sec}`;
}

































