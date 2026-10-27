import { describe, expect, it, vi } from "vitest";
import { createLiveQuery, notifyDataChanged, onDataChanged } from "../../src/lib/live-query";
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
function fixture(load: (signal: AbortSignal) => Promise<number>) {
  const value = vi.fn(),
    error = vi.fn(),
    clear = vi.fn(),
    state = vi.fn();
  return {
    value,
    error,
    clear,
    state,
    query: createLiveQuery({ load, value, error, clear, state }),
  };
}
describe("shared live queries", () => {
  it("coalesces polling and serializes a fresh read after a concurrent mutation", async () => {
    const first = deferred<number>(),
      second = deferred<number>();
    const load = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const f = fixture(load);
    const initial = f.query.refresh();
    await f.query.refresh(true);
    await f.query.refresh(true);
    const afterMutation = f.query.refresh();
    expect(load).toHaveBeenCalledTimes(1);
    first.resolve(1);
    await initial;
    expect(load).toHaveBeenCalledTimes(2);
    second.resolve(2);
    await afterMutation;
    expect(f.value.mock.calls.map(([value]) => value)).toEqual([1, 2]);
    f.query.dispose();
  });
  it("keeps forms mounted and retains a prior result through a background network error", async () => {
    const load = vi.fn().mockResolvedValueOnce(1).mockRejectedValueOnce(new Error("offline"));
    const f = fixture(load);
    await f.query.refresh();
    await f.query.refresh();
    expect(f.value).toHaveBeenLastCalledWith(1);
    expect(f.clear).not.toHaveBeenCalled();
    expect(f.error).not.toHaveBeenCalled();
    expect(f.state.mock.calls.filter(([state]) => state.loading)).toHaveLength(1);
    f.query.dispose();
  });
  it.each([401, 403, 404])(
    "clears private data immediately when access returns %s",
    async (status) => {
      const f = fixture(
        vi
          .fn()
          .mockResolvedValueOnce(1)
          .mockRejectedValueOnce(Object.assign(new Error("Access removed"), { status })),
      );
      await f.query.refresh();
      await f.query.refresh();
      expect(f.clear).toHaveBeenCalledOnce();
      expect(f.error).toHaveBeenCalledOnce();
      f.query.dispose();
    },
  );
  it("aborts and ignores an old account's request when the consumer is disposed", async () => {
    const pending = deferred<number>();
    let signal!: AbortSignal;
    const f = fixture(
      vi.fn((s) => {
        signal = s;
        return pending.promise;
      }),
    );
    const work = f.query.refresh();
    f.query.dispose();
    expect(signal.aborted).toBe(true);
    pending.resolve(42);
    await work;
    expect(f.value).not.toHaveBeenCalled();
    await f.query.refresh();
    expect(f.error).not.toHaveBeenCalled();
  });
  it("broadcasts invalidation without sharing records or leaking unsubscribed listeners", () => {
    const listener = vi.fn();
    const off = onDataChanged(listener);
    notifyDataChanged();
    expect(listener).toHaveBeenCalledWith();
    off();
    notifyDataChanged();
    expect(listener).toHaveBeenCalledOnce();
  });
});
