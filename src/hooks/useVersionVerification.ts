import { useCallback, useEffect, useRef, useState } from 'react';
import { verifyEmployeeCode } from '@/services/versionApi';
import { isValidEmpCode } from '@/services/downloads/downloadsApi';

export const MSG_NOT_RECOGNISED = 'Code not recognised. Check your employee code or contact the admin.';
export const MSG_RATE_LIMITED = 'Too many attempts. Please wait 15 minutes and try again.';
export const MSG_NETWORK = 'Could not verify right now. Please try again.';
export const MSG_INVALID_FORMAT = 'Enter a valid employee access code';
export const throttleMessage = (seconds: number) => `Too many wrong attempts. Please wait ${seconds} seconds.`;

/** Failed attempts (this page session) before Verify is disabled. */
export const MAX_FAILED_ATTEMPTS = 4;
export const LOCKOUT_MS = 60_000;

export type LockReason = 'throttle' | 'rate_limited';

export interface VerificationState {
  isLoading: boolean;
  isVerified: boolean;
  /** Shown only in the Employee Name field after a successful verification. Never stored. */
  employeeName: string;
  /** The code that was verified; kept in React state only, for the download log call. */
  verifiedCode: string | null;
  error: string | null;
}

const EMPTY: VerificationState = {
  isLoading: false,
  isVerified: false,
  employeeName: '',
  verifiedCode: null,
  error: null,
};

/**
 * Employee-code verification with a client-side throttle (UX guard only; the real
 * limit belongs on the server). Everything lives in memory for this page session.
 */
export function useVersionVerification() {
  const [verification, setVerification] = useState<VerificationState>(EMPTY);
  const [lock, setLock] = useState<{ until: number; reason: LockReason } | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const failuresRef = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  const cancelInFlight = useCallback(() => {
    requestIdRef.current += 1;
    controllerRef.current?.abort();
    controllerRef.current = null;
  }, []);

  // Abort anything in flight when the page is left.
  useEffect(() => cancelInFlight, [cancelInFlight]);

  // Live countdown while locked.
  useEffect(() => {
    if (!lock) return;
    setNow(Date.now());
    const interval = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= lock.until) {
        clearInterval(interval);
        setLock(null);
        if (lock.reason === 'throttle') {
          failuresRef.current = 0;
        }
        setVerification((prev) => (prev.isVerified ? prev : { ...prev, error: null }));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lock]);

  const secondsLeft = lock ? Math.max(0, Math.ceil((lock.until - now) / 1000)) : 0;
  const isLocked = lock !== null;

  const verifyCode = useCallback(
    async (rawCode: string) => {
      if (lock) return;
      const empCode = rawCode.trim().toUpperCase();
      if (!isValidEmpCode(empCode)) {
        setVerification({ ...EMPTY, error: MSG_INVALID_FORMAT });
        return;
      }

      cancelInFlight();
      const controller = new AbortController();
      controllerRef.current = controller;
      const requestId = requestIdRef.current;

      setVerification({ ...EMPTY, isLoading: true });
      const result = await verifyEmployeeCode(empCode, { signal: controller.signal });
      if (requestId !== requestIdRef.current || result.status === 'aborted') {
        return; // stale or cancelled
      }
      controllerRef.current = null;

      switch (result.status) {
        case 'ok':
          failuresRef.current = 0;
          setVerification({ isLoading: false, isVerified: true, employeeName: result.employeeName, verifiedCode: empCode, error: null });
          return;
        case 'rate_limited':
          setLock({ until: Date.now() + LOCKOUT_MS, reason: 'rate_limited' });
          setVerification({ ...EMPTY, error: MSG_RATE_LIMITED });
          return;
        case 'network':
          setVerification({ ...EMPTY, error: MSG_NETWORK });
          return;
        case 'failed':
        default:
          failuresRef.current += 1;
          if (failuresRef.current >= MAX_FAILED_ATTEMPTS) {
            setLock({ until: Date.now() + LOCKOUT_MS, reason: 'throttle' });
          }
          setVerification({ ...EMPTY, error: MSG_NOT_RECOGNISED });
      }
    },
    [lock, cancelInFlight]
  );

  /** Clears the name, code and any in-flight request (code changed, access revoked, page left). */
  const resetVerification = useCallback(
    (error: string | null = null) => {
      cancelInFlight();
      setVerification({ ...EMPTY, error });
    },
    [cancelInFlight]
  );

  const error = !lock
    ? verification.error
    : lock.reason === 'throttle'
      ? throttleMessage(secondsLeft || Math.ceil(LOCKOUT_MS / 1000))
      : MSG_RATE_LIMITED;

  return {
    verification: { ...verification, error },
    verifyCode,
    resetVerification,
    isLocked,
    secondsLeft,
  };
}
