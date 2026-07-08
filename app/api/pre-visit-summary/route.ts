import { NextResponse } from "next/server";
import { getOptionalMember } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { generatePreVisitSummary } from "@/lib/claude/summary";
import { recordUsage, modelToService } from "@/lib/usage";
import type { GraphicPainMap, Immunization, Patient, Visit } from "@/types/db";

export const runtime = "nodejs";
export const maxDuration = 60;

const pendingSummaries = new Map<string, Promise<{ summary: string; model: string }>>();

export async function POST(req: Request) {
  try {
    const sb = await supabaseServer();
    const context = await getOptionalMember();
    if (!context?.member) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const memberId = context.member.id;

    const body = (await req.json()) as { visitId?: string; force?: boolean };
    const visitId = body?.visitId;
    if (!visitId) {
      return NextResponse.json({ error: "Missing visitId" }, { status: 400 });
    }

    const { data: visit } = await sb
      .from("visits")
      .select("*")
      .eq("id", visitId)
      .maybeSingle();
    if (!visit) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }
    const v = visit as Visit;

    // Skip if a summary already exists and the caller didn't force a refresh.
    if (!body.force && v.pre_visit_summary && v.pre_visit_summary.length > 0) {
      return NextResponse.json({
        ok: true,
        cached: true,
        summary: v.pre_visit_summary,
      });
    }

    if (!body.force) {
      const pending = pendingSummaries.get(visitId);
      if (pending) {
        const result = await pending;
        return NextResponse.json({
          ok: true,
          cached: true,
          inFlight: true,
          summary: result.summary,
          model: result.model,
        });
      }
    }

    const { data: patient } = await sb
      .from("patients")
      .select("*")
      .eq("id", v.patient_id)
      .maybeSingle();
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Most recent 2 prior visits (across any doctor in the clinic — RLS handles scope).
    const { data: pastRows } = await sb
      .from("visits")
      .select("*")
      .eq("patient_id", v.patient_id)
      .lt("visit_date", v.visit_date)
      .order("visit_date", { ascending: false })
      .limit(2);
    const pastVisits = ((pastRows as Visit[]) || []).slice(0, 2);

    const { data: immunizationRows } = await sb
      .from("immunizations")
      .select("*")
      .eq("patient_id", v.patient_id)
      .eq("clinic_id", v.clinic_id)
      .order("date_given", { ascending: false })
      .limit(6);

    const { data: painMapRows } = await sb
      .from("graphic_pain_maps")
      .select("id, clinic_id, patient_id, visit_id, created_by, pain_type, intensity, pain_locations, marked_points, pain_summary, markers, created_at")
      .eq("visit_id", v.id)
      .eq("patient_id", v.patient_id)
      .eq("clinic_id", v.clinic_id)
      .order("created_at", { ascending: false })
      .limit(3);

    const summaryPromise = (async () => {
      const { summary, raw, modelUsed, usage } = await generatePreVisitSummary({
        patient: patient as Patient,
        visit: v,
        pastVisits,
        immunizations: (immunizationRows || []) as Immunization[],
        painMaps: (painMapRows || []) as GraphicPainMap[],
      });

      try {
        const service = modelToService(modelUsed);
        if (service && service !== "sarvam_stt") {
          await recordUsage({
            clinicId: v.clinic_id || (patient as Patient).clinic_id || "",
            userId: memberId,
            visitId: v.id,
            service,
            operation: "pre_visit_summary",
            claudeUsage: usage,
            metadata: { model: modelUsed },
          });
        }
      } catch (e) {
        console.error("[pre-visit-summary] usage log failed", e);
      }

      const admin = supabaseAdmin();
      const update: Record<string, unknown> = {
        pre_visit_summary: summary,
        pre_visit_summary_generated_at: new Date().toISOString(),
      };
      const { error } = await admin
        .from("visits")
        .update(update as never)
        .eq("id", visitId);
      if (error) {
        throw new Error(error.message);
      }

      return {
        summary,
        raw,
        model: modelUsed,
      };
    })();

    if (!body.force) {
      pendingSummaries.set(visitId, summaryPromise.then((result) => ({
        summary: result.summary,
        model: result.model,
      })));
    }

    const { summary, raw, model } = await summaryPromise.finally(() => {
      if (!body.force) pendingSummaries.delete(visitId);
    });

    return NextResponse.json({
      ok: true,
      cached: false,
      summary,
      model,
      raw_meta: typeof raw === "object" && raw && "id" in (raw as object) ? { id: (raw as { id: string }).id } : null,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
