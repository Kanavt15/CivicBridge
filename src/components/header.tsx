"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { ArrowUpRight, Bell, Menu, Moon, Sun, X, LogOut, LayoutDashboard } from "lucide-react";
import { Button } from "./ui/button";
export function Logo() {
  return (
    <Link href="/" className="brand" aria-label="CivicBridge home">
      <span className="brand-mark">
        <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path
            d="M5 24V13m22 11V13M5 18c6 0 5-11 11-11s5 11 11 11M3 24h26M16 7v17"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span>
        Civic<span className="brand-light">Bridge</span>
        <small>Ideas into impact.</small>
      </span>
    </Link>
  );
}
export function Header() {
  const path = usePathname();
  const { data: session } = useSession();
  const { resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const links = [
    ["/", "Home"],
    ["/explore", "Explore challenges"],
    ["/intelligence", "AI lab"],
    ["/innovations", "Innovations"],
    ["/impact", "Impact"],
  ];
  return (
    <>
      <div className="gov-strip">
        <div className="container gov-inner">
          <span>
            <span className="india-flag" /> A shared vision. A stronger India.
          </span>
          <span>
            Built for societal innovation <span className="strip-dot">•</span> SIH 2026
          </span>
        </div>
      </div>
      <header className="header">
        <div className="container nav-row">
          <Logo />
          <nav className={open ? "nav-links open" : "nav-links"} aria-label="Main navigation">
            {links.map(([href, name]) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={path === href ? "active" : ""}
              >
                {name}
              </Link>
            ))}
          </nav>
          <div className="nav-actions">
            <button
              className="icon-btn theme-toggle"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              aria-label="Toggle color theme"
            >
              {resolvedTheme === "dark" ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            {session ? (
              <>
                <Link href="/notifications" className="icon-btn" aria-label="Notifications">
                  <Bell size={18} />
                </Link>
                <Button asChild size="sm">
                  <Link href="/dashboard">
                    <LayoutDashboard size={15} />
                    <span className="desktop-label">Dashboard</span>
                  </Link>
                </Button>
                <button
                  className="icon-btn"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  aria-label="Sign out"
                >
                  <LogOut size={17} />
                </button>
              </>
            ) : (
              <>
                <Link className="login-link" href="/login">
                  Log in
                </Link>
                <Button asChild size="sm">
                  <Link href="/register">
                    Get involved <ArrowUpRight size={16} />
                  </Link>
                </Button>
              </>
            )}
            <button
              className="icon-btn mobile-menu"
              aria-expanded={open}
              aria-label="Toggle navigation"
              onClick={() => setOpen(!open)}
            >
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
