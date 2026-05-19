import { trimTrailingSlashes } from "@/lib/apiBase";

export type LicenseTier = "Trial" | "Standard" | "Professional" | "Enterprise";

export interface LicenseRecord {
  id?: string;
  licenseKey: string;
  backupKey?: string | null;
  tier: string;
  status: "active" | "revoked";
  machineName?: string | null;
  machineHost?: string | null;
  machineOs?: string | null;
  machineId?: string | null;
  activatedAt?: string | null;
  lastSeenAt?: string | null;
  createdAt?: string | null;
  customerNotes?: string | null;
  activationCount?: number;
  revokedAt?: string | null;
  raw?: Record<string, unknown>;
}

export interface LicenseActivation {
  id?: string;
  licenseKey: string;
  machineName?: string | null;
  machineHost?: string | null;
  machineId?: string | null;
  activatedAt?: string | null;
  lastSeenAt?: string | null;
  raw?: Record<string, unknown>;
}

export interface CreateLicensePayload {
  tier: LicenseTier;
  customerNotes: string;
}

const LICENSE_API_BASE_URL = trimTrailingSlashes(
  import.meta.env.VITE_LICENSE_API_BASE_URL ||
    "https://m4qoae4d8e.execute-api.us-east-1.amazonaws.com/prod"
);
const LICENSE_ADMIN_TOKEN = "deckmount_admin_2026_secure";

function getLicenseAdminToken(): string {
  return (import.meta.env.VITE_LICENSE_ADMIN_TOKEN || LICENSE_ADMIN_TOKEN).trim();
}

function buildLicenseHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    "X-Admin-Token": getLicenseAdminToken(),
  };
}

async function licenseApiPost<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${LICENSE_API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: buildLicenseHeaders(),
    body: JSON.stringify(body),
  });

  const contentType = response.headers.get("content-type");
  const payload = contentType?.includes("application/json") ? await response.json() : await response.text();
  const payloadRecord = asRecord(payload);
  const errorRecord = asRecord(payloadRecord.error);
  const errorMessage =
    pickString(errorRecord, ["message"]) ||
    pickString(payloadRecord, ["message", "error"]) ||
    response.statusText;

  if (!response.ok || payloadRecord.success === false) {
    throw new Error(errorMessage || "License API request failed");
  }

  return payload as T;
}

async function licenseApiGet<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${LICENSE_API_BASE_URL}${endpoint}`, {
    method: "GET",
    headers: buildLicenseHeaders(),
  });

  const contentType = response.headers.get("content-type");
  const payload = contentType?.includes("application/json") ? await response.json() : await response.text();
  const payloadRecord = asRecord(payload);
  const errorRecord = asRecord(payloadRecord.error);
  const errorMessage =
    pickString(errorRecord, ["message"]) ||
    pickString(payloadRecord, ["message", "error"]) ||
    response.statusText;

  if (!response.ok || payloadRecord.success === false) {
    throw new Error(errorMessage || "License API request failed");
  }

  return payload as T;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function pickString(source: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
    if (typeof value === "number") {
      return String(value);
    }
  }

  return null;
}

function pickBoolean(source: Record<string, unknown>, keys: string[]): boolean | null {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "boolean") {
      return value;
    }
  }

  return null;
}

function pickNumber(source: Record<string, unknown>, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return undefined;
}

function normalizeTimestamp(value: string | null): string | null {
  if (!value) return null;
  const numericValue = Number(value);
  if (Number.isFinite(numericValue)) {
    if (numericValue === 0) return null;
    const milliseconds = numericValue < 10_000_000_000 ? numericValue * 1000 : numericValue;
    return new Date(milliseconds).toISOString();
  }

  return value;
}

function normalizeTier(value: string | null): string {
  const tierNames: Record<string, string> = {
    "0": "Trial",
    "1": "Standard",
    "2": "Professional",
    "3": "Enterprise",
  };

  if (!value) return "Unknown";
  return tierNames[value] || value;
}

function unwrapList<T>(response: unknown, keys: string[]): T[] {
  if (Array.isArray(response)) {
    return response as T[];
  }

  const object = asRecord(response);
  for (const key of keys) {
    const value = object[key];
    if (Array.isArray(value)) {
      return value as T[];
    }
  }

  const data = object.data;
  if (data) {
    return unwrapList<T>(data, keys);
  }

  return [];
}

function normalizeStatus(source: Record<string, unknown>): LicenseRecord["status"] {
  const explicit = pickString(source, ["status", "licenseStatus", "state"]);
  if (explicit) {
    const lower = explicit.toLowerCase();
    if (lower.includes("revoked")) return "revoked";
    if (lower.includes("active") || lower.includes("valid")) return "active";
  }

  const revoked = pickBoolean(source, ["revoked", "isRevoked"]);
  if (revoked) return "revoked";

  return "active";
}

function normalizeLicense(value: unknown): LicenseRecord {
  const source = asRecord(value);
  const nestedMachine = asRecord(source.machine_binding || source.machine || source.binding || source.activation);
  const licenseKey = pickString(source, ["licenseKey", "license_key", "key", "license", "id"]) || "";

  return {
    id: pickString(source, ["id", "licenseId", "license_id"]) || licenseKey,
    licenseKey,
    backupKey: pickString(source, ["backupKey", "backup_key"]),
    tier: normalizeTier(pickString(source, ["tier_name", "tierName", "tier", "plan", "licenseTier"])),
    status: normalizeStatus(source),
    machineName:
      pickString(source, ["machineName", "machine_name", "deviceName"]) ||
      pickString(nestedMachine, ["name", "machineName", "machine_name", "deviceName"]),
    machineHost:
      pickString(source, ["machineHost", "machine_host", "host", "hostname"]) ||
      pickString(nestedMachine, ["host", "hostname", "machineHost", "machine_host"]),
    machineOs:
      pickString(source, ["machineOs", "machineOS", "machine_os"]) ||
      pickString(nestedMachine, ["machineOs", "machineOS", "machine_os"]),
    machineId:
      pickString(source, ["machineId", "machine_id", "deviceId", "fingerprint", "hardware_fingerprint"]) ||
      pickString(nestedMachine, ["id", "machineId", "machine_id", "deviceId", "fingerprint", "hardware_fingerprint"]),
    activatedAt: normalizeTimestamp(
      pickString(source, ["activatedAt", "activated_at"]) ||
        pickString(nestedMachine, ["activatedAt", "activated_at"])
    ),
    lastSeenAt: normalizeTimestamp(
      pickString(source, ["lastSeenAt", "last_seen"]) ||
        pickString(nestedMachine, ["lastSeenAt", "last_seen"])
    ),
    createdAt: normalizeTimestamp(pickString(source, ["createdAt", "created_at", "issuedAt", "issued_at"])),
    customerNotes: pickString(source, ["customerNotes", "notes", "customerName", "customer"]),
    activationCount: pickNumber(source, ["activationCount", "activation_count"]),
    revokedAt: normalizeTimestamp(pickString(source, ["revokedAt", "revoked_at"])),
    raw: source,
  };
}

function normalizeActivation(value: unknown): LicenseActivation {
  const source = asRecord(value);

  return {
    id: pickString(source, ["id", "activationId", "activation_id"]) || undefined,
    licenseKey: pickString(source, ["licenseKey", "license_key", "key", "license"]) || "",
    machineName: pickString(source, ["machineName", "machine_name", "deviceName", "name"]),
    machineHost: pickString(source, ["machineHost", "machine_host", "host", "hostname"]),
    machineId: pickString(source, ["machineId", "machine_id", "deviceId", "fingerprint"]),
    activatedAt: pickString(source, ["activatedAt", "activated_at", "createdAt", "created_at"]),
    lastSeenAt: pickString(source, ["lastSeenAt", "last_seen_at", "updatedAt", "updated_at"]),
    raw: source,
  };
}

export async function fetchLicenses(): Promise<LicenseRecord[]> {
  const response = await licenseApiGet<unknown>("/admin/licenses");
  return unwrapList<unknown>(response, ["records", "licenses", "items", "rows"]).map(normalizeLicense);
}

export async function createLicense(payload: CreateLicensePayload): Promise<LicenseRecord> {
  const response = await licenseApiPost<unknown>("/admin/create", {
    tier: payload.tier,
    customerNotes: payload.customerNotes,
    notes: payload.customerNotes,
    expiry: 0,
  });

  return normalizeLicense(asRecord(response).license || response);
}

export async function revokeLicense(licenseKey: string): Promise<void> {
  await licenseApiPost<unknown>("/admin/revoke", { licenseKey });
}

export async function fetchLicenseActivations(): Promise<LicenseActivation[]> {
  return [];
}
