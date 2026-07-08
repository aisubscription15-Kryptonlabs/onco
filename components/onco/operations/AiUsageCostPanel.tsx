import { Card } from "@/components/onco/ui/Card";
import { AiAgentIcon } from "@/components/onco/ui/icons";

export type AiUsageSummary = {
  totalCalls: number;
  artieChatCalls: number;
  safetyTriageCalls: number;
  prescriptionCalls: number;
  doctorSummaries: number;
  transcriptionMinutes: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  costPerPatient: number;
  costPerSite: number;
  costByAgent: Array<{ agent: string; cost: number }>;
};

export function AiUsageCostPanel({ summary }: { summary: AiUsageSummary }) {
  const metrics = [
    ["Total AI calls", summary.totalCalls.toLocaleString()],
    ["Artie chat calls", summary.artieChatCalls.toLocaleString()],
    ["Safety triage calls", summary.safetyTriageCalls.toLocaleString()],
    ["Prescription generation", summary.prescriptionCalls.toLocaleString()],
    ["Doctor summaries", summary.doctorSummaries.toLocaleString()],
    ["Voice minutes", summary.transcriptionMinutes.toLocaleString()],
    ["Input tokens", summary.inputTokens.toLocaleString()],
    ["Output tokens", summary.outputTokens.toLocaleString()],
    ["Estimated cost", `$${summary.estimatedCost.toFixed(2)}`],
    ["Cost per patient", `$${summary.costPerPatient.toFixed(2)}`],
    ["Cost per site", `$${summary.costPerSite.toFixed(2)}`],
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
      {metrics.map(([label, value]) => (
        <Card key={label}>
          <div className="flex items-center gap-2">
            {label.toLowerCase().includes("ai") || label.toLowerCase().includes("artie") || label.toLowerCase().includes("triage") || label.toLowerCase().includes("generation") || label.toLowerCase().includes("summaries") ? <AiAgentIcon className="text-onco-sage" /> : null}
            <p className="text-xs font-semibold text-onco-muted">{label}</p>
          </div>
          <p className="onco-display mt-2 text-2xl font-extrabold">{value}</p>
        </Card>
      ))}
      <Card className="md:col-span-3 xl:col-span-4">
        <p className="flex items-center gap-2 font-semibold"><AiAgentIcon className="text-onco-sage" />Cost by agent</p>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          {summary.costByAgent.map((item) => (
            <div className="rounded-2xl bg-onco-cream p-3" key={item.agent}>
              <p className="flex items-center gap-2 text-sm font-semibold"><AiAgentIcon className="text-onco-sage" />{item.agent}</p>
              <p className="text-sm text-onco-muted">${item.cost.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
