"use client";
import { useCallback, useEffect, useRef, useState } from "react";
export async function api<T = any>(path: string, method = "GET", data?: unknown): Promise<T> {
  const response = await fetch(path.startsWith("/api/") ? path : `/api/platform/${path}`, {
    method,
    headers: data ? { "Content-Type": "application/json" } : undefined,
    body: data ? JSON.stringify(data) : undefined,
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "The request failed. Please try again.");
  return result;
}
export function useData<T = any>(path: string) {
  const sequence = useRef(0);
  const [data, setData] = useState<T | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    const requestId = ++sequence.current;
    try {
      const value = await api<T>(path);
      if (requestId === sequence.current) {
        setData(value);
        setError("");
      }
    } catch (e) {
      if (requestId === sequence.current) setError((e as Error).message);
    } finally {
      if (requestId === sequence.current) setLoading(false);
    }
  }, [path]);
  useEffect(() => {
    setLoading(true);
    void reload();
    return () => {
      sequence.current++;
    };
  }, [reload]);
  return { data, error, loading, reload };
}
