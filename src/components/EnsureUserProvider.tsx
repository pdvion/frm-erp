"use client";

import { useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";

export function EnsureUserProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const ensureUserMutation = trpc.tenant.ensureUser.useMutation();
  const hasChecked = useRef(false);

  useEffect(() => {
    if (isAuthenticated && user && !hasChecked.current) {
      hasChecked.current = true;
      ensureUserMutation.mutate();
    }
  }, [isAuthenticated, user, ensureUserMutation]);

  return <>{children}</>;
}
