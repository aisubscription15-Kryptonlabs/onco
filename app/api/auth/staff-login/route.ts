import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

const ACTIVE_CLINIC_COOKIE = "active_clinic_id";
const ACTIVE_MEMBER_COOKIE = "active_member_id";
const STAFF_ROLES = new Set(["doctor", "medical_assistant", "admin"]);

type StaffLoginBody = {
  email?: unknown;
  password?: unknown;
  role?: unknown;
};

type ClinicMembership = {
  memberId: string;
  clinicId: string;
  clinicName: string;
  role: string;
};

function cleanEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function setActiveWorkspaceCookies(response: NextResponse, membership: ClinicMembership) {
  response.cookies.set(ACTIVE_CLINIC_COOKIE, membership.clinicId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });
  response.cookies.set(ACTIVE_MEMBER_COOKIE, membership.memberId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as StaffLoginBody;
  const email = cleanEmail(body.email);
  const password = typeof body.password === "string" ? body.password : "";
  const selectedRole = typeof body.role === "string" && STAFF_ROLES.has(body.role) ? body.role : "";

  if (!email || !password) {
    return NextResponse.json(
      { ok: false, error: "Email and password are required." },
      { status: 400 },
    );
  }
  if (!selectedRole) {
    return NextResponse.json(
      { ok: false, error: "Choose Site Admin, Doctor, or Care Team." },
      { status: 400 },
    );
  }

  const supabase = await supabaseServer();
  const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError || !authData.user) {
    return NextResponse.json(
      { ok: false, error: signInError?.message || "Could not sign in." },
      { status: 401 },
    );
  }

  const userId = authData.user.id;
  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("doctors")
    .select("id, role, clinic_id, clinic_name, clinics(id, name)")
    .eq("role", selectedRole)
    .not("clinic_id", "is", null)
    .or("status.is.null,status.eq.active")
    .or(`auth_user_id.eq.${userId},id.eq.${userId},email.ilike.${email}`)
    .order("clinic_name");

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const clinics = ((data || []) as Array<{
    id: string;
    role: string;
    clinic_id: string | null;
    clinic_name: string | null;
    clinics: { id: string; name: string } | { id: string; name: string }[] | null;
  }>)
    .map((row): ClinicMembership | null => {
      const clinic = Array.isArray(row.clinics) ? row.clinics[0] : row.clinics;
      const clinicId = row.clinic_id || clinic?.id;
      const clinicName = clinic?.name || row.clinic_name;
      if (!clinicId || !clinicName) return null;
      return {
        memberId: row.id,
        clinicId,
        clinicName,
        role: row.role,
      };
    })
    .filter((clinic): clinic is ClinicMembership => clinic !== null);

  const response = NextResponse.json({
    ok: true,
    clinics,
    next: clinics.length === 1 ? (selectedRole === "admin" ? "/admin" : "/dashboard") : null,
  });

  if (clinics.length === 1) {
    setActiveWorkspaceCookies(response, clinics[0]);
  }

  return response;
}
