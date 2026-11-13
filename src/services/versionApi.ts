// Version Download API Service — employee-code verification for /version.
import { getDownloadLogApiBase } from '@/services/downloads/downloadsApi';

export const VERIFY_PATH = '/version/verify';
export const VERIFY_TIMEOUT_MS = 10_000;

/**
 * The verification endpoint is built here only: the rate-limited endpoint on the
 * same (public) base URL as the download log. null when the base is not configured.
 */
export function getVerifyUrl(): string | null {
  const base = getDownloadLogApiBase();
  return base ? `${base}${VERIFY_PATH}` : null;
}

/**
 * Result of a verification attempt. Deliberately does not distinguish
 * "unknown code" from "inactive code" or any other rejection.
 */
export type VerifyResult =
  | { status: 'ok'; employeeName: string }
  | { status: 'failed' }
  | { status: 'rate_limited' }
  | { status: 'network' }
  | { status: 'aborted' };

export interface VerifyRequest {
  emp_code: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Non-empty employee_name from the top level or from data (both are sent by the API). */
function employeeNameFrom(body: unknown): string | null {
  if (!isRecord(body) || body.success !== true) return null;
  const candidates = [body.employee_name, isRecord(body.data) ? body.data.employee_name : undefined];
  for (const value of candidates) {
    if (typeof value === 'string' && value.trim() !== '') return value;
  }
  return null;
}

/**
 * POST {VITE_DOWNLOAD_LOG_API_BASE}/version/verify
 * - 200 + employee_name   -> ok
 * - 403 NOT_RECOGNISED, 400 and other 4xx -> failed (one generic message)
 * - 429 TOO_MANY_ATTEMPTS -> rate_limited
 * - network error, timeout (10 s), 5xx -> network
 * Public endpoint: no Authorization header, no cookies.
 */
export async function verifyEmployeeCode(
  empCode: string,
  { signal, fetchImpl = fetch }: { signal?: AbortSignal; fetchImpl?: typeof fetch } = {}
): Promise<VerifyResult> {
  const url = getVerifyUrl();
  if (!url) {
    return { status: 'network' };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS);
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort, { once: true });

  try {
    if (signal?.aborted) {
      return { status: 'aborted' };
    }
    const response = await fetchImpl(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emp_code: empCode.toUpperCase() } satisfies VerifyRequest),
      credentials: 'omit',
      signal: controller.signal,
    });

    if (response.status === 429) {
      return { status: 'rate_limited' };
    }
    if (response.status >= 500) {
      return { status: 'network' };
    }
    if (!response.ok) {
      return { status: 'failed' };
    }

    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      return { status: 'failed' };
    }
    const employeeName = employeeNameFrom(body);
    return employeeName ? { status: 'ok', employeeName } : { status: 'failed' };
  } catch {
    return signal?.aborted ? { status: 'aborted' } : { status: 'network' };
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}
