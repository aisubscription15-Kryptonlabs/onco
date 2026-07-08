import { Badge } from "@/components/onco/ui/Badge";
import { Card } from "@/components/onco/ui/Card";

export function SymptomTimeline({ symptoms }: { symptoms: string[] }) {
  return (
    <Card>
      <h2 className="onco-display text-xl font-extrabold">Symptoms timeline</h2>
      <div className="mt-4 space-y-3">
        {symptoms.map((symptom, index) => (
          <div className="flex items-start gap-3" key={`${symptom}-${index}`}>
            <Badge tone={symptom.toLowerCase().includes("red") || symptom.toLowerCase().includes("dizziness") ? "danger" : "sand"}>
              {index === 0 ? "Latest" : "Prior"}
            </Badge>
            <p className="text-sm text-onco-muted">{symptom}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

