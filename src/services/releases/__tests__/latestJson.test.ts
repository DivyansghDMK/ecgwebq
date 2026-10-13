import { describe, expect, it, vi } from "vitest";
import { fetchLatest, isTrustedDownloadUrl, latestJsonPath, validateLatest } from "../latestJson";

const CDN = "https://dgz43izxcyy2a.cloudfront.net";
const SHA = "a".repeat(64);

function goodLatest(overrides: Record<string, unknown> = {}) {
  return {
    version: "1.2.5",
    channel: "beta",
    mandatory: false,
    min_supported_version: "",
    release_notes: "Line one\nLine two",
    download_url: `${CDN}/releases/beta/1.2.5/CardioX-Setup-1.2.5.exe`,
    sha256: SHA,
    size_bytes: 88_342_528,
    published_at: "2026-10-13T08:30:00Z",
    ...overrides,
  };
}

function reasonFor(overrides: Record<string, unknown>): string {
  const result = validateLatest(goodLatest(overrides), CDN, "beta");
  if (result.ok) {
    throw new Error("expected validation to fail");
  }
  return result.reason;
}

describe("validateLatest", () => {
  it("accepts a valid latest.json and ignores extra fields", () => {
    const result = validateLatest(goodLatest({ extra_field: "ignored" }), CDN, "beta");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.release.version).toBe("1.2.5");
      expect(result.release).not.toHaveProperty("extra_field");
    }
  });

  it("accepts a min_supported_version that is a version", () => {
    expect(validateLatest(goodLatest({ min_supported_version: "1.0.0" }), CDN).ok).toBe(true);
  });

  it.each(["1.2", "v1.2.5", "1.2.5-beta", "1.2.5 ", "", 125])("rejects bad version %j", (version) => {
    expect(reasonFor({ version })).toMatch(/version/i);
  });

  it("rejects a non-https download URL", () => {
    expect(reasonFor({ download_url: "http://dgz43izxcyy2a.cloudfront.net/x.exe" })).toMatch(/download link/i);
  });

  it("rejects a download URL on another host", () => {
    expect(reasonFor({ download_url: "https://evil.example.com/x.exe" })).toMatch(/download link/i);
    expect(reasonFor({ download_url: "https://dgz43izxcyy2a.cloudfront.net.evil.com/x.exe" })).toMatch(
      /download link/i
    );
  });

  it("rejects a malformed download URL", () => {
    expect(reasonFor({ download_url: "not a url" })).toMatch(/download link/i);
  });

  it.each(["A".repeat(64), "a".repeat(63), "g".repeat(64), "", 123])("rejects bad sha256 %j", (sha256) => {
    expect(reasonFor({ sha256 })).toMatch(/SHA-256/);
  });

  it.each([0, -1, 1.5, "100", null, Number.MAX_SAFE_INTEGER + 2])("rejects bad size %j", (size_bytes) => {
    expect(reasonFor({ size_bytes })).toMatch(/size/i);
  });

  it("rejects bad channel, mandatory, min version and date", () => {
    expect(reasonFor({ channel: "nightly" })).toMatch(/channel/i);
    expect(reasonFor({ channel: "stable" })).toMatch(/does not match/);
    expect(reasonFor({ mandatory: "no" })).toMatch(/mandatory/i);
    expect(reasonFor({ min_supported_version: "1.0" })).toMatch(/minimum/i);
    expect(reasonFor({ published_at: "yesterday" })).toMatch(/date/i);
  });

  it("fails when the CDN base is not configured", () => {
    const result = validateLatest(goodLatest(), undefined);
    expect(result.ok).toBe(false);
  });

  it("rejects non-object JSON", () => {
    expect(validateLatest([], CDN).ok).toBe(false);
    expect(validateLatest(null, CDN).ok).toBe(false);
  });
});

describe("isTrustedDownloadUrl", () => {
  it("requires https on both the URL and the configured base", () => {
    expect(isTrustedDownloadUrl(`${CDN}/a.exe`, CDN)).toBe(true);
    expect(isTrustedDownloadUrl(`${CDN}/a.exe`, "http://dgz43izxcyy2a.cloudfront.net")).toBe(false);
  });
});

describe("fetchLatest", () => {
  function mockFetch(response: Response | Error) {
    return vi.fn(async () => {
      if (response instanceof Error) {
        throw response;
      }
      return response;
    }) as unknown as typeof fetch;
  }

  it("requests the same-origin proxy path", async () => {
    const fetchImpl = mockFetch(new Response(JSON.stringify(goodLatest()), { status: 200 }));
    await fetchLatest("beta", { cdnBase: CDN, fetchImpl });
    expect(fetchImpl).toHaveBeenCalledWith("/releases-cdn/releases/beta/latest.json", expect.anything());
    expect(latestJsonPath("stable")).toBe("/releases-cdn/releases/stable/latest.json");
  });

  it("returns ok for a valid response", async () => {
    const fetchImpl = mockFetch(new Response(JSON.stringify(goodLatest()), { status: 200 }));
    const result = await fetchLatest("beta", { cdnBase: CDN, fetchImpl });
    expect(result.status).toBe("ok");
  });

  it.each([403, 404])("treats HTTP %i as no release published", async (status) => {
    const fetchImpl = mockFetch(new Response("<Error/>", { status }));
    expect(await fetchLatest("stable", { cdnBase: CDN, fetchImpl })).toEqual({ status: "none" });
  });

  it("treats other HTTP errors as errors", async () => {
    const fetchImpl = mockFetch(new Response("", { status: 500 }));
    const result = await fetchLatest("stable", { cdnBase: CDN, fetchImpl });
    expect(result).toEqual({ status: "error", message: "Release server returned HTTP 500." });
  });

  it("returns an error for invalid JSON (e.g. SPA index.html)", async () => {
    const fetchImpl = mockFetch(new Response("<!doctype html>", { status: 200 }));
    const result = await fetchLatest("beta", { cdnBase: CDN, fetchImpl });
    expect(result.status).toBe("error");
  });

  it("returns an error when validation fails", async () => {
    const fetchImpl = mockFetch(
      new Response(JSON.stringify(goodLatest({ download_url: "https://evil.example.com/x.exe" })), { status: 200 })
    );
    const result = await fetchLatest("beta", { cdnBase: CDN, fetchImpl });
    expect(result.status).toBe("error");
  });

  it("returns an error on network failure", async () => {
    const fetchImpl = mockFetch(new TypeError("Failed to fetch"));
    const result = await fetchLatest("beta", { cdnBase: CDN, fetchImpl });
    expect(result).toEqual({ status: "error", message: "Could not reach the release server." });
  });
});
