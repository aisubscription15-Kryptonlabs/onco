"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { loginDemo } from "@/lib/onco/demo/demo-auth";
import { demoStore, useDemoStore } from "@/lib/onco/demo/demo-store";
import type { DemoRole } from "@/lib/onco/demo/demo-types";
import { Button } from "@/components/onco/ui/Button";
import { Card } from "@/components/onco/ui/Card";
import { WalkIcon } from "@/components/onco/ui/icons";
import { Select } from "@/components/onco/ui/Select";
import { cn } from "@/lib/utils";

const chips = ["Patient-started", "Doctor-shareable", "MET tracking", "Artie-guided"];

type LandingRole = Extract<DemoRole, "patient" | "doctor" | "admin" | "app-provider">;

const accessCards = [
  {
    role: "patient",
    short: "PT",
    title: "Patient",
    body: "Start on your own or continue with a care code.",
  },
  {
    role: "doctor",
    short: "DR",
    title: "Doctor / Care Team",
    body: "Sign in with email and password to review patients, alerts, prescriptions, and summaries.",
  },
  {
    role: "admin",
    short: "AD",
    title: "Site Admin",
    body: "Sign in to manage site operations, teams, programs, and reports.",
  },
  {
    role: "app-provider",
    short: "AP",
    title: "App Provider",
    body: "Sign in to oversee sites, platform usage, prompts, and audit logs.",
  },
] satisfies Array<{
  role: LandingRole;
  short: string;
  title: string;
  body: string;
}>;

export default function DemoLandingPage() {
  const router = useRouter();
  const { users } = useDemoStore();
  const [selectedRole, setSelectedRole] = useState<LandingRole>("patient");
  const [email, setEmail] = useState("demo@oncomotionrx.example");
  const [password, setPassword] = useState("recovery");
  const selectedCard = accessCards.find((card) => card.role === selectedRole) || accessCards[0];
  const staffUsers = useMemo(
    () => users.filter((user) => user.role === selectedRole),
    [selectedRole, users],
  );
  const [userId, setUserId] = useState("");
  const selectedUser = users.find((user) => user.id === userId && user.role === selectedRole) || staffUsers[0];

  function selectRole(role: LandingRole) {
    setSelectedRole(role);
    const nextUser = users.find((user) => user.role === role);
    setUserId(nextUser?.id || "");
  }

  function startPatientProgram() {
    demoStore.preparePatientProgram();
    router.push("/onboarding");
  }

  function signInStaff() {
    if (!selectedUser) return;
    router.push(loginDemo(selectedUser));
  }

  return (
    <main className="onco-page min-h-ios-screen px-5 py-8 safe-area-inset-bottom">
      <section className="mx-auto grid min-h-ios-landing max-w-7xl gap-10 lg:grid-cols-[1fr_620px] lg:items-center">
        <div>
          <div className="mb-8 flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-onco-sage text-onco-cream shadow-onco">
              <WalkIcon />
            </span>
            <span className="onco-display text-2xl font-extrabold">OncoMotionRx</span>
          </div>
          <span className="inline-flex rounded-full bg-onco-sage-soft px-3 py-1 text-xs font-semibold text-onco-sage">
            Frontend demo · backend not connected yet
          </span>
          <h1 className="onco-display mt-7 text-5xl font-extrabold leading-none text-onco-ink sm:text-7xl">
            Movement, made for recovery.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-onco-muted">
            A structured movement prescription platform for life during and after cancer treatment — guided by Artie.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {chips.map((chip) => (
              <span className="rounded-full border border-onco-line bg-white px-4 py-2 text-sm font-semibold text-onco-muted shadow-sm" key={chip}>
                {chip}
              </span>
            ))}
          </div>
        </div>

        <Card className="p-5 sm:p-8">
          <p className="text-[13px] font-black uppercase tracking-[0.22em] text-onco-terracotta">Welcome</p>
          <h2 className="onco-display mt-3 text-3xl font-extrabold text-onco-ink">
            {selectedRole === "patient" ? "Start your program" : "Sign in to OncoMotionRx"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-onco-muted">{selectedCard.body}</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {accessCards.map((card) => (
              <button
                className={cn(
                  "min-h-[112px] rounded-2xl border border-onco-line bg-white p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-onco-sage/30",
                  selectedRole === card.role && "border-2 border-onco-sage bg-onco-sage-soft/70",
                )}
                key={card.role}
                type="button"
                onClick={() => selectRole(card.role)}
              >
                <span className="inline-flex rounded-lg bg-onco-cream px-2 py-1 text-xs font-black text-onco-muted">{card.short}</span>
                <span className="ml-3 text-sm font-extrabold text-onco-ink">{card.title}</span>
                <p className="mt-2 text-xs leading-5 text-onco-muted">{card.role === "patient" ? "Start patient program" : "Email/password sign-in"}</p>
              </button>
            ))}
          </div>

          {selectedRole === "patient" ? (
            <div className="mt-6 rounded-2xl border border-onco-line bg-onco-cream p-4">
              <p className="text-sm font-semibold text-onco-ink">No username or password needed.</p>
              <p className="mt-1 text-sm leading-6 text-onco-muted">Start on your own or continue with a Care Code inside onboarding.</p>
              <Button className="mt-4 min-h-[54px] w-full" onClick={startPatientProgram}>
                Start patient program
              </Button>
            </div>
          ) : (
            <div className="mt-7 grid gap-5">
              <label>
                <span className="mb-2 block text-[13px] font-black uppercase tracking-[0.18em] text-onco-muted-light">
                  Email address
                </span>
                <input className="onco-input min-h-[56px]" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
              </label>
              <label>
                <span className="mb-2 block text-[13px] font-black uppercase tracking-[0.18em] text-onco-muted-light">
                  Password
                </span>
                <input className="onco-input min-h-[56px]" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Demo password" />
              </label>

              <Button className="min-h-[58px] w-full text-base" onClick={signInStaff}>
                Sign in
                <span aria-hidden="true">&rarr;</span>
              </Button>
            </div>
          )}
        </Card>
      </section>
    </main>
  );
}
