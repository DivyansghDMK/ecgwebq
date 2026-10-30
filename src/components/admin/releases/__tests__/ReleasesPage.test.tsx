// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ReleasesPage from "../ReleasesPage";

const CDN = "https://dgz43izxcyy2a.cloudfront.net";
const betaJson = {
  version: "1.2.5",
  channel: "beta",
  mandatory: false,
  min_supported_version: "",
  release_notes: "Admin-only beta notes",
  download_url: `${CDN}/releases/1.2.5/Setup_CardioX_1.2.5.exe`,
  sha256: "e".repeat(64),
  size_bytes: 179_333_423,
  published_at: "2026-10-13T05:00:09Z",
};

const emptyApiPage = { success: true, data: { items: [], next_cursor: null } };

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/artists/releases"]}>
      <ReleasesPage />
    </MemoryRouter>
  );
}

describe("ReleasesPage (admin)", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_RELEASES_CDN_BASE", CDN);
    vi.stubEnv("VITE_RELEASE_API_BASE", "/release-api");
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.startsWith("/release-api/")) return new Response(JSON.stringify(emptyApiPage), { status: 200 });
        return url.includes("/beta/")
          ? new Response(JSON.stringify(betaJson), { status: 200 })
          : new Response("<Error/>", { status: 403 });
      })
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("still shows release notes and SHA-256 on the live cards", async () => {
    vi.stubEnv("VITE_USE_MOCK_RELEASE_API", undefined);
    renderPage();

    expect(await screen.findByText("Admin-only beta notes")).toBeTruthy();
    expect(screen.getByText("Verify download (SHA-256)")).toBeTruthy();
    expect(screen.getByText(betaJson.sha256)).toBeTruthy();
    expect(screen.getByText("Release notes")).toBeTruthy();
  });

  it("uses the real API with no mock banner by default", async () => {
    vi.stubEnv("VITE_USE_MOCK_RELEASE_API", undefined);
    renderPage();

    expect(await screen.findByText("No releases yet.")).toBeTruthy();
    expect(screen.queryByText(/mock data/i)).toBeNull();
    expect(vi.mocked(fetch).mock.calls.some(([url]) => String(url) === "/release-api/admin/releases")).toBe(true);
  });

  it("shows the mock banner only when the mock is in use (dev + 'true')", async () => {
    vi.stubEnv("PROD", false);
    vi.stubEnv("VITE_USE_MOCK_RELEASE_API", "true");
    renderPage();

    expect(screen.getByText(/mock data/i)).toBeTruthy();
    // Mock data: 0.9.1 appears in both release history and upload history.
    expect((await screen.findAllByText("0.9.1")).length).toBeGreaterThan(0);
    expect(vi.mocked(fetch).mock.calls.some(([url]) => String(url).startsWith("/release-api/"))).toBe(false);
  });

  it("never shows the mock banner in a production build", async () => {
    vi.stubEnv("PROD", true);
    vi.stubEnv("VITE_USE_MOCK_RELEASE_API", "true");
    renderPage();

    expect(await screen.findByText("No releases yet.")).toBeTruthy();
    expect(screen.queryByText(/mock data/i)).toBeNull();
  });
});
