"use client";

import { usePathname } from "next/navigation";
import FloatingActionButton from "./FloatingActionButton";

/** Routes where the FAB should NOT appear */
const HIDDEN_ON_ROUTES = ["/submit", "/"];

export default function FABProvider() {
  const pathname = usePathname();
  const isHidden = HIDDEN_ON_ROUTES.some((r) => pathname === r);
  return <FloatingActionButton visible={!isHidden} />;
}
