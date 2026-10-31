"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { track } from "@/lib/analytics";

/** Records a page view on every route change (no-op without an analytics key). */
export function PageViews() {
  const path = usePathname();
  useEffect(() => track("$pageview"), [path]);
  return null;
}
