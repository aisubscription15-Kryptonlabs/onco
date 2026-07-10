import { Suspense } from "react";
import { DoctorSummaryClient } from "@/components/onco/demo/PatientScreens";

export default function DoctorSummaryPage() {
  return (
    <Suspense fallback={null}>
      <DoctorSummaryClient />
    </Suspense>
  );
}
