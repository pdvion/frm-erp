import { redirect } from "next/navigation";

export default function DeployAgentDetailRedirectPage({ params }: { params: { id: string } }) {
  redirect(`/setup/deploy-agent/${params.id}`);
}
