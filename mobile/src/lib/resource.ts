import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { api } from "./api";
import { useAuth } from "../providers";
import { createLiveQuery } from "../../../src/lib/live-query";
import { watchActiveQuery } from "./watch";
export function useResource<T = any>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(Boolean(path));
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const authKey = `${user?.id ?? "public"}:${user?.role ?? ""}`;
  const key = `${authKey}:${path}`;
  const [dataKey, setDataKey] = useState(key);
  const query = useRef<ReturnType<typeof createLiveQuery<T>> | null>(null);
  const reload = useCallback(() => query.current?.refresh() ?? Promise.resolve(), []);
  useFocusEffect(
    useCallback(() => {
      setDataKey(key);
      setData(null);
      setError("");
      setLoading(Boolean(path));
      if (!path) return;
      const current = createLiveQuery<T>({
        load: (signal) => api<T>(path, { signal }),
        value: (data) => {
          setData(data);
          setError("");
        },
        clear: () => setData(null),
        error: (error) => setError(error.message),
        state: (state) => {
          setLoading(state.loading);
          setRefreshing(state.refreshing);
        },
      });
      query.current = current;
      const stop = watchActiveQuery(current);
      return () => {
        stop();
        if (query.current === current) query.current = null;
      };
    }, [path, key]),
  );
  return {
    data: dataKey === key ? data : null,
    loading: dataKey !== key || loading,
    refreshing: dataKey === key && refreshing,
    error: dataKey === key ? error : "",
    reload,
  };
}
