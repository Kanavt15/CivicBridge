import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/providers";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { AppExperience } from "@/components/app-experience";
import "./globals.css";
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
  themeColor: "#142d3a",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <AppExperience>
            <a className="skip-link" href="#main">
              Skip to content
            </a>
            <Header />
            <main id="main">{children}</main>
            <Footer />
          </AppExperience>
        </Providers>
      </body>
    </html>
  );
}
