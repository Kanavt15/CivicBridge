import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { api } from "./api";
export function useResource<T = any>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(Boolean(path));
  const [error, setError] = useState("");
  const serial = useRef(0);
  const reload = useCallback(async () => {
    const request = ++serial.current;
    if (!path) {
      setData(null);
      setLoading(false);
      setError("");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const value = await api<T>(path);
      if (request === serial.current) setData(value);
    } catch (e) {
      if (request === serial.current) setError((e as Error).message);
    } finally {
      if (request === serial.current) setLoading(false);
    }
  }, [path]);
  useFocusEffect(
    useCallback(() => {
      void reload();
      return () => {
        serial.current++;
      };
    }, [reload]),
  );
  return { data, loading, error, reload };
}
