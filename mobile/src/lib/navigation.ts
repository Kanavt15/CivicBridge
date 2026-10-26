import { useRouter, type Href } from "expo-router";
type Destination =
  | "Tabs"
  | "Problem"
  | "Solution"
  | "Report"
  | "Propose"
  | "Auth"
  | "Activity"
  | "Notifications"
  | "Profile";
type Params = {
  id?: string;
  problemId?: string;
  register?: boolean;
  screen?: "Home" | "Explore" | "Create" | "Solutions" | "Account";
};
const paths = {
  Report: "/report",
  Propose: "/propose",
  Auth: "/auth",
  Activity: "/activity",
  Notifications: "/notifications",
  Profile: "/profile",
} as const;
function destination(name: Destination, params: Params = {}): Href {
  if (name === "Tabs")
    return (
      {
        Home: "/",
        Explore: "/explore",
        Create: "/create",
        Solutions: "/solutions",
        Account: "/account",
      } as const
    )[params.screen ?? "Home"];
  if (name === "Problem" || name === "Solution")
    return {
      pathname: name === "Problem" ? "/problems/[id]" : "/solutions/[id]",
      params: { id: params.id! },
    };
  return {
    pathname: paths[name],
    params: {
      ...(params.problemId ? { problemId: params.problemId } : {}),
      ...(params.register === undefined ? {} : { register: String(params.register) }),
    },
  };
}
// Domain screens use one small adapter; Expo Router owns all native navigation.
export function useAppNavigation() {
  const router = useRouter();
  return {
    navigate: (name: Destination, params?: Params) => router.push(destination(name, params)),
    replace: (name: Destination, params?: Params) => router.replace(destination(name, params)),
    setParams: (params: { register: boolean }) =>
      router.setParams({ register: String(params.register) }),
    goBack: () => (router.canGoBack() ? router.back() : router.replace("/account")),
  };
}
