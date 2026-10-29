import { describe, expect, it } from "vitest";
import { describeLiveVersion } from "../liveVersion";
import type { LatestRelease, LatestState } from "../types";

function ok(version: string, channel: "stable" | "beta"): LatestState {
  const release: LatestRelease = {
    version,
    channel,
    mandatory: false,
    min_supported_version: "",
    release_notes: "",
    download_url: "https://dgz43izxcyy2a.cloudfront.net/x.exe",
    sha256: "a".repeat(64),
    size_bytes: 1,
    published_at: "2026-10-13T08:30:00Z",
  };
  return { status: "ok", release };
}

const loading: LatestState = { status: "loading" };
const none: LatestState = { status: "none" };
const error: LatestState = { status: "error", message: "x" };

describe("describeLiveVersion", () => {
  it("prefers stable when published", () => {
    expect(describeLiveVersion(ok("2.0.0", "stable"), ok("2.1.0", "beta")).text).toBe("Latest Version: v2.0.0");
  });

  it("falls back to beta when stable is not published", () => {
    expect(describeLiveVersion(none, ok("1.2.5", "beta")).text).toBe("Beta 1.2.5 (testing)");
  });

  it("shows loading while stable or a needed beta is loading", () => {
    expect(describeLiveVersion(loading, ok("1.2.5", "beta")).kind).toBe("loading");
    expect(describeLiveVersion(none, loading).kind).toBe("loading");
  });

  it("shows unavailable when nothing is usable", () => {
    expect(describeLiveVersion(none, none).kind).toBe("unavailable");
    expect(describeLiveVersion(error, error).kind).toBe("unavailable");
  });
});
