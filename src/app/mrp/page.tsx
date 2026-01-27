"use client";

import { redirect } from "next/navigation";

export default function MRPRedirectPage() {
  redirect("/production/mrp");
}
