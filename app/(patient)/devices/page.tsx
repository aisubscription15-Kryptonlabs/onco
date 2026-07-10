import { Suspense } from "react";
import { DevicesClient } from "@/components/onco/demo/PatientScreens";

export default function DevicesPage() {
  return (
    <Suspense fallback={null}>
      <DevicesClient />
    </Suspense>
  );
}
