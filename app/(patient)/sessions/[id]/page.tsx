import { SessionFlowClient } from "@/components/onco/demo/PatientScreens";

type SessionPageProps = {
  params: Promise<{ id: string }>;
};

export default async function SessionPage({ params }: SessionPageProps) {
  const { id } = await params;
  const sessionId = Number(id);
  return <SessionFlowClient sessionId={Number.isFinite(sessionId) ? sessionId : 3} />;
}
