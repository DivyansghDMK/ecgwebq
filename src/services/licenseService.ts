import { getLicenseApiBase, joinApiUrl } from "@/lib/apiBase";

export type LicenseTier = "Trial" | "Standard" | "Professional" | "Enterprise";

export interface LicenseRecord {
  id?: string;
  licenseKey: string;
  backupKey?: string | null;
  tier: string;
  status: "active" | "revoked" | "unused";
  seatNumber?: string | null;
  seatId?: string | null;
  seatStatus?: string | null;
  fullName?: string | null;
  doctorName?: string | null;
  orgName?: string | null;
  orgAddress?: string | null;
  phone?: string | null;
  pcName?: string | null;
  windowsVersion?: string | null;
  machineSerialId?: string | null;
  rhythmultaSerial?: string | null;
  boundFingerprint?: string | null;
  machineName?: string | null;
  machineHost?: string | null;
  machineOs?: string | null;
  machineId?: string | null;
  activatedAt?: string | null;
  lastSeenAt?: string | null;
  lastHeartbeat?: string | null;
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

const LICENSE_ADMIN_TOKEN = "deckmount_admin_2026_secure";
const ADMIN_API = "https://m4qoae4d8e.execute-api.us-east-1.amazonaws.com/prod";
const VIEW_API = "https://zkipk0rhd8.execute-api.us-east-1.amazonaws.com/prod";

function getLicenseAdminToken(): string {
  return (import.meta.env.VITE_LICENSE_ADMIN_TOKEN || LICENSE_ADMIN_TOKEN).trim();
}

function buildLicenseHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    "x-admin-token": getLicenseAdminToken(),
  };
}

function licenseApiUrl(endpoint: string): string {
  return joinApiUrl(getLicenseApiBase(), endpoint);
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
    if (lower.includes("unused") || lower.includes("inactive") || lower.includes("pending")) return "unused";
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
  const fullName =
    pickString(source, ["fullName", "full_name"]) ||
    pickString(nestedMachine, ["fullName", "full_name"]);
  const doctorName =
    pickString(source, ["doctorName", "doctor_name"]) ||
    pickString(nestedMachine, ["doctorName", "doctor_name"]);
  const orgName =
    pickString(source, ["orgName", "org_name"]) ||
    pickString(nestedMachine, ["orgName", "org_name"]);
  const orgAddress =
    pickString(source, ["orgAddress", "org_address"]) ||
    pickString(nestedMachine, ["orgAddress", "org_address"]);
  const phone = pickString(source, ["phone"]) || pickString(nestedMachine, ["phone"]);
  const pcName =
    pickString(source, ["pcName", "pc_name"]) ||
    pickString(nestedMachine, ["pcName", "pc_name", "name"]);
  const windowsVersion =
    pickString(source, ["windowsVersion", "windows_version"]) ||
    pickString(nestedMachine, ["windowsVersion", "windows_version"]);
  const machineSerialId =
    pickString(source, ["machineSerialId", "machine_serial_id"]) ||
    pickString(nestedMachine, ["machineSerialId", "machine_serial_id"]);
  const rhythmultaSerial =
    pickString(source, ["rhythmultaSerial", "rhythmulta_serial"]) ||
    pickString(nestedMachine, ["rhythmultaSerial", "rhythmulta_serial"]);
  const boundFingerprint =
    pickString(source, ["boundFingerprint", "bound_fingerprint", "fingerprint"]) ||
    pickString(nestedMachine, ["boundFingerprint", "bound_fingerprint", "fingerprint"]);

  return {
    id: pickString(source, ["id", "licenseId", "license_id"]) || licenseKey,
    licenseKey,
    backupKey: pickString(source, ["backupKey", "backup_key"]),
    tier: normalizeTier(pickString(source, ["tier_name", "tierName", "tier", "plan", "licenseTier"])),
    status: normalizeStatus(source),
    fullName,
    doctorName,
    orgName,
    orgAddress,
    phone,
    pcName,
    windowsVersion,
    machineSerialId,
    rhythmultaSerial,
    boundFingerprint,
    machineName:
      pcName ||
      pickString(source, ["machineName", "machine_name", "deviceName"]) ||
      pickString(nestedMachine, ["name", "machineName", "machine_name", "deviceName"]),
    machineHost:
      pickString(source, ["machineHost", "machine_host", "host", "hostname"]) ||
      pickString(nestedMachine, ["host", "hostname", "machineHost", "machine_host"]),
    machineOs:
      windowsVersion ||
      pickString(source, ["machineOs", "machineOS", "machine_os"]) ||
      pickString(nestedMachine, ["machineOs", "machineOS", "machine_os"]),
    machineId:
      machineSerialId ||
      pickString(source, ["machineId", "machine_id", "deviceId", "fingerprint", "hardware_fingerprint"]) ||
      pickString(nestedMachine, ["id", "machineId", "machine_id", "deviceId", "fingerprint", "hardware_fingerprint"]),
    activatedAt: normalizeTimestamp(
      pickString(source, ["activatedAt", "activated_at"]) ||
        pickString(nestedMachine, ["activatedAt", "activated_at"])
    ),
    lastSeenAt: normalizeTimestamp(
      pickString(source, ["lastSeenAt", "last_seen", "last_heartbeat"]) ||
        pickString(nestedMachine, ["lastSeenAt", "last_seen"])
    ),
    lastHeartbeat: normalizeTimestamp(pickString(source, ["last_heartbeat", "lastHeartbeat"]) || null),
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
  const response = await fetch(licenseApiUrl("/seats"), {
    method: "GET",
    headers: buildLicenseHeaders(),
  });

  const payload = await parseJsonPayload(response);
  if (!response.ok) {
    throw new Error(extractApiError(payload) || "Failed to fetch licenses");
  }

  const seats = unwrapList<unknown>(payload, ["seats", "records", "licenses", "items", "rows"]);
  return seats.map(normalizeSeatRecord);
}

export async function createLicense(payload: CreateLicensePayload): Promise<LicenseRecord> {
  const response = await fetch(joinApiUrl(ADMIN_API, "/admin/create"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-token": getLicenseAdminToken(),
    },
    body: JSON.stringify({
      tier: payload.tier,
      expiry: 0,
      notes: payload.customerNotes || "Admin generated",
      created_for: payload.customerNotes || "Admin",
      plan_type: "single",
      valid_until: "2027-12-31",
    }),
  });

  const payloadJson = await parseJsonPayload(response);
  if (!response.ok || payloadJson.success === false) {
    throw new Error(extractApiError(payloadJson) || "Failed to create license");
  }

  const license = asRecord(payloadJson).license || payloadJson;
  return normalizeLicense(license);
}

export async function revokeLicense(licenseKey: string): Promise<void> {
  const response = await fetch(joinApiUrl(ADMIN_API, "/admin/revoke"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-token": getLicenseAdminToken(),
    },
    body: JSON.stringify({ license_key: licenseKey }),
  });

  const payload = await parseJsonPayload(response);
  if (!response.ok || payload.success === false) {
    throw new Error(extractApiError(payload) || "Failed to revoke license");
  }
}

export async function unrevokeLicense(licenseKey: string): Promise<void> {
  const response = await fetch(joinApiUrl(ADMIN_API, "/admin/unrevoke"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-token": getLicenseAdminToken(),
    },
    body: JSON.stringify({ license_key: licenseKey }),
  });

  const payload = await parseJsonPayload(response);
  if (!response.ok || payload.success === false) {
    throw new Error(extractApiError(payload) || "Failed to unrevoke");
  }
}

export async function deleteSeat(licenseKey: string): Promise<void> {
  const response = await fetch(joinApiUrl(VIEW_API, "/seats/delete"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-token": getLicenseAdminToken(),
    },
    body: JSON.stringify({ license_key: licenseKey }),
  });

  const payload = await parseJsonPayload(response);
  if (!response.ok || payload.success === false) {
    throw new Error(extractApiError(payload) || "Failed to delete seat");
  }
}

export function exportLicensesToCSV(licenses: LicenseRecord[]): void {
  const headers = [
    "License Key",
    "Status",
    "Full Name",
    "Org",
    "Phone",
    "PC Name",
    "Machine Serial",
    "RhythmUlta Serial",
    "Activated At",
  ];

  const quote = (value: unknown): string => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const rows = licenses.map((license) => [
    license.licenseKey,
    license.status,
    license.fullName,
    license.orgName,
    license.phone,
    license.pcName,
    license.machineSerialId,
    license.rhythmultaSerial,
    license.activatedAt ? new Date(license.activatedAt).toLocaleDateString("en-IN") : "-",
  ]);

  const csv = [headers, ...rows].map((row) => row.map(quote).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `cardiox_licenses_${new Date().toISOString().split("T")[0]}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function fetchLicenseActivations(): Promise<LicenseActivation[]> {
  const response = await fetch(licenseApiUrl("/seats"), {
    method: "GET",
    headers: buildLicenseHeaders(),
  });

  const payload = await parseJsonPayload(response);
  if (!response.ok) {
    throw new Error(extractApiError(payload) || "Failed to fetch activations");
  }

  const seats = unwrapList<unknown>(payload, ["seats", "records", "licenses", "items", "rows"]);
  return seats.map(normalizeActivation);
}

function normalizeSeatRecord(value: unknown): LicenseRecord {
  const source = asRecord(value);
  return {
    ...normalizeLicense(source),
    status: normalizeStatus(source),
    licenseKey: pickString(source, ["license_key", "licenseKey"]) || "",
    seatNumber: pickString(source, ["seat_number", "seatNumber"]),
    seatId: pickString(source, ["seat_id", "seatId"]),
    seatStatus: pickString(source, ["seat_status", "seatStatus"]),
    fullName: pickString(source, ["full_name", "fullName"]),
    doctorName: pickString(source, ["doctor_name", "doctorName"]),
    orgName: pickString(source, ["org_name", "orgName"]),
    orgAddress: pickString(source, ["org_address", "orgAddress"]),
    phone: pickString(source, ["phone"]),
    pcName: pickString(source, ["pc_name", "pcName"]),
    windowsVersion: pickString(source, ["windows_version", "windowsVersion"]),
    machineSerialId: pickString(source, ["machine_serial_id", "machineSerialId"]),
    rhythmultaSerial: pickString(source, ["rhythmulta_serial", "rhythmultaSerial"]),
    boundFingerprint: pickString(source, ["bound_fingerprint", "boundFingerprint"]),
    machineName: pickString(source, ["pc_name", "pcName"]) || pickString(source, ["machineName", "machine_name"]),
    machineHost: pickString(source, ["pc_name", "pcName"]) || pickString(source, ["machineHost", "machine_host"]),
    machineOs: pickString(source, ["windows_version", "windowsVersion"]) || pickString(source, ["machineOs", "machineOS"]),
    machineId: pickString(source, ["machine_serial_id", "machineSerialId"]) || pickString(source, ["machineId", "machine_id"]),
    activatedAt: normalizeTimestamp(pickString(source, ["activated_at", "activatedAt"])),
    lastHeartbeat: normalizeTimestamp(pickString(source, ["last_heartbeat", "lastHeartbeat"])),
    lastSeenAt: normalizeTimestamp(pickString(source, ["last_heartbeat", "lastHeartbeat", "last_seen", "lastSeenAt"])),
    createdAt: normalizeTimestamp(pickString(source, ["activated_at", "created_at", "createdAt"])),
    raw: source,
  };
}

async function parseJsonPayload(response: Response): Promise<any> {
  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return response.json();
  }
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function extractApiError(payload: unknown): string | null {
  const record = asRecord(payload);
  return (
    pickString(asRecord(record.error), ["message"]) ||
    pickString(record, ["message", "error"]) ||
    null
  );
}
