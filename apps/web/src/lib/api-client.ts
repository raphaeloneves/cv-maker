/**
 * Shared typed fetch client for `apps/web`.
 *
 * Every domain module (`src/domains/*​/api.ts`) should build its typed
 * request/response calls on top of the primitives exported here rather than
 * calling `fetch` directly, so auth-header injection, refresh-on-401 retry,
 * and error-shape parsing stay in exactly one place.
 *
 * ## Auth model (see docs/api-routes.md + packages/contracts/src/auth.ts)
 * - The **access token** is short-lived and held in memory only (this
 *   module's module-level `accessToken` variable) — never localStorage,
 *   never a readable cookie. It is attached to every request (except
 *   `/auth/*`) as `Authorization: Bearer <token>`.
 * - The **refresh token** is an httpOnly `SameSite=None; Secure` cookie
 *   (`cv_maker_refresh`) the browser sends automatically; this module never
 *   reads or writes it directly, it just makes sure `credentials: "include"`
 *   is set on every request so the browser can.
 * - Because `apps/web` is a **static multi-page app** (full browser
 *   navigation between Astro pages, not a client-side router), the in-memory
 *   access token does NOT survive a page load. Call `refreshSession()` once
 *   when any page that needs auth mounts (typically from a small "session
 *   bootstrap" hook in `domains/auth`) to silently re-derive a fresh access
 *   token from the refresh cookie before rendering protected content.
 * - On any authenticated request that comes back `401`, this module
 *   automatically calls `POST /auth/refresh` once, retries the original
 *   request with the new token, and only surfaces the `401` to the caller if
 *   that refresh itself fails (at which point `onAuthExpired` — if
 *   registered — fires so the app can redirect to `/login`). Concurrent
 *   401s share a single in-flight refresh call instead of each firing their
 *   own.
 *
 * ## Error shape
 * Every non-2xx, non-401-retried response is thrown as an `ApiError`
 * carrying the parsed `{ code, message, fields }` from the API's documented
 * error envelope (`docs/api-routes.md` → "Error shape"). `fields`, when
 * present, is keyed by the offending field path — hand it straight to
 * per-field form error state.
 *
 * ## Exported request helpers
 * - `apiGet<T>(path, opts?)`
 * - `apiPost<T>(path, body?, opts?)`
 * - `apiPut<T>(path, body?, opts?)`
 * - `apiPatch<T>(path, body?, opts?)`
 * - `apiDelete<T = void>(path, opts?)`
 * - `apiPostMultipart<T>(path, formData, opts?)` — for the photo upload
 *   endpoint; does not set `Content-Type` itself so the browser can add the
 *   correct multipart boundary.
 * - `apiRequestBlob(path, opts?)` — low-level escape hatch for binary
 *   responses (e.g. `POST /cvs/:id/export`'s `application/pdf` body). Runs
 *   the same auth/refresh handling, returns the raw `Response` so the caller
 *   can read `.blob()` and inspect headers like `X-Watermarked`.
 *
 * ## Session helpers
 * - `getAccessToken()` / `setAccessToken(token, expiresAt?)`
 * - `refreshSession()` — calls `POST /auth/refresh`, stores the resulting
 *   access token in memory, and returns the full `AuthSession` (or `null` if
 *   there is no valid refresh cookie). Safe to call on every protected
 *   page's mount.
 * - `setOnAuthExpired(callback)` — register a single callback fired when an
 *   authenticated request's automatic refresh attempt fails (i.e. the user's
 *   session is truly gone). `domains/auth` wires this up once, app-wide, to
 *   redirect to `/login`.
 */

import type { AuthSession } from "@cv-maker/contracts";

/** Dev default matches docs/api-routes.md. Override via `PUBLIC_API_BASE_URL`
 * (Astro only exposes `PUBLIC_`-prefixed env vars to client code). */
const API_BASE_URL: string =
  (import.meta.env.PUBLIC_API_BASE_URL as string | undefined) ?? "http://localhost:4000";

// ---------------------------------------------------------------------------
// In-memory session state
// ---------------------------------------------------------------------------

let accessToken: string | null = null;
let accessTokenExpiresAt: string | null = null;
let onAuthExpired: (() => void) | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null, expiresAt?: string | null): void {
  accessToken = token;
  accessTokenExpiresAt = token ? (expiresAt ?? null) : null;
}

export function getAccessTokenExpiresAt(): string | null {
  return accessTokenExpiresAt;
}

/** Registers the single app-wide callback fired when a request's automatic
 * refresh-on-401 attempt fails. Pass `null` to unregister. */
export function setOnAuthExpired(callback: (() => void) | null): void {
  onAuthExpired = callback;
}

// ---------------------------------------------------------------------------
// Error type
// ---------------------------------------------------------------------------

/** Thrown by every request helper for non-2xx responses (after any
 * refresh-and-retry has already been attempted). Mirrors the API's
 * `{ error: { code, message, fields } }` envelope. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields?: Record<string, string>;

  constructor(status: number, code: string, message: string, fields?: Record<string, string>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

// ---------------------------------------------------------------------------
// Refresh-on-401
// ---------------------------------------------------------------------------

let refreshPromise: Promise<AuthSession | null> | null = null;

/** Calls `POST /auth/refresh` (reads the httpOnly refresh cookie), stores the
 * resulting access token in memory, and returns the session — or `null` if
 * there is no valid refresh cookie / it has expired. Concurrent callers share
 * one in-flight request. Safe to call unconditionally on a protected page's
 * mount to silently restore a session after a full page navigation. */
export function refreshSession(): Promise<AuthSession | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });
        if (!res.ok) {
          setAccessToken(null);
          return null;
        }
        const session = (await res.json()) as AuthSession;
        setAccessToken(session.accessToken, session.accessTokenExpiresAt);
        return session;
      } catch {
        setAccessToken(null);
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

// ---------------------------------------------------------------------------
// Core request plumbing
// ---------------------------------------------------------------------------

interface RequestOptions {
  signal?: AbortSignal;
}

interface InternalRequestOptions extends RequestOptions {
  method: string;
  path: string;
  body?: unknown;
  isMultipart?: boolean;
  /** Set on the internal retry after a successful refresh, so we never loop. */
  skipAuthRetry?: boolean;
}

function isAuthEndpoint(path: string): boolean {
  return path.startsWith("/auth/");
}

async function parseErrorBody(res: Response): Promise<ApiError> {
  let code = "unknown_error";
  let message = res.statusText || "Request failed";
  let fields: Record<string, string> | undefined;
  const text = await res.text();
  if (text) {
    try {
      const parsed = JSON.parse(text) as { error?: { code?: string; message?: string; fields?: Record<string, string> } };
      if (parsed.error) {
        code = parsed.error.code ?? code;
        message = parsed.error.message ?? message;
        fields = parsed.error.fields;
      }
    } catch {
      // Non-JSON error body (e.g. an upstream proxy error page) — keep defaults.
    }
  }
  return new ApiError(res.status, code, message, fields);
}

/** Performs the fetch, including auth-header injection and the single
 * refresh-and-retry pass on a `401` from a non-`/auth/*` endpoint. Returns
 * the raw `Response` — callers decide how to read the body (JSON vs blob). */
async function rawRequest(opts: InternalRequestOptions): Promise<Response> {
  const headers: Record<string, string> = {};
  if (!opts.isMultipart && opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  const token = getAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${opts.path}`, {
    method: opts.method,
    headers,
    credentials: "include",
    signal: opts.signal,
    body:
      opts.body === undefined
        ? undefined
        : opts.isMultipart
          ? (opts.body as FormData)
          : JSON.stringify(opts.body),
  });

  if (res.status === 401 && !opts.skipAuthRetry && !isAuthEndpoint(opts.path)) {
    const session = await refreshSession();
    if (session) {
      return rawRequest({ ...opts, skipAuthRetry: true });
    }
    onAuthExpired?.();
  }

  return res;
}

async function apiRequest<T>(opts: InternalRequestOptions): Promise<T> {
  const res = await rawRequest(opts);

  if (res.status === 204) {
    return undefined as T;
  }

  if (!res.ok) {
    throw await parseErrorBody(res);
  }

  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

// ---------------------------------------------------------------------------
// Public request helpers
// ---------------------------------------------------------------------------

export function apiGet<T>(path: string, opts?: RequestOptions): Promise<T> {
  return apiRequest<T>({ method: "GET", path, signal: opts?.signal });
}

export function apiPost<T>(path: string, body?: unknown, opts?: RequestOptions): Promise<T> {
  return apiRequest<T>({ method: "POST", path, body, signal: opts?.signal });
}

export function apiPut<T>(path: string, body?: unknown, opts?: RequestOptions): Promise<T> {
  return apiRequest<T>({ method: "PUT", path, body, signal: opts?.signal });
}

export function apiPatch<T>(path: string, body?: unknown, opts?: RequestOptions): Promise<T> {
  return apiRequest<T>({ method: "PATCH", path, body, signal: opts?.signal });
}

export function apiDelete<T = void>(path: string, opts?: RequestOptions): Promise<T> {
  return apiRequest<T>({ method: "DELETE", path, signal: opts?.signal });
}

/** For multipart endpoints (currently just the personal-info photo upload).
 * Pass a `FormData` with the field named per the route (`photo`). */
export function apiPostMultipart<T>(
  path: string,
  formData: FormData,
  opts?: RequestOptions,
): Promise<T> {
  return apiRequest<T>({ method: "POST", path, body: formData, isMultipart: true, signal: opts?.signal });
}

/** Low-level escape hatch for binary responses (e.g. PDF export). Runs the
 * same auth-header/refresh-retry handling as the JSON helpers but returns
 * the raw `Response` so the caller can read `.blob()` and inspect headers
 * (`X-Watermarked`, `X-Page-Count`) or throw a parsed `ApiError` itself via
 * `throwIfError`. */
export async function apiRequestBlob(
  path: string,
  opts?: RequestOptions & { method?: string; body?: unknown },
): Promise<Response> {
  const res = await rawRequest({
    method: opts?.method ?? "POST",
    path,
    body: opts?.body,
    signal: opts?.signal,
  });
  if (!res.ok) {
    throw await parseErrorBody(res);
  }
  return res;
}
