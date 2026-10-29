// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import DownloadsPage from "../DownloadsPage";

const CDN = "https://dgz43izxcyy2a.cloudfront.net";
const STABLE_PATH = "/releases-cdn/releases/stable/latest.json";
const DOWNLOAD_URL = `${CDN}/releases/2.0.0/Setup_CardioX_2.0.0.exe`;

const stableJson = {
  version: "2.0.0",
  channel: "stable",
  mandatory: false,
  min_supported_version: "",
  release_notes: "First public release.\nSupports RhythmUltra.",
  download_url: DOWNLOAD_URL,
  sha256: "b".repeat(64),
  size_bytes: 179_333_423,
  published_at: "2026-10-20T05:00:00Z",
};

type Reply = { status: number; body?: unknown };

/** Stubs fetch with one reply per call (last one repeats) and records requested URLs. */
function stubFetch(...replies: Reply[]) {
  const urls: string[] = [];
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    urls.push(String(input));
    const reply = replies[Math.min(urls.length - 1, replies.length - 1)];
    const body = reply.body === undefined ? "<Error/>" : JSON.stringify(reply.body);
    return new Response(body, { status: reply.status });
  });
  vi.stubGlobal("fetch", fetchMock);
  return urls;
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/downloads"]}>
      <DownloadsPage />
    </MemoryRouter>
  );
}

describe("DownloadsPage (public)", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_RELEASES_CDN_BASE", CDN);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("requests only the stable channel, never beta", async () => {
    const urls = stubFetch({ status: 200, body: stableJson });
    renderPage();
    await screen.findByRole("link", { name: /download for windows/i });

    expect(urls.length).toBeGreaterThan(0);
    expect(urls.every((url) => url === STABLE_PATH)).toBe(true);
    expect(urls.some((url) => url.includes("beta"))).toBe(false);
  });

  it.each([403, 404])("shows 'Download coming soon' when stable returns %i", async (status) => {
    stubFetch({ status });
    renderPage();

    expect(await screen.findByRole("heading", { name: "Download coming soon" })).toBeTruthy();
    expect(screen.getByText("The first public release will be available here shortly.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Contact support" }).getAttribute("href")).toBe("/#support");
    expect(screen.queryByRole("link", { name: /download for windows/i })).toBeNull();
    expect(screen.queryByText(/beta/i)).toBeNull();
  });

  it("shows version, IST date, size and a safe download link for valid stable JSON", async () => {
    stubFetch({ status: 200, body: stableJson });
    renderPage();

    const button = await screen.findByRole("link", { name: /download for windows/i });
    expect(button.getAttribute("href")).toBe(DOWNLOAD_URL);
    expect(button.getAttribute("rel")).toBe("noopener noreferrer");
    expect(button.getAttribute("target")).toBeNull();

    expect(screen.getByRole("heading", { name: "CardioX for Windows" })).toBeTruthy();
    expect(screen.getByText("v2.0.0")).toBeTruthy();
    expect(screen.getByText("20 Oct 2026, 10:30 IST")).toBeTruthy();
    expect(screen.getByText("171.0 MB")).toBeTruthy();
  });

  it("puts no release notes or SHA-256 anywhere in the DOM", async () => {
    stubFetch({ status: 200, body: stableJson });
    const { container } = renderPage();
    await screen.findByRole("link", { name: /download for windows/i });

    const html = document.body.innerHTML;
    expect(container.innerHTML).not.toContain(stableJson.sha256);
    expect(html).not.toContain(stableJson.sha256);
    expect(html).not.toContain("First public release");
    expect(html).not.toContain("Supports RhythmUltra");
    expect(html).not.toMatch(/release notes/i);
    expect(html).not.toMatch(/SHA-256/i);
  });

  it("never shows a button for JSON that fails validation (wrong host)", async () => {
    stubFetch({ status: 200, body: { ...stableJson, download_url: "https://evil.example.com/x.exe" } });
    renderPage();

    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.queryByRole("link", { name: /download for windows/i })).toBeNull();
  });

  it("shows an error with Retry and recovers on retry", async () => {
    const urls = stubFetch({ status: 500 }, { status: 200, body: stableJson });
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /retry/i }));
    expect(await screen.findByRole("link", { name: /download for windows/i })).toBeTruthy();
    expect(urls.every((url) => url === STABLE_PATH)).toBe(true);
  });

  it("lists the system requirements", () => {
    stubFetch({ status: 404 });
    renderPage();
    expect(screen.getByText("Windows 10 or 11 (64-bit)")).toBeTruthy();
    expect(screen.getByText("Internet connection for updates")).toBeTruthy();
    expect(screen.getByText("RhythmUltra device")).toBeTruthy();
  });
});
