import { afterEach, describe, expect, it, vi } from "vitest";
declare global {
  const __DEV__: boolean;
}
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.resetModules();
});
describe("native requests during an account change", () => {
  it.each([200, 401])(
    "drops an old account's %s response without invalidating the new account",
    async (status) => {
      vi.stubGlobal("__DEV__", false);
      vi.stubEnv("EXPO_PUBLIC_API_URL", "https://civicbridge.example.test");
      let finish!: (value: Response) => void;
      const fetch = vi.fn<typeof globalThis.fetch>(
        () =>
          new Promise<Response>((resolve) => {
            finish = resolve;
          }),
      );
      vi.stubGlobal("fetch", fetch);
      const { api, configureSession, fileSource } = await import("../../mobile/src/lib/api");
      const expired = vi.fn();
      configureSession("old-token", expired);
      const request = api("/api/mobile/session");
      configureSession("new-token");
      finish(
        Response.json(status === 200 ? { user: { id: "old-user" } } : { error: "Expired" }, {
          status,
        }),
      );
      await expect(request).rejects.toMatchObject({ status: 409 });
      expect(expired).not.toHaveBeenCalled();
      expect(fileSource("file").headers?.Authorization).toBe("Bearer new-token");
      expect(fetch.mock.calls[0][1]).toMatchObject({
        headers: { Authorization: "Bearer old-token" },
      });
    },
  );
});
