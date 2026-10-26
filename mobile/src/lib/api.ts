export class ApiError extends Error {
  constructor(
    message: string,
    public status = 0,
  ) {
    super(message);
  }
}
export function validateApiUrl(value: string | undefined, development: boolean) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.username || url.password || url.search || url.hash || !["", "/"].includes(url.pathname))
      return null;
    if (
      url.protocol !== "https:" &&
      !(
        development &&
        url.protocol === "http:" &&
        /^(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)$/.test(
          url.hostname,
        )
      )
    )
      return null;
    return url.origin;
  } catch {
    return null;
  }
}
export const apiUrl = validateApiUrl(process.env.EXPO_PUBLIC_API_URL, __DEV__);
let sessionToken: string | null = null;
let expired = () => {};
export function configureSession(token: string | null, onExpired?: () => void) {
  sessionToken = token;
  if (onExpired) expired = onExpired;
}
export const fileSource = (id: string) => ({
  uri: `${apiUrl}/api/files/${encodeURIComponent(id)}`,
  ...(sessionToken ? { headers: { Authorization: `Bearer ${sessionToken}` } } : {}),
});
export async function api<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  if (!apiUrl) throw new ApiError("Server address has not been configured.");
  if (!path.startsWith("/api/")) throw new ApiError("Invalid API path.");
  const abort = new AbortController();
  const timeout = setTimeout(() => abort.abort(), 25000);
  try {
    const response = await fetch(apiUrl + path, {
      ...options,
      signal: abort.signal,
      credentials: "omit",
      headers: {
        "X-CivicBridge-Client": "native",
        ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
        ...(options.body && !(options.body instanceof FormData)
          ? { "Content-Type": "application/json" }
          : {}),
        ...options.headers,
      },
    });
    if (response.status === 204) return undefined as T;
    const body = await response
      .json()
      .catch(() => ({ error: "The request failed. Please try again." }));
    if (!response.ok) {
      if (response.status === 401 && sessionToken) expired();
      throw new ApiError(body.error || "The request failed. Please try again.", response.status);
    }
    return body;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError("Could not connect. Check your internet connection and try again.");
  } finally {
    clearTimeout(timeout);
  }
}
export const platform = <T = any>(path: string, method = "GET", body?: unknown) =>
  api<T>(`/api/platform/${path}`, {
    method,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
