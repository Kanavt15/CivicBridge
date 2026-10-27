"use client";
import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LIVE_REFRESH_MS, onDataChanged } from "@/lib/live-query";

// Public server-rendered summaries need fresh records too. Refresh only these
// read-only views, preserving their client state and browser scroll position.
export function LiveServerView() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  useEffect(() => {
    const refresh = () => {
      if (!pending && document.visibilityState === "visible" && navigator.onLine)
        startTransition(() => router.refresh());
    };
    const timer = setInterval(refresh, LIVE_REFRESH_MS);
    const unsubscribe = onDataChanged(refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener("online", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(timer);
      unsubscribe();
      window.removeEventListener("focus", refresh);
      window.removeEventListener("online", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [pending, router]);
  return null;
}
