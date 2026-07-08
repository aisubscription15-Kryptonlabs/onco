import { NextResponse } from "next/server";
import { logProviderAudit } from "@/lib/provider/audit";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

type ClinicBody = {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  establishedYear?: string | number;
};

function randomInviteCode() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let value = "";
  for (let i = 0; i < 8; i += 1) value += chars[Math.floor(Math.random() * chars.length)];
  return value;
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

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
    return { error: "Only App Provider admins can create clinics", status: 403 } as const;
  }

  return { userId: user.id, admin } as const;
}

export async function POST(request: Request) {
  try {
    const guard = await requireProviderManager();
    if ("error" in guard) return NextResponse.json({ error: guard.error }, { status: guard.status });

    const body = (await request.json().catch(() => ({}))) as ClinicBody;
    const name = cleanText(body.name);
    const phone = cleanText(body.phone);
    const email = cleanText(body.email).toLowerCase();
    const address = cleanText(body.address);
    const city = cleanText(body.city);
    const state = cleanText(body.state);
    const establishedYear = Number(body.establishedYear || 0);

    if (!name) return NextResponse.json({ error: "Clinic name is required" }, { status: 400 });
    if (!/^\d{10}$/.test(phone)) {
      return NextResponse.json({ error: "Phone must be exactly 10 digits" }, { status: 400 });
    }

    const clinicPayload = {
      name,
      phone: phone || null,
      email: email || null,
      address: address || null,
      city: city || null,
      state: state || null,
      established_year: Number.isInteger(establishedYear) && establishedYear > 1800 ? establishedYear : null,
      invite_code: randomInviteCode(),
    };

    let lastError: string | null = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const payload = attempt === 0 ? clinicPayload : { ...clinicPayload, invite_code: randomInviteCode() };
      const { data, error } = await guard.admin
        .from("clinics")
        .insert(payload as never)
        .select("id,name")
        .single();

      if (!error && data) {
        const clinic = data as { id: string; name: string };
        await logProviderAudit({
          actorId: guard.userId,
          action: "clinic_created",
          entityType: "clinic",
          entityId: clinic.id,
          metadata: { name: clinic.name, city, state },
        });
        return NextResponse.json({ ok: true, clinic });
      }

      lastError = error?.message || "Could not create clinic";
      if (!lastError.toLowerCase().includes("invite_code")) break;
    }

    return NextResponse.json({ error: lastError || "Could not create clinic" }, { status: 500 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Could not create clinic";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
