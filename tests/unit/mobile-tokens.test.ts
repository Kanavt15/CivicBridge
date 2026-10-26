import { describe, expect, it } from "vitest";
import {
  mobileToken,
  newMobileToken,
  tokenDigest,
  mobileSessionDurationMs,
} from "../../src/lib/mobile-tokens";
describe("native session credentials", () => {
  it("uses independent 256-bit random tokens and stores only a digest", () => {
    const first = newMobileToken(),
      second = newMobileToken();
    expect(first).not.toBe(second);
    expect(mobileToken(`Bearer ${first}`)).toBe(first);
    expect(tokenDigest(first)).toMatch(/^[a-f0-9]{64}$/);
    expect(tokenDigest(first)).not.toContain(first);
    expect(tokenDigest(first)).not.toBe(tokenDigest(second));
    expect(mobileSessionDurationMs).toBe(604800000);
  });
  it.each([
    null,
    "",
    "Bearer abc",
    "Basic cbm_invalid",
    `Bearer ${newMobileToken()} extra`,
    `Bearer ${newMobileToken()}\n`,
    `Bearer cbm_${"a".repeat(42)}`,
  ])("rejects malformed authorization %#", (header) => expect(mobileToken(header)).toBeNull());
});
