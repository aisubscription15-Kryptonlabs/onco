import { NextResponse } from "next/server";
import { logProviderAudit } from "@/lib/provider/audit";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

const STAFF_ROLES = new Set(["admin"]);

type StaffBody = {
  email?: string;
  fullName?: string;
  role?: string;
  password?: string;
  qualification?: string;
  registrationNumber?: string;
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

async function findAuthUserByEmail(admin: ReturnType<typeof supabaseAdmin>, email: string) {
  let page = 1;

  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(error.message);

    const found = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (found) return found;
    if (data.users.length < 1000) break;
    page += 1;
  }

  return null;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const guard = await requireProviderManager();
    if ("error" in guard) return NextResponse.json({ error: guard.error }, { status: guard.status });

    const { id: clinicId } = await params;
    const body = (await req.json().catch(() => ({}))) as StaffBody;
    const email = (body.email || "").trim().toLowerCase();
    const fullName = (body.fullName || "").trim();
    const role = (body.role || "").trim();
    const password = body.password || "";
    const qualification = (body.qualification || "").trim();
    const registrationNumber = (body.registrationNumber || "").trim();

    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });
    if (!fullName) return NextResponse.json({ error: "Full name is required" }, { status: 400 });
    if (!STAFF_ROLES.has(role)) {
      return NextResponse.json({ error: "Role must be Hospital Admin" }, { status: 400 });
    }
    if (password && password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const admin = guard.admin;
    const { data: clinic, error: clinicErr } = await admin
      .from("clinics")
      .select("id,name")
      .eq("id", clinicId)
      .maybeSingle();

    if (clinicErr) return NextResponse.json({ error: clinicErr.message }, { status: 500 });
    if (!clinic) return NextResponse.json({ error: "Clinic not found" }, { status: 404 });

    const existingAuthUser = await findAuthUserByEmail(admin, email);
    let authUserId = existingAuthUser?.id || null;
    let createdAuthUser = false;

    if (authUserId && password) {
      const { error } = await admin.auth.admin.updateUserById(authUserId, {
        password,
        user_metadata: {
          ...(existingAuthUser?.user_metadata || {}),
          full_name: fullName,
        },
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!authUserId) {
      if (password) {
        const { data, error } = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: fullName },
        });
        if (error || !data.user) {
          return NextResponse.json({ error: error?.message || "Could not create auth user" }, { status: 500 });
        }
        authUserId = data.user.id;
        createdAuthUser = true;
      } else {
        const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
          data: { full_name: fullName },
        });
        if (error || !data.user) {
          return NextResponse.json({ error: error?.message || "Could not invite user" }, { status: 500 });
        }
        authUserId = data.user.id;
        createdAuthUser = true;
      }
    }

    const { data: existingStaff, error: existingErr } = await admin
      .from("doctors")
      .select("id")
      .eq("clinic_id", clinicId)
      .eq("role", role)
      .ilike("email", email)
      .maybeSingle();

    if (existingErr) return NextResponse.json({ error: existingErr.message }, { status: 500 });

    const payload = {
      auth_user_id: authUserId,
      email,
      full_name: fullName,
      role,
      clinic_id: clinicId,
      clinic_name: (clinic as { name: string }).name,
      qualification: qualification || null,
      registration_number: registrationNumber || null,
      preferred_language: "en",
      status: "active",
    };

    const query = existingStaff
      ? admin.from("doctors").update(payload as never).eq("id", (existingStaff as { id: string }).id)
      : admin.from("doctors").insert(payload as never);

    const { data: member, error: memberErr } = await query
      .select("id,auth_user_id,email,full_name,role,status,created_at")
      .single();

    if (memberErr) {
      if (createdAuthUser && authUserId) await admin.auth.admin.deleteUser(authUserId).catch(() => {});
      return NextResponse.json({ error: memberErr.message }, { status: 500 });
    }

    await logProviderAudit({
      actorId: guard.userId,
      action: existingStaff ? "clinic_admin_reactivated" : "clinic_admin_created",
      entityType: "doctor",
      entityId: (member as { id?: string }).id || email,
      metadata: { clinicId, email, fullName, role },
    });

    return NextResponse.json({ ok: true, member, already_existed: Boolean(existingStaff) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
