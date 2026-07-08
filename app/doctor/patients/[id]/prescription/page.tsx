import { DoctorDashboard } from "@/components/onco/demo/DemoDashboards";

export default async function DoctorPatientPrescriptionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DoctorDashboard view="prescription" patientId={id} />;
}

