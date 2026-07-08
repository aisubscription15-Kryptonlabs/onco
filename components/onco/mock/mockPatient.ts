import type { OncoPatient, OncoPrescription, OncoProgress } from "@/types/onco";

export const mockPatient: OncoPatient = {
  name: "Sam Rivera",
  cancerType: "Colon cancer",
  treatmentStatus: "Finished treatment",
  barriers: ["fatigue", "neuropathy", "bathroom access", "fear of overdoing it"],
  goal: "Rebuild stamina for gardening and errands without feeling wiped out.",
};

export const mockPrescription: OncoPrescription = {
  activity: "Walk",
  durationMinutes: 10,
  daysPerWeek: 3,
  intensity: "Easy-to-moderate",
  weeklyMetHours: 2,
};

export const mockProgress: OncoProgress = {
  minutesCompleted: 10,
  minutesGoal: 30,
  metHoursCompleted: 0.7,
  metHoursGoal: 2,
  adherence: 67,
  activeDays: 9,
};

export const sessionList = [
  { id: 1, title: "Meet Artie", detail: "Your plan and baseline", state: "complete" },
  { id: 2, title: "Safety + hydration", detail: "What to wear · Completed June 6", state: "complete" },
  { id: 3, title: "Goal setting", detail: "~8 minutes · Due Friday", state: "current" },
  { id: 4, title: "Fatigue planning", detail: "Short loops and backup days", state: "locked" },
] as const;

