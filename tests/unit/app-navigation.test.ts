import { describe, it, expect } from "vitest";
import { toAppHref, toWebsiteHref, isAppPath } from "../../src/lib/app-navigation";
describe("dedicated app navigation", () => {
  it.each([
    ["/", "/app"],
    ["/problems/new", "/app/post"],
    ["/solutions/new?problem=abc#form", "/app/propose?problem=abc#form"],
    ["/problems/abc", "/app/problems/abc"],
    ["/innovations/abc", "/app/solutions/abc"],
    ["/explore?category=Water", "/app/explore?category=Water"],
    ["/dashboard", "/app/activity"],
    ["/login", "/app/login"],
    ["/register", "/app/register"],
    ["/teams?invite=abc", "/app/teams?invite=abc"],
    ["/collaborations/abc", "/app/collaborations/abc"],
    ["/notifications", "/app/notifications"],
    ["/people/abc", "/app/people/abc"],
    ["/admin", "/app/admin"],
    ["/settings", "/app/settings"],
  ])("keeps %s inside the app and round-trips", (web, app) => {
    expect(toAppHref(web)).toBe(app);
    expect(toWebsiteHref(app)).toBe(web);
    expect(toAppHref(app)).toBe(app);
  });
  it.each([
    "https://example.com/explore",
    "//example.com/explore",
    "/api/platform/problems",
    "/explorer",
    "/dashboard-old",
    "#location",
    "?page=2",
    "mailto:help@example.com",
    "/unknown",
  ])("preserves unrelated or external destination %s", (href) =>
    expect(toAppHref(href)).toBe(href),
  );
  it("uses route boundaries for app mode", () => {
    expect(isAppPath("/app")).toBe(true);
    expect(isAppPath("/app/account")).toBe(true);
    expect(isAppPath("/application")).toBe(false);
  });
});
