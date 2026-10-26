"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Compass, Download, Home, Lightbulb, UserRound, WifiOff } from "lucide-react";
import { Button } from "./ui/button";

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
          <WifiOff size={17} /> You’re offline. Keep this page open and reconnect before posting.
          Nothing has been queued or submitted.
        </div>
      )}
      {children}
      <nav className="phone-navigation" aria-label="App navigation">
        {links.map(([href, label, Icon]) => (
          <Link key={href} href={href} aria-current={path === href ? "page" : undefined}>
            <Icon size={21} />
            <span>{label}</span>
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
        You’re using the CivicBridge app. Your posts sync with your account when connected.
      </p>
    );
  return (
    <section className="app-install">
      <div>
        <strong>Keep your community close.</strong>
        <p>Add CivicBridge to your home screen. Use the same account on every device.</p>
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
        {canInstall ? "Install app" : "How to install"}
      </Button>
      {(showHelp || error) && (
        <div className="app-install-help" role="status">
          {error || (
            <>
              On Android or desktop, open the browser menu and choose <strong>Install app</strong>{" "}
              or <strong>Add to Home screen</strong>. On iPhone, open the site in Safari, tap{" "}
              <strong>Share</strong>, then <strong>Add to Home Screen</strong>. Installation
              requires the deployed HTTPS site (or localhost for testing).
            </>
          )}
        </div>
      )}
    </section>
  );
}
