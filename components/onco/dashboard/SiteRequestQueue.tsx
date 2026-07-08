"use client";

import { Badge } from "@/components/onco/ui/Badge";
import { Button } from "@/components/onco/ui/Button";
import { DataTable } from "@/components/onco/ui/DataTable";
import type { SiteRequest } from "@/lib/onco/demo/demo-types";

export function SiteRequestQueue({
  requests,
  onApprove,
  onReject,
  onView,
}: {
  requests: SiteRequest[];
  onApprove: (request: SiteRequest) => void;
  onReject: (request: SiteRequest) => void;
  onView: (request: SiteRequest) => void;
}) {
  return (
    <DataTable
      rows={requests}
      getKey={(request) => request.id}
      columns={[
        { header: "Site request", cell: (request) => request.siteName },
        { header: "Admin", cell: (request) => `${request.adminName} · ${request.adminEmail}` },
        { header: "City/state", cell: (request) => request.cityState },
        { header: "Status", cell: (request) => <Badge tone={request.status === "Rejected" ? "danger" : request.status === "Approved" ? "sage" : "sand"}>{request.status}</Badge> },
        { header: "Actions", cell: (request) => (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => onView(request)}>View details</Button>
            <Button onClick={() => onApprove(request)}>Approve</Button>
            <Button variant="outline" onClick={() => onReject(request)}>Reject</Button>
          </div>
        ) },
      ]}
    />
  );
}

