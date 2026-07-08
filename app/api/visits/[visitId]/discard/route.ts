import { NextResponse } from "next/server";
import { getOptionalMember } from "@/lib/auth";
import { serverEnv } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Visit } from "@/types/db";

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ visitId: string }> },
) {
  try {
    const context = await getOptionalMember();
    if (!context?.member || !context.clinic) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { visitId } = await params;
    if (!visitId) {
      return NextResponse.json({ error: "Missing visit id" }, { status: 400 });
    }

    const admin = supabaseAdmin();
    const { data: visit, error: loadError } = await admin
      .from("visits")
      .select("id, clinic_id, created_by, status, completed_at, audio_url")
      .eq("id", visitId)
      .eq("clinic_id", context.clinic.id)
      .maybeSingle();

    if (loadError) {
      return NextResponse.json({ error: loadError.message }, { status: 500 });
    }
    if (!visit) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }

    const draft = visit as Pick<
      Visit,
      "id" | "clinic_id" | "created_by" | "status" | "completed_at" | "audio_url"
    >;
    if (
      draft.created_by !== context.member.id ||
      draft.status === "completed" ||
      draft.completed_at
    ) {
      return NextResponse.json({ error: "Visit cannot be discarded" }, { status: 409 });
    }

    if (draft.audio_url) {
      await admin.storage.from(serverEnv.supabaseAudioBucket).remove([draft.audio_url]);
    }

    await admin.from("graphic_pain_maps").delete().eq("visit_id", draft.id);
    await admin.from("immunizations").delete().eq("visit_id", draft.id);
    await admin.from("visit_doctors").delete().eq("visit_id", draft.id);

    const { error: deleteError } = await admin
      .from("visits")
      .delete()
      .eq("id", draft.id)
      .eq("clinic_id", context.clinic.id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Could not discard visit";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
