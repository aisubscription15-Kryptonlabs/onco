import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Doctor, Clinic } from "@/types/db";
 
const ACTIVE_CLINIC_COOKIE = "active_clinic_id";
const ACTIVE_MEMBER_COOKIE = "active_member_id";
 
function resolveActiveMember(memberRows: Doctor[], activeMemberId: string | null) {
  if (memberRows.length === 0) return null;
 
  if (activeMemberId) {
    return memberRows.find((member) => member.id === activeMemberId) || null;
  }
 
  if (memberRows.length === 1) {
    return memberRows[0];
  }
 
  return null;
}
 
// Convenience: fetch the signed-in user, their staff row, and their clinic in one go.
// Redirects to staff login when missing.
export async function requireMember(): Promise<{
  userId: string;
  email: string;
  member: Doctor;
  clinic: Clinic;
}> {
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/staff/login");
 
  const cookieStore = await cookies();
  const activeClinicId = cookieStore.get(ACTIVE_CLINIC_COOKIE)?.value || null;
  const activeMemberId = cookieStore.get(ACTIVE_MEMBER_COOKIE)?.value || null;
  const admin = supabaseAdmin();
 
  let memberQuery = admin
    .from("doctors")
    .select("*")
    .eq("auth_user_id", user.id)
    .not("clinic_id", "is", null)
    .or("status.is.null,status.eq.active");
 
  if (activeMemberId) {
    memberQuery = memberQuery.eq("id", activeMemberId);
  }
 
  if (activeClinicId) {
    memberQuery = memberQuery.eq("clinic_id", activeClinicId);
  }
 
  const { data: members } = await memberQuery;
  let memberRows = (members as Doctor[] | null) || [];
  if (memberRows.length === 0) {
    const { data: legacyMember } = await admin
      .from("doctors")
      .select("*")
      .eq("id", user.id)
      .or("status.is.null,status.eq.active")
      .maybeSingle();
    memberRows = legacyMember ? [legacyMember as Doctor] : [];
  }
  const member = resolveActiveMember(memberRows, activeMemberId);
 
  if (!member || !(member as Doctor).clinic_id) redirect("/staff/login");
 
  const { data: clinic } = await admin
    .from("clinics")
    .select("*")
    .eq("id", (member as Doctor).clinic_id as string)
    .maybeSingle();
  if (!clinic) redirect("/staff/login");
 
  return {
    userId: user.id,
    email: user.email || "",
    member: member as Doctor,
    clinic: clinic as Clinic,
  };
}
 
export async function getOptionalMember(): Promise<{
  userId: string;
  email: string;
  member: Doctor | null;
  clinic: Clinic | null;
} | null> {
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;
 
  const cookieStore = await cookies();
  const activeClinicId = cookieStore.get(ACTIVE_CLINIC_COOKIE)?.value || null;
  const activeMemberId = cookieStore.get(ACTIVE_MEMBER_COOKIE)?.value || null;
  const admin = supabaseAdmin();
 
  let memberQuery = admin
    .from("doctors")
    .select("*")
    .eq("auth_user_id", user.id)
    .not("clinic_id", "is", null)
    .or("status.is.null,status.eq.active");
 
  if (activeMemberId) {
    memberQuery = memberQuery.eq("id", activeMemberId);
  }
 
  if (activeClinicId) {
    memberQuery = memberQuery.eq("clinic_id", activeClinicId);
  }
 
  const { data: members } = await memberQuery;
  let memberRows = (members as Doctor[] | null) || [];
  if (memberRows.length === 0) {
    const { data: legacyMember } = await admin
      .from("doctors")
      .select("*")
      .eq("id", user.id)
      .or("status.is.null,status.eq.active")
      .maybeSingle();
    memberRows = legacyMember ? [legacyMember as Doctor] : [];
  }
  const m = resolveActiveMember(memberRows, activeMemberId);
 
  let clinic: Clinic | null = null;
  if (m?.clinic_id) {
    const { data: c } = await admin
      .from("clinics")
      .select("*")
      .eq("id", m.clinic_id)
      .maybeSingle();
    clinic = c as Clinic | null;
  }
 
  return {
    userId: user.id,
    email: user.email || "",
    member: m,
    clinic,
  };
}
 
 
