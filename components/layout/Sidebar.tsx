"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Bell,
  BookOpen,
  Calendar,
  CalendarDays,
  LineChart,
  Menu,
  Settings,
  X,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/app/dashboard/logout-button";
import { checkUnreadNews } from "@/app/(intranet)/news/actions";

type Profile = {
  vorname: string;
  nachname: string;
  rolle: string;
  letzterNewsAufruf: string | null;
};

type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  allowedRoles: string[];
};

const NAV_ITEMS: NavItem[] = [
  { name: "News", href: "/news", icon: Bell, allowedRoles: ["member", "admin", "board"] },
  { name: "Events", href: "/events", icon: CalendarDays, allowedRoles: ["member", "admin", "board"] },
  { name: "Zeitschriften", href: "/magazines", icon: BookOpen, allowedRoles: ["member", "admin", "board"] },
  { name: "Vorstand", href: "/board-members", icon: UsersRound, allowedRoles: ["member", "admin", "board"] },
  { name: "Mitglieder", href: "/members", icon: Users, allowedRoles: ["member", "admin", "board"] },
  { name: "Kalender", href: "/calendar", icon: Calendar, allowedRoles: ["member", "admin", "board"] },
  { name: "Admin Bereich", href: "/admin", icon: Settings, allowedRoles: ["admin", "board"] },
  { name: "Insights", href: "/insights", icon: LineChart, allowedRoles: ["board"] },
];

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  board: "Vorstand",
  member: "Mitglied",
};

function getInitials(vorname: string, nachname: string) {
  return `${vorname.charAt(0)}${nachname.charAt(0)}`.toUpperCase();
}

export function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const [hasUnread, setHasUnread] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const lastReadRef = useRef(profile.letzterNewsAufruf);
  const lastCheckAtRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (pathname === "/news") {
        lastReadRef.current = new Date().toISOString();
        lastCheckAtRef.current = Date.now();
        if (!cancelled) setHasUnread(false);
        return;
      }
      const now = Date.now();
      if (lastCheckAtRef.current && now - lastCheckAtRef.current < 60_000) {
        // Letzter Check < 60s her – Ergebnis wiederverwenden.
        return;
      }
      lastCheckAtRef.current = now;

      const unread = await checkUnreadNews(lastReadRef.current);
      if (!cancelled) setHasUnread(unread);
    }
    check();
    return () => { cancelled = true; };
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const visibleItems = NAV_ITEMS.filter((item) =>
    item.allowedRoles.includes(profile.rolle)
  );
  const initials = getInitials(profile.vorname, profile.nachname);
  const roleLabel = ROLE_LABELS[profile.rolle] ?? profile.rolle;

  const renderProfileHead = (onClick?: () => void) => (
    <Link
      href="/profile"
      onClick={onClick}
      className="group flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-red-50"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white transition-transform duration-300 group-hover:scale-105">
        {initials}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">
          {profile.vorname} {profile.nachname}
        </p>
        <p className="text-xs text-muted-foreground">{roleLabel}</p>
      </div>
    </Link>
  );

  const renderNavLinks = (onNavigate?: () => void) => (
    <nav aria-label="Intranet Navigation">
      <ul className="space-y-1">
        {visibleItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          const showDot = item.href === "/news" && hasUnread && !active;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                className={`group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-red-50 font-medium text-primary"
                    : "text-gray-600 hover:bg-red-50 hover:text-primary"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0 transition-all duration-300 ease-out group-hover:-translate-y-0.5 group-hover:scale-110" />
                <span className="truncate">{item.name}</span>
                {showDot && (
                  <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-red-500" />
                )}
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
      <aside className="hidden h-screen w-64 shrink-0 flex-col border-r bg-background/80 md:sticky md:top-0 md:flex">
        <div className="flex h-full flex-col justify-between px-4 py-4">
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Mein Profil
              </p>
              {renderProfileHead()}
            </div>
            <div className="border-t pt-4">{renderNavLinks()}</div>
          </div>
          <div className="flex flex-col items-center gap-3 border-t pt-4">
            <div className="flex w-full items-center justify-between gap-2">
              <Image
                src="/icr-logo.png"
                alt="ICR Logo"
                width={40}
                height={40}
                unoptimized
                className="h-10 w-10 shrink-0 object-contain"
              />
              <LogoutButton />
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Topbar */}
      <header className="sticky top-0 z-40 flex w-full items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur md:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image
            src="/icr-logo.png"
            alt="ICR Logo"
            width={32}
            height={32}
            unoptimized
            className="h-8 w-8 shrink-0 object-contain"
          />
          <span className="text-sm font-semibold">ICR Intranet</span>
        </Link>
        <Button
          variant="outline"
          size="icon"
          aria-label="Navigation oeffnen"
          onClick={() => setIsOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </header>

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-0 z-50 bg-black/40 transition-opacity md:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setIsOpen(false)}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] border-r bg-background p-4 transition-transform duration-200 md:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!isOpen}
      >
        <div className="flex h-full flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Image
                  src="/icr-logo.png"
                  alt="ICR Logo"
                  width={32}
                  height={32}
                  unoptimized
                  className="h-8 w-8 shrink-0 object-contain"
                />
                <span className="text-sm font-semibold">Navigation</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Navigation schliessen"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Mein Profil
              </p>
              {renderProfileHead(() => setIsOpen(false))}
            </div>
            <div className="border-t pt-3">{renderNavLinks(() => setIsOpen(false))}</div>
          </div>

          <div className="border-t pt-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
                {initials}
              </div>
              <LogoutButton />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
