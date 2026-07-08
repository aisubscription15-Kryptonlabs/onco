"use client";

import Link from "next/link";
import { Badge } from "@/components/onco/ui/Badge";
import { DataTable } from "@/components/onco/ui/DataTable";
import type { DemoPatient } from "@/lib/onco/demo/demo-types";

function tone(status: DemoPatient["prescriptionStatus"]) {
  if (status === "alert") return "danger" as const;
  if (status === "pending-approval" || status === "low-adherence") return "sand" as const;
  return "sage" as const;
}

export function PatientRosterTable({ patients }: { patients: DemoPatient[] }) {
  return (
    <DataTable
      rows={patients}
      getKey={(patient) => patient.id}
      columns={[
        { header: "Patient", cell: (patient) => <Link className="font-semibold text-onco-sage" href={`/doctor/patients/${patient.id}`}>{patient.name}</Link> },
        { header: "Cancer", cell: (patient) => patient.cancerType },
        { header: "Phase", cell: (patient) => <Badge>{patient.phase}</Badge> },
        { header: "Adherence", cell: (patient) => `${patient.adherence}%` },
        { header: "MET-hours", cell: (patient) => patient.prescription.metHours },
        { header: "Status", cell: (patient) => <Badge tone={tone(patient.prescriptionStatus)}>{patient.prescriptionStatus.replace("-", " ")}</Badge> },
      ]}
    />
  );
}

