import { buildAuthHeaders } from "@/lib/auth";

/**
 * Employee download tracking API (called directly, not through a proxy, so the server
 * sees the employee's real IP). Base URL: VITE_DOWNLOAD_LOG_API_BASE (public URL, not a secret).
 *
 * Every field from the API is treated as untrusted text: it is type-checked here and
 * rendered only as React text by callers.
 */

/** Employee code format: 2 letters + 1–8 digits (uppercase). */
export const EMP_CODE_PATTERN = /^[A-Z]{2}[0-9]{1,8}$/;

export const LOG_TIMEOUT_MS = 3_000;
export const ADMIN_TIMEOUT_MS = 10_000;
export const LOG_PAGE_MAX = 200;

export function isValidEmpCode(value: string): boolean {
  return EMP_CODE_PATTERN.test(value);
}

export function getDownloadLogApiBase(): string | null {
  const raw = import.meta.env.VITE_DOWNLOAD_LOG_API_BASE?.trim().replace(/\/+$/, "");
  if (!raw) {
    return null;
  }
  try {
    const url = new URL(raw);
    // Plain https origin only (http allowed for localhost during development).
    if (url.protocol !== "https:" && !(url.protocol === "http:" && url.hostname === "localhost")) {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const asString = (value: unknown): string => (typeof value === "string" ? value : "");
const asNullableString = (value: unknown): string | null => (typeof value === "string" && value !== "" ? value : null);
const asCount = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.trunc(value) : 0;

/**
 * Runs fetch with a timeout. If `outer` is given, aborting it aborts the request too.
 * Returns the response, or throws (AbortError / TypeError) like fetch.
 */
async function fetchWithTimeout(
  fetchImpl: typeof fetch,
  url: string,
  init: RequestInit,
  timeoutMs: number,
  outer?: AbortSignal
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onOuterAbort = () => controller.abort();
  if (outer) {
    if (outer.aborted) {
      controller.abort();
    } else {
      outer.addEventListener("abort", onOuterAbort, { once: true });
    }
  }
  try {
    return await fetchImpl(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
    outer?.removeEventListener("abort", onOuterAbort);
  }
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public: POST /downloads/log
// ---------------------------------------------------------------------------

export type LogDownloadResult = "logged" | "not_allowed" | "failed";

export interface LogDownloadInput {
  empCode: string;
  channel: string;
  version: string;
}

/**
 * Records a /version download. Never throws.
 * - "logged": 200 (including duplicate within 10 s)
 * - "not_allowed": 403 NOT_ALLOWED — the employee code is no longer active
 * - "failed": anything else (network, timeout, 4xx/5xx) — the caller still downloads
 */
export async function logDownload(
  { empCode, channel, version }: LogDownloadInput,
  {
    fetchImpl = (...args: Parameters<typeof fetch>) => fetch(...args),
    timeoutMs = LOG_TIMEOUT_MS,
    signal,
  }: { fetchImpl?: typeof fetch; timeoutMs?: number; signal?: AbortSignal } = {}
): Promise<LogDownloadResult> {
  const base = getDownloadLogApiBase();
  if (!base || !isValidEmpCode(empCode)) {
    return "failed";
  }

  try {
    const response = await fetchWithTimeout(
      fetchImpl,
      `${base}/downloads/log`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emp_code: empCode, channel, version }),
        credentials: "omit",
      },
      timeoutMs,
      signal
    );

    if (response.status === 403) {
      const body = await readJson(response);
      const code = isRecord(body) && isRecord(body.error) ? body.error.code : undefined;
      return code === "NOT_ALLOWED" ? "not_allowed" : "failed";
    }
    if (!response.ok) {
      return "failed";
    }
    const body = await readJson(response);
    return isRecord(body) && body.success === true ? "logged" : "failed";
  } catch {
    return "failed";
  }
}

// ---------------------------------------------------------------------------
// Admin: GET /admin/downloads/summary and /admin/downloads
// ---------------------------------------------------------------------------

export interface DownloadSummaryItem {
  emp_code: string;
  employee_name: string;
  is_active: boolean;
  downloads: number;
  last_downloaded_at: string | null;
  last_version: string | null;
}

export interface DownloadLogItem {
  id: string;
  emp_code: string;
  employee_name: string;
  channel: string;
  version: string;
  device: string;
  ip: string;
  downloaded_at: string;
}

export interface DownloadLogPage {
  items: DownloadLogItem[];
  next_cursor: string | null;
}

export interface DownloadLogQuery {
  limit?: number;
  cursor?: string | null;
  empCode?: string;
  signal?: AbortSignal;
}

export type DownloadsApiErrorKind = "auth" | "network" | "timeout" | "server" | "bad_response" | "config" | "aborted" | "invalid";

/** Error with a generic, user-safe message (never the raw server text). */
export class DownloadsApiError extends Error {
  readonly status: number;
  readonly kind: DownloadsApiErrorKind;

  constructor(kind: DownloadsApiErrorKind, status = 0) {
    super(GENERIC_MESSAGES[kind]);
    this.name = "DownloadsApiError";
    this.kind = kind;
    this.status = status;
  }

  /** 401/403: the admin session is missing, expired or not allowed. */
  get isAuthError(): boolean {
    return this.kind === "auth";
  }
}

const GENERIC_MESSAGES: Record<DownloadsApiErrorKind, string> = {
  auth: "Your admin session has expired. Please log in again.",
  network: "Could not reach the downloads service.",
  timeout: "The downloads service took too long to respond.",
  server: "The downloads service returned an error.",
  bad_response: "The downloads service returned an unexpected response.",
  config: "Download tracking is not configured.",
  aborted: "Request cancelled.",
  invalid: "Enter a valid employee code (2 letters followed by numbers).",
};

function toSummaryItem(raw: unknown): DownloadSummaryItem {
  const item = isRecord(raw) ? raw : {};
  return {
    emp_code: asString(item.emp_code),
    employee_name: asString(item.employee_name),
    is_active: item.is_active === true,
    downloads: asCount(item.downloads),
    last_downloaded_at: asNullableString(item.last_downloaded_at),
    last_version: asNullableString(item.last_version),
  };
}

function toLogItem(raw: unknown): DownloadLogItem {
  const item = isRecord(raw) ? raw : {};
  return {
    id: typeof item.id === "number" ? String(item.id) : asString(item.id),
    emp_code: asString(item.emp_code),
    employee_name: asString(item.employee_name),
    channel: asString(item.channel),
    version: asString(item.version),
    device: asString(item.device),
    ip: asString(item.ip),
    downloaded_at: asString(item.downloaded_at),
  };
}

function toCursor(value: unknown): string | null {
  if (typeof value === "string" && value) return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

export interface DownloadsAdminApi {
  getSummary(options?: { signal?: AbortSignal }): Promise<DownloadSummaryItem[]>;
  getLog(query?: DownloadLogQuery): Promise<DownloadLogPage>;
}

export interface DownloadsAdminApiOptions {
  fetchImpl?: typeof fetch;
  getHeaders?: () => HeadersInit;
  timeoutMs?: number;
  baseUrl?: string | null;
}

export function createDownloadsAdminApi(options: DownloadsAdminApiOptions = {}): DownloadsAdminApi {
  const {
    fetchImpl = (...args: Parameters<typeof fetch>) => fetch(...args),
    getHeaders = () => buildAuthHeaders("admin", false),
    timeoutMs = ADMIN_TIMEOUT_MS,
  } = options;

  async function getData(pathAndQuery: string, signal?: AbortSignal): Promise<Record<string, unknown>> {
    const base = options.baseUrl === undefined ? getDownloadLogApiBase() : options.baseUrl;
    if (!base) {
      throw new DownloadsApiError("config");
    }

    let response: Response;
    let timedOut = false;
    const timer = new AbortController();
    const timeout = setTimeout(() => {
      timedOut = true;
      timer.abort();
    }, timeoutMs);
    const onOuterAbort = () => timer.abort();
    signal?.addEventListener("abort", onOuterAbort, { once: true });
    try {
      if (signal?.aborted) {
        throw new DownloadsApiError("aborted");
      }
      response = await fetchImpl(`${base}${pathAndQuery}`, {
        method: "GET",
        headers: getHeaders(),
        credentials: "omit",
        signal: timer.signal,
      });
    } catch (error) {
      if (error instanceof DownloadsApiError) throw error;
      if (signal?.aborted) throw new DownloadsApiError("aborted");
      throw new DownloadsApiError(timedOut ? "timeout" : "network");
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener("abort", onOuterAbort);
    }

    if (response.status === 401 || response.status === 403) {
      throw new DownloadsApiError("auth", response.status);
    }
    const body = await readJson(response);
    if (!response.ok || !isRecord(body) || body.success !== true) {
      throw new DownloadsApiError("server", response.status);
    }
    if (!isRecord(body.data) || !Array.isArray(body.data.items)) {
      throw new DownloadsApiError("bad_response", response.status);
    }
    return body.data;
  }

  return {
    async getSummary({ signal } = {}) {
      const data = await getData("/admin/downloads/summary", signal);
      return (data.items as unknown[]).map(toSummaryItem);
    },

    async getLog({ limit = 50, cursor = null, empCode, signal } = {}) {
      const size = Math.min(Math.max(Math.trunc(limit) || 1, 1), LOG_PAGE_MAX);
      const params = new URLSearchParams({ limit: String(size) });
      if (cursor) {
        params.set("cursor", cursor);
      }
      if (empCode) {
        if (!isValidEmpCode(empCode)) {
          throw new DownloadsApiError("invalid");
        }
        params.set("emp_code", empCode);
      }
      const data = await getData(`/admin/downloads?${params.toString()}`, signal);
      return {
        items: (data.items as unknown[]).map(toLogItem),
        next_cursor: toCursor(data.next_cursor),
      };
    },
  };
}
