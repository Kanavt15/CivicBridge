import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/providers";
import { AppExperience } from "@/components/app-experience";
import "./globals.css";
import "./redesign.css";
import "./app-shell.css";
import { cookies } from "next/headers";
import { isLocale, localeTags } from "@/lib/i18n/messages";
export const metadata: Metadata = {
  applicationName: "CivicBridge",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "CivicBridge" },
  icons: { icon: "/icons/app-192.png", apple: "/icons/app-180.png" },
  title: { default: "CivicBridge — Ideas into impact", template: "%s | CivicBridge" },
  description:
    "Connect citizens, universities, researchers and industry to turn India's societal challenges into meaningful innovation.",
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#171717",
};
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const savedLocale = (await cookies()).get("civicbridge_locale")?.value;
  const locale = isLocale(savedLocale) ? savedLocale : "en";
  return (
    <html lang={localeTags[locale]} suppressHydrationWarning>
      <body>
        <Providers initialLocale={locale}>
          <AppExperience>{children}</AppExperience>
        </Providers>
      </body>
    </html>
  );
}
