// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import VersionDownloadPage from "../VersionDownloadPage";

const CDN = "https://dgz43izxcyy2a.cloudfront.net";
const STABLE_PATH = "/releases-cdn/releases/stable/latest.json";
const BETA_PATH = "/releases-cdn/releases/beta/latest.json";
const VALIDATE_URL = "https://6jhix49qt6.execute-api.us-east-1.amazonaws.com/version/validate-company-code";

function latest(channel: "stable" | "beta", version: string, notes: string, shaChar: string) {
  return {
    version,
    channel,
    mandatory: false,
    min_supported_version: "",
    release_notes: notes,
    download_url: `${CDN}/releases/${version}/Setup_CardioX_${version}.exe`,
    sha256: shaChar.repeat(64),
    size_bytes: 179_333_423,
    published_at: "2026-10-13T05:00:09Z",
  };
}

const stableJson = latest("stable", "2.0.0", "Stable notes line", "c");
const betaJson = latest("beta", "2.1.0", "Beta notes line", "d");

function stubFetch() {
  const urls: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      urls.push(url);
      if (url === STABLE_PATH) return new Response(JSON.stringify(stableJson), { status: 200 });
      if (url === BETA_PATH) return new Response(JSON.stringify(betaJson), { status: 200 });
      if (url === VALIDATE_URL) return new Response(JSON.stringify({ success: true, employee_name: "Test User" }), { status: 200 });
      return new Response("unexpected", { status: 599 });
    })
  );
  return urls;
}

describe("VersionDownloadPage (internal)", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_RELEASES_CDN_BASE", CDN);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("after employee-code verification shows minimal stable and beta cards (no notes, no SHA-256)", async () => {
    const urls = stubFetch();
    render(
      <MemoryRouter initialEntries={["/version"]}>
        <VersionDownloadPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText("Enter your employee code"), { target: { value: "DM485" } });
    fireEvent.click(screen.getByRole("button", { name: "Verify Code" }));

    const buttons = await screen.findAllByRole("link", { name: /download for windows/i });
    expect(buttons.map((b) => b.getAttribute("href"))).toEqual([stableJson.download_url, betaJson.download_url]);
    expect(screen.getByText("v2.0.0")).toBeTruthy();
    expect(screen.getByText("v2.1.0")).toBeTruthy();

    const html = document.body.innerHTML;
    for (const json of [stableJson, betaJson]) {
      expect(html).not.toContain(json.sha256);
      expect(html).not.toContain(json.release_notes);
    }
    expect(html).not.toMatch(/release notes/i);
    expect(html).not.toMatch(/SHA-256/i);

    // Only the two latest.json files and the existing employee-code check.
    expect(new Set(urls)).toEqual(new Set([STABLE_PATH, BETA_PATH, VALIDATE_URL]));
  });
});
