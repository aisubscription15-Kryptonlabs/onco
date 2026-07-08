"use client";

import { demoStore } from "./demo-store";
import type { DemoRole, DemoUser } from "./demo-types";

export const roleDestinations: Record<DemoRole, string> = {
  patient: "/onboarding",
  doctor: "/doctor",
  "care-team": "/doctor",
  admin: "/admin",
  "app-provider": "/app-provider",
};

export function loginDemo(user: DemoUser) {
  demoStore.login(user.role, user.id);
  demoStore.toast(`Signed in as ${user.name}`);
  return roleDestinations[user.role];
}

export function logoutDemo() {
  demoStore.logout();
  demoStore.toast("Logged out of demo.");
}

export function switchDemoRole(user: DemoUser) {
  demoStore.login(user.role, user.id);
  demoStore.toast(`Switched to ${user.title}`);
  return roleDestinations[user.role];
}

export function resetDemo() {
  demoStore.reset();
}
