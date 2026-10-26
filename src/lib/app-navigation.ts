// Keep app journeys in the installed experience while reusing the same features.
// Longest/specific paths come first; query strings and fragments stay intact.
const routes = [
  ["/problems/new", "/app/post"],
  ["/solutions/new", "/app/propose"],
  ["/innovations", "/app/solutions"],
  ["/problems", "/app/problems"],
  ["/explore", "/app/explore"],
  ["/dashboard", "/app/activity"],
  ...[
    "settings",
    "login",
    "register",
    "notifications",
    "teams",
    "collaborations",
    "impact",
    "evidence",
    "intelligence",
    "organizations",
    "people",
    "leaderboard",
    "admin",
    "operations",
    "system",
  ].map((name) => [`/${name}`, `/app/${name}`]),
] as const;

function rewrite(href: string, reverse = false) {
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  const [pathname] = href.split(/[?#]/, 1);
  const suffix = href.slice(pathname.length);
  if (pathname === (reverse ? "/app" : "/")) return (reverse ? "/" : "/app") + suffix;
  for (const pair of routes) {
    const [from, to] = reverse ? [pair[1], pair[0]] : pair;
    if (pathname === from || pathname.startsWith(from + "/"))
      return to + pathname.slice(from.length) + suffix;
  }
  return href;
}
export const toAppHref = (href: string) => rewrite(href);
export const toWebsiteHref = (href: string) => rewrite(href, true);
export const isAppPath = (path: string) => path === "/app" || path.startsWith("/app/");
