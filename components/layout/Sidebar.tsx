"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/app/dashboard/logout-button";

type SidebarProps = {
  role: string;
};

const mainLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/profile", label: "Mein Profil" },
];

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const isAdmin = role === "admin" || role === "board";

  const allLinks = [
    ...mainLinks,
    ...(isAdmin ? [{ href: "/admin", label: "Admin-Bereich" as const }] : []),
  ];

  const renderLinks = (className?: string) => (
    <nav className={className} aria-label="Intranet Navigation">
      <ul className="space-y-1">
        {allLinks.map((link) => {
          const active = pathname === link.href;
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-background/80 px-4 py-6 md:flex">
        <div className="mb-6 text-lg font-semibold text-foreground">
          ICR Intranet
        </div>
        {renderLinks()}
        <div className="mt-auto pt-6 border-t">
          <LogoutButton />
        </div>
      </aside>

      {/* Mobile Topbar mit Hamburger-Menü (vereinfachte Variante) */}
      <header className="flex w-full items-center justify-between border-b bg-background px-4 py-3 md:hidden">
        <span className="text-base font-semibold">ICR Intranet</span>
        {/* Für eine echte Drawer-Navigation könnte hier ein Sheet/Drawer verwendet werden.
            Für den Moment zeigen wir einfach die Links inline darunter. */}
        <Button variant="outline" size="icon" aria-label="Navigation öffnen">
          <Menu className="size-5" />
        </Button>
      </header>
      <div className="block border-b bg-background px-4 py-2 space-y-2 md:hidden">
        {renderLinks("flex flex-col gap-1")}
        <LogoutButton />
      </div>
    </>
  );
}

