import { describe, it, expect } from "vitest";
import { catalog, isLocale, localeNames, locales, translate } from "../../src/lib/i18n/messages";
describe("regional interface messages", () => {
  it("provides complete nonempty translations for every catalog entry", () => {
    expect(new Set(catalog.map((r) => r[0])).size).toBe(catalog.length);
    for (const row of catalog) {
      expect(row).toHaveLength(locales.length);
      expect(row.every((v) => typeof v === "string" && v.trim().length > 0)).toBe(true);
    }
    expect(locales).toHaveLength(6);
  });
  it("validates persisted language choices", () => {
    for (const locale of locales) {
      expect(isLocale(locale)).toBe(true);
      expect(localeNames[locale]).toBeTruthy();
    }
    for (const invalid of ["fr", "HI", null, "hi; Path=/", {}])
      expect(isLocale(invalid)).toBe(false);
  });
  it("translates core labels in all five regional languages", () => {
    for (const locale of locales.filter((l) => l !== "en")) {
      for (const source of [
        "Problems",
        "Post a problem",
        "Propose a solution",
        "Category",
        "Continue",
        "Submit report",
        "Submit proposal",
        "Password",
        "Choose language",
      ]) {
        expect(translate(source, locale)).not.toBe(source);
      }
    }
  });
  it("keeps unknown text readable and preserves spaces around translated fragments", () => {
    expect(translate("Unknown community phrase", "hi")).toBe("Unknown community phrase");
    expect(translate(" supporters", "hi")).toBe(" समर्थक");
    expect(translate(" of ", "mr")).toBe(" पैकी ");
  });
  it("shortens legacy interface copy without changing routes or stored values", () => {
    expect(translate("Keep the bridge moving.", "en")).toBe("Administration");
    expect(translate("Keep the bridge moving.", "hi")).toBe(translate("Administration", "hi"));
    expect(translate("/problems/new", "ta")).toBe("/problems/new");
  });
});
