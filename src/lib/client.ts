"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { createLiveQuery, LIVE_REFRESH_MS, notifyDataChanged, onDataChanged } from "./live-query";
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function api<T = any>(
  path: string,
  method = "GET",
  data?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(path.startsWith("/api/") ? path : `/api/platform/${path}`, {
    method,
    signal,
    cache: "no-store",
    headers: data ? { "Content-Type": "application/json" } : undefined,
    body: data ? JSON.stringify(data) : undefined,
  });
  const result = await response.json();
  if (!response.ok)
    throw new ApiError(result.error || "The request failed. Please try again.", response.status);
  if (method !== "GET") notifyDataChanged();
  return result;
}
export function useData<T = any>(path: string) {
  const { data: session } = useSession();
  const key = `${session?.user?.id ?? "public"}:${session?.user?.role ?? ""}:${path}`;
  const [snapshot, setSnapshot] = useState<{
    key: string;
    data: T | null;
    error: string;
    loading: boolean;
    refreshing: boolean;
  }>({ key, data: null, error: "", loading: true, refreshing: false });
  const current = useRef<ReturnType<typeof createLiveQuery<T>> | null>(null);
  const reload = useCallback(() => current.current?.refresh() ?? Promise.resolve(), []);
  useEffect(() => {
    setSnapshot({ key, data: null, error: "", loading: true, refreshing: false });
    const query = createLiveQuery<T>({
      load: (signal) => api<T>(path, "GET", undefined, signal),
      value: (data) => setSnapshot((s) => ({ ...s, key, data, error: "" })),
      error: (error) => setSnapshot((s) => ({ ...s, key, error: error.message })),
      clear: () => setSnapshot((s) => ({ ...s, key, data: null })),
      state: (state) => setSnapshot((s) => ({ ...s, key, ...state })),
    });
    current.current = query;
    const active = () => document.visibilityState === "visible" && navigator.onLine;
    const refresh = () => {
      if (active()) void query.refresh(true);
    };
    void query.refresh();
    const timer = setInterval(refresh, LIVE_REFRESH_MS);
    window.addEventListener("focus", refresh);
    window.addEventListener("online", refresh);
    document.addEventListener("visibilitychange", refresh);
    const unsubscribe = onDataChanged(() => {
      if (active()) void query.refresh();
    });
    return () => {
      clearInterval(timer);
      unsubscribe();
      query.dispose();
      if (current.current === query) current.current = null;
      window.removeEventListener("focus", refresh);
      window.removeEventListener("online", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [key, path]);
  return {
    data: snapshot.key === key ? snapshot.data : null,
    error: snapshot.key === key ? snapshot.error : "",
    loading: snapshot.key !== key || snapshot.loading,
    refreshing: snapshot.key === key && snapshot.refreshing,
    reload,
  };
}
