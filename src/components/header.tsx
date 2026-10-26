"use client";
import { Control } from "@/components/localized-fields";

import Link from "@/components/localized-fields";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { ArrowUpRight, Bell, Menu, Moon, Sun, X, UserRound, LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { LanguagePicker, Text, useI18n } from "./i18n";
export function Logo() {
  return (
    <Link href="/" className="brand" aria-label="CivicBridge home">
      <span className="brand-mark">
        <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path
            d="M5 24V13m22 11V13M5 18c6 0 5-11 11-11s5 11 11 11M3 24h26M16 7v17"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span>
        <Text>{"CivicBridge"}</Text>
      </span>
    </Link>
  );
}
export function Header() {
  const path = usePathname();
  const { data: session } = useSession();
  const { resolvedTheme, setTheme } = useTheme();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);
  const links = [
    ["/explore", "Problems"],
    ["/innovations", "Solutions"],
    ["/impact", "Impact"],
    ["/app", "Community app"],
  ];
  return (
    <header className="header">
      <div className="container nav-row">
        <Logo />
        <nav
          id="primary-navigation"
          className={"nav-links" + (open ? " open" : "")}
          aria-label={t("Main navigation")}
        >
          {links.map(([href, name]) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={path.startsWith(href) ? "active" : ""}
              aria-current={path.startsWith(href) ? "page" : undefined}
            >
              <Text>{name}</Text>
            </Link>
          ))}
          <div className="mobile-account-links">
            <Link href={session ? "/dashboard" : "/login"}>
              <Text>{session ? "My activity" : "Sign in"}</Text>
            </Link>
            <Link href="/intelligence">
              <Text>AI lab</Text>
            </Link>
            <Control
              type="button"
              className="icon-btn"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              aria-label={t("Toggle color theme")}
            >
              <Moon size={17} />
            </Control>
          </div>
        </nav>
        <div className="nav-actions">
          <LanguagePicker />
          <Control
            className="icon-btn theme-toggle"
            type="button"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            aria-label={t("Toggle color theme")}
          >
            {resolvedTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </Control>
          {session ? (
            <>
              <Link
                className="icon-btn notification-link"
                href="/notifications"
                aria-label={t("Notifications")}
              >
                <Bell size={19} />
              </Link>
              <details className="account-menu">
                <summary aria-label={t("Account")}>
                  <span className="avatar avatar-sm">{session.user.name?.slice(0, 1)}</span>
                </summary>
                <div>
                  <strong>{session.user.name}</strong>
                  <Link href="/dashboard">
                    <UserRound size={15} />
                    <Text>My activity</Text>
                  </Link>
                  <Link href="/settings">
                    <Text>My profile</Text>
                  </Link>
                  <Control type="button" onClick={() => signOut({ callbackUrl: "/" })}>
                    <LogOut size={15} />
                    <Text>Sign out</Text>
                  </Control>
                </div>
              </details>
            </>
          ) : (
            <>
              <Link className="login-link" href="/login">
                <Text>Sign in</Text>
              </Link>
              <Button asChild size="sm" className="header-start">
                <Link href="/register">
                  <Text>Get started</Text>
                  <ArrowUpRight size={15} />
                </Link>
              </Button>
            </>
          )}
          <Control
            className="icon-btn mobile-menu"
            type="button"
            aria-expanded={open}
            aria-controls="primary-navigation"
            aria-label={t("Toggle navigation")}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={21} /> : <Menu size={21} />}
          </Control>
        </div>
      </div>
    </header>
  );
}
