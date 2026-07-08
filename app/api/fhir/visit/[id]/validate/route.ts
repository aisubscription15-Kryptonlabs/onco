import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { buildOpConsultBundle } from "@/lib/fhir/bundle";
import type { Doctor, Immunization, Patient, PatientAllergy, Visit } from "@/types/db";

export const runtime = "nodejs";

const VALIDATOR_URL = process.env.FHIR_VALIDATOR_URL ?? "http://localhost:8080";

type ValidatorIssue = {
  level: "ERROR" | "WARNING" | "INFORMATION" | "FATAL";
  message: string;
  location?: string;
  line?: number;
  col?: number;
};

type ValidationStatus = "passed" | "warning" | "failed";

function deriveStatus(issues: ValidatorIssue[]): ValidationStatus {
  if (issues.some((i) => i.level === "ERROR" || i.level === "FATAL")) return "failed";
  if (issues.some((i) => i.level === "WARNING")) return "warning";
  return "passed";
}

// POST /api/fhir/visit/[id]/validate
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: visitId } = await params;
    if (!visitId) {
      return NextResponse.json({ error: "Missing visit id" }, { status: 400 });
    }

    const sb = await supabaseServer();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch visit (RLS ensures only clinic members can see it)
    const { data: visit } = await sb
      .from("visits")
      .select("*")
      .eq("id", visitId)
      .maybeSingle();
    if (!visit) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }
    const v = visit as Visit;

    // Fetch all related data in parallel; immunizations are full patient history
    const [
      { data: patient },
      { data: doctor },
      { data: allergyRows },
      { data: immunizationRows },
    ] = await Promise.all([
      sb.from("patients").select("*").eq("id", v.patient_id).maybeSingle(),
      sb.from("doctors").select("*").eq("id", v.doctor_id).maybeSingle(),
      sb.from("patient_allergies").select("*").eq("patient_id", v.patient_id),
      sb.from("immunizations").select("*").eq("patient_id", v.patient_id).order("date_given", { ascending: false }),
    ]);

    if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    if (!doctor) return NextResponse.json({ error: "Doctor not found" }, { status: 404 });

    const bundle = buildOpConsultBundle({
      patient: patient as Patient,
      visit: v,
      doctor: doctor as Doctor,
      allergies: (allergyRows as PatientAllergy[]) ?? [],
      immunizations: (immunizationRows as Immunization[]) ?? [],
    });

    const bundleJson = JSON.stringify(bundle);

    // Send to HL7 FHIR Validator Wrapper (Docker, localhost:8080)
    let issues: ValidatorIssue[] = [];
    let validatorReachable = true;

    try {
      const payload = {
        cliContext: { sv: "4.0.1" },
        filesToValidate: [
          {
            fileName: "bundle.json",
            fileContent: Buffer.from(bundleJson).toString("base64"),
            fileType: "json",
          },
        ],
      };

      const validatorRes = await fetch(`${VALIDATOR_URL}/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(60_000),
      });

      if (!validatorRes.ok) {
        const text = await validatorRes.text().catch(() => "");
        throw new Error(`Validator returned ${validatorRes.status}: ${text}`);
      }

      const result = (await validatorRes.json()) as {
        outcomes?: Array<{ issues?: ValidatorIssue[] }>;
      };

      issues = result.outcomes?.flatMap((o) => o.issues ?? []) ?? [];
    } catch (err: unknown) {
      validatorReachable = false;
      const msg = err instanceof Error ? err.message : "Validator unreachable";
      return NextResponse.json(
        { error: `FHIR validator is not reachable. Start the Docker container and try again. (${msg})` },
        { status: 503 },
      );
    }

    if (!validatorReachable) {
      return NextResponse.json({ error: "Validator unreachable" }, { status: 503 });
    }

    const errors = issues.filter((i) => i.level === "ERROR" || i.level === "FATAL");
    const warnings = issues.filter((i) => i.level === "WARNING");
    const info = issues.filter((i) => i.level === "INFORMATION");
    const status = deriveStatus(issues);

    // Persist result via admin client (bypass RLS for insert)
    const admin = supabaseAdmin();
    const { data: saved, error: dbError } = await admin
      .from("fhir_validation_results")
      .insert({
        clinic_id: v.clinic_id,
        patient_id: v.patient_id,
        visit_id: v.id,
        actor_id: user.id,
        bundle_profile: "OPConsultRecord",
        status,
        validator: "hl7-fhir-validator",
        errors,
        warnings,
      } as never)
      .select("id")
      .single();

    if (dbError) {
      console.error("[fhir/validate] db insert failed", dbError.message);
    }

    return NextResponse.json({
      status,
      resultId: (saved as { id: string } | null)?.id ?? null,
      counts: { errors: errors.length, warnings: warnings.length, info: info.length },
      errors,
      warnings,
      info,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
