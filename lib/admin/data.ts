import { supabaseAdmin } from "@/lib/supabase/admin";
import type { StaffRole } from "@/types/db";

export type AdminStaffRow = {
  id: string;
  auth_user_id: string | null;
  email: string | null;
  full_name: string;
  role: StaffRole;
  qualification: string | null;
  registration_number: string | null;
  status: string | null;
  created_at: string;
};

export type AdminPatientRow = {
  id: string;
  emr_number: string | null;
  full_name: string;
  age: number | null;
  sex: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  created_at: string;
  latestVisit: string | null;
  visitCount: number;
  completedVisitCount: number;
  assignedDoctorName: string | null;
};

export async function getClinicAdminDashboard(clinicId: string) {
  const admin = supabaseAdmin();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    { data: staff },
    { count: patients },
    { count: visits },
    { count: todayVisits },
    { data: recentVisits },
  ] = await Promise.all([
    admin
      .from("doctors")
      .select("id,full_name,email,role,status,created_at")
      .eq("clinic_id", clinicId)
      .order("created_at", { ascending: false }),
    admin
      .from("patients")
      .select("id", { count: "exact", head: true })
      .eq("clinic_id", clinicId),
    admin
      .from("visits")
      .select("id", { count: "exact", head: true })
      .eq("clinic_id", clinicId),
    admin
      .from("visits")
      .select("id", { count: "exact", head: true })
      .eq("clinic_id", clinicId)
      .gte("visit_date", today.toISOString()),
    admin
      .from("visits")
      .select("id,status,visit_date,updated_at,patients(full_name)")
      .eq("clinic_id", clinicId)
      .order("updated_at", { ascending: false })
      .limit(6),
  ]);

  const staffRows = (staff || []) as Array<{
    role: StaffRole;
    status: string | null;
  }>;
  const activeStaff = staffRows.filter((row) => row.status !== "inactive");

  return {
    counts: {
      admins: activeStaff.filter((row) => row.role === "admin").length,
      doctors: activeStaff.filter((row) => row.role === "doctor").length,
      medicalAssistants: activeStaff.filter((row) => row.role === "medical_assistant").length,
      patients: patients || 0,
      visits: visits || 0,
      todayVisits: todayVisits || 0,
    },
    recentStaff: ((staff || []) as AdminStaffRow[]).slice(0, 6),
    recentVisits: ((recentVisits || []) as Array<Record<string, unknown>>).map((row) => {
      const patient = row.patients;
      const patientRow = Array.isArray(patient) ? patient[0] : patient;
      return {
        id: String(row.id),
        status: String(row.status || "unknown"),
        visitDate: String(row.updated_at || row.visit_date || ""),
        patientName:
          patientRow && typeof patientRow === "object" && "full_name" in patientRow
            ? String(patientRow.full_name || "Unknown patient")
            : "Unknown patient",
      };
    }),
  };
}

export async function getClinicStaff(clinicId: string): Promise<AdminStaffRow[]> {
  const admin = supabaseAdmin();
  const { data } = await admin
    .from("doctors")
    .select("id,auth_user_id,email,full_name,role,qualification,registration_number,status,created_at")
    .eq("clinic_id", clinicId)
    .order("role")
    .order("full_name");

  return (data || []) as AdminStaffRow[];
}

export async function getClinicPatientsForAdmin(clinicId: string): Promise<AdminPatientRow[]> {
  const admin = supabaseAdmin();
  const [{ data: patients }, { data: visits }, { data: staff }] = await Promise.all([
    admin
      .from("patients")
      .select("id,clinic_id,doctor_id,emr_number,full_name,age,birthdate,sex,phone,email,city,state,created_at,last_visit_at")
      .eq("clinic_id", clinicId)
      .order("last_visit_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false }),
    admin.from("visits").select("id,patient_id,status,visit_date,completed_at").eq("clinic_id", clinicId),
    admin.from("doctors").select("id,full_name,role").eq("clinic_id", clinicId),
  ]);

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

  type PatientRow = {
    id: string;
    clinic_id: string | null;
    doctor_id: string;
    emr_number: string | null;
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

  return ((patients || []) as PatientRow[]).map((patient) => {
    const patientVisits = visitRows.filter((visit) => visit.patient_id === patient.id);
    const latestVisit =
      patientVisits
        .map((visit) => visit.visit_date)
        .filter(Boolean)
        .sort()
        .reverse()[0] || patient.last_visit_at || null;
    const assignedDoctor = staffMap.get(patient.doctor_id);

    return {
      id: patient.id,
      emr_number: patient.emr_number,
      full_name: patient.full_name,
      age: patient.age,
      sex: patient.sex,
      phone: patient.phone,
      city: patient.city,
      state: patient.state,
      created_at: patient.created_at,
      latestVisit,
      visitCount: patientVisits.length,
      completedVisitCount: patientVisits.filter((visit) => visit.status === "completed").length,
      assignedDoctorName: assignedDoctor?.full_name || null,
    };
  });
}
