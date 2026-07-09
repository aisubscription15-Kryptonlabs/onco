"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
import type { ActivityLog, CancerType, ConnectedDevice, TrackingType, TreatmentStatus } from "@/lib/onco/demo/demo-types";
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
  const [wearableOpen, setWearableOpen] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);
  const [codeInitialStage, setCodeInitialStage] = useState<"entry" | "forgot">("entry");
  const [selfOpen, setSelfOpen] = useState(false);
  const [pendingDevice, setPendingDevice] = useState<TrackingType>("Apple Health");
  const isCareCodeFlow = state.onboardingMode === "care_code";
  const total = isCareCodeFlow ? 8 : 9;
  const stepNames = isCareCodeFlow ? careCodeSteps : selfStartSteps;
  const stepOffset = !isCareCodeFlow && state.onboardingMode !== "none" && step > 0 ? 1 : 0;
  const currentStepNumber = isCareCodeFlow ? step : Math.min(stepNames.length, step + 1 + stepOffset);
  const currentStepName = stepNames[currentStepNumber - 1] || "Start";
  const showLinkedPatientHeader = state.role === "patient" && state.patientProfile.careCodeLinked && state.patientProfile.inviteCodeType === "patient_invite";
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
    if (isCareCodeFlow && step <= 1) {
      setStep(0);
      return;
    }
    setStep((value) => Math.max(0, value - 1));
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
    <PatientShell bottomNav={false} showPatientHeader={showLinkedPatientHeader}>
      <div className="flex min-h-ios-compact flex-col">
        {step > 0 ? (
          <div className="mb-5 space-y-2">
            <div className="flex items-center gap-3">
            <button className="text-xl text-onco-muted-light" type="button" onClick={goBack}>{"<"}</button>
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-onco-muted-light">{currentStepName}</p>
              <p className="text-xs font-semibold text-onco-muted">Step {currentStepNumber} of {stepNames.length}</p>
            </div>
            </div>
            <Stepper current={currentStepNumber} total={stepNames.length} />
          </div>
        ) : null}

        <div className="flex-1">
          {step === 0 ? <Welcome /> : null}
          {step === 1 && !isCareCodeFlow ? <TreatmentContext /> : null}
          {step === 2 && !isCareCodeFlow ? <Baseline /> : null}
          {step === 3 && !isCareCodeFlow ? <Safety /> : null}
          {step === 1 && isCareCodeFlow ? <Baseline /> : null}
          {step === 2 && isCareCodeFlow ? <Safety /> : null}
          {((step === 4 && !isCareCodeFlow) || (step === 3 && isCareCodeFlow)) ? <Preferences /> : null}
          {((step === 5 && !isCareCodeFlow) || (step === 4 && isCareCodeFlow)) ? <Barriers /> : null}
          {((step === 6 && !isCareCodeFlow) || (step === 5 && isCareCodeFlow)) ? <Environment /> : null}
          {((step === 7 && !isCareCodeFlow) || (step === 6 && isCareCodeFlow)) ? <Support onAdd={() => setSupportOpen(true)} /> : null}
          {((step === 8 && !isCareCodeFlow) || (step === 7 && isCareCodeFlow)) ? <GoalTracking onWearable={(device) => { setPendingDevice(device); setWearableOpen(true); }} /> : null}
          {((step === 9 && !isCareCodeFlow) || (step === 8 && isCareCodeFlow)) ? <ReadyToGenerate /> : null}
        </div>

        <div className="mt-5 space-y-2.5">
          {step === 0 ? (
            <>
              <div className="space-y-2.5">
                <Button className="w-full" onClick={() => { demoStore.beginCareCode(); setCodeInitialStage("entry"); setCodeOpen(true); }}>I have a care code</Button>
                <button
                  className="block w-full py-2 text-center text-sm font-semibold text-onco-sage hover:text-onco-ink"
                  type="button"
                  onClick={() => { demoStore.beginSelfStart(); setSelfOpen(true); }}
                >
                  Start on my own
                </button>
                <button
                  className="block w-full py-1 text-center text-xs font-semibold text-onco-muted-light hover:text-onco-sage"
                  type="button"
                  onClick={() => { demoStore.beginCareCode(); setCodeInitialStage("forgot"); setCodeOpen(true); }}
                >
                  Need help finding your code?
                </button>
              </div>
            </>
          ) : (
            <>
              <Button className="w-full" onClick={next}>{step === total ? "Generate my plan" : "Continue"}</Button>
              <button className="w-full py-1 text-center text-xs font-semibold text-onco-muted-light" type="button" onClick={skip}>
                Skip for now
              </button>
            </>
          )}
        </div>
      </div>
      <SupportModal open={supportOpen} onClose={() => setSupportOpen(false)} />
      <SelfStartModal open={selfOpen} onClose={() => setSelfOpen(false)} onSuccess={() => setStep(1)} />
      <CareTeamCodeModal initialStage={codeInitialStage} open={codeOpen} onClose={() => setCodeOpen(false)} onSuccess={(nextStep) => setStep(nextStep)} />
      <Modal open={wearableOpen} title={`Connect ${pendingDevice}`} onClose={() => setWearableOpen(false)}>
        <p className="text-sm leading-6 text-onco-muted">Review permission and connect activity tracking for this plan.</p>
        <Button className="mt-4 w-full" onClick={() => { demoStore.connectDevice(pendingDevice); setWearableOpen(false); }}>
          Connect {pendingDevice}
        </Button>
      </Modal>
    </PatientShell>
  );
}

function Welcome() {
  return (
    <div className="flex h-full flex-col justify-between pt-8">
      <div>
        <p className="mb-3 text-[12px] font-black uppercase tracking-[0.18em] text-onco-terracotta">Start</p>
        <div className="mb-10 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-onco-sage text-onco-cream"><WalkIcon /></div>
          <span className="onco-display text-lg font-bold">OncoMotionRx</span>
        </div>
        <div className="mb-10 rounded-[28px] bg-onco-sage-soft p-7">
          <svg viewBox="0 0 260 150" className="h-auto w-full" aria-hidden="true">
            <circle cx="48" cy="70" r="38" fill="#F7F4ED" /><circle cx="118" cy="48" r="27" fill="#E8C9B0" />
            <path d="M145 88 Q180 30 216 62 Q238 82 252 57" stroke="#2D5A4A" strokeWidth="8" fill="none" strokeLinecap="round" />
            <circle cx="252" cy="57" r="8" fill="#C66B3D" />
          </svg>
        </div>
        <h1 className="onco-display text-[34px] font-extrabold leading-[0.96]">Movement,<br />made for recovery.</h1>
        <p className="mt-4 text-sm leading-6 text-onco-muted">
          A structured movement program built for life during and after cancer treatment - guided by Artie, your personal activity consultant.
        </p>
      </div>
      <p className="text-center text-xs leading-5 text-onco-muted-light">You can share your plan and progress with your oncology team anytime.</p>
    </div>
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
          <Choice key={option} hideIndicator selected={onboarding.previousActivity === option} onClick={() => demoStore.updateOnboarding({ previousActivity: onboarding.previousActivity === option ? "" : option })}>{option}</Choice>
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
  const [showTrailDetails, setShowTrailDetails] = useState(false);
  const trails = trailsForZip(onboarding.environmentZipCode);
  const visibleTrails = trails.slice(0, 2);
  const selectedTrail = visibleTrails.find((trail) => trail.id === onboarding.selectedTrailId) || visibleTrails[0];
  const hasZip = onboarding.environmentZipCode.trim().length === 5;
  const hasExactZipRoutes = hasZip && visibleTrails.some((trail) => !trail.zipCodes.includes("default"));
  const environmentNote = environmentSupportMessage(onboarding.environment);
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
            className="onco-input pr-12 font-semibold"
            inputMode="numeric"
            maxLength={5}
            value={onboarding.environmentZipCode}
            onChange={(event) => {
              demoStore.updateOnboarding({ environmentZipCode: event.target.value.replace(/\D/g, "").slice(0, 5) });
              setShowTrailDetails(false);
            }}
            placeholder="Enter 5-digit zip code"
          />
          <button
            aria-label={showTrailDetails ? "Hide nearby trails" : "Show nearby trails"}
            className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-onco-sage-soft text-onco-sage transition disabled:opacity-40"
            disabled={!hasZip}
            type="button"
            onClick={() => setShowTrailDetails((current) => !current)}
          >
            <svg
              aria-hidden="true"
              className={cn("h-4 w-4 transition-transform", showTrailDetails && "rotate-180")}
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        </div>
      </div>
      {hasZip && showTrailDetails ? (
        <>
      <Card className="mt-4 rounded-[16px] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold">Nearby short route ideas</p>
            <p className="mt-1 text-xs leading-5 text-onco-muted">
              {hasExactZipRoutes ? `Showing 2 short options near ${onboarding.environmentZipCode}.` : "No saved trail match yet, so here is a safe starter option."}
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
        <div className="mt-4 rounded-[14px] bg-onco-sand/70 p-3">
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
        <p className="mt-1 text-xs font-semibold text-onco-muted">{selectedTrail.area} · {selectedTrail.distance}</p>
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
        checked ? "border-onco-sage bg-onco-sage text-onco-cream" : "border-onco-line bg-white text-onco-ink",
      )}
      onClick={() => onChange(!checked)}
    >
      <EnvironmentOptionIcon name={icon} selected={checked} />
      <span className="min-w-0 flex-1 pr-7 text-sm leading-4">{label}</span>
      {checked ? (
        <span className="absolute right-3 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded-full border border-onco-cream/70 text-[10px] text-onco-cream">
          <CheckIcon />
        </span>
      ) : null}
    </button>
  );
}

function EnvironmentOptionIcon({ name, selected }: { name: (typeof environmentOptions)[number]["icon"]; selected?: boolean }) {
  return (
    <span className={cn("onco-option-icon", selected && "text-onco-cream")} aria-hidden="true">
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
        {name === "path" ? (
          <>
            <path d="M7 19c2-5 2-9 0-14" />
            <path d="M17 19c-2-5-2-9 0-14" />
            <path d="M10 8h4" />
            <path d="M9 13h6" />
          </>
        ) : null}
        {name === "shield" ? (
          <>
            <path d="M12 3 5 6v5c0 4.2 2.7 7.6 7 10 4.3-2.4 7-5.8 7-10V6l-7-3Z" />
            <path d="m9 12 2 2 4-5" />
          </>
        ) : null}
        {name === "bathroom" ? (
          <>
            <path d="M7 5h10v14H7z" />
            <path d="M10 9h4" />
            <path d="M10 13h4" />
          </>
        ) : null}
        {name === "gym" ? (
          <>
            <path d="M4 10v4" />
            <path d="M8 8v8" />
            <path d="M16 8v8" />
            <path d="M20 10v4" />
            <path d="M8 12h8" />
          </>
        ) : null}
        {name === "stairs" ? (
          <>
            <path d="M5 18h5v-4h4v-4h5" />
            <path d="M5 22h14" />
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
        <Card>
          <p className="font-semibold">{onboarding.supportPerson.name}</p>
          <p className="text-sm text-onco-muted">{onboarding.supportPerson.relationship} · Invite sent · pending</p>
        </Card>
      ) : <Card tone="sand">No support person yet.</Card>}
      <Button className="mt-4 w-full" variant="outline" onClick={onAdd}>Add support person</Button>
    </ScreenTitle>
  );
}

function GoalTracking({ onWearable }: { onWearable: (device: TrackingType) => void }) {
  const { onboarding } = useDemoStore();
  const goalOptions = [
    "Rebuild stamina for gardening and errands.",
    "Feel less afraid of movement.",
    "Support my long-term health outcomes.",
    "Write my own...",
  ];
  const isCustomGoal = !goalOptions.slice(0, 3).includes(onboarding.goalAnchor);

  function selectTrackingType(trackingType: TrackingType) {
    demoStore.updateOnboarding({ trackingType });
    if (trackingType !== "Manual") onWearable(trackingType);
  }

  return (
    <ScreenTitle title="Last thing - what matters most to you?" subtitle="This becomes your anchor. Artie will bring it back to you on the hard days.">
      <div className="space-y-2.5">
        {goalOptions.map((goal) => {
          const isOwnOption = goal.includes("own");
          const isSelected = isOwnOption ? isCustomGoal : onboarding.goalAnchor === goal;
          if (isOwnOption && isSelected) {
            return (
              <div key={goal}>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.05em] text-onco-muted-light">Write your own</p>
                <textarea
                  autoFocus
                  aria-label="Write my own goal"
                  className="onco-input min-h-[112px] resize-y py-4 text-base font-semibold leading-6"
                  placeholder="Tell us what matters most to you..."
                  value={onboarding.goalAnchor}
                  onChange={(event) => demoStore.updateOnboarding({ goalAnchor: event.target.value })}
                />
              </div>
            );
          }
          return (
            <button
              className={cn(
                "onco-option-row",
                isSelected && "onco-option-row-active",
              )}
              key={goal}
              type="button"
              onClick={() => demoStore.updateOnboarding({ goalAnchor: isOwnOption ? "" : isSelected ? "" : goal })}
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
        label="Track automatically? Optional"
        value={onboarding.trackingType}
        onChange={selectTrackingType}
        options={trackingOptions.map((value) => ({ label: value === "Manual" ? "Manual" : value, value }))}
      />
      <Link className="onco-button-outline mt-4 w-full" href="/devices">Manage device connection</Link>
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
        <p className="mt-2 text-sm text-[#C7D8CC]">{onboarding.preferences.join(", ")} · {onboarding.barriers.join(", ")}</p>
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
      <Button className="mt-5 w-full" onClick={() => { demoStore.setSafetyPaused(false); router.push("/plan-reveal"); }}>I understand · show my plan</Button>
      <Link className="onco-button-outline mt-3 w-full" href="/doctor-summary">Share with my doctor first</Link>
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
        <p className="mt-1 text-sm text-[#C7D8CC]">{patientPlan.daysPerWeek} days/week · {patientPlan.intensity} · {patientPlan.metHours} MET-hrs/wk</p>
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
      <Link className="onco-button-outline mt-3 w-full" href="/doctor-summary">Share with my doctor first</Link>
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
            <p className="mt-1 font-semibold">Session 3 · Goal setting</p>
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
  return (
    <PatientShell activeTab="prescription" requireRole>
      <h1 className="onco-display text-[28px] font-extrabold">Your prescription</h1>
      <Card className="mt-4">
        <p className="font-semibold">Weekly goal</p>
        <p className="mt-1 text-sm text-onco-muted">{patientPlan.minutes * patientPlan.daysPerWeek} minutes per week, about {patientPlan.metHours} MET-hours.</p>
      </Card>
      <Card className="mt-4">
        <p className="font-semibold">Why this plan fits</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {patientPlan.adaptations.map((item) => <Pill active key={item}>{item}</Pill>)}
          {onboarding.barriers.length === 0 ? <Pill>starts gently</Pill> : null}
        </div>
      </Card>
      <Card tone="sage" className="mt-5"><h2 className="onco-display text-3xl font-extrabold">{patientPlan.activity} {patientPlan.minutes} minutes</h2><p className="mt-1 text-sm text-[#C7D8CC]">{patientPlan.daysPerWeek} days/week · {patientPlan.intensity} · {patientPlan.metHours} MET-hrs/wk</p></Card>
      <div className="mt-4 space-y-2">{["Stop for chest pain", "Hydrate", "Use flat steady routes", "Choose bathroom loops"].map((item) => <button className="w-full rounded-2xl border border-onco-line bg-white p-4 text-left text-sm font-semibold" key={item} onClick={() => setOpen(open === item ? null : item)}>{item}{open === item ? <p className="mt-2 text-xs font-normal text-onco-muted">This guidance helps you stay inside your safety boundaries.</p> : null}</button>)}</div>
      <Link className="onco-button-primary mt-4 w-full" href="/doctor-summary">Generate doctor summary</Link>
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
      {[1, 2, 3].map((id) => <Card key={id} className="mt-3 flex items-center justify-between"><div><p className="font-semibold">Session {id}{id === 3 ? " · Goal setting" : ""}</p><p className="text-xs text-onco-muted">{completedSessions.includes(id) ? "Completed" : "Available now"}</p></div>{id === 3 ? <Link className="onco-button-primary min-h-0 py-2" href="/sessions/3">Start session 3</Link> : <Badge>Done</Badge>}</Card>)}
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
      <h1 className="onco-display text-xl font-extrabold text-center">Session 3 · Goal setting</h1><Stepper className="mt-3" current={Math.min(progress + 1, 5)} total={5} />
      <div className="mt-6 space-y-3"><ChatBubble sender="artie" text={messages[Math.min(progress, messages.length - 1)]} />{progress < 3 ? <Button className="w-full" variant="outline" onClick={() => demoStore.setSessionProgress(3, progress + 1)}>{progress === 0 ? "Fatigue got in the way" : "Yes, plan around it"}</Button> : <Button className="w-full" onClick={() => { demoStore.completeSession(3); demoStore.toast("Session 3 completed"); router.push("/sessions"); }}>Finish session</Button>}</div>
    </PatientShell>
  );
}

export function SessionsClient() {
  const { completedSessions, programSessions } = useDemoStore();
  return (
    <PatientShell activeTab="sessions" requireRole>
      <h1 className="onco-display text-[28px] font-extrabold">Sessions</h1>
      <p className="mt-1 text-sm text-onco-muted">Phase 1 curriculum. Sessions 1 and 2 are complete; session 3 is ready.</p>
      {programSessions.map((session) => {
        const done = completedSessions.includes(session.number);
        const available = done || session.number === 3;
        return (
          <Card key={session.id} className={cn("mt-3 flex items-center justify-between gap-3", !available && "opacity-60")}>
            <div>
              <p className="font-semibold">Session {session.number}: {session.title}</p>
              <p className="text-xs text-onco-muted">{done ? "Completed" : available ? `${session.estimatedMinutes} min · available now` : "Locked for later"}</p>
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
  const session = state.programSessions.find((item) => item.number === sessionId) || state.programSessions[2];
  const progress = state.sessionProgress[String(sessionId)] || 0;
  const firstName = state.patientProfile.name?.trim().split(/\s+/)[0] || "there";
  const messages = [`Nice to see you, ${firstName}. What got in the way this week?`, "That is information, not failure. Want to plan around fatigue?", "Great. I will update your goal to protect infusion days.", "Session complete."];
  return (
    <PatientShell bottomNav={false} requireRole>
      <h1 className="onco-display text-center text-xl font-extrabold">Session {session.number}: {session.title}</h1>
      <Stepper className="mt-3" current={Math.min(progress + 1, 5)} total={5} />
      <div className="mt-6 space-y-3">
        <ChatBubble sender="artie" text={messages[Math.min(progress, messages.length - 1)]} />
        {progress < 3 ? (
          <>
            <div className="flex flex-wrap gap-2">
              {["Fatigue got in the way", "Bathroom access", "I was worried I would overdo it"].map((reply) => (
                <Pill key={reply} onClick={() => demoStore.setSessionProgress(sessionId, progress + 1)}>{reply}</Pill>
              ))}
            </div>
            <div className="flex items-center gap-2 rounded-full border border-onco-line bg-white p-2">
              <input className="flex-1 bg-transparent px-2 text-sm outline-none" value={typed} onChange={(event) => setTyped(event.target.value)} placeholder="Type an answer..." />
              <button className="grid h-8 w-8 place-items-center rounded-full text-onco-sage" type="button" onClick={() => setVoiceOpen(true)} aria-label="Use microphone"><MicIcon className="text-lg" /></button>
              <button className="flex h-8 w-8 items-center justify-center rounded-full bg-onco-ink text-onco-cream" type="button" onClick={() => demoStore.setSessionProgress(sessionId, progress + 1)}><ArrowUpIcon /></button>
            </div>
          </>
        ) : (
          <Button className="w-full" onClick={() => { demoStore.completeSession(sessionId); demoStore.toast(`Session ${sessionId} completed`); router.push("/sessions"); }}>Finish session</Button>
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
  const totalMinutes = state.activityLogs.reduce((sum, log) => sum + log.duration, 0);
  const totalMet = state.activityLogs.reduce((sum, log) => sum + log.metHours, 0);
  const metGoal = Number(Math.max(state.patientPlan.metHours, 1.2).toFixed(2));
  const metPercent = Math.min(100, Math.round((totalMet / metGoal) * 100));
  const minuteGoal = state.patientPlan.minutes * state.patientPlan.daysPerWeek;
  const minutePercent = Math.min(100, Math.round((totalMinutes / Math.max(minuteGoal, 1)) * 100));
  const activeDays = new Set(state.activityLogs.map((log) => log.dateLabel)).size;
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
            <span className="inline-flex items-center gap-1"><span className="h-0.5 w-5 rounded bg-onco-sage" />This month</span>
            <span className="inline-flex items-center gap-1"><span className="h-0.5 w-5 border-t-2 border-dotted border-onco-muted-light" />Goal</span>
          </div>
        </div>
        <GoalTrendChart values={[38, 58, 76, Math.max(88, totalMinutes)]} goal={minuteGoal || 120} />
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

export function ArtieClient() {
  const state = useDemoStore();
  const [input, setInput] = useState("");
  const [voice, setVoice] = useState(false);
  const firstName = state.patientProfile.name?.trim().split(/\s+/)[0] || "there";
  function send(text: string) {
    const safety = /chest pain|dizzy|dizziness|faint|fever|severe shortness of breath/i.test(text);
    demoStore.addChatMessage({ sender: "user", text });
    demoStore.addChatMessage({ sender: "artie", text: safety ? "That can be a red flag. Stop activity and contact your care team before continuing." : artieResponse(text) });
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
          {["Does gardening count?", "I missed a whole week", "My feet are numb", "Can I swim?"].map((chip) => <Pill key={chip} onClick={() => send(chip)}>{chip}</Pill>)}
        </div>
        <div className="mt-5 flex-1 space-y-3 pb-4">
          {state.chatMessages.map((message) => (
            <ChatBubble key={message.id} sender={message.sender} text={message.text.replace(/^Hi Sam\./, `Hi ${firstName}.`)} />
          ))}
        </div>
        <div
          className="sticky z-30 mt-auto rounded-[28px] bg-onco-paper/95 pb-2 pt-2 backdrop-blur"
          style={{ bottom: "calc(4.75rem + env(safe-area-inset-bottom))" }}
        >
          <div className="flex min-h-[50px] items-center gap-2 rounded-full border border-onco-line bg-white p-2 shadow-[0_10px_28px_-22px_rgba(30,36,33,0.55)]">
            <input
              className="min-w-0 flex-1 bg-transparent px-2 text-[16px] outline-none placeholder:text-[#A9ADA8]"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask anything..."
            />
            <button className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-onco-ink" type="button" onClick={() => setVoice(true)} aria-label="Use microphone"><MicIcon className="text-lg" /></button>
            <button className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-onco-ink text-onco-cream" type="button" onClick={() => input.trim() && send(input)} aria-label="Send message"><ArrowUpIcon /></button>
          </div>
        </div>
      </section>
      <Modal open={voice} title="Voice capture" onClose={() => setVoice(false)}><p className="text-sm text-onco-muted">Use voice to share symptoms or plan questions with Artie.</p><Button className="mt-4" onClick={() => { setVoice(false); send("I feel dizzy"); }}>Use sample voice message</Button></Modal>
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
      <div className="flex min-h-ios-compact flex-col justify-between text-center"><Link className="text-left text-sm text-[#C7D8CC]" href="/today">Close</Link><section><Badge tone="cream">Guided walk · Main walk</Badge><h1 className="onco-display mt-5 text-[64px] font-extrabold">{formatTime(seconds)}</h1><p className="text-[#A9C5B4]">of {patientPlan.minutes} minutes · {earned} MET dose</p><ProgressBar className="mt-5 bg-onco-cream/25" indicatorClassName="bg-onco-sand" value={seconds / 60} max={patientPlan.minutes} /></section><section><Card className="bg-onco-cream/10 text-left text-onco-cream border-none"><p>Talk test: can you talk comfortably?</p><div className="mt-3 grid grid-cols-3 gap-2">{["Easy", "A little breathless", "Struggling"].map((item) => <Button key={item} variant={pace === item ? "cream" : "outline"} className={pace !== item ? "border-onco-cream/20 text-onco-cream" : ""} onClick={() => setPace(item)}>{item}</Button>)}</div></Card><div className="mt-4 flex gap-3"><Button className="flex-1" variant="cream" onClick={() => setRunning((value) => !value)}>{running ? "Pause" : seconds ? "Resume" : "Start"}</Button><Button className="flex-1 bg-[#F0D9CE] text-[#7A3B1E]" onClick={() => setStopOpen(true)}>I need to stop</Button></div><Button className="mt-3 w-full" variant="outline" onClick={complete}>Complete walk</Button></section></div>
      <Modal open={stopOpen} title="Stop safely" onClose={() => setStopOpen(false)}><p className="text-sm text-onco-muted">Stop now. Sit if needed. If symptoms include chest pain, dizziness, or unusual shortness of breath, contact your care team.</p><Button className="mt-4" onClick={() => { demoStore.setSafetyPaused(true); setStopOpen(false); router.push("/today"); }}>Stop and save safety note</Button></Modal>
    </PatientShell>
  );
}

export function GuidedWalkClient() {
  const router = useRouter();
  const { patientPlan } = useDemoStore();
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

  function complete() {
    demoStore.addActivityLog({ activity: "Walking", duration: Math.max(1, Math.round(seconds / 60)), paceFeel: pace, symptoms: false });
    router.push("/guided-walk/success");
  }

  return (
    <PatientShell bottomNav={false} inverted requireRole>
      <div className="flex min-h-ios-compact flex-col justify-between text-center">
        <Link className="text-left text-sm text-[#C7D8CC]" href="/today">Close</Link>
        <section>
          <Badge tone="cream">Guided walk · {stage}</Badge>
          <h1 className="onco-display mt-5 text-[64px] font-extrabold">{formatTime(seconds)}</h1>
          <p className="text-[#A9C5B4]">of {patientPlan.minutes} minutes · {earned} MET dose · {steps} steps</p>
          <ProgressBar className="mt-5 bg-onco-cream/25" indicatorClassName="bg-onco-sand" value={seconds / 60} max={patientPlan.minutes} />
        </section>
        <section>
          <Card className="border-none bg-onco-cream/10 text-left text-onco-cream">
            <p>Talk test: can you talk comfortably?</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {["Yes easily", "A little breathless", "Struggling"].map((item) => (
                <Button key={item} variant={pace === item ? "cream" : "outline"} className={pace !== item ? "border-onco-cream/20 text-onco-cream" : ""} onClick={() => setPace(item)}>{item}</Button>
              ))}
            </div>
          </Card>
          <div className="mt-4 flex gap-3">
            <Button className="flex-1" variant="cream" onClick={() => setRunning((value) => !value)}>{running ? "Pause" : seconds ? "Resume" : "Start"}</Button>
            <Button className="flex-1 bg-[#F0D9CE] text-[#7A3B1E]" onClick={() => setStopOpen(true)}>I need to stop</Button>
          </div>
          <Button className="mt-3 w-full" variant="outline" onClick={() => setSeconds(patientPlan.minutes * 60)}>Complete session now</Button>
          <Button className="mt-3 w-full" variant="outline" onClick={complete}>Complete walk</Button>
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
  return <PatientShell bottomNav={false} requireRole><Card tone="sage" className="mt-10 text-center"><CheckIcon className="mx-auto text-4xl" /><h1 className="onco-display mt-3 text-3xl font-extrabold">Walk complete</h1><p className="mt-2 text-sm text-[#C7D8CC]">{latest?.duration || 1} minutes logged · {latest?.metHours.toFixed(2) || "0.04"} MET-hours earned</p></Card><Link className="onco-button-primary mt-5 w-full" href="/progress">View progress</Link></PatientShell>;
}

export function DoctorSummaryClient() {
  const state = useDemoStore();
  const [share, setShare] = useState(false);
  const minutes = state.activityLogs.reduce((sum, log) => sum + log.duration, 0);
  const met = state.activityLogs.reduce((sum, log) => sum + log.metHours, 0);
  const baselineMet = estimateBaselineMetHours(state.onboarding);
  const baselineText = `${state.onboarding.previousActivity}. Current capacity: ${state.onboarding.currentCapacity} Baseline estimate: ${baselineMet || 0} MET-hrs/week, ${state.onboarding.weeklyWalkingMinutes || 0} walking min/wk, ${state.onboarding.weeklyOtherActivityMinutes || 0} other min/wk, ${state.onboarding.averageDailySteps || "not entered"} avg steps/day${state.onboarding.sixMinuteWalk ? `, 6-min walk ${state.onboarding.sixMinuteWalk} ft` : ""}.`;
  const symptoms = state.symptomReports.length ? state.symptomReports.map((item) => `${item.symptom}${item.redFlag ? " (red flag)" : ""}`).join(", ") : "No symptoms reported.";
  const safetyFlags = state.onboarding.redFlags.length ? state.onboarding.redFlags.join(", ") : "No onboarding red flags selected.";
  const summary = `OncoMotionRx summary for ${state.patientProfile.name || "Patient"}. Context: ${state.onboarding.cancerType}, ${state.onboarding.treatmentStatus}. Baseline: ${baselineText} Prescription: ${state.patientPlan.activity} ${state.patientPlan.minutes} min, ${state.patientPlan.daysPerWeek} days/week. Adherence: ${minutes} minutes, ${met.toFixed(2)} MET-hours. Symptoms: ${symptoms}. Safety flags: ${safetyFlags}. Barriers: ${state.onboarding.barriers.join(", ")}. Questions: activity restrictions, neuropathy fall risk, and stop symptoms.`;
  return (
    <PatientShell bottomNav={false} requireRole>
      <Link className="mb-4 inline-flex text-sm font-semibold text-onco-muted" href="/onboarding">
        {"<"} Back to start
      </Link>
      <h1 className="onco-display text-[22px] font-extrabold">Doctor summary</h1>
      <Card className="mt-5 space-y-3">
        <Summary label="Symptoms" text={symptoms} />
        <Summary label="Safety flags" text={safetyFlags} />
      </Card>
      <Card className="mt-5 space-y-3">
        <Summary label="Baseline assessment" text={baselineText} />
        <Summary label="Phase I target" text={`Progress gradually toward +10 MET-hrs/week above the ${baselineMet || 0} MET-hrs/week baseline.`} />
      </Card>
      <Card className="mt-5 space-y-3"><Summary label="Context" text={`${state.onboarding.cancerType}, ${state.onboarding.treatmentStatus}. Goal: ${state.onboarding.goalAnchor}`} /><Summary label="Current prescription" text={`${state.patientPlan.activity} · ${state.patientPlan.daysPerWeek} days/wk · ${state.patientPlan.minutes} min · ${state.patientPlan.metHours} MET-hrs/wk.`} /><Summary label="Adherence" text={`${minutes} minutes logged · ${met.toFixed(2)} MET-hours earned.`} /><Summary label="Symptoms & barriers" text={state.onboarding.barriers.join(", ")} /><Summary label="Questions for doctor" text="Any activity restrictions? Is neuropathy affecting fall risk? Which symptoms should make me stop and call?" /></Card>
      <div className="mt-4 grid gap-3"><Button onClick={() => { void navigator.clipboard?.writeText(summary); demoStore.toast("Copied for MyChart"); }}>Copy for MyChart</Button><Button variant="outline" onClick={() => demoStore.toast("PDF export prepared.", "info")}>PDF</Button><Link className="onco-button-outline w-full" href="/onboarding">Back to start page</Link></div>
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

function SelfStartModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
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

function CareTeamCodeModal({ initialStage = "entry", open, onClose, onSuccess }: { initialStage?: "entry" | "forgot"; open: boolean; onClose: () => void; onSuccess: (nextStep: number) => void }) {
  const state = useDemoStore();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [verify, setVerify] = useState("");
  const [stage, setStage] = useState<"entry" | "invite" | "confirm" | "updateChoice" | "forgot" | "otp" | "recovered">("entry");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [otp, setOtp] = useState("");
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
    }
    if (initialStage === "forgot") {
      setRecoveryEmail("");
      setOtp("");
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
    setOtp("");
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
      setOtp("");
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
              setOtp("");
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
          <Card>
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
          <Card>
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
        <p className="mt-2 text-sm text-onco-muted">{support ? `${support.name} · ${support.relationship} · Invite sent · pending` : "No support person added yet."}</p>
      </Card>
      <Link className="onco-button-outline mt-4 w-full" href="/privacy-sharing">Privacy & sharing</Link>
    </PatientShell>
  );
}

export function DevicesClient() {
  const state = useDemoStore();
  return <DeviceConnectivityContent state={state} />;
}

function DeviceConnectivityContent({ state }: { state: ReturnType<typeof useDemoStore> }) {
  const router = useRouter();
  const [selectedDevice, setSelectedDevice] = useState<ConnectedDevice | null>(null);
  const [autoSync, setAutoSync] = useState(true);
  const [shareDose, setShareDose] = useState(true);
  const connected = state.connectedDevices.filter((device) => device.connected);
  const activeSource = connected.find((device) => device.name === state.onboarding.trackingType) || connected[0] || state.connectedDevices.find((device) => device.name === "Manual");
  const latestLog = state.activityLogs[0];

  function connectAndClose(device: ConnectedDevice) {
    demoStore.connectDevice(device.name);
    setSelectedDevice(null);
    router.push("/onboarding?step=tracking");
  }

  function syncAndClose(device: ConnectedDevice) {
    demoStore.syncDevice(device.name);
    setSelectedDevice(null);
    router.push("/onboarding?step=tracking");
  }

  function useManualAndReturn() {
    demoStore.connectDevice("Manual");
    setSelectedDevice(null);
    router.push("/onboarding?step=tracking");
  }

  return (
    <PatientShell requireRole>
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
          Latest detected activity: {latestLog ? `${latestLog.activity} ${latestLog.duration} min · ${latestLog.metHours.toFixed(2)} MET-hours` : "No activity yet"}
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
                  <p className="mt-1 text-xs leading-5 text-onco-muted">{device.connected ? `Connected · last sync ${device.lastSync || "not yet"}` : device.name === "Manual" ? "Enter activity yourself" : "Not connected"}</p>
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
              <p className="mt-2 text-sm leading-6 text-onco-muted">8 minutes easy walking · 0.33 MET-hours · no symptoms reported.</p>
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
                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-onco-muted-light">{item.type} · {item.createdAt}</p>
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
  return <Modal open={open} title="Add support person" onClose={onClose}><input className="onco-input" value={name} onChange={(event) => setName(event.target.value)} /><input className="onco-input mt-3" value={relationship} onChange={(event) => setRelationship(event.target.value)} /><input className="onco-input mt-3" value={contact} onChange={(event) => setContact(event.target.value)} /><Select className="mt-3 block" label="Support type" value={supportType} onChange={setSupportType} options={["Reminders", "Walking buddy", "Care updates"].map((value) => ({ label: value, value }))} /><Button className="mt-4 w-full" onClick={() => { if (!name || !contact) { demoStore.toast("Name and contact required", "warning"); return; } demoStore.setSupportPerson({ name, relationship, contact, supportType, invitePending: true }); demoStore.toast("Invite sent · pending"); onClose(); }}>Send invite</Button></Modal>;
}

function ScreenTitle({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <div><h1 className="onco-mobile-title">{title}</h1><p className="onco-mobile-subtitle">{subtitle}</p>{children}</div>;
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

function MovementOptionIcon({ label, selected }: { label: string; selected: boolean }) {
  const commonProps = {
    className: "h-6 w-6",
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.9,
    viewBox: "0 0 24 24",
  };

  return (
    <span
      aria-hidden="true"
      className={cn(
        "onco-option-icon",
        selected && "text-onco-cream",
      )}
    >
      {label === "Walking" ? (
        <svg {...commonProps}><circle cx="12" cy="4" r="1.6" /><path d="m11 7-2 5 3 2 2 6" /><path d="m9 12-3 5" /><path d="m13 8 3 3 2.5.5" /></svg>
      ) : null}
      {label === "Gardening" ? (
        <svg {...commonProps}><path d="M12 14V6" /><path d="M12 9C8.5 6.5 5.5 8 5.5 8s2 4 6.5 3.2" /><path d="M12 8c3.5-3.2 7-1.4 7-1.4S17.1 11 12 9.8" /><path d="M6.5 14h11l-1.2 6H7.7l-1.2-6Z" /><path d="M5.5 20h13" /></svg>
      ) : null}
      {label === "Cycling" ? (
        <svg {...commonProps}><circle cx="6" cy="17" r="3" /><circle cx="18" cy="17" r="3" /><path d="M6 17h5l3-6h-4l-4 6Z" /><path d="m11 17-3-8" /><path d="m14 11 4 6" /><path d="M9 7h4" /></svg>
      ) : null}
      {label === "Swimming" ? (
        <svg {...commonProps}><circle cx="15.5" cy="6.5" r="1.6" /><path d="M6 12c2.5-3 5.6-4 10.5-2.8" /><path d="M4 16c2-1.4 4-1.4 6 0s4 1.4 6 0 4-1.4 6 0" /><path d="M4 20c2-1.4 4-1.4 6 0s4 1.4 6 0 4-1.4 6 0" /></svg>
      ) : null}
      {label === "Gym" ? (
        <svg {...commonProps}><path d="M4 12h16" /><path d="M6 8v8" /><path d="M9 9.5v5" /><path d="M15 9.5v5" /><path d="M18 8v8" /></svg>
      ) : null}
      {label === "At home" ? (
        <svg {...commonProps}><path d="m4 11 8-6 8 6v9H4v-9Z" /><path d="M9.5 20v-6h5v6" /></svg>
      ) : null}
      {label === "Stretching" ? (
        <svg {...commonProps}><circle cx="14" cy="4" r="1.6" /><path d="m13 7-3 5 4 2" /><path d="m10 12-5 5" /><path d="m14 14 4 5" /><path d="m12 8-4-2" /><path d="m13 7 4 3" /></svg>
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
      <path d="M20 7.5v11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17.2 8.5h5.6M17.2 12h5.6M17.2 15.5h5.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M20 18.5c-2 1.1-3.2 2.8-3.8 5.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 18.5c2 1.1 3.2 2.8 3.8 5.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16.8 18.4C11.4 19.6 8 25.4 8 32.1c0 2.8 1.8 4.4 4.1 3.4 4.2-1.7 6.1-5.8 6.1-11.8v-4c0-.9-.6-1.5-1.4-1.3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M23.2 18.4C28.6 19.6 32 25.4 32 32.1c0 2.8-1.8 4.4-4.1 3.4-4.2-1.7-6.1-5.8-6.1-11.8v-4c0-.9.6-1.5 1.4-1.3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SafetyDizzyIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 40 40" fill="none">
      <path d="M23.5 32.5H16c-5 0-8.5-3.8-8.5-8.7v-3.2c0-5.8 4.5-10.4 10.1-10.4h1.8c4.6 0 8.2 3.7 8.2 8.3v1.3l4 5.1h-3.9v3.3c0 2.4-1.8 4.3-4.2 4.3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M14.2 21.4h.01M21.8 21.4h.01M14.8 26.6c2.4-1.5 5-1.5 7.4 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M10.2 8.2c-1.1-1-2.4-1-3.5 0s-1.1 2.3 0 3.3c1.1 1 2.4 1 3.5 0s1.1-2.3 0-3.3ZM32.7 10.8c-1-.9-2.1-.9-3.1 0s-1 2.1 0 3 2.1.9 3.1 0 1-2.1 0-3Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
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
      <path d="M10 29c4.8-.5 8.7-2.5 11.4-6.1l3.8-5.1c1-1.3 3.2-.8 3.3.8.2 3.8-1.5 7.4-4.4 9.8L22 30.2c-2.4 2-5.4 3-8.4 3H9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11.2 28.8c-1.3-1.8-.8-4.1 1-5.3l6-3.8c1.7-1 3.8.1 3.8 2.1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.2 18.3 6 16.1M12.3 14.1l-1-3M29.3 13.2l2.4-2.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
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
      <path d="M20 7.8c-4.2 1.9-6.4 5.8-5.4 10.5l1.4 6.8c.5 2.6 2.1 4.7 4.4 6 2.2-1.3 3.8-3.4 4.3-6l1.4-6.8C27 13.6 24.2 9.6 20 7.8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M20 12v17M14 17h12M9 16l-3-2M9 23l-3 1M31 16l3-2M31 23l3 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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
  return <div className={cn("flex", sender === "user" ? "justify-end" : "justify-start")}><div className={cn("max-w-[84%] rounded-2xl px-4 py-3 text-sm leading-6", sender === "user" ? "bg-onco-sage text-onco-cream rounded-tr" : "border border-onco-line bg-white rounded-tl")}>{text}</div></div>;
}

function ActivityTable({ logs }: { logs: ActivityLog[] }) {
  return <DataTable rows={logs} getKey={(log) => log.id} columns={[{ header: "Activity", cell: (log) => log.activity }, { header: "Duration", cell: (log) => `${log.duration} min` }, { header: "MET", cell: (log) => log.metHours.toFixed(2) }]} />;
}

function Summary({ label, text }: { label: string; text: string }) {
  return <div><p className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-onco-muted-light">{label}</p><p className="text-[12.5px] leading-5 text-[#3A403C]">{text}</p></div>;
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

function artieResponse(text: string) {
  if (/gardening/i.test(text)) return "Yes. Light gardening counts, especially if it is paced and safe. I can include it as recovery movement.";
  if (/missed/i.test(text)) return "Missing a week is data, not failure. Restart with one short session and rebuild gently.";
  if (/feet|numb|neuropathy/i.test(text)) return "Choose flat, steady routes, supportive shoes, and avoid uneven ground. Stop if numbness changes suddenly.";
  if (/swim/i.test(text)) return "Swimming can count if your care team has cleared it and your port/wounds are safe.";
  return "I can help you adjust the plan while staying inside your safety boundaries.";
}

function formatTime(seconds: number) {
  const min = Math.floor(seconds / 60).toString().padStart(2, "0");
  const sec = (seconds % 60).toString().padStart(2, "0");
  return `${min}:${sec}`;
}
