export type Channel = "stable" | "beta";

export const CHANNELS: readonly Channel[] = ["stable", "beta"];

/** Validated contents of releases/<channel>/latest.json on the CDN. */
export interface LatestRelease {
  version: string;
  channel: Channel;
  mandatory: boolean;
  min_supported_version: string;
  release_notes: string;
  download_url: string;
  sha256: string;
  size_bytes: number;
  published_at: string;
}

export type LatestResult =
  | { status: "ok"; release: LatestRelease }
  | { status: "none" }
  | { status: "error"; message: string };

export type LatestState = { status: "loading" } | LatestResult;

export interface ReleaseHistoryItem {
  version: string;
  channel: string;
  published_at: string;
  size_bytes: number;
  sha256: string;
  download_url: string;
  release_notes: string;
  mandatory: boolean;
  min_supported_version: string;
  installer_file: string;
}

export type UploadResult = "ACCEPTED" | "REJECTED";

export interface UploadHistoryItem {
  at: string;
  result: UploadResult | string;
  /** null when the upload was rejected before its manifest could be read. */
  version: string | null;
  /** null when the upload was rejected before its manifest could be read. */
  channel: string | null;
  source_key: string;
  reasons: string[];
}

export interface UploadPage {
  items: UploadHistoryItem[];
  next_cursor: string | null;
}
