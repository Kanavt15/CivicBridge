"use client";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  Bell,
  Compass,
  Home,
  Lightbulb,
  Plus,
  UserRound,
  Activity,
  Users,
  ChartNoAxesCombined,
} from "lucide-react";
import Link from "./localized-fields";
import { LanguagePicker, Text, useI18n } from "./i18n";
import { Logo } from "./header";
import { initials } from "@/lib/utils";
import { toWebsiteHref } from "@/lib/app-navigation";

const tabs = [
  ["/app", "Home", Home],
  ["/app/explore", "Explore", Compass],
  ["/app/create", "Create", Plus],
  ["/app/solutions", "Solutions", Lightbulb],
  ["/app/account", "Account", UserRound],
] as const;
export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { data: session } = useSession();
  const { t } = useI18n();
  const web = toWebsiteHref(path);
  const isHome = path === "/app";
  const isProblem = path.startsWith("/app/problems/");
  const isSolution = path.startsWith("/app/solutions/");
  const title = isHome
    ? "CivicBridge"
    : path === "/app/post"
      ? "Post a problem"
      : path === "/app/propose"
        ? "Propose a solution"
        : isProblem
          ? "Problem details"
          : isSolution
            ? "Solution details"
            : (tabs.find(([href]) => href === path)?.[1] ??
              (
                {
                  "/dashboard": "My activity",
                  "/settings": "My profile",
                  "/notifications": "Notifications",
                  "/teams": "My teams",
                  "/collaborations": "Collaborations",
                  "/login": "Sign in",
                  "/register": "Create account",
                  "/impact": "Community impact",
                  "/evidence": "Impact evidence",
                  "/intelligence": "AI lab",
                  "/operations": "Review queue",
                  "/admin": "Administration",
                  "/system": "System overview",
                  "/organizations": "Organizations",
                  "/leaderboard": "Recognition",
                } as Record<string, string>
              )[web] ??
              "Community");
  const back = isProblem
    ? "/app/explore"
    : isSolution
      ? "/app/solutions"
      : ["/app/post", "/app/propose"].includes(path)
        ? "/app/create"
        : "/app";
  function active(href: string) {
    if (href === "/app") return isHome;
    if (href === "/app/create") return [href, "/app/post", "/app/propose"].includes(path);
    if (href === "/app/explore") return path === href || isProblem;
    if (href === "/app/account")
      return [href, "/app/login", "/app/register", "/app/settings"].includes(path);
    return path === href || path.startsWith(href + "/");
  }
  return (
    <div className="civic-app">
      <aside className="app-rail">
        <Logo />
        <nav aria-label={t("App sidebar")}>
          {tabs.map(([href, name, Icon]) => (
            <Link key={href} href={href} aria-current={active(href) ? "page" : undefined}>
              <Icon size={20} />
              <Text>{name}</Text>
            </Link>
          ))}
        </nav>
        <div className="app-rail-divider" />
        <nav aria-label={t("Workspace navigation")}>
          {[
            ["/app/activity", "My activity", Activity],
            ["/app/teams", "My teams", Users],
            ["/app/impact", "Community impact", ChartNoAxesCombined],
          ].map(([href, name, Icon]: any) => (
            <Link key={href} href={href} aria-current={active(href) ? "page" : undefined}>
              <Icon size={20} />
              <Text>{name}</Text>
            </Link>
          ))}
        </nav>
        <p className="app-rail-caption">
          <Text>Small actions. Shared progress.</Text>
        </p>
      </aside>
      <div className="app-stage">
        <header className="app-topbar" aria-label={t("App header")}>
          <div className="app-topbar-title">
            {isHome ? (
              <span className="app-mobile-brand">
                <Logo />
              </span>
            ) : (
              <Link href={back} className="icon-btn" aria-label="Back">
                <ArrowLeft size={21} />
              </Link>
            )}
            <span className={isHome ? "app-desktop-title" : ""}>
              <Text>{title}</Text>
            </span>
          </div>
          <div className="app-topbar-actions">
            <LanguagePicker />
            <Link href="/app/notifications" className="icon-btn" aria-label="Notifications">
              <Bell size={20} />
            </Link>
            <Link href="/app/account" className="app-account-avatar" aria-label="Account">
              {session ? initials(session.user.name ?? "") : <UserRound size={18} />}
            </Link>
          </div>
        </header>
        <main id="main" className="app-main">
          {children}
        </main>
      </div>
      <nav className="app-tabbar" aria-label={t("App navigation")}>
        {tabs.map(([href, name, Icon]) => (
          <Link
            key={href}
            href={href}
            className={name === "Create" ? "app-create-tab" : ""}
            aria-current={active(href) ? "page" : undefined}
          >
            <span className="app-tab-icon">
              <Icon size={22} strokeWidth={active(href) ? 2.4 : 1.7} />
            </span>
            <span>
              <Text>{name}</Text>
            </span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
