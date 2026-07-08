import { DoctorDashboard } from "@/components/onco/demo/DemoDashboards";

export default async function DoctorPatientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DoctorDashboard view="patient" patientId={id} />;
}

