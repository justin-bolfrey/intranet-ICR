"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

export function IntranetPageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="intranet-page-fade-in h-full">
      {children}
    </div>
  );
}
