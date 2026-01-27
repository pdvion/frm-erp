"use client";

import { redirect } from "next/navigation";

export default function NewWorkflowRedirectPage() {
  redirect("/workflow/definitions/new");
}
