import { Badge } from "@/components/onco/ui/Badge";
import { Card } from "@/components/onco/ui/Card";

export function SiteScopeBanner({ scope, siteName }: { scope: "site" | "platform"; siteName?: string }) {
  return (
    <Card className="mb-5 flex flex-wrap items-center justify-between gap-3 p-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-onco-muted-light">
          {scope === "site" ? "Site-scoped operations" : "Platform-scoped operations"}
        </p>
        <p className="mt-1 text-sm font-semibold text-onco-muted">
          {scope === "site" ? siteName || "Green Valley Oncology Center" : "All demo sites and global configuration"}
        </p>
      </div>
      <Badge tone={scope === "site" ? "sage" : "terracotta"}>{scope === "site" ? "Site Admin" : "App Provider"}</Badge>
    </Card>
  );
}
