"use client";
import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { LocaleProvider } from "./i18n";
import type { Locale } from "@/lib/i18n/messages";
import { LIVE_REFRESH_MS } from "@/lib/live-query";
export function Providers({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale: Locale;
}) {
  return (
    <SessionProvider
      refetchInterval={LIVE_REFRESH_MS / 1000}
      refetchOnWindowFocus
      refetchWhenOffline={false}
    >
      <LocaleProvider initialLocale={initialLocale}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <Toaster richColors position="bottom-right" />
          {children}
        </ThemeProvider>
      </LocaleProvider>
    </SessionProvider>
  );
}
