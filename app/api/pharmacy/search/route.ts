import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isClinicFeatureEnabled } from "@/lib/features";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";
import type { Doctor } from "@/types/db";

const ACTIVE_CLINIC_COOKIE = "active_clinic_id";
const ACTIVE_MEMBER_COOKIE = "active_member_id";

async function getRouteMember() {
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) return null;

  let memberQuery = sb
    .from("doctors")
    .select("*")
    .eq("auth_user_id", user.id)
    .not("clinic_id", "is", null)
    .or("status.is.null,status.eq.active");

  const cookieStore = await cookies();
  const activeClinicId = cookieStore.get(ACTIVE_CLINIC_COOKIE)?.value || null;
  const activeMemberId = cookieStore.get(ACTIVE_MEMBER_COOKIE)?.value || null;

  if (activeMemberId) {
    memberQuery = memberQuery.eq("id", activeMemberId);
  }

  if (activeClinicId) {
    memberQuery = memberQuery.eq("clinic_id", activeClinicId);
  }

  const { data: members } = await memberQuery;
  let memberRows = (members as Doctor[] | null) || [];

  if (memberRows.length === 0) {
    const { data: legacyMember } = await sb
      .from("doctors")
      .select("*")
      .eq("id", user.id)
      .or("status.is.null,status.eq.active")
      .maybeSingle();

    memberRows = legacyMember ? [legacyMember as Doctor] : [];
  }

  const member = activeMemberId
    ? memberRows.find((row) => row.id === activeMemberId) || null
    : memberRows[0] || null;

  if (!member?.clinic_id) return null;
  return { ...member, clinic_id: member.clinic_id };
}

export async function GET(request: Request) {
  const member = await getRouteMember();

  if (!member) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (member.role !== "doctor" && member.role !== "medical_assistant") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const clinicId = member.clinic_id;

  if (!(await isClinicFeatureEnabled(clinicId, "pharmacy"))) {
    return NextResponse.json({ error: "Pharmacy is not enabled for this clinic." }, { status: 403 });
  }

  const url = new URL(request.url);
  const query = (url.searchParams.get("q") || "").trim();
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 20), 1), 50);

  if (query.length < 2) {
    return NextResponse.json({ data: [] });
  }

  const admin = supabaseAdmin();
  const prefix = await admin
    .from("medicines")
    .select("*")
    .ilike("name", `${query}%`)
    .limit(limit);

  if (prefix.error) {
    return NextResponse.json({ error: prefix.error.message }, { status: 500 });
  }

  if ((prefix.data || []).length > 0) {
    return NextResponse.json({ data: prefix.data || [] });
  }

  const contains = await admin
    .from("medicines")
    .select("*")
    .ilike("name", `%${query}%`)
    .limit(limit);

  if (contains.error) {
    return NextResponse.json({ error: contains.error.message }, { status: 500 });
  }

  return NextResponse.json({ data: contains.data || [] });
}

export async function POST(request: Request) {
  const member = await getRouteMember();

  if (!member) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (member.role !== "doctor" && member.role !== "medical_assistant") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  if (!(await isClinicFeatureEnabled(member.clinic_id, "pharmacy"))) {
    return NextResponse.json({ error: "Pharmacy is not enabled for this clinic." }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    composition?: string;
    manufacturer?: string;
    type?: string;
    pack?: string;
    price?: string;
    prescriptionRequired?: boolean;
  };

  const name = cleanText(body.name);
  if (name.length < 2) {
    return NextResponse.json({ error: "Medicine name is required." }, { status: 400 });
  }

  const priceText = cleanText(body.price);
  const parsedPrice = priceText ? Number(priceText) : null;
  if (parsedPrice !== null && (!Number.isFinite(parsedPrice) || parsedPrice < 0)) {
    return NextResponse.json({ error: "Price must be a valid positive number." }, { status: 400 });
  }

  const insert = {
    id: crypto.randomUUID(),
    name,
    short_composition1: cleanText(body.composition) || null,
    manufacturer_name: cleanText(body.manufacturer) || null,
    type: cleanText(body.type) || null,
    pack_size_label: cleanText(body.pack) || null,
    price: parsedPrice,
    prescription_required: Boolean(body.prescriptionRequired),
    source: "custom",
  };

  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("medicines")
    .insert(insert as never)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}
