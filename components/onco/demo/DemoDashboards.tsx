"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertList } from "@/components/onco/dashboard/AlertList";
import { ActivityChart } from "@/components/onco/dashboard/ActivityChart";
import { DashboardShell } from "@/components/onco/dashboard/DashboardShell";
import { MetricTrendCard } from "@/components/onco/dashboard/MetricTrendCard";
import { PatientRosterTable } from "@/components/onco/dashboard/PatientRosterTable";
import { PatientSummaryCard } from "@/components/onco/dashboard/PatientSummaryCard";
import { PrescriptionBuilder } from "@/components/onco/dashboard/PrescriptionBuilder";
import { PromptVersionTable } from "@/components/onco/dashboard/PromptVersionTable";
import { SiteRequestQueue } from "@/components/onco/dashboard/SiteRequestQueue";
import { SymptomTimeline } from "@/components/onco/dashboard/SymptomTimeline";
import { Badge } from "@/components/onco/ui/Badge";
import { Button } from "@/components/onco/ui/Button";
import { Card } from "@/components/onco/ui/Card";
import { DataTable } from "@/components/onco/ui/DataTable";
import { EmptyState } from "@/components/onco/ui/EmptyState";
import { Modal } from "@/components/onco/ui/Modal";
import { SearchInput } from "@/components/onco/ui/SearchInput";
import { Select } from "@/components/onco/ui/Select";
import { Tabs } from "@/components/onco/ui/Tabs";
import { AiAgentIcon } from "@/components/onco/ui/icons";
import { AiUsageCostPanel, type AiUsageSummary } from "@/components/onco/operations/AiUsageCostPanel";
import { OperationsShell } from "@/components/onco/operations/OperationsShell";
import { ReportsUsageTable, type AiUsageRow } from "@/components/onco/operations/ReportsUsageTable";
import { demoStore, useDemoStore } from "@/lib/onco/demo/demo-store";
import type {
  AlertSeverity,
  DemoAlert,
  DemoPatient,
  MetCatalogItem,
  PlatformSite,
  ProgramSession,
  PromptRegistryItem,
  SiteRequest,
  TeamMember,
} from "@/lib/onco/demo/demo-types";

const doctorNav = [
  { label: "Overview", href: "/doctor" },
  { label: "Patients", href: "/doctor/patients" },
  { label: "Alerts", href: "/doctor/alerts" },
];

const adminNav = [
  { label: "Overview", href: "/admin" },
  { label: "Team", href: "/admin/team" },
  { label: "Patients", href: "/admin/patients" },
  { label: "Program Config", href: "/admin/program-config" },
  { label: "MET Catalog", href: "/admin/met-catalog" },
  { label: "Symptom Rules", href: "/admin/symptom-rules" },
  { label: "AI Prompts", href: "/admin/prompts" },
  { label: "Analytics", href: "/admin/analytics" },
  { label: "AI Usage & Reports", href: "/admin/ai-usage" },
  { label: "Billing", href: "/admin/billing" },
  { label: "Audit", href: "/admin/audit" },
];

const providerNav = [
  { label: "Platform Overview", href: "/app-provider" },
  { label: "Site Requests", href: "/app-provider/site-requests" },
  { label: "Sites", href: "/app-provider/sites" },
  { label: "Platform Analytics", href: "/app-provider/analytics" },
  { label: "Global AI Usage", href: "/app-provider/ai-usage" },
  { label: "Global Prompt Registry", href: "/app-provider/prompts" },
  { label: "Audit Logs", href: "/app-provider/audit" },
  { label: "Billing & Operations", href: "/app-provider/billing" },
];

export function DoctorDashboard({ view, patientId }: { view: "overview" | "patients" | "patient" | "prescription" | "summary" | "alerts"; patientId?: string }) {
  const state = useDemoStore();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All patients");
  const [sort, setSort] = useState("Last activity");
  const [severity, setSeverity] = useState<AlertSeverity | "All">("All");
  const [patientFilter, setPatientFilter] = useState("All");
  const [dateRange, setDateRange] = useState("30 days");
  const [alertType, setAlertType] = useState("All");
  const patient = state.patients.find((item) => item.id === patientId) || state.patients[0];

  const roster = useMemo(() => {
    const lower = query.toLowerCase();
    const filtered = state.patients.filter((item) => {
      const phaseMatch = filter.startsWith("Phase") ? item.phase === filter : true;
      const statusMatch =
        filter === "All patients" ||
        (filter === "Red flags" && item.prescriptionStatus === "alert") ||
        (filter === "Low adherence" && item.prescriptionStatus === "low-adherence") ||
        (filter === "Pending prescription" && item.prescriptionStatus === "pending-approval") ||
        phaseMatch;
      return item.name.toLowerCase().includes(lower) && statusMatch;
    });
    return [...filtered].sort((a, b) => {
      if (sort === "Adherence") return b.adherence - a.adherence;
      if (sort === "MET-hours") return b.prescription.metHours - a.prescription.metHours;
      if (sort === "Alert severity") return Number(b.prescriptionStatus === "alert") - Number(a.prescriptionStatus === "alert");
      return b.activeDays - a.activeDays;
    });
  }, [filter, query, sort, state.patients]);

  const alertList = state.alerts.filter((alert) => {
    const p = state.patients.find((item) => item.id === alert.patientId);
    const severityMatch = severity === "All" || alert.severity === severity;
    const patientMatch = patientFilter === "All" || p?.name === patientFilter;
    const typeMatch = alertType === "All" || alert.title.toLowerCase().includes(alertType.toLowerCase());
    return severityMatch && patientMatch && typeMatch;
  });

  return (
    <DashboardShell title="Doctor workspace" nav={doctorNav} allowedRoles={["doctor", "care-team"]}>
      {view === "overview" ? <DoctorOverview patients={state.patients} alerts={state.alerts} /> : null}
      {view === "patients" ? (
        <Card>
          <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_210px_190px]">
            <SearchInput label="Search patients" value={query} onChange={setQuery} placeholder="Search patient roster..." />
            <Select label="Filter" value={filter} onChange={setFilter} options={["All patients", "Red flags", "Low adherence", "Pending prescription", "Phase 1", "Phase 2", "Phase 3"].map((value) => ({ label: value, value }))} />
            <Select label="Sort" value={sort} onChange={setSort} options={["Last activity", "Adherence", "MET-hours", "Alert severity"].map((value) => ({ label: value, value }))} />
          </div>
          <PatientRosterTable patients={roster} />
        </Card>
      ) : null}
      {view === "patient" ? <DoctorPatientDetail patient={patient} /> : null}
      {view === "prescription" ? <PrescriptionBuilder patient={patient} /> : null}
      {view === "summary" ? <DoctorSummary patient={patient} /> : null}
      {view === "alerts" ? (
        <Card>
          <div className="mb-4 grid gap-3 lg:grid-cols-4">
            <Select label="Severity" value={severity} onChange={setSeverity} options={["All", "low", "medium", "high", "critical"].map((value) => ({ label: value, value: value as AlertSeverity | "All" }))} />
            <Select label="Patient" value={patientFilter} onChange={setPatientFilter} options={["All", ...state.patients.map((item) => item.name)].map((value) => ({ label: value, value }))} />
            <Select label="Date range" value={dateRange} onChange={setDateRange} options={["7 days", "30 days", "90 days", "All time"].map((value) => ({ label: value, value }))} />
            <Select label="Alert type" value={alertType} onChange={setAlertType} options={["All", "Dizziness", "Low adherence", "Prescription"].map((value) => ({ label: value, value }))} />
          </div>
          <AlertGroups alerts={alertList} patients={state.patients} />
        </Card>
      ) : null}
    </DashboardShell>
  );
}

function DoctorOverview({ patients, alerts }: { patients: DemoPatient[]; alerts: DemoAlert[] }) {
  const state = useDemoStore();
  const reviewRequest = state.doctorSummary.reviewRequest;
  const pending = patients.filter((patient) => patient.prescriptionStatus === "pending-approval").length;
  const avgAdherence = Math.round(patients.reduce((sum, patient) => sum + patient.adherence, 0) / patients.length);
  const avgMet = (patients.reduce((sum, patient) => sum + patient.prescription.metHours, 0) / patients.length).toFixed(1);
  const attention = patients.filter((patient) => ["alert", "pending-approval", "low-adherence"].includes(patient.prescriptionStatus));
  return (
    <div className="space-y-5">
      <Card tone="sage" className="p-6">
        <p className="text-[#A9C5B4]">Good morning, Dr. Chen</p>
        <h2 className="onco-display mt-2 text-4xl font-extrabold">Three patients need attention today.</h2>
      </Card>
      <div className="grid gap-4 md:grid-cols-5">
        <MetricTrendCard label="Active patients" value={String(patients.length)} trend="+2 this month" />
        <MetricTrendCard label="Patients with alerts" value={String(alerts.length)} trend="Review today" />
        <MetricTrendCard label="Average adherence" value={`${avgAdherence}%`} trend="+4%" />
        <MetricTrendCard label="Avg weekly MET-hours" value={avgMet} trend="steady" />
        <MetricTrendCard label="Pending approvals" value={String(pending)} trend="1 new" />
      </div>
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="onco-display text-xl font-extrabold">Today's attention list</h2>
          <div className="flex flex-wrap gap-2">
            <Link className="onco-button-outline" href="/doctor/patients">View patient roster</Link>
            <Link className="onco-button-outline" href="/doctor/alerts">Review alerts</Link>
            <Button icon={<AiAgentIcon />} onClick={() => demoStore.toast("Visit summary generated")}>Generate visit summary</Button>
          </div>
        </div>
        <PatientRosterTable patients={attention} />
      </Card>
      {reviewRequest ? (
        <Card>
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="onco-display text-xl font-extrabold">Patient review request</h2>
              <p className="mt-1 text-sm text-onco-muted">Shared {reviewRequest.sharedAt || "just now"} from the patient app.</p>
            </div>
            <Badge tone="sand">{reviewRequest.status === "waiting-review" ? "Waiting review" : "Reviewed"}</Badge>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <SummaryLine label="Patient" value={`${reviewRequest.patientName} - ${reviewRequest.patientEmail}`} />
            <SummaryLine label="Doctor / clinic" value={`${reviewRequest.doctorName} - ${reviewRequest.clinicName}`} />
            <SummaryLine label="Context" value={reviewRequest.context} />
            <SummaryLine label="Baseline" value={reviewRequest.baseline} />
            <SummaryLine label="Preferences" value={reviewRequest.preferences} />
            <SummaryLine label="Barriers" value={reviewRequest.barriers} />
            <SummaryLine label="Proposed prescription" value={reviewRequest.prescription} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => demoStore.toast("Plan approved and patient notified")}>Approve plan</Button>
            <Button variant="outline" onClick={() => demoStore.toast("Edit prescription opened")}>Modify plan</Button>
          </div>
        </Card>
      ) : null}
      <Card>
        <h2 className="onco-display text-xl font-extrabold">Recent patient summaries</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {patients.slice(0, 3).map((patient) => <PatientSummaryCard patient={patient} key={patient.id} />)}
        </div>
      </Card>
    </div>
  );
}

function DoctorPatientDetail({ patient }: { patient: DemoPatient }) {
  return (
    <div className="space-y-5">
      <PatientSummaryCard patient={patient} />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card><h2 className="onco-display text-xl font-extrabold">Weekly minutes</h2><ActivityChart values={[5, 12, 20, patient.prescription.minutes * patient.prescription.daysPerWeek]} /></Card>
        <Card><h2 className="onco-display text-xl font-extrabold">Weekly MET-hours</h2><ActivityChart accent="terracotta" values={[0.4, 0.9, 1.3, patient.prescription.metHours]} /></Card>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <SymptomTimeline symptoms={[...patient.flags, patient.prescriptionStatus === "alert" ? "red-flag symptom alert" : "No new red flags"]} />
        <Card>
          <h2 className="onco-display flex items-center gap-2 text-xl font-extrabold"><AiAgentIcon className="text-onco-sage" />Artie AI flags</h2>
          <div className="mt-3 flex flex-wrap gap-2">{patient.flags.map((flag) => <Badge tone="sand" key={flag}>{flag}</Badge>)}</div>
          <p className="mt-4 text-sm text-onco-muted">Session completion: 2 of 3 available sessions completed.</p>
        </Card>
      </div>
      <Card>
        <h2 className="onco-display mb-4 text-xl font-extrabold">Activity log</h2>
        <DataTable rows={[{ id: "1", activity: patient.prescription.activity, minutes: patient.prescription.minutes, date: "This week" }]} getKey={(row) => row.id} columns={[
          { header: "Date", cell: (row) => row.date },
          { header: "Activity", cell: (row) => row.activity },
          { header: "Minutes", cell: (row) => row.minutes },
        ]} />
      </Card>
    </div>
  );
}

function DoctorSummary({ patient }: { patient: DemoPatient }) {
  const text = `${patient.name}: ${patient.cancerType}, ${patient.treatmentStatus}. Prescription ${patient.prescription.activity} ${patient.prescription.minutes} min, ${patient.prescription.daysPerWeek} days/week. Adherence ${patient.adherence}%.`;
  return (
    <Card className="space-y-4">
      <h2 className="onco-display flex items-center gap-2 text-2xl font-extrabold"><AiAgentIcon className="text-onco-sage" />One-page doctor summary</h2>
      {[
        ["Patient context", `${patient.cancerType}, ${patient.treatmentStatus}, ${patient.phase}`],
        ["Current prescription", `${patient.prescription.activity} · ${patient.prescription.daysPerWeek} days/wk · ${patient.prescription.minutes} min · ${patient.prescription.metHours} MET-hours`],
        ["Adherence", `${patient.adherence}% · ${patient.activeDays} active days`],
        ["Symptoms and barriers", patient.flags.join(", ")],
        ["Safety flags", patient.prescriptionStatus === "alert" ? "Open red-flag symptom alert" : "No open red-flag alerts"],
        ["Questions for doctor", "Activity restrictions? Neuropathy fall risk? Stop symptoms?"],
      ].map(([label, value]) => <SummaryLine key={label} label={label} value={value} />)}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => { void navigator.clipboard?.writeText(text); demoStore.toast("Copied for MyChart"); }}>Copy for MyChart</Button>
        <Button variant="outline" onClick={() => window.print()}>Print</Button>
        <Button variant="outline" onClick={() => demoStore.toast("PDF export will be connected in backend phase.", "info")}>Download PDF demo</Button>
        <Button variant="outline" onClick={() => demoStore.toast("Summary marked shared")}>Mark shared</Button>
      </div>
    </Card>
  );
}

function AlertGroups({ alerts, patients }: { alerts: DemoAlert[]; patients: DemoPatient[] }) {
  const groups = [
    ["Red-flag symptoms", alerts.filter((alert) => alert.severity === "critical")],
    ["Low adherence", alerts.filter((alert) => alert.title.toLowerCase().includes("adherence"))],
    ["AI escalations", alerts.filter((alert) => alert.detail.toLowerCase().includes("artie") || alert.severity === "high")],
    ["Pending prescription approvals", alerts.filter((alert) => alert.title.toLowerCase().includes("prescription"))],
  ] as const;
  return <div className="space-y-5">{groups.map(([title, rows]) => <div key={title}><h2 className="onco-display mb-3 text-lg font-extrabold">{title}</h2>{rows.length ? <AlertList alerts={rows} patients={patients} /> : <EmptyState title="No alerts" description={`No ${title.toLowerCase()} right now.`} />}</div>)}</div>;
}

export function AdminDashboard({ view }: { view: "overview" | "team" | "patients" | "program" | "met" | "symptom-rules" | "prompts" | "analytics" | "ai-usage" | "billing" | "audit" }) {
  const state = useDemoStore();
  return (
    <OperationsShell title="Site admin console" nav={adminNav} allowedRoles={["admin"]} scope="site">
      {view === "overview" ? <AdminOverview /> : null}
      {view === "team" ? <AdminTeam /> : null}
      {view === "patients" ? <AdminPatients /> : null}
      {view === "program" ? <ProgramConfig /> : null}
      {view === "met" ? <MetCatalog /> : null}
      {view === "symptom-rules" ? <SymptomRules /> : null}
      {view === "prompts" ? <PromptRegistry /> : null}
      {view === "analytics" ? <Analytics /> : null}
      {view === "ai-usage" ? <AiUsageDashboard scope="site" /> : null}
      {view === "billing" ? <BillingOperations scope="site" /> : null}
      {view === "audit" ? <AdminAudit /> : null}
      <span className="sr-only">{state.site.name}</span>
    </OperationsShell>
  );
}

function AdminOverview() {
  const state = useDemoStore();
  const doctors = state.teamMembers.filter((member) => member.role === "Doctor").length;
  const careTeam = state.teamMembers.filter((member) => member.role === "Care Team").length;
  const avgAdherence = Math.round(state.patients.reduce((sum, patient) => sum + patient.adherence, 0) / state.patients.length);
  return (
    <div className="space-y-5">
      <Card tone="sage"><h2 className="onco-display text-3xl font-extrabold">Green Valley Oncology Center</h2><p className="mt-2 text-[#C7D8CC]">Austin, TX · Active · Invite code {state.site.inviteCode}</p></Card>
      <div className="grid gap-4 md:grid-cols-6">
        <MetricTrendCard label="Total patients" value={String(state.patients.length)} trend="demo roster" />
        <MetricTrendCard label="Active patients" value={String(state.patients.filter((p) => p.prescriptionStatus !== "pending-approval").length)} trend="active plans" />
        <MetricTrendCard label="Doctors" value={String(doctors)} trend="1 invited" />
        <MetricTrendCard label="Care team" value={String(careTeam)} trend="RN support" />
        <MetricTrendCard label="Avg adherence" value={`${avgAdherence}%`} trend="site average" />
        <MetricTrendCard label="Red flags" value={String(state.alerts.filter((a) => a.severity === "critical").length)} trend="needs review" />
      </div>
      <Card>
        <h2 className="onco-display mb-3 text-xl font-extrabold">Quick actions</h2>
        <div className="flex flex-wrap gap-2">
          {["Invite doctor", "Add patient", "Generate enrollment code", "Edit program config"].map((label) => <Button key={label} variant="outline" onClick={() => demoStore.toast(label === "Invite doctor" ? "Demo invite created. Email sending will be connected in backend phase." : `${label} opened`)}>{label}</Button>)}
        </div>
      </Card>
    </div>
  );
}

function AdminTeam() {
  const { teamMembers } = useDemoStore();
  const [modal, setModal] = useState(false);
  return (
    <Card>
      <div className="mb-4 flex justify-between"><h2 className="onco-display text-xl font-extrabold">Team</h2><Button onClick={() => setModal(true)}>Add member</Button></div>
      <DataTable rows={teamMembers} getKey={(member) => member.id} columns={[
        { header: "Name", cell: (member) => member.name },
        { header: "Email", cell: (member) => member.email },
        { header: "Role", cell: (member) => <Badge>{member.role}</Badge> },
        { header: "Specialty", cell: (member) => member.specialty },
        { header: "Actions", cell: (member) => <div className="flex gap-2"><Button variant="outline" onClick={() => demoStore.toast("Edit member opened")}>Edit</Button><Button variant="outline" onClick={() => demoStore.updateTeamMember(member.id, { status: "Inactive" })}>Deactivate</Button><Button variant="outline" onClick={() => demoStore.toast("Demo invite created. Email sending will be connected in backend phase.")}>Resend invite</Button></div> },
      ]} />
      <TeamModal open={modal} onClose={() => setModal(false)} />
    </Card>
  );
}

function TeamModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState("New Clinician");
  const [email, setEmail] = useState("new@gvoc.example");
  const [role, setRole] = useState<TeamMember["role"]>("Doctor");
  const [specialty, setSpecialty] = useState("Medical oncology");
  return <Modal open={open} title="Add member" onClose={onClose}><input className="onco-input" value={name} onChange={(e) => setName(e.target.value)} /><input className="onco-input mt-3" value={email} onChange={(e) => setEmail(e.target.value)} /><Select className="mt-3 block" label="Role" value={role} onChange={setRole} options={["Doctor", "Care Team", "Site Admin"].map((value) => ({ label: value, value: value as TeamMember["role"] }))} /><input className="onco-input mt-3" value={specialty} onChange={(e) => setSpecialty(e.target.value)} /><Button className="mt-4" onClick={() => { demoStore.addTeamMember({ name, email, role, specialty }); demoStore.toast("Demo invite created. Email sending will be connected in backend phase."); onClose(); }}>Invite member</Button></Modal>;
}

function AdminPatients() {
  const state = useDemoStore();
  const [modal, setModal] = useState<"add" | "code" | null>(null);
  return <Card><div className="mb-4 flex flex-wrap justify-between gap-2"><h2 className="onco-display text-xl font-extrabold">Site patients</h2><div className="flex gap-2"><Button onClick={() => setModal("add")}>Add/link patient</Button><Button variant="outline" onClick={() => setModal("code")}>Generate Care Code</Button></div></div><PatientRosterTable patients={state.patients} /><Modal open={modal === "add"} title="Add/link patient" onClose={() => setModal(null)}><Select label="Assign doctor" value="Dr. Maya Chen" onChange={() => undefined} options={["Dr. Maya Chen", "Jordan Lee, RN"].map((value) => ({ label: value, value }))} /><Button className="mt-4" onClick={() => { demoStore.toast("Patient linked to site"); setModal(null); }}>Save</Button></Modal><Modal open={modal === "code"} title="Care Code" onClose={() => setModal(null)}><p className="onco-display text-3xl font-bold">SAM-GVOC-7429</p><Button className="mt-4" onClick={() => { demoStore.toast("Care Code generated"); setModal(null); }}>Done</Button></Modal></Card>;
}

function ProgramConfig() {
  const { programSessions } = useDemoStore();
  const [editing, setEditing] = useState<ProgramSession | null>(null);
  return <Card><h2 className="onco-display mb-4 text-xl font-extrabold">Phase 1 sessions</h2><DataTable rows={programSessions} getKey={(session) => session.id} columns={[
    { header: "#", cell: (session) => session.number },
    { header: "Title", cell: (session) => session.title },
    { header: "Minutes", cell: (session) => session.estimatedMinutes },
    { header: "Status", cell: (session) => <Badge tone={session.active ? "sage" : "sand"}>{session.active ? "Active" : "Inactive"}</Badge> },
    { header: "Actions", cell: (session) => <div className="flex gap-2"><Button variant="outline" onClick={() => setEditing(session)}>Edit</Button><Button variant="outline" onClick={() => demoStore.updateProgramSession(session.id, { active: !session.active })}>Toggle</Button></div> },
  ]} /><SessionModal session={editing} onClose={() => setEditing(null)} /></Card>;
}

function SessionModal({ session, onClose }: { session: ProgramSession | null; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [minutes, setMinutes] = useState("8");
  const [points, setPoints] = useState("");
  if (session && title === "") { setTitle(session.title); setDescription(session.description); setMinutes(String(session.estimatedMinutes)); setPoints(session.talkingPoints); }
  return <Modal open={Boolean(session)} title="Edit session" onClose={onClose}><input className="onco-input" value={title} onChange={(e) => setTitle(e.target.value)} /><textarea className="onco-input mt-3" value={description} onChange={(e) => setDescription(e.target.value)} /><input className="onco-input mt-3" type="number" value={minutes} onChange={(e) => setMinutes(e.target.value)} /><textarea className="onco-input mt-3" value={points} onChange={(e) => setPoints(e.target.value)} /><Button className="mt-4" onClick={() => { if (session) demoStore.updateProgramSession(session.id, { title, description, estimatedMinutes: Number(minutes), talkingPoints: points }); demoStore.toast("Session updated"); onClose(); }}>Save</Button></Modal>;
}

function MetCatalog() {
  const { metCatalog } = useDemoStore();
  const [editing, setEditing] = useState<MetCatalogItem | null>(null);
  return <Card><div className="mb-4 flex justify-between"><h2 className="onco-display text-xl font-extrabold">Activity MET catalog</h2><Button onClick={() => setEditing({ id: "", activity: "New activity", type: "Walking", intensity: "Easy", met: 2.5, active: true })}>Add activity</Button></div><DataTable rows={metCatalog} getKey={(item) => item.id} columns={[
    { header: "Activity", cell: (item) => item.activity },
    { header: "Type", cell: (item) => item.type },
    { header: "Intensity", cell: (item) => item.intensity },
    { header: "MET", cell: (item) => item.met },
    { header: "Active", cell: (item) => <Badge>{item.active ? "Active" : "Inactive"}</Badge> },
    { header: "Action", cell: (item) => <Button variant="outline" onClick={() => setEditing(item)}>Edit</Button> },
  ]} /><MetModal item={editing} onClose={() => setEditing(null)} /></Card>;
}

function MetModal({ item, onClose }: { item: MetCatalogItem | null; onClose: () => void }) {
  const [draft, setDraft] = useState<MetCatalogItem | null>(null);
  if (item && !draft) setDraft(item);
  if (!draft) return null;
  return <Modal open={Boolean(item)} title="MET activity" onClose={() => { setDraft(null); onClose(); }}><input className="onco-input" value={draft.activity} onChange={(e) => setDraft({ ...draft, activity: e.target.value })} /><Select className="mt-3 block" label="Activity type" value={draft.type} onChange={(type) => setDraft({ ...draft, type })} options={["Walking", "Gardening", "Cycling", "Swimming", "Stretching", "Resistance training"].map((value) => ({ label: value, value }))} /><Select className="mt-3 block" label="Intensity" value={draft.intensity} onChange={(intensity) => setDraft({ ...draft, intensity })} options={["Very easy", "Easy", "Easy-to-moderate", "Moderate"].map((value) => ({ label: value, value }))} /><input className="onco-input mt-3" type="number" value={draft.met} onChange={(e) => setDraft({ ...draft, met: Number(e.target.value) })} /><Button className="mt-4" onClick={() => { draft.id ? demoStore.updateMetCatalogItem(draft.id, draft) : demoStore.addMetCatalogItem(draft); demoStore.toast("MET catalog updated"); setDraft(null); onClose(); }}>Save</Button></Modal>;
}

type SymptomRule = {
  id: string;
  symptom: string;
  trigger: string;
  action: string;
  status: "Live" | "Review" | "Draft";
};

const symptomRules: SymptomRule[] = [
  { id: "rule-chest", symptom: "Chest pain or pressure", trigger: "Any report during session or walk check-in", action: "Pause plan, show safety message, notify care team", status: "Live" },
  { id: "rule-breath", symptom: "Severe shortness of breath", trigger: "Patient selects severe breathlessness", action: "Recommend immediate clinical review", status: "Live" },
  { id: "rule-dizzy", symptom: "Dizziness or lightheadedness", trigger: "Repeated dizziness or fall concern", action: "Create high-priority Artie escalation", status: "Live" },
  { id: "rule-fever", symptom: "Fever", trigger: "Fever selected during active treatment", action: "Hold progression until doctor review", status: "Review" },
  { id: "rule-pain", symptom: "Uncontrolled pain", trigger: "Pain blocks usual daily activity", action: "Reduce plan and route to care team", status: "Draft" },
];

function SymptomRules() {
  const [selected, setSelected] = useState<SymptomRule | null>(null);
  return (
    <div className="space-y-5">
      <Card tone="sage">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="onco-display text-3xl font-extrabold">Symptom Rules</h2>
            <p className="mt-2 text-[#C7D8CC]">Site-level safety rules that decide when Artie pauses movement and asks for review.</p>
          </div>
          <Button variant="cream" onClick={() => demoStore.toast("Rule builder will be connected in backend phase.", "info")}>New rule</Button>
        </div>
      </Card>
      <div className="grid gap-4 md:grid-cols-3">
        <MetricTrendCard label="Live rules" value={String(symptomRules.filter((rule) => rule.status === "Live").length)} trend="safety triage" />
        <MetricTrendCard label="Needs review" value={String(symptomRules.filter((rule) => rule.status === "Review").length)} trend="clinical approval" />
        <MetricTrendCard label="Draft rules" value={String(symptomRules.filter((rule) => rule.status === "Draft").length)} trend="not active" />
      </div>
      <Card>
        <DataTable rows={symptomRules} getKey={(rule) => rule.id} columns={[
          { header: "Symptom", cell: (rule) => rule.symptom },
          { header: "Trigger", cell: (rule) => rule.trigger },
          { header: "Action", cell: (rule) => rule.action },
          { header: "Status", cell: (rule) => <Badge tone={rule.status === "Live" ? "sage" : rule.status === "Review" ? "sand" : "cream"}>{rule.status}</Badge> },
          { header: "Review", cell: (rule) => <Button variant="outline" onClick={() => setSelected(rule)}>Open</Button> },
        ]} />
      </Card>
      <Modal open={Boolean(selected)} title={selected?.symptom || "Rule"} onClose={() => setSelected(null)}>
        <p className="text-sm text-onco-muted">{selected?.action}</p>
        <Button className="mt-4" onClick={() => { demoStore.toast("Rule review saved"); setSelected(null); }}>Mark reviewed</Button>
      </Modal>
    </div>
  );
}

function PromptRegistry({ title = "AI Prompt Registry", description = "Prompt preview only. No real AI calls in this demo." }: { title?: string; description?: string }) {
  const { promptRegistry } = useDemoStore();
  const [prompt, setPrompt] = useState<PromptRegistryItem | null>(null);
  return <Card><h2 className="onco-display mb-2 flex items-center gap-2 text-xl font-extrabold"><AiAgentIcon className="text-onco-sage" />{title}</h2><p className="mb-4 text-sm text-onco-muted">{description}</p><PromptVersionTable prompts={promptRegistry} onView={setPrompt} /><Modal open={Boolean(prompt)} title={prompt?.key || "Prompt"} onClose={() => setPrompt(null)}><p className="text-sm text-onco-muted">{description}</p><Button className="mt-4" onClick={() => setPrompt(null)}>Close</Button></Modal></Card>;
}

function Analytics() {
  const [range, setRange] = useState("30 days");
  return <div className="space-y-5"><Select label="Date range" value={range} onChange={setRange} options={["7 days", "30 days", "90 days", "All time"].map((value) => ({ label: value, value }))} /><div className="grid gap-5 lg:grid-cols-2">{["Enrollment trend", "Adherence trend", "MET-hours trend", "Symptom trend", "Session completion", "Artie usage"].map((title, index) => <Card key={title}><h2 className="onco-display mb-4 text-xl font-extrabold">{title}</h2><ActivityChart accent={index % 2 ? "terracotta" : "sage"} values={[4 + index, 8 + index, 6 + index, 12 + index]} /></Card>)}</div></div>;
}

export function ProviderDashboard({ view, siteId }: { view: "overview" | "requests" | "sites" | "site" | "analytics" | "prompts" | "audit" | "ai-usage" | "billing"; siteId?: string }) {
  return (
    <OperationsShell title="Platform provider console" nav={providerNav} allowedRoles={["app-provider"]} scope="platform">
      {view === "overview" ? <ProviderOverview /> : null}
      {view === "requests" ? <ProviderRequests /> : null}
      {view === "sites" ? <ProviderSites /> : null}
      {view === "site" ? <ProviderSiteDetail siteId={siteId || "gvoc"} /> : null}
      {view === "analytics" ? <PlatformAnalytics /> : null}
      {view === "prompts" ? <PromptRegistry title="Global Prompt Registry" description="Platform prompt registry across Artie, safety triage, prescriptions, and summaries." /> : null}
      {view === "audit" ? <ProviderAudit /> : null}
      {view === "ai-usage" ? <AiUsageDashboard scope="platform" /> : null}
      {view === "billing" ? <BillingOperations scope="platform" /> : null}
    </OperationsShell>
  );
}

function ProviderOverview() {
  const state = useDemoStore();
  return <div className="space-y-5"><div className="grid gap-4 md:grid-cols-5"><MetricTrendCard label="Total sites" value={String(state.platformSites.length)} trend="3 demo sites" /><MetricTrendCard label="Pending requests" value={String(state.siteRequests.filter((r) => r.status === "Pending review").length)} trend="review queue" /><MetricTrendCard label="Active patients" value={String(state.platformSites.reduce((sum, site) => sum + site.patients, 0))} trend="across sites" /><MetricTrendCard label="AI usage demo" value="1.2k" trend="messages" /><MetricTrendCard label="Red flags" value={String(state.alerts.length)} trend="all sites" /></div><Card><div className="flex flex-wrap gap-2"><Link className="onco-button-primary" href="/app-provider/site-requests">Review site requests</Link><Link className="onco-button-outline" href="/app-provider/sites">View sites</Link><Link className="onco-button-outline" href="/app-provider/audit">View audit log</Link></div></Card></div>;
}

function ProviderRequests() {
  const { siteRequests } = useDemoStore();
  const [tab, setTab] = useState("Pending review");
  const [approve, setApprove] = useState<SiteRequest | null>(null);
  const [reject, setReject] = useState<SiteRequest | null>(null);
  const [view, setView] = useState<SiteRequest | null>(null);
  return <Card><Tabs value={tab} onChange={setTab} items={["Pending review", "Approved", "Rejected"].map((value) => ({ label: value, value }))} /><div className="mt-4"><SiteRequestQueue requests={siteRequests.filter((request) => request.status === tab)} onApprove={setApprove} onReject={setReject} onView={setView} /></div><ApproveRequestModal request={approve} onClose={() => setApprove(null)} /><RejectRequestModal request={reject} onClose={() => setReject(null)} /><Modal open={Boolean(view)} title={view?.siteName || "Request"} onClose={() => setView(null)}><p className="text-sm text-onco-muted">{view?.adminName} · {view?.adminEmail} · {view?.cityState}</p></Modal></Card>;
}

function ApproveRequestModal({ request, onClose }: { request: SiteRequest | null; onClose: () => void }) {
  return <Modal open={Boolean(request)} title="Approve site request" onClose={onClose}><p className="text-sm text-onco-muted">Confirm {request?.siteName}. Assign admin {request?.adminName}. Generate invite code {request?.inviteCode}.</p><Button className="mt-4" onClick={() => { if (request) demoStore.updateSiteRequest(request.id, { status: "Approved" }); demoStore.toast("Demo invite created. Email sending will be connected in backend phase."); onClose(); }}>Approve</Button></Modal>;
}

function RejectRequestModal({ request, onClose }: { request: SiteRequest | null; onClose: () => void }) {
  const [reason, setReason] = useState("Needs complete clinic verification.");
  return <Modal open={Boolean(request)} title="Reject site request" onClose={onClose}><textarea className="onco-input" value={reason} onChange={(e) => setReason(e.target.value)} /><Button className="mt-4" variant="outline" onClick={() => { if (request) demoStore.updateSiteRequest(request.id, { status: "Rejected", rejectionReason: reason }); demoStore.toast("Request rejected", "warning"); onClose(); }}>Reject</Button></Modal>;
}

function ProviderSites() {
  const { platformSites } = useDemoStore();
  const [filter, setFilter] = useState("Active");
  const rows = platformSites.filter((site) => filter === "All" || site.status === filter);
  return <Card><Select label="Status filter" value={filter} onChange={setFilter} options={["All", "Active", "Pending", "Suspended"].map((value) => ({ label: value, value }))} /><div className="mt-4"><SiteTable sites={rows} /></div></Card>;
}

function ProviderSiteDetail({ siteId }: { siteId: string }) {
  const state = useDemoStore();
  const site = state.platformSites.find((item) => item.id === siteId) || state.platformSites[0];
  return <div className="space-y-5"><Card tone="sage"><h2 className="onco-display text-3xl font-extrabold">{site.name}</h2><p className="mt-2 text-[#C7D8CC]">{site.admin} · {site.status} · Created {site.createdDate}</p></Card><div className="grid gap-4 md:grid-cols-4"><MetricTrendCard label="Members" value={String(site.doctors + 2)} trend="demo count" /><MetricTrendCard label="Patients" value={String(site.patients)} trend="site total" /><MetricTrendCard label="Alerts" value={String(state.alerts.length)} trend="open" /><MetricTrendCard label="Usage" value="420" trend="AI messages" /></div><Card><h2 className="onco-display mb-4 text-xl font-extrabold">Recent audit events</h2><AuditTable events={state.auditEvents.filter((event) => event.site === site.name || site.id === "gvoc")} /></Card><div className="flex flex-wrap gap-2"><Button onClick={() => demoStore.toast("Edit site opened")}>Edit site</Button><Button variant="outline" onClick={() => demoStore.updatePlatformSite(site.id, { status: "Suspended" })}>Suspend site</Button><Button variant="outline" onClick={() => demoStore.toast("Members panel opened")}>View members</Button></div></div>;
}

function SiteTable({ sites }: { sites: PlatformSite[] }) {
  return <DataTable rows={sites} getKey={(site) => site.id} columns={[
    { header: "Site name", cell: (site) => <Link className="font-semibold text-onco-sage" href={`/app-provider/sites/${site.id}`}>{site.name}</Link> },
    { header: "Admin", cell: (site) => site.admin },
    { header: "Patients", cell: (site) => site.patients },
    { header: "Doctors", cell: (site) => site.doctors },
    { header: "Status", cell: (site) => <Badge tone={site.status === "Suspended" ? "danger" : site.status === "Pending" ? "sand" : "sage"}>{site.status}</Badge> },
    { header: "Created", cell: (site) => site.createdDate },
    { header: "Actions", cell: (site) => <div className="flex gap-2"><Link className="onco-button-outline min-h-0 py-2" href={`/app-provider/sites/${site.id}`}>View site</Link><Button variant="outline" onClick={() => demoStore.updatePlatformSite(site.id, { status: site.status === "Suspended" ? "Active" : "Suspended" })}>{site.status === "Suspended" ? "Reactivate demo" : "Suspend demo"}</Button></div> },
  ]} />;
}

function ProviderAudit() {
  const state = useDemoStore();
  const [site, setSite] = useState("All");
  const [actor, setActor] = useState("All");
  const [action, setAction] = useState("All");
  const [range, setRange] = useState("30 days");
  const rows = state.auditEvents.filter((event) => (site === "All" || event.site === site) && (actor === "All" || event.actor === actor) && (action === "All" || event.action.includes(action)));
  return <Card><div className="mb-4 grid gap-3 lg:grid-cols-4"><Select label="Site" value={site} onChange={setSite} options={["All", ...state.platformSites.map((s) => s.name)].map((value) => ({ label: value, value }))} /><Select label="Actor" value={actor} onChange={setActor} options={["All", ...state.auditEvents.map((e) => e.actor)].map((value) => ({ label: value, value }))} /><Select label="Action type" value={action} onChange={setAction} options={["All", "Approved", "Safety", "Generated", "Marked"].map((value) => ({ label: value, value }))} /><Select label="Date range" value={range} onChange={setRange} options={["7 days", "30 days", "90 days", "All time"].map((value) => ({ label: value, value }))} /></div><AuditTable events={rows} /></Card>;
}

function AdminAudit() {
  const state = useDemoStore();
  const [actor, setActor] = useState("All");
  const [action, setAction] = useState("All");
  const [range, setRange] = useState("30 days");
  const siteEvents = state.auditEvents.filter((event) => event.site === state.site.name);
  const actors = Array.from(new Set(siteEvents.map((event) => event.actor)));
  const rows = siteEvents.filter((event) => (actor === "All" || event.actor === actor) && (action === "All" || event.action.includes(action)));
  return (
    <Card>
      <div className="mb-4 grid gap-3 lg:grid-cols-3">
        <Select label="Actor" value={actor} onChange={setActor} options={["All", ...actors].map((value) => ({ label: value, value }))} />
        <Select label="Action type" value={action} onChange={setAction} options={["All", "Safety", "Generated", "Marked"].map((value) => ({ label: value, value }))} />
        <Select label="Date range" value={range} onChange={setRange} options={["7 days", "30 days", "90 days", "All time"].map((value) => ({ label: value, value }))} />
      </div>
      <AuditTable events={rows} />
    </Card>
  );
}

function PlatformAnalytics() {
  const state = useDemoStore();
  const activePatients = state.platformSites.reduce((sum, site) => sum + site.patients, 0);
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-4">
        <MetricTrendCard label="Sites live" value={String(state.platformSites.filter((site) => site.status === "Active").length)} trend="active installs" />
        <MetricTrendCard label="Patients" value={String(activePatients)} trend="platform total" />
        <MetricTrendCard label="Avg site patients" value={String(Math.round(activePatients / state.platformSites.length))} trend="demo average" />
        <MetricTrendCard label="Safety events" value={String(state.auditEvents.filter((event) => event.action.includes("Safety")).length)} trend="needs review" />
      </div>
      <Analytics />
    </div>
  );
}

function AuditTable({ events }: { events: ReturnType<typeof useDemoStore>["auditEvents"] }) {
  return <DataTable rows={events} getKey={(event) => event.id} columns={[
    { header: "Timestamp", cell: (event) => event.timestamp },
    { header: "Actor", cell: (event) => event.actor },
    { header: "Action", cell: (event) => event.action },
    { header: "Entity", cell: (event) => event.entity },
    { header: "Status", cell: (event) => <Badge tone={event.status === "Failed" ? "danger" : event.status === "Warning" ? "sand" : "sage"}>{event.status}</Badge> },
  ]} />;
}

const aiUsageRows: AiUsageRow[] = [
  { id: "ai-1", date: "Today", site: "Green Valley Oncology Center", patient: "Sam Rivera", agent: "Artie chat", model: "demo-local", reportType: "Patient coaching", inputTokens: 1240, outputTokens: 420, estimatedCost: 0.08, status: "Completed" },
  { id: "ai-2", date: "Today", site: "Green Valley Oncology Center", patient: "Aisha Patel", agent: "Safety triage", model: "demo-local", reportType: "Red-flag escalation", inputTokens: 860, outputTokens: 260, estimatedCost: 0.05, status: "Needs review" },
  { id: "ai-3", date: "Yesterday", site: "Green Valley Oncology Center", patient: "Sam Rivera", agent: "Prescription generation", model: "demo-local", reportType: "Week 1 plan", inputTokens: 1840, outputTokens: 720, estimatedCost: 0.13, status: "Reviewed" },
  { id: "ai-4", date: "Yesterday", site: "Green Valley Oncology Center", patient: "Maria Lopez", agent: "Doctor summary", model: "demo-local", reportType: "Clinic visit summary", inputTokens: 2100, outputTokens: 900, estimatedCost: 0.16, status: "Completed" },
  { id: "ai-5", date: "Jun 25", site: "North Ridge Oncology", patient: "Daniel Kim", agent: "Adherence reflection", model: "demo-local", reportType: "Missed week guidance", inputTokens: 980, outputTokens: 380, estimatedCost: 0.07, status: "Completed" },
  { id: "ai-6", date: "Jun 24", site: "Coastal Cancer Care", patient: "Robert Evans", agent: "Activity classifier", model: "demo-local", reportType: "Wearable activity detection", inputTokens: 650, outputTokens: 180, estimatedCost: 0.04, status: "Completed" },
  { id: "ai-7", date: "Jun 24", site: "Green Valley Oncology Center", patient: "Sam Rivera", agent: "Voice transcription", model: "demo-local", reportType: "Guided walk note", inputTokens: 420, outputTokens: 120, estimatedCost: 0.03, status: "Completed" },
];

function AiUsageDashboard({ scope }: { scope: "site" | "platform" }) {
  const rows = scope === "site" ? aiUsageRows.filter((row) => row.site === "Green Valley Oncology Center") : aiUsageRows;
  const summary: AiUsageSummary = {
    totalCalls: rows.length * 143,
    artieChatCalls: rows.filter((row) => row.agent === "Artie chat").length * 88,
    safetyTriageCalls: rows.filter((row) => row.agent === "Safety triage").length * 34,
    prescriptionCalls: rows.filter((row) => row.agent === "Prescription generation").length * 19,
    doctorSummaries: rows.filter((row) => row.agent === "Doctor summary").length * 21,
    transcriptionMinutes: scope === "site" ? 42 : 128,
    inputTokens: rows.reduce((sum, row) => sum + row.inputTokens, 0),
    outputTokens: rows.reduce((sum, row) => sum + row.outputTokens, 0),
    estimatedCost: rows.reduce((sum, row) => sum + row.estimatedCost, 0),
    costPerPatient: scope === "site" ? 0.42 : 0.56,
    costPerSite: scope === "site" ? 2.38 : 4.71,
    costByAgent: ["Artie chat", "Safety triage", "Prescription generation", "Doctor summary", "Adherence reflection", "Activity classifier", "Voice transcription"].map((agent) => ({
      agent,
      cost: rows.filter((row) => row.agent === agent).reduce((sum, row) => sum + row.estimatedCost, 0),
    })),
  };
  return (
    <div className="space-y-5">
      <Card tone="sage">
        <h2 className="onco-display flex items-center gap-2 text-3xl font-extrabold"><AiAgentIcon />AI Usage & Reports</h2>
        <p className="mt-2 text-[#C7D8CC]">{scope === "site" ? "Site-scoped AI cost, report, and review dashboard." : "Platform-wide AI cost, report, and review dashboard."}</p>
      </Card>
      <AiUsageCostPanel summary={summary} />
      <ReportsUsageTable rows={rows} />
    </div>
  );
}

type BillingRow = {
  id: string;
  label: string;
  included: string;
  used: string;
  status: "Current" | "Watch" | "Action";
};

const siteBillingRows: BillingRow[] = [
  { id: "site-artie", label: "Artie patient sessions", included: "1,000 messages", used: "436 messages", status: "Current" },
  { id: "site-summary", label: "Doctor summaries", included: "100 summaries", used: "18 summaries", status: "Current" },
  { id: "site-triage", label: "Safety triage", included: "Unlimited demo", used: "3 escalations", status: "Watch" },
];

const platformBillingRows: BillingRow[] = [
  { id: "platform-sites", label: "Active clinic sites", included: "10 sites", used: "3 sites", status: "Current" },
  { id: "platform-ai", label: "AI usage pool", included: "25,000 calls", used: "1,001 calls", status: "Current" },
  { id: "platform-support", label: "Operations queue", included: "Standard support", used: "1 pending request", status: "Action" },
];

function BillingOperations({ scope }: { scope: "site" | "platform" }) {
  const rows = scope === "site" ? siteBillingRows : platformBillingRows;
  const usageRows = scope === "site" ? aiUsageRows.filter((row) => row.site === "Green Valley Oncology Center") : aiUsageRows;
  const estimatedCost = usageRows.reduce((sum, row) => sum + row.estimatedCost, 0);
  return (
    <div className="space-y-5">
      <Card tone="sage">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="onco-display text-3xl font-extrabold">{scope === "site" ? "Billing" : "Billing & Operations"}</h2>
            <p className="mt-2 text-[#C7D8CC]">
              {scope === "site" ? "Site-scoped demo usage, plan status, and invoice preview." : "Platform-level account operations, usage pool, and invoice controls."}
            </p>
          </div>
          <Button variant="cream" onClick={() => demoStore.toast("Invoice export will be connected in backend phase.", "info")}>Export invoice</Button>
        </div>
      </Card>
      <div className="grid gap-4 md:grid-cols-4">
        <MetricTrendCard label="Plan" value={scope === "site" ? "Clinic" : "Platform"} trend="demo tier" />
        <MetricTrendCard label="Estimated AI cost" value={`$${estimatedCost.toFixed(2)}`} trend="current period" />
        <MetricTrendCard label="Invoice status" value="Draft" trend="not billed" />
        <MetricTrendCard label="Payment" value="Demo" trend="backend pending" />
      </div>
      <Card>
        <DataTable rows={rows} getKey={(row) => row.id} columns={[
          { header: "Line item", cell: (row) => row.label },
          { header: "Included", cell: (row) => row.included },
          { header: "Used", cell: (row) => row.used },
          { header: "Status", cell: (row) => <Badge tone={row.status === "Current" ? "sage" : row.status === "Watch" ? "sand" : "terracotta"}>{row.status}</Badge> },
          { header: "Action", cell: (row) => <Button variant="outline" onClick={() => demoStore.toast(`${row.label} details opened`, "info")}>Details</Button> },
        ]} />
      </Card>
      <Card tone="cream">
        <h2 className="onco-display text-xl font-extrabold">Billing note</h2>
        <p className="mt-2 text-sm text-onco-muted">This frontend demo keeps all billing values local. Real plan limits, invoices, usage metering, and payment collection will be connected in the backend phase.</p>
      </Card>
    </div>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-onco-muted-light">{label}</p><p className="mt-1 text-sm text-onco-muted">{value}</p></div>;
}
