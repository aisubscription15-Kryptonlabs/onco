"use client";

import { Badge } from "@/components/onco/ui/Badge";
import { Button } from "@/components/onco/ui/Button";
import { DataTable } from "@/components/onco/ui/DataTable";
import { demoStore } from "@/lib/onco/demo/demo-store";
import type { PromptRegistryItem } from "@/lib/onco/demo/demo-types";

export function PromptVersionTable({ prompts, onView }: { prompts: PromptRegistryItem[]; onView: (prompt: PromptRegistryItem) => void }) {
  return (
    <DataTable
      rows={prompts}
      getKey={(prompt) => prompt.id}
      columns={[
        { header: "Prompt key", cell: (prompt) => prompt.key },
        { header: "Agent type", cell: (prompt) => prompt.agentType },
        { header: "Version", cell: (prompt) => prompt.version },
        { header: "Model", cell: (prompt) => prompt.model },
        { header: "Active", cell: (prompt) => <Badge tone={prompt.active ? "sage" : "sand"}>{prompt.active ? "Active" : "Inactive"}</Badge> },
        { header: "Last updated", cell: (prompt) => prompt.lastUpdated },
        { header: "Actions", cell: (prompt) => (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onView(prompt)}>View</Button>
            <Button variant="outline" onClick={() => { demoStore.addPromptVersion(prompt.id); demoStore.toast("New prompt version created"); }}>New version</Button>
            <Button onClick={() => { demoStore.updatePrompt(prompt.id, { active: true, lastUpdated: "Just now" }); demoStore.toast("Prompt version activated"); }}>Activate</Button>
          </div>
        ) },
      ]}
    />
  );
}

