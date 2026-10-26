"use client";
import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { LocaleProvider } from "./i18n";
import type { Locale } from "@/lib/i18n/messages";
export function Providers({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale: Locale;
}) {
  return (
    <SessionProvider>
      <LocaleProvider initialLocale={initialLocale}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <Toaster richColors position="bottom-right" />
          {children}
        </ThemeProvider>
      </LocaleProvider>
    </SessionProvider>
  );
}
