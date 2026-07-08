"use client";

import type { DemoRole } from "@/lib/onco/demo/demo-types";
import { RoleLoginCard, type LoginRole } from "./RoleLoginCard";

export const loginRoles: LoginRole[] = [
  { role: "patient", short: "PT", label: "Patient", description: "Daily prescription" },
  { role: "doctor", short: "DR", label: "Doctor", description: "Clinical review" },
  { role: "care-team", short: "RN", label: "Care Team", description: "Alerts & support" },
  { role: "admin", short: "AD", label: "Site Admin", description: "Site operations" },
  { role: "app-provider", short: "AP", label: "App Provider", description: "Platform oversight" },
];

export function RoleSelector({
  selectedRole,
  onSelect,
  roles = loginRoles,
}: {
  selectedRole: DemoRole;
  onSelect: (role: DemoRole) => void;
  roles?: LoginRole[];
}) {
  return (
    <div>
      <p className="mb-4 text-[13px] font-black uppercase tracking-[0.18em] text-onco-muted-light">
        Your role
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => (
          <RoleLoginCard
            key={role.role}
            role={role}
            selected={role.role === selectedRole}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}

