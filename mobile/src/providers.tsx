import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from "react";
import { getLocales } from "expo-localization";
import { api, configureSession, ApiError } from "./lib/api";
import { storage } from "./lib/storage";
import { translate, isLocale, type Locale } from "../../src/lib/i18n/messages";
import { createLiveQuery } from "../../src/lib/live-query";
import { watchActiveQuery } from "./lib/watch";
export type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  bio?: string;
  skills?: string[];
  interests?: string[];
};
type StoredSession = { token: string; expiresAt: string; user: User };
const AuthContext = createContext<{
  user: User | null;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<boolean>;
  refreshUser: () => Promise<void>;
}>({
  user: null,
  ready: false,
  signIn: async () => {},
  signOut: async () => false,
  refreshUser: async () => {},
});
const LocaleContext = createContext<{ locale: Locale; setLocale: (value: Locale) => void }>({
  locale: "en",
  setLocale: () => {},
});
export const useAuth = () => useContext(AuthContext);
export function useI18n() {
  const context = useContext(LocaleContext);
  return { ...context, t: (value: string) => translate(value, context.locale) };
}
export function MobileProviders({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const userRef = useRef<User | null>(null);
  useEffect(() => {
    userRef.current = user;
  }, [user]);
  const systemLocale = getLocales()[0]?.languageCode;
  const [locale, setLanguage] = useState<Locale>(isLocale(systemLocale) ? systemLocale : "en");
  useEffect(() => {
    let active = true;
    const expire = () => {
      configureSession(null);
      if (active) setUser(null);
      void storage.remove("civicbridge.session").catch(() => {});
    };
    configureSession(null, expire);
    void (async () => {
      try {
        const savedLocale = await storage.get("civicbridge.locale");
        if (active && isLocale(savedLocale)) setLanguage(savedLocale);
        const raw = await storage.get("civicbridge.session");
        if (!raw) return;
        const saved: StoredSession = JSON.parse(raw);
        if (!/^cbm_[\w-]{43}$/.test(saved.token) || !(Date.parse(saved.expiresAt) > Date.now())) {
          expire();
          return;
        }
        configureSession(saved.token);
        if (active) setUser(saved.user);
        try {
          const verified = await api<{ user: User }>("/api/mobile/session");
          if (active) setUser(verified.user);
        } catch (e) {
          // Keep the encrypted session during temporary outages; server checks every write.
          if (e instanceof ApiError && e.status === 401) expire();
        }
      } catch {
        expire();
      } finally {
        if (active) setReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);
  const userId = user?.id;
  useEffect(() => {
    if (!ready || !userId) return;
    const query = createLiveQuery<{ user: User }>({
      load: (signal) => api("/api/mobile/session", { signal }),
      value: (result) => {
        if (JSON.stringify(result.user) !== JSON.stringify(userRef.current)) setUser(result.user);
      },
      state: () => {},
      error: () => {},
      clear: () => {},
    });
    return watchActiveQuery(query);
  }, [ready, userId]);
  async function signIn(email: string, password: string) {
    const session = await api<StoredSession>("/api/mobile/session", {
      method: "POST",
      body: JSON.stringify({ email: email.trim(), password }),
    });
    // Do not show a successful login until the device has safely stored its credential.
    try {
      await storage.set("civicbridge.session", JSON.stringify(session));
    } catch {
      configureSession(session.token);
      await api("/api/mobile/session", { method: "DELETE" }).catch(() => {});
      configureSession(null);
      throw new Error("Could not save your session. Please try again.");
    }
    configureSession(session.token);
    setUser(session.user);
  }
  async function signOut() {
    let revoked = false;
    try {
      await api("/api/mobile/session", { method: "DELETE" });
      revoked = true;
    } catch {}
    await storage.remove("civicbridge.session");
    configureSession(null);
    setUser(null);
    return revoked;
  }
  async function refreshUser() {
    const result = await api<{ user: User }>("/api/mobile/session");
    setUser(result.user);
    const raw = await storage.get("civicbridge.session");
    if (raw) {
      const { id, name, email, role } = result.user;
      await storage.set(
        "civicbridge.session",
        JSON.stringify({ ...JSON.parse(raw), user: { id, name, email, role } }),
      );
    }
  }
  function setLocale(value: Locale) {
    if (isLocale(value)) {
      setLanguage(value);
      void storage.set("civicbridge.locale", value).catch(() => {});
    }
  }
  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      <AuthContext.Provider value={{ user, ready, signIn, signOut, refreshUser }}>
        {children}
      </AuthContext.Provider>
    </LocaleContext.Provider>
  );
}
