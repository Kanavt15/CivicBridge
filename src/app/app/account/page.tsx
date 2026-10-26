"use client";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import {
  Activity,
  Bell,
  ChevronRight,
  Handshake,
  Users,
  Settings,
  ShieldCheck,
  Brain,
  Trophy,
  ExternalLink,
  LogOut,
  Moon,
  Sun,
  Building2,
} from "lucide-react";
import Link from "@/components/localized-fields";
import { Text } from "@/components/i18n";
import { Loading } from "@/components/common";
import { Button } from "@/components/ui/button";
import { InstallApp } from "@/components/app-experience";
import { initials, label } from "@/lib/utils";

export default function AppAccount() {
  const { data: session, status } = useSession();
  const { resolvedTheme, setTheme } = useTheme();
  if (status === "loading") return <Loading />;
  const links = [
    ...(session
      ? [
          ["/dashboard", "My activity", Activity],
          ["/settings", "My profile", Settings],
          ["/notifications", "Notifications", Bell],
          ["/teams", "My teams", Users],
          ["/collaborations", "Collaborations", Handshake],
        ]
      : []),
    ["/impact", "Community impact", Activity],
    ["/evidence", "Impact evidence", ShieldCheck],
    ["/intelligence", "AI lab", Brain],
    ["/organizations", "Organizations", Building2],
    ["/leaderboard", "Recognition", Trophy],
    ...(session?.user.role === "ADMIN"
      ? [
          ["/operations", "Review queue", ShieldCheck],
          ["/admin", "Administration", Settings],
          ["/system", "System overview", Activity],
        ]
      : []),
  ];
  return (
    <div className="app-account-page">
      <div className="app-page-heading">
        <h1>
          <Text>Account</Text>
        </h1>
      </div>
      <section className="app-identity">
        <div className="app-profile-avatar">
          {session ? initials(session.user.name ?? "") : <Users size={27} />}
        </div>
        <div>
          <h2>{session?.user.name ?? <Text>Your community starts here.</Text>}</h2>
          <p>
            {session ? (
              <Text>{label(session.user.role)}</Text>
            ) : (
              <Text>Sign in to post and follow progress.</Text>
            )}
          </p>
        </div>
        {!session && (
          <div className="app-auth-actions">
            <Button asChild>
              <Link href="/login">
                <Text>Sign in</Text>
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/register">
                <Text>Create account</Text>
              </Link>
            </Button>
          </div>
        )}
      </section>
      <div className="app-settings-list">
        {links.map(([href, name, Icon]: any) => (
          <Link key={href} href={href}>
            <Icon size={20} />
            <span>
              <Text>{name}</Text>
            </span>
            <ChevronRight size={17} />
          </Link>
        ))}
      </div>
      <section className="app-preferences">
        <h2>
          <Text>Appearance</Text>
        </h2>
        <div className="app-theme-options">
          <Button
            variant="outline"
            onClick={() => setTheme("light")}
            aria-pressed={resolvedTheme === "light"}
          >
            <Sun size={17} />
            <Text>Light</Text>
          </Button>
          <Button
            variant="outline"
            onClick={() => setTheme("dark")}
            aria-pressed={resolvedTheme === "dark"}
          >
            <Moon size={17} />
            <Text>Dark</Text>
          </Button>
        </div>
      </section>
      <InstallApp />
      <div className="app-account-footer">
        <a href="/" target="_blank" rel="noopener noreferrer">
          <ExternalLink size={16} />
          <Text>View website</Text>
        </a>
        {session && (
          <Button variant="ghost" onClick={() => signOut({ callbackUrl: "/app" })}>
            <LogOut size={16} />
            <Text>Sign out</Text>
          </Button>
        )}
      </div>
    </div>
  );
}
