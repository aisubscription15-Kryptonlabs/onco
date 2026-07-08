import { NextResponse } from "next/server";
import { getOptionalMember } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Prescription, Visit } from "@/types/db";

export const runtime = "nodejs";

type EnsureVisitBody = {
  patientId?: string;
  visitId?: string | null;
  doctorNotes?: string | null;
  prescription?: Prescription | null;
};

export async function POST(req: Request) {
  try {
    const context = await getOptionalMember();
    if (!context?.member || !context.clinic) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as EnsureVisitBody;
    const patientId = body.patientId;
    if (!patientId) {
      return NextResponse.json({ error: "Missing patientId" }, { status: 400 });
    }

    const admin = supabaseAdmin();
    const memberId = context.member.id;
    const clinicId = context.clinic.id;
    const doctorNotes = body.doctorNotes?.trim() || null;

    const { data: patient } = await admin
      .from("patients")
      .select("id, clinic_id")
      .eq("id", patientId)
      .eq("clinic_id", clinicId)
      .maybeSingle();
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    if (body.visitId) {
      const visit = await loadAccessibleVisit(admin, body.visitId, memberId, clinicId);
      if (!visit || visit.patient_id !== patientId) {
        return NextResponse.json({ error: "Visit not found" }, { status: 404 });
      }

      const update: Record<string, unknown> = {};
      if (doctorNotes !== null) update.doctor_notes = doctorNotes;
      if (body.prescription) update.prescription = body.prescription;
      if (Object.keys(update).length > 0) {
        const { error } = await admin
          .from("visits")
          .update(update as never)
          .eq("id", visit.id);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ ok: true, visitId: visit.id });
    }

    const insert: Record<string, unknown> = {
      patient_id: patientId,
      doctor_id: memberId,
      created_by: memberId,
      clinic_id: clinicId,
      visit_date: new Date().toISOString(),
      doctor_notes: doctorNotes,
    };
    if (body.prescription) insert.prescription = body.prescription;

    const { data: created, error: createError } = await admin
      .from("visits")
      .insert(insert as never)
      .select("id")
      .single();
    if (createError || !created) {
      return NextResponse.json(
        { error: createError?.message || "Could not create visit" },
        { status: 500 },
      );
    }

    const visitId = (created as { id: string }).id;
    const { error: assignError } = await admin
      .from("visit_doctors")
      .upsert(
        {
          visit_id: visitId,
          doctor_id: memberId,
          role: "attending",
        } as never,
        { onConflict: "visit_id,doctor_id" },
      );
    if (assignError) {
      return NextResponse.json({ error: assignError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, visitId });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

async function loadAccessibleVisit(
  admin: ReturnType<typeof supabaseAdmin>,
  visitId: string,
  memberId: string,
  clinicId: string,
) {
  const { data: visit } = await admin
    .from("visits")
    .select("id, patient_id, doctor_id, clinic_id")
    .eq("id", visitId)
    .eq("clinic_id", clinicId)
    .maybeSingle();
  if (!visit) return null;

  const typedVisit = visit as Pick<Visit, "id" | "patient_id" | "doctor_id" | "clinic_id">;
  if (typedVisit.doctor_id === memberId) return typedVisit;

  const { data: assignment } = await admin
    .from("visit_doctors")
    .select("visit_id")
    .eq("visit_id", visitId)
    .eq("doctor_id", memberId)
    .maybeSingle();

  return assignment ? typedVisit : null;
}
