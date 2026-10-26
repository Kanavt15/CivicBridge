"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "@/components/localized-fields";
import { Compass, Download, Home, Lightbulb, UserRound, WifiOff } from "lucide-react";
import { Button } from "./ui/button";
import { Text } from "./i18n";

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};
const AppContext = createContext<{
  installed: boolean;
  canInstall: boolean;
  install: () => Promise<void>;
}>({ installed: false, canInstall: false, install: async () => {} });

export function AppExperience({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [offline, setOffline] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  useEffect(() => {
    const media = window.matchMedia("(display-mode: standalone)");
    const updateInstalled = () =>
      setInstalled(
        media.matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone),
      );
    const updateNetwork = () => setOffline(!navigator.onLine);
    const beforeInstall = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPrompt);
    };
    const afterInstall = () => {
      setPrompt(null);
      setInstalled(true);
    };
    updateInstalled();
    updateNetwork();
    media.addEventListener("change", updateInstalled);
    window.addEventListener("online", updateNetwork);
    window.addEventListener("offline", updateNetwork);
    window.addEventListener("beforeinstallprompt", beforeInstall);
    window.addEventListener("appinstalled", afterInstall);
    // A failed registration must never prevent reporting or signing in.
    if (
      "serviceWorker" in navigator &&
      (process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_ENABLE_DEV_SW === "true")
    ) {
      void navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch(() => {});
    }
    return () => {
      media.removeEventListener("change", updateInstalled);
      window.removeEventListener("online", updateNetwork);
      window.removeEventListener("offline", updateNetwork);
      window.removeEventListener("beforeinstallprompt", beforeInstall);
      window.removeEventListener("appinstalled", afterInstall);
    };
  }, []);
  async function install() {
    if (!prompt) return;
    setPrompt(null);
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
  }
  const links = [
    ["/app", "Home", Home],
    ["/explore", "Problems", Compass],
    ["/innovations", "Solutions", Lightbulb],
    ["/dashboard", "My activity", UserRound],
  ] as const;
  return (
    <AppContext.Provider value={{ installed, canInstall: Boolean(prompt), install }}>
      {offline && (
        <div className="connection-notice" role="status">
          <WifiOff size={17} />
          <span>
            <Text>You’re offline. Reconnect before posting.</Text>{" "}
            <Text>No posts have been queued.</Text>
          </span>
        </div>
      )}
      {children}
      <nav className="phone-navigation" aria-label="App navigation">
        {links.map(([href, label, Icon]) => (
          <Link key={href} href={href} aria-current={path === href ? "page" : undefined}>
            <Icon size={21} />
            <span>
              <Text>{label}</Text>
            </span>
          </Link>
        ))}
      </nav>
    </AppContext.Provider>
  );
}

export function InstallApp() {
  const { installed, canInstall, install } = useContext(AppContext);
  const [showHelp, setShowHelp] = useState(false);
  const [error, setError] = useState("");
  if (installed)
    return (
      <p className="app-install-note">
        <Text>Available on your phone</Text>
      </p>
    );
  return (
    <section className="app-install">
      <div>
        <strong>
          <Text>Available on your phone</Text>
        </strong>
        <p>
          <Text>Add CivicBridge to your home screen.</Text>
        </p>
      </div>
      <Button
        variant="outline"
        type="button"
        onClick={async () => {
          if (!canInstall) {
            setShowHelp((v) => !v);
            return;
          }
          try {
            await install();
          } catch {
            setError("Use your browser’s menu to add CivicBridge to your home screen.");
          }
        }}
      >
        <Download size={17} />
        <Text>{canInstall ? "Install app" : "How to install"}</Text>
      </Button>
      {(showHelp || error) && (
        <div className="app-install-help" role="status">
          <Text>
            {error ||
              "Android: choose Install app in your browser. iPhone: open Safari, tap Share, then Add to Home Screen. Use the HTTPS website."}
          </Text>
        </div>
      )}
    </section>
  );
}
