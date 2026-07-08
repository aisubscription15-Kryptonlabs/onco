import type { ReactNode } from "react";

export type OncoBarrier =
  | "fatigue"
  | "neuropathy"
  | "bathroom access"
  | "fear of overdoing it";

export type PatientTab = "today" | "prescription" | "sessions" | "progress" | "artie";

export type OncoPatient = {
  name: string;
  cancerType: string;
  treatmentStatus: string;
  barriers: OncoBarrier[];
  goal: string;
};

export type OncoPrescription = {
  activity: string;
  durationMinutes: number;
  daysPerWeek: number;
  intensity: string;
  weeklyMetHours: number;
};

export type OncoProgress = {
  minutesCompleted: number;
  minutesGoal: number;
  metHoursCompleted: number;
  metHoursGoal: number;
  adherence: number;
  activeDays: number;
};

export type BottomNavItem = {
  label: string;
  href: string;
  tab: PatientTab;
  icon: ReactNode;
};

