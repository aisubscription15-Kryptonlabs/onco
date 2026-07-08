"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/onco/ui/Badge";
import { Button } from "@/components/onco/ui/Button";
import { Card } from "@/components/onco/ui/Card";
import { DataTable } from "@/components/onco/ui/DataTable";
import { Modal } from "@/components/onco/ui/Modal";
import { Select } from "@/components/onco/ui/Select";
import { AiAgentIcon } from "@/components/onco/ui/icons";
import { demoStore } from "@/lib/onco/demo/demo-store";

export type AiUsageRow = {
  id: string;
  date: string;
  site: string;
  patient: string;
  agent: string;
  model: string;
  reportType: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  status: "Completed" | "Needs review" | "Reviewed" | "Failed";
};

export function ReportsUsageTable({ rows }: { rows: AiUsageRow[] }) {
  const [items, setItems] = useState(rows);
  const [dateRange, setDateRange] = useState("30 days");
  const [site, setSite] = useState("All");
  const [agent, setAgent] = useState("All");
  const [model, setModel] = useState("All");
  const [patient, setPatient] = useState("All");
  const [status, setStatus] = useState("All");
  const [active, setActive] = useState<AiUsageRow | null>(null);

  const filtered = useMemo(() => items.filter((row) =>
    (site === "All" || row.site === site) &&
    (agent === "All" || row.agent === agent) &&
    (model === "All" || row.model === model) &&
    (patient === "All" || row.patient === patient) &&
    (status === "All" || row.status === status),
  ), [agent, items, model, patient, site, status]);

  const unique = (key: keyof AiUsageRow) => ["All", ...Array.from(new Set(items.map((row) => String(row[key]))))];

  return (
    <Card className="mt-5">
      <div className="mb-4 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Select label="Date range" value={dateRange} onChange={setDateRange} options={["7 days", "30 days", "90 days", "All time"].map((value) => ({ label: value, value }))} />
        <Select label="Site" value={site} onChange={setSite} options={unique("site").map((value) => ({ label: value, value }))} />
        <Select label="Agent" value={agent} onChange={setAgent} options={unique("agent").map((value) => ({ label: value, value }))} />
        <Select label="Model" value={model} onChange={setModel} options={unique("model").map((value) => ({ label: value, value }))} />
        <Select label="Patient" value={patient} onChange={setPatient} options={unique("patient").map((value) => ({ label: value, value }))} />
        <Select label="Status" value={status} onChange={setStatus} options={["All", "Completed", "Needs review", "Reviewed", "Failed"].map((value) => ({ label: value, value }))} />
      </div>
      <DataTable rows={filtered} getKey={(row) => row.id} columns={[
        { header: "Date", cell: (row) => row.date },
        { header: "Site", cell: (row) => row.site },
        { header: "Patient", cell: (row) => row.patient },
        { header: "Agent", cell: (row) => <span className="inline-flex items-center gap-2 font-semibold text-onco-sage"><AiAgentIcon />{row.agent}</span> },
        { header: "Model", cell: (row) => row.model },
        { header: "Report/Summary Type", cell: (row) => row.reportType },
        { header: "Input tokens", cell: (row) => row.inputTokens.toLocaleString() },
        { header: "Output tokens", cell: (row) => row.outputTokens.toLocaleString() },
        { header: "Estimated cost", cell: (row) => `$${row.estimatedCost.toFixed(2)}` },
        { header: "Status", cell: (row) => <Badge tone={row.status === "Failed" ? "danger" : row.status === "Needs review" ? "sand" : "sage"}>{row.status}</Badge> },
        { header: "Actions", cell: (row) => <div className="flex gap-2"><Button variant="outline" onClick={() => setActive(row)}>View summary</Button><Button variant="outline" onClick={() => { setItems((current) => current.map((item) => item.id === row.id ? { ...item, status: "Reviewed" } : item)); demoStore.toast("Usage row marked reviewed"); }}>Mark reviewed</Button></div> },
      ]} />
      <Button className="mt-4" variant="outline" onClick={() => demoStore.toast("Usage report export prepared", "info")}>Export usage report</Button>
      <Modal open={active !== null} title={active?.reportType || "Usage summary"} onClose={() => setActive(null)}>
        <p className="text-sm leading-6 text-onco-muted">
          <span className="inline-flex items-center gap-2 font-semibold text-onco-sage"><AiAgentIcon />{active?.agent}</span> used {active?.model} for {active?.patient} at {active?.site}. Estimated cost: ${active?.estimatedCost.toFixed(2)}.
        </p>
      </Modal>
    </Card>
  );
}
