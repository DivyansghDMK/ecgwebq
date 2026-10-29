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

describe("ReleasesPage (admin)", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_RELEASES_CDN_BASE", CDN);
    vi.stubEnv("VITE_USE_MOCK_RELEASE_API", "true");
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) =>
        String(input).includes("/beta/")
          ? new Response(JSON.stringify(betaJson), { status: 200 })
          : new Response("<Error/>", { status: 403 })
      )
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("still shows release notes and SHA-256 on the live cards", async () => {
    render(
      <MemoryRouter initialEntries={["/artists/releases"]}>
        <ReleasesPage />
      </MemoryRouter>
    );

    expect(await screen.findByText("Admin-only beta notes")).toBeTruthy();
    expect(screen.getByText("Verify download (SHA-256)")).toBeTruthy();
    expect(screen.getByText(betaJson.sha256)).toBeTruthy();
    expect(screen.getByText("Release notes")).toBeTruthy();
  });
});
