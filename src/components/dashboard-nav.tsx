"use client";
import Link from "@/components/localized-fields";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Compass,
  Users,
  Handshake,
  Bell,
  Trophy,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { initials, label } from "@/lib/utils";
import { Text } from "./i18n";
export function DashboardNav({ user }: { user: { name: string; role: string } }) {
  const path = usePathname();
  return (
    <aside className="dashboard-sidebar">
      <div className="dashboard-user">
        <div className="avatar">{initials(user.name)}</div>
        <strong>{user.name}</strong>
        <small>
          <Text>{label(user.role)}</Text>
        </small>
      </div>
      <nav className="dashboard-nav" aria-label="Workspace navigation">
        {[
          ["/app", "Community app", Compass],
          ["/dashboard", "Overview", LayoutDashboard],
          ["/explore", "Discover", Compass],
          ["/teams", "My teams", Users],
          ["/collaborations", "Collaborations", Handshake],
          ["/notifications", "Notifications", Bell],
          ["/leaderboard", "Recognition", Trophy],
          ["/settings", "My profile", Settings],
          ["/evidence", "Impact evidence", ShieldCheck],
          ["/intelligence", "AI lab", Compass],
          ...(user.role === "ADMIN" ? [["/operations", "Review queue", LayoutDashboard]] : []),
          ...(user.role === "ADMIN" ? [["/system", "System overview", Settings]] : []),
          ...(user.role === "ADMIN" ? [["/admin", "Administration", ShieldCheck]] : []),
        ].map(([href, text, Icon]: any) => (
          <Link href={href} key={href} className={path === href ? "active" : ""}>
            <Icon size={17} />
            <Text>{text}</Text>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
