import { redirect } from "next/navigation";

export default function DeployAgentWizardRedirectPage() {
  redirect("/setup/deploy-agent/wizard");
}
