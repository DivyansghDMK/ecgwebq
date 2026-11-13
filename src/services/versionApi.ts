// Version Download API Service — employee-code verification for /version.

/**
 * The verification endpoint lives here only. To switch to a new backend endpoint,
 * change this one constant.
 */
export const VALIDATE_COMPANY_CODE_URL = 'https://6jhix49qt6.execute-api.us-east-1.amazonaws.com/version/validate-company-code';

export const VERIFY_TIMEOUT_MS = 10_000;

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

export interface CompanyDetailsRequest {
  emp_code: string;
}

export async function validateCompanyCode(
  empCode: string,
  { signal, fetchImpl = fetch }: { signal?: AbortSignal; fetchImpl?: typeof fetch } = {}
): Promise<VerifyResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS);
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort, { once: true });

  try {
    if (signal?.aborted) {
      return { status: 'aborted' };
    }
    const response = await fetchImpl(VALIDATE_COMPANY_CODE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emp_code: empCode.toUpperCase() } as CompanyDetailsRequest),
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

    let data: unknown = null;
    try {
      data = await response.json();
    } catch {
      return { status: 'failed' };
    }
    if (
      typeof data === 'object' &&
      data !== null &&
      (data as Record<string, unknown>).success === true &&
      typeof (data as Record<string, unknown>).employee_name === 'string' &&
      ((data as Record<string, unknown>).employee_name as string).trim() !== ''
    ) {
      return { status: 'ok', employeeName: (data as Record<string, unknown>).employee_name as string };
    }
    return { status: 'failed' };
  } catch {
    return signal?.aborted ? { status: 'aborted' } : { status: 'network' };
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}
