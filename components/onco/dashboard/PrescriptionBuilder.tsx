"use client";

import { useState } from "react";
import { Button } from "@/components/onco/ui/Button";
import { Card } from "@/components/onco/ui/Card";
import { ConfirmDialog } from "@/components/onco/ui/ConfirmDialog";
import { Pill } from "@/components/onco/ui/Pill";
import { Select } from "@/components/onco/ui/Select";
import { demoStore, useDemoStore } from "@/lib/onco/demo/demo-store";
import type { DemoPatient } from "@/lib/onco/demo/demo-types";

const precautions = ["Neuropathy/fall risk", "Bathroom access", "Fatigue", "Avoid crowded gym", "Hydration reminder", "Stop for red flags"];

export function PrescriptionBuilder({ patient }: { patient: DemoPatient }) {
  const { metCatalog } = useDemoStore();
  const [activity, setActivity] = useState(patient.prescription.activity);
  const [frequency, setFrequency] = useState(String(patient.prescription.daysPerWeek));
  const [duration, setDuration] = useState(String(patient.prescription.minutes));
  const [intensity, setIntensity] = useState(patient.prescription.intensity);
  const [selectedPrecautions, setSelectedPrecautions] = useState<string[]>(patient.flags);
  const [confirm, setConfirm] = useState<"draft" | "approve" | "send" | null>(null);
  const met = metCatalog.find((item) => item.type === activity && item.intensity === intensity)?.met || patient.prescription.metHours;
  const weeklyMinutes = Number(frequency) * Number(duration);
  const weeklyMet = Number(((met * weeklyMinutes) / 60).toFixed(2));

  function save(status: DemoPatient["prescriptionStatus"]) {
    demoStore.updatePrescription(
      patient.id,
      {
        activity,
        daysPerWeek: Number(frequency),
        minutes: Number(duration),
        intensity,
        metHours: weeklyMet,
      },
      status,
    );
    demoStore.updatePatient(patient.id, { flags: selectedPrecautions });
    demoStore.toast(status === "active" ? "Prescription approved" : "Prescription saved");
  }

  return (
    <Card className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Select label="Activity type" value={activity} onChange={setActivity} options={["Walking", "Gardening", "Cycling", "Swimming", "Stretching", "Resistance training"].map((value) => ({ label: value, value: value as typeof activity }))} />
        <Select label="Frequency" value={frequency} onChange={setFrequency} options={["1", "2", "3", "4", "5", "6", "7"].map((value) => ({ label: `${value} days/week`, value }))} />
        <Select label="Duration" value={duration} onChange={setDuration} options={["5", "10", "15", "20", "30"].map((value) => ({ label: `${value} minutes`, value }))} />
        <Select label="Intensity" value={intensity} onChange={setIntensity} options={["Very easy", "Easy", "Easy-to-moderate", "Moderate"].map((value) => ({ label: value, value: value as typeof intensity }))} />
      </div>
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.05em] text-onco-muted-light">Precautions</p>
        <div className="flex flex-wrap gap-2">
          {precautions.map((item) => (
            <Pill
              active={selectedPrecautions.includes(item)}
              key={item}
              onClick={() => setSelectedPrecautions((current) => current.includes(item) ? current.filter((value) => value !== item) : [...current, item])}
            >
              {item}
            </Pill>
          ))}
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Card tone="cream"><p className="text-xs text-onco-muted">Weekly minutes</p><p className="onco-display text-2xl font-bold">{weeklyMinutes}</p></Card>
        <Card tone="cream"><p className="text-xs text-onco-muted">Estimated MET-hours</p><p className="onco-display text-2xl font-bold">{weeklyMet}</p></Card>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => setConfirm("draft")}>Save as draft</Button>
        <Button onClick={() => setConfirm("approve")}>Approve prescription</Button>
        <Button variant="outline" onClick={() => setConfirm("send")}>Send to patient</Button>
      </div>
      <ConfirmDialog
        open={confirm !== null}
        title={confirm === "approve" ? "Approve prescription" : confirm === "send" ? "Send prescription" : "Save draft"}
        message="This updates local demo state only."
        confirmLabel="Confirm"
        onClose={() => setConfirm(null)}
        onConfirm={() => save(confirm === "approve" || confirm === "send" ? "active" : "pending-approval")}
      />
    </Card>
  );
}

