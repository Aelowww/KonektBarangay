"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

export function useResidentOnly(enabled = true) {
  const router = useRouter();
  const { role } = useAuth();
  const isAdmin = enabled && role === "admin";

  useEffect(() => {
    if (isAdmin) router.replace("/admin/manage-services");
  }, [isAdmin, router]);

  return isAdmin;
}
