import { DoctorDashboard } from "@/components/onco/demo/DemoDashboards";

export default async function DoctorPatientSummaryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DoctorDashboard view="summary" patientId={id} />;
}

