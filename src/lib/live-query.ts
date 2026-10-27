// Shared by the browser and React Native. This carries invalidations, never data.
export const LIVE_REFRESH_MS = 5000;
const listeners = new Set<() => void>();
export function notifyDataChanged() {
  for (const listener of listeners) listener();
}
export function onDataChanged(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export type LiveQuery<T> = ReturnType<typeof createLiveQuery<T>>;
export function createLiveQuery<T>(options: {
  load: (signal: AbortSignal) => Promise<T>;
  value: (value: T) => void;
  state: (state: { loading: boolean; refreshing: boolean }) => void;
  error: (error: Error) => void;
  clear: () => void;
}) {
  let disposed = false,
    running = false,
    hasValue = false;
  let abort: AbortController | null = null;
  let waiters: (() => void)[] = [];
  async function run() {
    running = true;
    const batch = waiters;
    waiters = [];
    abort = new AbortController();
    options.state({ loading: !hasValue, refreshing: hasValue });
    try {
      const value = await options.load(abort.signal);
      if (!disposed) {
        hasValue = true;
        options.value(value);
      }
    } catch (error) {
      if (!disposed && !abort.signal.aborted) {
        const status = (error as { status?: number }).status;
        if (status === 401 || status === 403 || status === 404) {
          hasValue = false;
          options.clear();
        }
        // Background network failures retain the last result; offline/connection
        // notices and the next successful request handle reconnection.
        if (!hasValue) options.error(error as Error);
      }
    } finally {
      running = false;
      abort = null;
      if (!disposed) options.state({ loading: false, refreshing: false });
      for (const resolve of batch) resolve();
      if (waiters.length && !disposed) void run();
    }
  }
  return {
    refresh(skipIfBusy = false) {
      if (disposed || (skipIfBusy && running)) return Promise.resolve();
      return new Promise<void>((resolve) => {
        waiters.push(resolve);
        if (!running) void run();
      });
    },
    dispose() {
      disposed = true;
      abort?.abort();
      for (const resolve of waiters) resolve();
      waiters = [];
    },
  };
}
