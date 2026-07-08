import { ProviderDashboard } from "@/components/onco/demo/DemoDashboards";

export default async function SiteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProviderDashboard view="site" siteId={id} />;
}

