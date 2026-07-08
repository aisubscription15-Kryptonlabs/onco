import { NextResponse } from "next/server";
import { getOptionalMember } from "@/lib/auth";
import { serverEnv } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";
import type { Visit, VisitAudioSegment } from "@/types/db";

export const runtime = "nodejs";
export const maxDuration = 180;

export async function POST(req: Request) {
  try {
    const sb = await supabaseServer();
    const context = await getOptionalMember();
    if (!context?.member || !context.clinic) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as { visitId?: string; doctorNotes?: string | null };
    const visitId = body.visitId;
    if (!visitId) return NextResponse.json({ error: "Missing visitId" }, { status: 400 });

    const memberId = context.member.id;
    const clinicId = context.clinic.id;
    const { data: visit } = await sb
      .from("visits")
      .select("id, doctor_id, clinic_id")
      .eq("id", visitId)
      .eq("clinic_id", clinicId)
      .single();
    if (!visit) return NextResponse.json({ error: "Visit not found" }, { status: 404 });

    const typedVisit = visit as Pick<Visit, "id" | "doctor_id" | "clinic_id">;
    if (typedVisit.doctor_id !== memberId) {
      const { data: assignment } = await sb
        .from("visit_doctors")
        .select("visit_id")
        .eq("visit_id", visitId)
        .eq("doctor_id", memberId)
        .maybeSingle();
      if (!assignment) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const admin = supabaseAdmin();
    const { data: rows, error: segmentsError } = await admin
      .from("visit_audio_segments")
      .select("*")
      .eq("visit_id", visitId)
      .order("segment_index", { ascending: true });
    if (segmentsError) return NextResponse.json({ error: segmentsError.message }, { status: 500 });

    const segments = (rows || []) as VisitAudioSegment[];
    if (segments.length === 0) {
      return NextResponse.json({ error: "No saved recording segments found" }, { status: 400 });
    }

    const buffers: Buffer[] = [];
    for (const segment of segments) {
      const { data: file, error: downloadError } = await admin.storage
        .from(serverEnv.supabaseAudioBucket)
        .download(segment.audio_url);
      if (downloadError || !file) {
        return NextResponse.json(
          { error: `Could not load segment ${segment.segment_index}` },
          { status: 500 },
        );
      }
      buffers.push(Buffer.from(await file.arrayBuffer()));
    }

    const lastSegment = segments[segments.length - 1];
    const ext = extensionFromPath(lastSegment.audio_url);
    const contentType = lastSegment.mime_type || contentTypeFromExt(ext);
    const mergedPath = `${memberId}/${visitId}/merged-${String(lastSegment.segment_index).padStart(3, "0")}.${ext}`;
    const merged = Buffer.concat(buffers);

    const { error: uploadError } = await admin.storage
      .from(serverEnv.supabaseAudioBucket)
      .upload(mergedPath, merged, { contentType, upsert: true });
    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const update: Record<string, unknown> = {
      audio_url: mergedPath,
      status: "in_progress",
    };
    const doctorNotes = body.doctorNotes?.trim();
    if (doctorNotes) update.doctor_notes = doctorNotes;

    const { error: visitUpdateError } = await admin
      .from("visits")
      .update(update as never)
      .eq("id", visitId);
    if (visitUpdateError) return NextResponse.json({ error: visitUpdateError.message }, { status: 500 });

    await admin
      .from("visit_audio_segments")
      .update({ status: "merged" } as never)
      .eq("visit_id", visitId);

    return NextResponse.json({
      ok: true,
      audioUrl: mergedPath,
      segmentCount: segments.length,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Save session failed: ${msg}` }, { status: 500 });
  }
}

function extensionFromPath(path: string) {
  const ext = path.split(".").pop()?.toLowerCase();
  if (ext === "mp3" || ext === "wav" || ext === "m4a" || ext === "mp4" || ext === "webm" || ext === "ogg") {
    return ext === "mp4" ? "m4a" : ext;
  }
  return "webm";
}

function contentTypeFromExt(ext: string) {
  if (ext === "mp3") return "audio/mpeg";
  if (ext === "wav") return "audio/wav";
  if (ext === "m4a" || ext === "mp4") return "audio/mp4";
  if (ext === "ogg") return "audio/ogg";
  return "audio/webm";
}
