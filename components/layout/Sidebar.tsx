"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Bell,
  BookOpen,
  Building2,
  Calendar,
  CalendarDays,
  LineChart,
  Menu,
  Settings,
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
  { name: "Departments & Kontakt", href: "/contact", icon: Building2, allowedRoles: ["member", "admin", "board"] },
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
  const lastReadRef = useRef(profile.letzterNewsAufruf);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (pathname === "/news") {
        lastReadRef.current = new Date().toISOString();
        if (!cancelled) setHasUnread(false);
        return;
      }
      const unread = await checkUnreadNews(lastReadRef.current);
      if (!cancelled) setHasUnread(unread);
    }
    check();
    return () => { cancelled = true; };
  }, [pathname]);

  const visibleItems = NAV_ITEMS.filter((item) =>
    item.allowedRoles.includes(profile.rolle)
  );
  const initials = getInitials(profile.vorname, profile.nachname);
  const roleLabel = ROLE_LABELS[profile.rolle] ?? profile.rolle;

  const renderProfileHead = () => (
    <Link
      href="/profile"
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

  const renderNavLinks = () => (
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
      <aside className="hidden w-64 flex-col border-r bg-background/80 md:flex">
        <div className="flex h-full flex-col justify-between px-4 py-4">
          <div className="space-y-6">
            {renderProfileHead()}
            <div className="border-t pt-4">{renderNavLinks()}</div>
          </div>
          <div className="border-t pt-4">
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* Mobile Topbar */}
      <header className="flex w-full items-center justify-between border-b bg-background px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
            {initials}
          </div>
          <span className="text-sm font-semibold">
            {profile.vorname} {profile.nachname}
          </span>
        </div>
        <Button variant="outline" size="icon" aria-label="Navigation oeffnen">
          <Menu className="h-5 w-5" />
        </Button>
      </header>
      <div className="block space-y-2 border-b bg-background px-4 py-2 md:hidden">
        {renderNavLinks()}
        <div className="border-t pt-2">
          <LogoutButton />
        </div>
      </div>
    </>
  );
}
