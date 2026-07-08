import Link from "next/link";
import { Badge } from "@/components/onco/ui/Badge";
import { Button } from "@/components/onco/ui/Button";
import { Card } from "@/components/onco/ui/Card";
import { AiAgentIcon } from "@/components/onco/ui/icons";
import type { DemoPatient } from "@/lib/onco/demo/demo-types";

export function PatientSummaryCard({ patient }: { patient: DemoPatient }) {
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="onco-display text-2xl font-extrabold">{patient.name}</h2>
          <p className="text-sm text-onco-muted">{patient.cancerType} · {patient.treatmentStatus}</p>
        </div>
        <Badge>{patient.phase}</Badge>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <Mini label="Adherence" value={`${patient.adherence}%`} />
        <Mini label="Active days" value={String(patient.activeDays)} />
        <Mini label="MET-hours" value={String(patient.prescription.metHours)} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link className="onco-button-outline" href={`/doctor/patients/${patient.id}/prescription`}>Edit prescription</Link>
        <Link className="onco-button-outline" href={`/doctor/patients/${patient.id}/summary`}><AiAgentIcon />Generate summary</Link>
        <Button variant="outline" onClick={() => undefined}>Mark reviewed</Button>
      </div>
    </Card>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-onco-cream p-3">
      <p className="text-xs text-onco-muted-light">{label}</p>
      <p className="onco-display text-xl font-bold">{value}</p>
    </div>
  );
}
