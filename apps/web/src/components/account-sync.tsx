"use client";

import { useEffect } from "react";
import { pull } from "@/lib/sync";

/** Catches this device up with the signed-in account once per page load. Renders nothing. */
export function AccountSync() {
  useEffect(() => {
    void pull();
  }, []);
  return null;
}
