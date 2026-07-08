import { NextResponse } from "next/server";
import { logProviderAudit } from "@/lib/provider/audit";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Body = {
  status?: string;
};

async function requireProviderManager() {
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) return { error: "Unauthorized", status: 401 } as const;

  const admin = supabaseAdmin();
  const { data: caller } = await admin
    .from("platform_admins")
    .select("role,status")
    .eq("auth_user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  const ownerEmails = (process.env.PLATFORM_OWNER_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  const isOwnerByEnv = ownerEmails.includes((user.email || "").toLowerCase());
  const role = (caller as { role?: string } | null)?.role;

  if (!caller && !isOwnerByEnv) return { error: "Forbidden", status: 403 } as const;
  if (!isOwnerByEnv && role !== "platform_owner" && role !== "platform_admin") {
    return { error: "Only App Provider admins can manage hospital admin access", status: 403 } as const;
  }

  return { userId: user.id, admin } as const;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; staffId: string }> },
) {
  try {
    const guard = await requireProviderManager();
    if ("error" in guard) return NextResponse.json({ error: guard.error }, { status: guard.status });

    const { id: clinicId, staffId } = await params;
    const body = (await req.json().catch(() => ({}))) as Body;
    const status = body.status;

    if (status !== "active" && status !== "inactive") {
      return NextResponse.json({ error: "Status must be active or inactive" }, { status: 400 });
    }

    const { data: target, error: targetErr } = await guard.admin
      .from("doctors")
      .select("id,role,clinic_id,status")
      .eq("id", staffId)
      .eq("clinic_id", clinicId)
      .maybeSingle();

    if (targetErr) return NextResponse.json({ error: targetErr.message }, { status: 500 });
    if (!target) return NextResponse.json({ error: "Staff member not found" }, { status: 404 });

    const role = (target as { role?: string }).role;
    if (role !== "admin") {
      return NextResponse.json({ error: "Only Hospital Admin access can be managed here" }, { status: 400 });
    }

    const { error } = await guard.admin
      .from("doctors")
      .update({ status } as never)
      .eq("id", staffId)
      .eq("clinic_id", clinicId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await logProviderAudit({
      actorId: guard.userId,
      action: status === "active" ? "clinic_admin_activated" : "clinic_admin_deactivated",
      entityType: "doctor",
      entityId: staffId,
      metadata: { clinicId, status },
    });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
