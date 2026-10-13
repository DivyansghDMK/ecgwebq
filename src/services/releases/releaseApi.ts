import { buildAuthHeaders } from "@/lib/auth";
import { getReleasesCdnBase } from "./latestJson";
import type { Channel, ReleaseHistoryItem, UploadHistoryItem, UploadPage, UploadResult } from "./types";

export const DEFAULT_UPLOADS_LIMIT = 50;

export class ReleaseApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ReleaseApiError";
    this.status = status;
    this.code = code;
  }

  /** 401/403: the admin session is missing, expired or not allowed. */
  get isAuthError(): boolean {
    return this.status === 401 || this.status === 403;
  }
}

export interface UploadsQuery {
  limit?: number;
  cursor?: string | null;
  /** Omit for all results. */
  result?: UploadResult;
  /** Omit for all channels. */
  channel?: Channel;
}

export interface ReleaseApiClient {
  getReleases(): Promise<ReleaseHistoryItem[]>;
  getUploads(query?: UploadsQuery): Promise<UploadPage>;
}

/** Mock is on unless VITE_USE_MOCK_RELEASE_API is exactly "false". */
export function isMockReleaseApi(): boolean {
  return import.meta.env.VITE_USE_MOCK_RELEASE_API?.trim().toLowerCase() !== "false";
}

export function getReleaseApi(): ReleaseApiClient {
  if (isMockReleaseApi()) {
    return createMockReleaseApi();
  }
  return createHttpReleaseApi(import.meta.env.VITE_RELEASE_API_BASE);
}

// ---------------------------------------------------------------------------
// HTTP client
// ---------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const asString = (value: unknown): string => (typeof value === "string" ? value : "");
const asNumber = (value: unknown): number => (typeof value === "number" && Number.isFinite(value) ? value : 0);

function toReleaseItem(raw: unknown): ReleaseHistoryItem {
  const item = isRecord(raw) ? raw : {};
  return {
    version: asString(item.version),
    channel: asString(item.channel),
    published_at: asString(item.published_at),
    size_bytes: asNumber(item.size_bytes),
    sha256: asString(item.sha256),
    download_url: asString(item.download_url),
    release_notes: asString(item.release_notes),
    mandatory: item.mandatory === true,
    min_supported_version: asString(item.min_supported_version),
    installer_file: asString(item.installer_file),
  };
}

function toUploadItem(raw: unknown): UploadHistoryItem {
  const item = isRecord(raw) ? raw : {};
  return {
    at: asString(item.at),
    result: asString(item.result),
    version: asString(item.version),
    channel: asString(item.channel),
    source_key: asString(item.source_key),
    reasons: Array.isArray(item.reasons) ? item.reasons.filter((r): r is string => typeof r === "string") : [],
  };
}

export interface HttpReleaseApiOptions {
  fetchImpl?: typeof fetch;
  getHeaders?: () => HeadersInit;
}

export function createHttpReleaseApi(baseUrl: string | undefined, options: HttpReleaseApiOptions = {}): ReleaseApiClient {
  const { fetchImpl = fetch, getHeaders = () => buildAuthHeaders("admin") } = options;
  const base = baseUrl?.trim().replace(/\/+$/, "");

  async function getData(path: string): Promise<Record<string, unknown>> {
    if (!base) {
      throw new ReleaseApiError("Release API is not configured (VITE_RELEASE_API_BASE).", 0, "CONFIG");
    }

    let response: Response;
    try {
      response = await fetchImpl(`${base}${path}`, { method: "GET", headers: getHeaders() });
    } catch {
      throw new ReleaseApiError("Could not reach the release API.", 0, "NETWORK");
    }

    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      // handled below
    }

    const apiError = isRecord(body) && isRecord(body.error) ? body.error : undefined;
    const message = typeof apiError?.message === "string" ? apiError.message : undefined;
    const code = typeof apiError?.code === "string" ? apiError.code : undefined;

    if (response.status === 401 || response.status === 403) {
      throw new ReleaseApiError(message || "Your admin session has expired. Please log in again.", response.status, code);
    }
    if (!response.ok || !isRecord(body) || body.success !== true) {
      throw new ReleaseApiError(message || `Release API returned HTTP ${response.status}.`, response.status, code);
    }
    if (!isRecord(body.data) || !Array.isArray(body.data.items)) {
      throw new ReleaseApiError("Release API returned an unexpected response.", response.status, "BAD_RESPONSE");
    }

    return body.data;
  }

  return {
    async getReleases() {
      const data = await getData("/admin/releases");
      return (data.items as unknown[]).map(toReleaseItem);
    },

    async getUploads({ limit = DEFAULT_UPLOADS_LIMIT, cursor = null, result, channel } = {}) {
      const params = new URLSearchParams({ limit: String(limit) });
      if (cursor) {
        params.set("cursor", cursor);
      }
      if (result) {
        params.set("result", result);
      }
      if (channel) {
        params.set("channel", channel);
      }
      const data = await getData(`/admin/uploads?${params.toString()}`);
      return {
        items: (data.items as unknown[]).map(toUploadItem),
        next_cursor: typeof data.next_cursor === "string" && data.next_cursor ? data.next_cursor : null,
      };
    },
  };
}

// ---------------------------------------------------------------------------
// Mock (default until the real API exists)
// ---------------------------------------------------------------------------

const MOCK_CDN = "https://dgz43izxcyy2a.cloudfront.net";

/** Deterministic fake 64-char hex string. */
function fakeSha(seed: number): string {
  let x = (seed * 2654435761) >>> 0;
  let out = "";
  while (out.length < 64) {
    x = (Math.imul(x, 1103515245) + 12345) >>> 0;
    out += x.toString(16).padStart(8, "0");
  }
  return out.slice(0, 64);
}

const installerFile = (version: string) => `CardioX-Setup-${version}.exe`;

function mockRelease(version: string, published_at: string, size_bytes: number, release_notes: string, seed: number): ReleaseHistoryItem {
  const cdn = getReleasesCdnBase() ?? MOCK_CDN;
  return {
    version,
    channel: "beta",
    published_at,
    size_bytes,
    sha256: fakeSha(seed),
    download_url: `${cdn}/releases/beta/${version}/${installerFile(version)}`,
    release_notes,
    mandatory: false,
    min_supported_version: "",
    installer_file: installerFile(version),
  };
}

const MOCK_RELEASES: ReleaseHistoryItem[] = [
  mockRelease("1.2.5", "2026-10-06T09:12:00Z", 91_750_400, "Fixes report export on Windows 11.\nFaster startup.", 125),
  mockRelease("1.2.4", "2026-09-15T07:05:00Z", 91_226_112, "Lead II rhythm view improvements.", 124),
  mockRelease("1.2.2", "2026-08-04T10:30:00Z", 90_701_824, "", 122),
  mockRelease("0.9.1", "2026-06-10T06:00:00Z", 84_934_656, "First beta for internal testing.", 91),
];

const SHA_MISMATCH = `installer SHA-256 mismatch: manifest ${fakeSha(1).slice(0, 12)}…, actual ${fakeSha(2).slice(0, 12)}…`;

function upload(at: string, result: "ACCEPTED" | "REJECTED", version: string, channel: string, reasons: string[] = []): UploadHistoryItem {
  return { at, result, version, channel, source_key: `incoming/${channel}/${installerFile(version)}`, reasons };
}

function buildMockUploads(): UploadHistoryItem[] {
  const rows: UploadHistoryItem[] = [
    upload("2026-10-06T09:10:00Z", "ACCEPTED", "1.2.5", "beta"),
    upload("2026-10-01T12:00:00Z", "REJECTED", "1.2.5", "stable", [SHA_MISMATCH]),
    upload("2026-09-28T11:40:00Z", "REJECTED", "1.2.3", "beta", [SHA_MISMATCH]),
    upload("2026-09-15T07:03:00Z", "ACCEPTED", "1.2.4", "beta"),
    upload("2026-09-02T08:20:00Z", "REJECTED", "0.9.1", "beta", [
      "version 0.9.1 already exists in releases/; versions are never re-used, build with a higher version",
    ]),
    upload("2026-08-04T10:28:00Z", "ACCEPTED", "1.2.2", "beta"),
    upload("2026-07-20T05:45:00Z", "REJECTED", "0.9.0", "beta", [
      "0.9.0 is lower than live 0.9.1 on the beta channel; publish a higher version",
    ]),
    upload("2026-06-10T05:58:00Z", "ACCEPTED", "0.9.1", "beta"),
  ];

  // Older filler rows so "Load more" can be exercised locally.
  const start = Date.parse("2026-06-01T00:00:00Z");
  for (let i = 0; i < 54; i += 1) {
    const at = new Date(start - i * 12 * 60 * 60 * 1000).toISOString();
    const version = `0.8.${53 - i}`;
    rows.push(i % 4 === 1 ? upload(at, "REJECTED", version, "beta", [SHA_MISMATCH]) : upload(at, "ACCEPTED", version, "beta"));
  }

  return rows.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
}

function encodeCursor(offset: number): string {
  return btoa(`offset:${offset}`);
}

function decodeCursor(cursor: string): number {
  try {
    const match = /^offset:(\d+)$/.exec(atob(cursor));
    if (match) {
      return Number(match[1]);
    }
  } catch {
    // fall through
  }
  throw new ReleaseApiError("Invalid cursor.", 400, "INVALID_CURSOR");
}

export function createMockReleaseApi({ delayMs = 350 }: { delayMs?: number } = {}): ReleaseApiClient {
  const uploads = buildMockUploads();
  const releases = [...MOCK_RELEASES].sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at));
  const wait = () => (delayMs > 0 ? new Promise<void>((resolve) => setTimeout(resolve, delayMs)) : Promise.resolve());

  return {
    async getReleases() {
      await wait();
      return releases.map((item) => ({ ...item }));
    },

    async getUploads({ limit = DEFAULT_UPLOADS_LIMIT, cursor = null, result, channel } = {}) {
      await wait();
      // Filter first, then page — the cursor is an offset into the filtered list.
      const matching = uploads.filter((u) => (!result || u.result === result) && (!channel || u.channel === channel));
      const offset = cursor ? decodeCursor(cursor) : 0;
      const size = Math.min(Math.max(Math.trunc(limit), 1), 100);
      const items = matching.slice(offset, offset + size).map((item) => ({ ...item, reasons: [...item.reasons] }));
      const nextOffset = offset + size;
      return { items, next_cursor: nextOffset < matching.length ? encodeCursor(nextOffset) : null };
    },
  };
}
