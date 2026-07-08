"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { loginDemo } from "@/lib/onco/demo/demo-auth";
import { useDemoStore } from "@/lib/onco/demo/demo-store";
import type { DemoRole } from "@/lib/onco/demo/demo-types";
import { Button } from "@/components/onco/ui/Button";
import { Select } from "@/components/onco/ui/Select";
import { RoleSelector, loginRoles } from "./RoleSelector";

type LoginShellProps = {
  presetRole?: DemoRole;
};

const roleNames: Record<DemoRole, string> = {
  patient: "Patient",
  doctor: "Doctor",
  "care-team": "Care Team",
  admin: "Site Admin",
  "app-provider": "App Provider",
};

export function LoginShell({ presetRole }: LoginShellProps) {
  return <StaffLoginShell presetRole={presetRole} />;
}

function StaffLoginShell({ presetRole }: LoginShellProps) {
  const router = useRouter();
  const { users } = useDemoStore();

  const [selectedRole, setSelectedRole] = useState<DemoRole>(presetRole || "doctor");
  const [email, setEmail] = useState("demo@oncomotionrx.example");
  const [password, setPassword] = useState("recovery");
  const roleOptions = presetRole ? loginRoles.filter((item) => item.role === presetRole) : loginRoles.filter((item) => item.role !== "patient");
  const demoUsers = useMemo(
    () => users.filter((user) => user.role === selectedRole),
    [selectedRole, users],
  );
  const [userId, setUserId] = useState(demoUsers[0]?.id || "");
  const selectedUser = users.find((user) => user.id === userId && user.role === selectedRole) || demoUsers[0];

  function updateRole(role: DemoRole) {
    setSelectedRole(role);
    const nextUser = users.find((user) => user.role === role);
    setUserId(nextUser?.id || "");
  }

  function submit() {
    const destination = loginDemo(selectedUser);
    router.push(destination);
  }

  return (
    <main className="onco-page min-h-ios-screen px-5 py-8 sm:py-12">
      <section className="mx-auto w-full max-w-[760px]">
        <Link className="mb-8 inline-flex items-center text-sm font-semibold text-onco-sage" href="/">
          Back to OncoMotionRx
        </Link>
        <p className="text-[13px] font-black uppercase tracking-[0.22em] text-onco-terracotta">
          Welcome back
        </p>
        <h1 className="onco-display mt-5 text-4xl font-extrabold text-onco-ink sm:text-5xl">
          Sign in to OncoMotionRx
        </h1>
        <p className="mt-4 text-lg font-medium leading-7 text-onco-muted">
          Choose your role and continue to your workspace.
        </p>

        <div className="mt-10 rounded-onco-lg border border-onco-line bg-white p-5 shadow-onco sm:p-8">
          <RoleSelector selectedRole={selectedRole} onSelect={updateRole} roles={roleOptions} />

          <div className="mt-5 rounded-2xl border border-onco-line bg-onco-cream px-4 py-4 text-sm font-semibold text-onco-muted">
            {roleNames[selectedRole]} demo access uses local state only. Backend persistence will be connected in the Supabase phase.
          </div>

          <div className="mt-7 grid gap-5">
            <Select
              label="Use demo account"
              value={selectedUser?.id || ""}
              options={demoUsers.map((user) => ({ label: `${user.name} · ${user.title}`, value: user.id }))}
              onChange={setUserId}
            />
            <label>
              <span className="mb-2 block text-[13px] font-black uppercase tracking-[0.18em] text-onco-muted-light">
                Email address
              </span>
              <input
                className="onco-input min-h-[56px]"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
              />
            </label>
            <label>
              <span className="mb-2 block text-[13px] font-black uppercase tracking-[0.18em] text-onco-muted-light">
                Password
              </span>
              <input
                className="onco-input min-h-[56px]"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Demo password"
              />
            </label>
          </div>

          <div className="mt-4 flex justify-end">
            <button className="text-sm font-semibold text-onco-sage" type="button" onClick={() => setPassword("recovery")}>
              Use demo password
            </button>
          </div>

          <Button className="mt-8 min-h-[58px] w-full text-base" onClick={submit}>
            Sign in
            <span aria-hidden="true">-&gt;</span>
          </Button>
          <p className="mt-6 text-center text-sm font-semibold text-onco-muted-light">
            Secure demo · Role-based access · Backend not connected yet
          </p>
        </div>
      </section>
    </main>
  );
}
