"use client";

import Link from "next/link";
import { Badge } from "@/components/onco/ui/Badge";
import { Button } from "@/components/onco/ui/Button";
import { Card } from "@/components/onco/ui/Card";
import { demoStore } from "@/lib/onco/demo/demo-store";
import type { DemoAlert, DemoPatient } from "@/lib/onco/demo/demo-types";

export function AlertList({ alerts, patients }: { alerts: DemoAlert[]; patients: DemoPatient[] }) {
  return (
    <div className="space-y-3">
      {alerts.map((alert) => {
        const patient = patients.find((item) => item.id === alert.patientId);
        return (
          <Card key={alert.id}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <Badge tone={alert.severity === "critical" ? "danger" : "sand"}>{alert.severity}</Badge>
                <h3 className="mt-2 font-semibold">{alert.title}</h3>
                <p className="text-sm text-onco-muted">{patient?.name || "Patient"} · {alert.detail}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {patient ? <Link className="onco-button-outline min-h-0 py-2" href={`/doctor/patients/${patient.id}`}>Open patient</Link> : null}
                <Button variant="outline" onClick={() => { demoStore.updateAlert(alert.id, "acknowledged"); demoStore.toast("Alert marked reviewed"); }}>Mark reviewed</Button>
                <Button variant="outline" onClick={() => demoStore.toast("Follow-up task created")}>Create follow-up task</Button>
                <Button variant="outline" onClick={() => demoStore.toast("Prescription paused", "warning")}>Pause prescription</Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

