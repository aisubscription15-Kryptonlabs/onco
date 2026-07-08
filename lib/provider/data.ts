import { supabaseAdmin } from "@/lib/supabase/admin";

type CountResult = { count: number | null; error: { message: string } | null };

async function countRows(table: string, column?: string, value?: string) {
  const admin = supabaseAdmin();
  let query = admin.from(table).select("id", { count: "exact", head: true });
  if (column && value) query = query.eq(column, value);
  const { count, error } = (await query) as CountResult;
  if (error) return 0;
  return count || 0;
}

function inr(value: unknown) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

function startOfMonthIso() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

export type ClinicSummary = {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  admins: number;
  doctors: number;
  medicalAssistants: number;
  patients: number;
  visits: number;
  lastActivity: string | null;
  status: string;
};

export async function getProviderStats() {
  const admin = supabaseAdmin();
  const monthStart = startOfMonthIso();

  const [
    { data: clinics },
    { data: staffRows },
    { data: patientRows },
    { data: visitRows },
    monthlyVisits,
  ] = await Promise.all([
    admin.from("clinics").select("id"),
    admin.from("doctors").select("id,clinic_id,role,status"),
    admin.from("patients").select("id,clinic_id"),
    admin.from("visits").select("id,clinic_id"),
    admin.from("visits").select("id", { count: "exact", head: true }).gte("visit_date", monthStart),
  ]);

  const clinicIds = new Set(((clinics || []) as Array<{ id: string }>).map((clinic) => clinic.id));
  const clinicStaffRows = ((staffRows || []) as Array<{
    clinic_id: string | null;
    role: string;
    status?: string | null;
  }>).filter((row) => row.clinic_id && clinicIds.has(row.clinic_id) && row.status !== "inactive");
  const clinicPatientRows = ((patientRows || []) as Array<{ clinic_id: string | null }>).filter(
    (row) => row.clinic_id && clinicIds.has(row.clinic_id),
  );
  const clinicVisitRows = ((visitRows || []) as Array<{ clinic_id: string | null }>).filter(
    (row) => row.clinic_id && clinicIds.has(row.clinic_id),
  );

  const { data: usageEvents } = await admin
    .from("api_usage_events")
    .select("*")
    .gte("created_at", monthStart)
    .limit(5000);

  const monthlyApiCostInr = ((usageEvents || []) as Array<Record<string, unknown>>).reduce(
    (sum, row) => sum + inr(row.cost_inr ?? row.cost_usd),
    0,
  );

  return {
    totalClinics: clinicIds.size,
    activeClinics: clinicIds.size,
    pendingClinics: 0,
    blockedClinics: 0,
    admins: clinicStaffRows.filter((row) => row.role === "admin").length,
    doctors: clinicStaffRows.filter((row) => row.role === "doctor").length,
    medicalAssistants: clinicStaffRows.filter((row) => row.role === "medical_assistant").length,
    patients: clinicPatientRows.length,
    visits: clinicVisitRows.length,
    monthlyVisits: monthlyVisits.count || 0,
    monthlyRevenueInr: 0,
    monthlyApiCostInr,
    unpaidClinics: 0,
    apiCallsThisMonth: usageEvents?.length || 0,
  };
}

export async function getClinicSummaries(): Promise<ClinicSummary[]> {
  const admin = supabaseAdmin();
  const [{ data: clinics }, { data: staff }, { data: patients }, { data: visits }] =
    await Promise.all([
      admin.from("clinics").select("*").order("created_at", { ascending: false }),
      admin.from("doctors").select("id,clinic_id,role,status"),
      admin.from("patients").select("id,clinic_id"),
      admin.from("visits").select("id,clinic_id,visit_date,updated_at"),
    ]);

  const staffRows = (staff || []) as Array<{ clinic_id: string | null; role: string; status?: string | null }>;
  const patientRows = (patients || []) as Array<{ clinic_id: string | null }>;
  const visitRows = (visits || []) as Array<{ clinic_id: string | null; visit_date?: string; updated_at?: string }>;

  return ((clinics || []) as Array<Record<string, unknown> & { id: string; name: string; created_at: string }>).map(
    (clinic) => {
      const clinicStaff = staffRows.filter((row) => row.clinic_id === clinic.id);
      const activeClinicStaff = clinicStaff.filter((row) => row.status !== "inactive");
      const clinicVisits = visitRows.filter((row) => row.clinic_id === clinic.id);
      const lastActivity =
        clinicVisits
          .map((row) => row.updated_at || row.visit_date)
          .filter(Boolean)
          .sort()
          .reverse()[0] || null;

      return {
        id: clinic.id,
        name: clinic.name,
        city: (clinic.city as string | null) || null,
        state: (clinic.state as string | null) || null,
        email: (clinic.email as string | null) || null,
        phone: (clinic.phone as string | null) || null,
        created_at: clinic.created_at,
        admins: activeClinicStaff.filter((row) => row.role === "admin").length,
        doctors: activeClinicStaff.filter((row) => row.role === "doctor").length,
        medicalAssistants: activeClinicStaff.filter((row) => row.role === "medical_assistant").length,
        patients: patientRows.filter((row) => row.clinic_id === clinic.id).length,
        visits: clinicVisits.length,
        lastActivity,
        status: "active",
      };
    },
  );
}

export async function getClinicDetail(clinicId: string) {
  const admin = supabaseAdmin();
  const [
    { data: clinic },
    { data: staff },
    { data: patients },
    { data: visits },
    { data: usage },
    { data: fhir },
    { data: audit },
  ] = await Promise.all([
    admin.from("clinics").select("*").eq("id", clinicId).maybeSingle(),
    admin.from("doctors").select("*").eq("clinic_id", clinicId).order("created_at", { ascending: false }),
    admin.from("patients").select("id,created_at,last_visit_at").eq("clinic_id", clinicId),
    admin.from("visits").select("id,status,visit_date,updated_at").eq("clinic_id", clinicId),
    admin.from("api_usage_events").select("*").eq("clinic_id", clinicId).order("created_at", { ascending: false }).limit(100),
    admin.from("fhir_validation_results").select("id,status,created_at").eq("clinic_id", clinicId).limit(200),
    admin.from("audit_events").select("*").limit(50),
  ]);

  if (!clinic) return null;
  const usageRows = (usage || []) as Array<Record<string, unknown>>;

  return {
    clinic: clinic as Record<string, unknown> & { id: string; name: string },
    staff: (staff || []) as Array<Record<string, unknown>>,
    patients: (patients || []) as Array<Record<string, unknown>>,
    visits: (visits || []) as Array<Record<string, unknown> & { status?: string }>,
    usage: usageRows,
    subscription: null,
    flags: null,
    fhir: (fhir || []) as Array<Record<string, unknown> & { status?: string }>,
    audit: (audit || []) as Array<Record<string, unknown>>,
    usageCostInr: usageRows.reduce((sum, row) => sum + inr(row.cost_inr ?? row.cost_usd), 0),
  };
}

export async function getClinicPatients(clinicId: string) {
  const admin = supabaseAdmin();
  const [{ data: clinic }, { data: patients }, { data: visits }, { data: staff }] = await Promise.all([
    admin.from("clinics").select("*").eq("id", clinicId).maybeSingle(),
    admin
      .from("patients")
      .select("id,clinic_id,doctor_id,emr_number,full_name,age,birthdate,sex,phone,email,city,state,created_at,last_visit_at")
      .eq("clinic_id", clinicId)
      .order("last_visit_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false }),
    admin.from("visits").select("id,patient_id,status,visit_date,completed_at").eq("clinic_id", clinicId),
    admin.from("doctors").select("id,full_name,role").eq("clinic_id", clinicId),
  ]);

  if (!clinic) return null;

  const visitRows = (visits || []) as Array<{
    id: string;
    patient_id: string;
    status: string;
    visit_date: string;
    completed_at: string | null;
  }>;
  const staffMap = new Map(
    ((staff || []) as Array<{ id: string; full_name: string; role: string }>).map((member) => [
      member.id,
      member,
    ]),
  );

  type SuperAdminPatientRow = {
    id: string;
    clinic_id: string | null;
    doctor_id: string;
    emr_number: string;
    full_name: string;
    age: number | null;
    birthdate: string | null;
    sex: string | null;
    phone: string | null;
    email: string | null;
    city: string | null;
    state: string | null;
    created_at: string;
    last_visit_at: string | null;
  };

  const rows = ((patients || []) as SuperAdminPatientRow[]).map((patient) => {
    const patientVisits = visitRows.filter((visit) => visit.patient_id === patient.id);
    const latestVisit =
      patientVisits
        .map((visit) => visit.visit_date)
        .filter(Boolean)
        .sort()
        .reverse()[0] || null;
    const assignedDoctor = staffMap.get(patient.doctor_id);

    return {
      ...patient,
      visitCount: patientVisits.length,
      completedVisitCount: patientVisits.filter((visit) => visit.status === "completed").length,
      latestVisit,
      assignedDoctorName: assignedDoctor?.full_name || null,
    };
  });

  return {
    clinic: clinic as Record<string, unknown> & { id: string; name: string },
    patients: rows,
  };
}

export type ClinicUsageTotals = {
  clinicName: string;
  calls: number;
  costInr: number;
  sttCost: number;
  claudeCost: number;
  storageCost: number;
};

export async function getUsageRows(since?: string, until?: string) {
  const admin = supabaseAdmin();
  let usageQuery = admin
    .from("api_usage_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (since) usageQuery = usageQuery.gte("created_at", since);
  if (until) usageQuery = usageQuery.lte("created_at", until);

  const [{ data: clinics }, { data: usage }] = await Promise.all([
    admin.from("clinics").select("id,name"),
    usageQuery,
  ]);
  const clinicMap = new Map(((clinics || []) as Array<{ id: string; name: string }>).map((c) => [c.id, c.name]));
  const rows = (usage || []) as Array<Record<string, unknown> & { clinic_id: string; service: string }>;

  const totalsByClinic = rows.reduce<Record<string, ClinicUsageTotals>>(
    (acc, row) => {
      const id = row.clinic_id;
      acc[id] ||= { clinicName: clinicMap.get(id) || "Unknown clinic", calls: 0, costInr: 0, sttCost: 0, claudeCost: 0, storageCost: 0 };
      const cost = inr(row.cost_inr ?? row.cost_usd);
      acc[id].calls += 1;
      acc[id].costInr += cost;
      if (row.service === "sarvam_stt") acc[id].sttCost += cost;
      else if (String(row.service).startsWith("claude")) acc[id].claudeCost += cost;
      else if (row.service === "audio_storage") acc[id].storageCost += cost;
      return acc;
    },
    {},
  );

  type ProviderUsageRow = Record<string, unknown> & {
    clinic_id: string;
    service: string;
    clinicName: string;
    costInr: number;
    id?: string;
    operation?: string;
    created_at?: string;
    audio_duration_seconds?: number | string;
    input_tokens?: number;
    output_tokens?: number;
  };

  const usageRows: ProviderUsageRow[] = rows.map((row) => ({
    ...row,
    clinicName: clinicMap.get(row.clinic_id) || "Unknown clinic",
    costInr: inr(row.cost_inr ?? row.cost_usd),
  }));

  return {
    rows: usageRows,
    totalsByClinic: Object.values(totalsByClinic).sort((a, b) => b.costInr - a.costInr),
  };
}

export async function getBillingRows() {
  return [];
}

export async function getFeatureFlagRows() {
  return [];
}

export type ProviderStaffMember = {
  id: string;
  auth_user_id: string;
  email: string;
  full_name: string | null;
  role: string;
  status: string;
  created_at: string;
};

export async function getProviderStaff(): Promise<ProviderStaffMember[]> {
  const admin = supabaseAdmin();
  const { data } = await admin
    .from("platform_admins")
    .select("id,auth_user_id,email,full_name,role,status,created_at")
    .order("created_at", { ascending: true });
  return (data || []) as ProviderStaffMember[];
}

export type PendingClinic = {
  id: string;
  name: string;
  phone: string | null;
  created_at: string;
  adminName: string | null;
  adminEmail: string | null;
};

export async function getPendingClinics(): Promise<PendingClinic[]> {
  return [];
}

export type ProviderAuditRow = Record<string, unknown> & {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  actor_id: string | null;
  actorLabel: string;
  entityLabel: string;
  detailsLabel: string;
  created_at: string;
};

function titleCase(value: unknown) {
  return String(value || "Unknown")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function shortId(value: unknown) {
  const text = String(value || "");
  return text.length > 10 ? `${text.slice(0, 8)}...` : text || "-";
}

function formatAuditDetails(metadata: unknown) {
  if (!metadata || typeof metadata !== "object") return "-";
  const entries = Object.entries(metadata as Record<string, unknown>).filter(([, value]) => {
    if (value === null || value === undefined || value === "") return false;
    if (typeof value === "object" && Object.keys(value as Record<string, unknown>).length === 0) return false;
    return true;
  });
  if (entries.length === 0) return "-";

  return entries
    .slice(0, 4)
    .map(([key, value]) => `${key.replace(/_/g, " ")}: ${typeof value === "object" ? JSON.stringify(value) : String(value)}`)
    .join(" | ");
}

export async function getAuditRows(): Promise<ProviderAuditRow[]> {
  const admin = supabaseAdmin();
  const [{ data: events }, { data: providerAdmins }, { data: clinicStaff }] = await Promise.all([
    admin
    .from("audit_events")
    .select("*")
    .order("created_at", { ascending: false })
      .limit(100),
    admin.from("platform_admins").select("id,auth_user_id,email,full_name,role"),
    admin.from("doctors").select("id,auth_user_id,email,full_name,role"),
  ]);

  const actorMap = new Map<string, string>();
  for (const adminRow of (providerAdmins || []) as Array<Record<string, unknown>>) {
    const label = `${adminRow.full_name || adminRow.email || "App Provider"} (${titleCase(adminRow.role)})`;
    if (adminRow.id) actorMap.set(String(adminRow.id), label);
    if (adminRow.auth_user_id) actorMap.set(String(adminRow.auth_user_id), label);
  }
  for (const staffRow of (clinicStaff || []) as Array<Record<string, unknown>>) {
    const label = `${staffRow.full_name || staffRow.email || "Clinic Staff"} (${titleCase(staffRow.role)})`;
    if (staffRow.id) actorMap.set(String(staffRow.id), label);
    if (staffRow.auth_user_id) actorMap.set(String(staffRow.auth_user_id), label);
  }

  return ((events || []) as Array<Record<string, unknown>>).map((row) => {
    const actorId = row.actor_id ? String(row.actor_id) : null;
    const entityType = String(row.entity_type || "record");
    const entityId = row.entity_id ? String(row.entity_id) : null;

    return {
      ...row,
      id: String(row.id),
      action: String(row.action || "unknown"),
      entity_type: entityType,
      entity_id: entityId,
      actor_id: actorId,
      actorLabel: actorId ? actorMap.get(actorId) || `Unknown user (${shortId(actorId)})` : "System",
      entityLabel: `${titleCase(entityType)} ${shortId(entityId)}`,
      detailsLabel: formatAuditDetails(row.metadata),
      created_at: String(row.created_at),
    };
  });
}
