import { AppState } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { isLoopbackPreview } from "./api";
import { LIVE_REFRESH_MS, onDataChanged, type LiveQuery } from "../../../src/lib/live-query";
export function watchActiveQuery<T>(query: LiveQuery<T>) {
  let online = true;
  let foreground = AppState.currentState !== "background" && AppState.currentState !== "inactive";
  const refresh = (skip = true) => {
    if (online && foreground) void query.refresh(skip);
  };
  const state = AppState.addEventListener("change", (value) => {
    foreground = value === "active";
    refresh();
  });
  const network = NetInfo.addEventListener((value) => {
    const wasOnline = online;
    // USB forwarding and LAN servers can be reachable without public Internet.
    online = isLoopbackPreview || value.isConnected !== false;
    if (!wasOnline && online) refresh();
  });
  const changes = onDataChanged(() => refresh(false));
  const timer = setInterval(refresh, LIVE_REFRESH_MS);
  refresh();
  return () => {
    clearInterval(timer);
    state.remove();
    network();
    changes();
    query.dispose();
  };
}
