import type { OnboardingAnswers } from "./demo-types";

type BaselineInput = Pick<OnboardingAnswers, "weeklyWalkingMinutes" | "walkingPace" | "weeklyOtherActivityMinutes" | "baselineIntensity">;

const walkingPaceMet: Record<OnboardingAnswers["walkingPace"], number> = {
  "Slow/easy": 2,
  Normal: 2.8,
  "Brisk/moderate": 3.5,
};

const otherActivityMet: Record<OnboardingAnswers["baselineIntensity"], number> = {
  "Mostly light": 2.3,
  "Some moderate": 3.3,
  "Hard exercise sometimes": 4,
};

export function estimateBaselineMetHours(answers: BaselineInput) {
  const walkingMinutes = Number(answers.weeklyWalkingMinutes) || 0;
  const otherMinutes = Number(answers.weeklyOtherActivityMinutes) || 0;
  const walkingMet = walkingPaceMet[answers.walkingPace || "Normal"];
  const otherMet = otherActivityMet[answers.baselineIntensity] || otherActivityMet["Mostly light"];
  return Number((((walkingMinutes * walkingMet) + (otherMinutes * otherMet)) / 60).toFixed(2));
}

export function normalizeWeeklyPrescriptionMet(rawMetHours: number, baselineMetHours: number) {
  const raw = Number(rawMetHours) || 0;
  const baseline = Number(baselineMetHours) || 0;
  return Number(Math.max(raw, baseline).toFixed(2));
}

export function formatMetHours(value: number) {
  const normalized = Number(value) || 0;
  return normalized.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
}

export function formatMetHoursPerWeek(value: number) {
  return `${formatMetHours(value)} MET-hours/week`;
}

export function formatMetHoursPerActiveDay(weeklyValue: number, daysPerWeek: number) {
  const days = Math.max(Number(daysPerWeek) || 1, 1);
  return `${formatMetHours((Number(weeklyValue) || 0) / days)} MET-hours/active day`;
}

export function formatMetHoursEarned(value: number) {
  return `${formatMetHours(value)} MET-hours earned`;
}
