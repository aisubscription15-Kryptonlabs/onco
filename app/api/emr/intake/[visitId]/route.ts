//app/api/emr/intake/[visitId]/route.ts
import { NextResponse } from "next/server";
import { emrIntakeUpdateSchema, firstZodError } from "@/lib/emr-validation";
import { getOptionalMember } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Patient, Visit } from "@/types/db";
 
export const runtime = "nodejs";
 
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ visitId: string }> },
) {
  try {
    const { visitId } = await params;
    if (!visitId) {
      return NextResponse.json({ error: "Missing visit id" }, { status: 400 });
    }
 
    const context = await getOptionalMember();
    if (!context?.member) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const member = context.member;
    const clinicId = member.clinic_id;
    const role = member.role;

    if (!clinicId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
 
    const parsed = emrIntakeUpdateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: firstZodError(parsed.error) }, { status: 400 });
    }
    const body = parsed.data;
 
    const admin = supabaseAdmin();
    const [{ data: patient }, { data: visit }] = await Promise.all([
      admin.from("patients").select("id, clinic_id").eq("id", body.patientId).maybeSingle(),
      admin
        .from("visits")
        .select("id, patient_id, clinic_id, doctor_id, created_by")
        .eq("id", visitId)
        .maybeSingle(),
    ]);
 
    if (!patient || !visit) {
      return NextResponse.json({ error: "Patient or visit not found" }, { status: 404 });
    }
 
    const p = patient as Pick<Patient, "id" | "clinic_id">;
    const v = visit as Pick<Visit, "id" | "patient_id" | "clinic_id" | "doctor_id" | "created_by">;
    if (p.clinic_id !== clinicId || v.clinic_id !== clinicId || v.patient_id !== p.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: existingAssignment } =
      role === "doctor"
        ? await admin
            .from("visit_doctors")
            .select("visit_id")
            .eq("visit_id", visitId)
            .eq("doctor_id", member.id)
            .maybeSingle()
        : { data: null };

    const canUpdate =
      role === "medical_assistant" ||
      role === "admin" ||
      (role === "doctor" &&
        (v.doctor_id === member.id || v.created_by === member.id || Boolean(existingAssignment)));

    if (!canUpdate) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
 
    const assignments = body.assignments;
 
    const doctorIds = assignments.map((assignment) => assignment.doctor_id);
    const { data: clinicDoctors, error: doctorError } = await admin
      .from("doctors")
      .select("id")
      .eq("clinic_id", clinicId)
      .in("id", doctorIds);
 
    if (doctorError) {
      return NextResponse.json({ error: doctorError.message }, { status: 500 });
    }
    if (((clinicDoctors as Array<{ id: string }> | null) || []).length !== doctorIds.length) {
      return NextResponse.json({ error: "One or more assigned doctors are invalid" }, { status: 400 });
    }
 
    const patientUpdate = body.patient;
    const visitUpdate = {
      ...body.visit,
      doctor_id: assignments[0].doctor_id,
    };
 
    const { error: patientError } = await admin
      .from("patients")
      .update(patientUpdate as never)
      .eq("id", p.id)
      .eq("clinic_id", clinicId);
    if (patientError) {
      return NextResponse.json({ error: patientError.message }, { status: 500 });
    }
 
    const { error: visitError } = await admin
      .from("visits")
      .update(visitUpdate as never)
      .eq("id", v.id)
      .eq("clinic_id", clinicId);
    if (visitError) {
      return NextResponse.json({ error: visitError.message }, { status: 500 });
    }
 
    const { error: deleteError } = await admin
      .from("visit_doctors")
      .delete()
      .eq("visit_id", v.id);
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }
 
    const { error: assignmentError } = await admin.from("visit_doctors").insert(
      assignments.map((assignment) => ({
        visit_id: v.id,
        doctor_id: assignment.doctor_id,
        role: assignment.role,
      })) as never,
    );
    if (assignmentError) {
      return NextResponse.json({ error: assignmentError.message }, { status: 500 });
    }
 
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Could not save intake";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
 
 
