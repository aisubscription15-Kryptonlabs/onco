import { NextResponse } from "next/server";
import { getOptionalMember } from "@/lib/auth";
import { serverEnv } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";
import type { Visit } from "@/types/db";

export const runtime = "nodejs";
export const maxDuration = 120;

const ACCEPTED_AUDIO_EXTENSIONS = ["mp3", "wav", "m4a", "mp4", "webm", "ogg"];
const ACCEPTED_AUDIO_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/mp4",
  "audio/m4a",
  "audio/webm",
  "audio/ogg",
];

export async function POST(req: Request) {
  try {
    const sb = await supabaseServer();
    const context = await getOptionalMember();
    if (!context?.member) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const memberId = context.member.id;

    const form = await req.formData();
    const visitId = String(form.get("visitId") || "");
    const audio = form.get("audio");
    const doctorNotes = String(form.get("doctorNotes") || "").trim();

    if (!visitId) {
      return NextResponse.json({ error: "Missing visitId" }, { status: 400 });
    }
    if (!(audio instanceof File)) {
      return NextResponse.json({ error: "Missing audio file" }, { status: 400 });
    }
    if (!isAcceptedAudio(audio)) {
      return NextResponse.json(
        { error: "Please upload an MP3, WAV, M4A, WEBM, or OGG audio file." },
        { status: 400 },
      );
    }

    const { data: visit } = await sb
      .from("visits")
      .select("id, doctor_id")
      .eq("id", visitId)
      .single();
    if (!visit) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }

    if ((visit as Pick<Visit, "doctor_id">).doctor_id !== memberId) {
      const { data: assignment } = await sb
        .from("visit_doctors")
        .select("visit_id")
        .eq("visit_id", visitId)
        .eq("doctor_id", memberId)
        .maybeSingle();

      if (!assignment) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const contentType = normalizeAudioType(audio.type);
    const ext = audioExtension(contentType, audio.name);
    const path = `${memberId}/${visitId}.${ext}`;
    const bytes = Buffer.from(await audio.arrayBuffer());
    const admin = supabaseAdmin();

    const { error: uploadError } = await admin.storage
      .from(serverEnv.supabaseAudioBucket)
      .upload(path, bytes, {
        contentType,
        upsert: true,
      });
    if (uploadError) {
      console.error("[visit-audio] Supabase storage upload failed", {
        bucket: serverEnv.supabaseAudioBucket,
        path,
        message: uploadError.message,
      });
      return NextResponse.json(
        { error: `Supabase audio upload failed: ${uploadError.message}` },
        { status: 500 },
      );
    }

    const { error: updateError } = await admin
      .from("visits")
      .update({
        audio_url: path,
        doctor_notes: doctorNotes || null,
      } as never)
      .eq("id", visitId);
    if (updateError) {
      console.error("[visit-audio] visit update failed", updateError.message);
      return NextResponse.json(
        { error: `Audio uploaded, but visit update failed: ${updateError.message}` },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, audioUrl: path });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[visit-audio] unexpected failure", err);
    return NextResponse.json({ error: `Audio upload failed: ${msg}` }, { status: 500 });
  }
}

function audioExtension(mimeType: string, filename?: string) {
  const fromName = filename?.split(".").pop()?.toLowerCase();
  if (fromName && ACCEPTED_AUDIO_EXTENSIONS.includes(fromName)) {
    return fromName === "mp4" ? "m4a" : fromName;
  }
  if (mimeType.includes("mpeg") || mimeType.includes("mp3")) return "mp3";
  if (mimeType.includes("wav")) return "wav";
  if (mimeType.includes("ogg")) return "ogg";
  if (mimeType.includes("mp4") || mimeType.includes("m4a")) return "m4a";
  return "webm";
}

function isAcceptedAudio(file: File) {
  const contentType = normalizeAudioType(file.type);
  if (contentType && ACCEPTED_AUDIO_TYPES.includes(contentType)) return true;
  const ext = file.name.split(".").pop()?.toLowerCase();
  return !!ext && ACCEPTED_AUDIO_EXTENSIONS.includes(ext);
}

function normalizeAudioType(mimeType: string) {
  const baseType = mimeType.split(";")[0]?.trim().toLowerCase();
  if (baseType === "audio/m4a") return "audio/x-m4a";
  return baseType || "audio/webm";
}
