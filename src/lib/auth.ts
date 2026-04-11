export type AuthRole = "admin" | "doctor";

export interface StoredUser {
  userId: string;
  role: string;
  name: string;
  email?: string;
  passwordResetRequired?: boolean;
}

export function isJwtLikeToken(value: string): boolean {
  const segments = value.split(".");
  return segments.length === 3 && segments.every((segment) => segment.trim().length > 0);
}

const STORAGE_KEYS = {
  adminToken: "ecg_admin_token",
  adminUser: "ecg_admin_user",
  doctorToken: "ecg_doctor_token",
  doctorUser: "ecg_doctor_user",
  legacyToken: "token",
  legacyUser: "user",
  legacyRole: "role",
  legacyAdminLoggedIn: "admin_logged_in",
  legacyDoctorName: "ecg_doctor_name",
  legacyDoctorId: "ecg_doctor_id",
} as const;

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore storage failures
  }
}

function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore storage failures
  }
}

function normalizeToken(raw: string | null): string | null {
  if (!raw) {
    return null;
  }

  const trimmed = raw.trim().replace(/^Bearer\s+/i, "").replace(/^"+|"+$/g, "");
  if (!trimmed) {
    return null;
  }

  // Reject common malformed auth values so protected requests never send SigV4/base64 hash material.
  if (
    /^AWS4-HMAC-SHA256/i.test(trimmed) ||
    trimmed.includes("Credential=") ||
    trimmed.includes("SignedHeaders=") ||
    trimmed.includes("Signature=")
  ) {
    return null;
  }

  if (!isJwtLikeToken(trimmed)) {
    return null;
  }

  return trimmed;
}

function parseUser(raw: string | null): StoredUser | null {
  if (!raw) return null;

  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

function getRoleKeys(role: AuthRole) {
  return role === "admin"
    ? { token: STORAGE_KEYS.adminToken, user: STORAGE_KEYS.adminUser }
    : { token: STORAGE_KEYS.doctorToken, user: STORAGE_KEYS.doctorUser };
}

export function getStoredToken(role: AuthRole): string | null {
  const roleKeys = getRoleKeys(role);
  const roleToken = normalizeToken(safeGet(roleKeys.token));

  if (roleToken) {
    return roleToken;
  }

  const legacyRole = safeGet(STORAGE_KEYS.legacyRole);
  if (legacyRole === role) {
    return normalizeToken(safeGet(STORAGE_KEYS.legacyToken));
  }

  return null;
}

export function getStoredUser(role: AuthRole): StoredUser | null {
  const roleKeys = getRoleKeys(role);
  const roleUser = parseUser(safeGet(roleKeys.user));

  if (roleUser) {
    return roleUser;
  }

  const legacyRole = safeGet(STORAGE_KEYS.legacyRole);
  if (legacyRole === role) {
    return parseUser(safeGet(STORAGE_KEYS.legacyUser));
  }

  return null;
}

export function isRoleAuthenticated(role: AuthRole): boolean {
  return Boolean(getStoredToken(role) && getStoredUser(role));
}

export function setAuthSession(role: AuthRole, token: string, user: StoredUser): void {
  const roleKeys = getRoleKeys(role);
  const normalizedToken = normalizeToken(token);

  if (!normalizedToken) {
    throw new Error("Received an invalid authentication token");
  }

  safeSet(roleKeys.token, normalizedToken);
  safeSet(roleKeys.user, JSON.stringify(user));

  if (role === "admin") {
    safeSet(STORAGE_KEYS.legacyAdminLoggedIn, "true");
  }

  if (role === "doctor") {
    safeSet(STORAGE_KEYS.legacyDoctorName, user.name);
    safeSet(STORAGE_KEYS.legacyDoctorId, user.userId);
  }

  safeSet(STORAGE_KEYS.legacyToken, normalizedToken);
  safeSet(STORAGE_KEYS.legacyUser, JSON.stringify(user));
  safeSet(STORAGE_KEYS.legacyRole, role);
}

export function clearAuthSession(role: AuthRole): void {
  const roleKeys = getRoleKeys(role);

  safeRemove(roleKeys.token);
  safeRemove(roleKeys.user);

  const activeRole = safeGet(STORAGE_KEYS.legacyRole);
  if (activeRole === role) {
    safeRemove(STORAGE_KEYS.legacyToken);
    safeRemove(STORAGE_KEYS.legacyUser);
    safeRemove(STORAGE_KEYS.legacyRole);
  }

  if (role === "admin") {
    safeRemove(STORAGE_KEYS.legacyAdminLoggedIn);
  }

  if (role === "doctor") {
    safeRemove(STORAGE_KEYS.legacyDoctorName);
    safeRemove(STORAGE_KEYS.legacyDoctorId);
  }
}

export function clearAllAuthSessions(): void {
  clearAuthSession("admin");
  clearAuthSession("doctor");
}

export function buildAuthHeaders(role: AuthRole, isJson: boolean = true): HeadersInit {
  const headers: Record<string, string> = {};
  const token = getStoredToken(role);

  if (isJson) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}
