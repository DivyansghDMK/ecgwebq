export type AuthRole = "admin" | "doctor";

export interface StoredUser {
  userId: string;
  role: string;
  name: string;
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
  const roleToken = safeGet(roleKeys.token);

  if (roleToken) {
    return roleToken;
  }

  const legacyRole = safeGet(STORAGE_KEYS.legacyRole);
  if (legacyRole === role) {
    return safeGet(STORAGE_KEYS.legacyToken);
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

  safeSet(roleKeys.token, token);
  safeSet(roleKeys.user, JSON.stringify(user));

  if (role === "admin") {
    safeSet(STORAGE_KEYS.legacyAdminLoggedIn, "true");
  }

  if (role === "doctor") {
    safeSet(STORAGE_KEYS.legacyDoctorName, user.name);
    safeSet(STORAGE_KEYS.legacyDoctorId, user.userId);
  }

  safeSet(STORAGE_KEYS.legacyToken, token);
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
