"use client";

import { demoStore } from "./demo-store";
import type { DemoRole } from "./demo-types";

export function demoLogin(role: DemoRole, userId: string) {
  demoStore.login(role, userId);
  demoStore.toast(`Signed in as ${role.replace("-", " ")}`, "success");
}

export function resetDemoData() {
  demoStore.reset();
}

export function showDemoToast(message: string) {
  demoStore.toast(message, "success");
}

