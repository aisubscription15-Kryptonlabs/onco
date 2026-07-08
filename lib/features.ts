import { NextResponse } from "next/server";

export const FEATURE_KEYS = [
  "pharmacy",
  "patient_portal",
  "fhir_export",
  "ai_extraction",
  "pre_visit_summary",
  "fax",
  "multilingual",
  "immunizations",
  "referrals",
] as const;

export type FeatureKey = (typeof FEATURE_KEYS)[number];
export type ClinicFeatureFlags = Record<FeatureKey, boolean>;

const DEFAULT_FLAGS: ClinicFeatureFlags = {
  pharmacy: true,
  patient_portal: false,
  fhir_export: false,
  ai_extraction: true,
  pre_visit_summary: false,
  fax: false,
  multilingual: true,
  immunizations: false,
  referrals: false,
};

export async function getClinicFeatureFlags(clinicId: string): Promise<ClinicFeatureFlags> {
  return { ...DEFAULT_FLAGS };
}

export function isFeatureEnabled(flags: Partial<Record<FeatureKey, boolean>> | null | undefined, key: FeatureKey) {
  return flags?.[key] !== false;
}

export async function isClinicFeatureEnabled(clinicId: string, key: FeatureKey) {
  const flags = await getClinicFeatureFlags(clinicId);
  return isFeatureEnabled(flags, key);
}

export function featureDisabledResponse(featureName: string) {
  return NextResponse.json(
    {
      error: `${featureName} is not enabled for this clinic. Contact your app provider.`,
    },
    { status: 403 },
  );
}
