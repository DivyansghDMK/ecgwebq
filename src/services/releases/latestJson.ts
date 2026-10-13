import type { Channel, LatestRelease, LatestResult } from "./types";

/** Same-origin prefix; proxied to the release CDN by Vite (dev) and vercel.json (deploy). */
export const RELEASES_PROXY_PREFIX = "/releases-cdn";

const VERSION_PATTERN = /^\d+\.\d+\.\d+$/;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;

export type ValidationResult = { ok: true; release: LatestRelease } | { ok: false; reason: string };

export function getReleasesCdnBase(): string | undefined {
  return import.meta.env.VITE_RELEASES_CDN_BASE?.trim() || undefined;
}

export function latestJsonPath(channel: Channel): string {
  return `${RELEASES_PROXY_PREFIX}/releases/${channel}/latest.json`;
}

export function isValidVersion(value: unknown): value is string {
  return typeof value === "string" && VERSION_PATTERN.test(value);
}

/** True only for https URLs whose host matches the configured CDN host exactly. */
export function isTrustedDownloadUrl(value: unknown, cdnBase: string | undefined): value is string {
  if (typeof value !== "string" || !cdnBase) {
    return false;
  }

  try {
    const url = new URL(value);
    const cdn = new URL(cdnBase);
    return url.protocol === "https:" && cdn.protocol === "https:" && url.host === cdn.host;
  } catch {
    return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Validates a parsed latest.json. Extra fields are ignored. */
export function validateLatest(
  raw: unknown,
  cdnBase: string | undefined,
  expectedChannel?: Channel
): ValidationResult {
  if (!cdnBase) {
    return { ok: false, reason: "Release CDN is not configured (VITE_RELEASES_CDN_BASE)." };
  }
  if (!isRecord(raw)) {
    return { ok: false, reason: "Release information is not a JSON object." };
  }

  const {
    version,
    channel,
    mandatory,
    min_supported_version,
    release_notes,
    download_url,
    sha256,
    size_bytes,
    published_at,
  } = raw;

  if (!isValidVersion(version)) {
    return { ok: false, reason: "Release has an invalid version number." };
  }
  if (channel !== "stable" && channel !== "beta") {
    return { ok: false, reason: "Release has an unknown channel." };
  }
  if (expectedChannel && channel !== expectedChannel) {
    return { ok: false, reason: `Release channel "${channel}" does not match "${expectedChannel}".` };
  }
  if (typeof mandatory !== "boolean") {
    return { ok: false, reason: "Release has an invalid mandatory flag." };
  }
  if (min_supported_version !== "" && !isValidVersion(min_supported_version)) {
    return { ok: false, reason: "Release has an invalid minimum supported version." };
  }
  if (typeof release_notes !== "string") {
    return { ok: false, reason: "Release notes are missing." };
  }
  if (!isTrustedDownloadUrl(download_url, cdnBase)) {
    return { ok: false, reason: "Download link is not a secure link on the release CDN." };
  }
  if (typeof sha256 !== "string" || !SHA256_PATTERN.test(sha256)) {
    return { ok: false, reason: "Release has an invalid SHA-256 checksum." };
  }
  if (typeof size_bytes !== "number" || !Number.isSafeInteger(size_bytes) || size_bytes <= 0) {
    return { ok: false, reason: "Release has an invalid file size." };
  }
  if (typeof published_at !== "string" || Number.isNaN(Date.parse(published_at))) {
    return { ok: false, reason: "Release has an invalid publish date." };
  }

  return {
    ok: true,
    release: {
      version,
      channel,
      mandatory,
      min_supported_version: min_supported_version as string,
      release_notes,
      download_url,
      sha256,
      size_bytes,
      published_at,
    },
  };
}

export interface FetchLatestOptions {
  signal?: AbortSignal;
  cdnBase?: string;
  fetchImpl?: typeof fetch;
}

/** Fetches and validates latest.json for a channel. 403/404 mean nothing is published yet. */
export async function fetchLatest(channel: Channel, options: FetchLatestOptions = {}): Promise<LatestResult> {
  const { signal, cdnBase = getReleasesCdnBase(), fetchImpl = fetch } = options;

  let response: Response;
  try {
    response = await fetchImpl(latestJsonPath(channel), {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }
    return { status: "error", message: "Could not reach the release server." };
  }

  if (response.status === 403 || response.status === 404) {
    return { status: "none" };
  }
  if (!response.ok) {
    return { status: "error", message: `Release server returned HTTP ${response.status}.` };
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return { status: "error", message: "Release information is not valid JSON." };
  }

  const result = validateLatest(body, cdnBase, channel);
  return result.ok ? { status: "ok", release: result.release } : { status: "error", message: result.reason };
}
