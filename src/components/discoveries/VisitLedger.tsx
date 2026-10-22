"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { recordVisit } from "@/lib/visitReceipt";

export function VisitLedger() {
  const pathname = usePathname();
  useEffect(() => { recordVisit(pathname); }, [pathname]);
  return null;
}
