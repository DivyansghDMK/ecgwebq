// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import VersionDownloadPage, { MSG_ACCESS_REVOKED } from "../VersionDownloadPage";
import { VALIDATE_COMPANY_CODE_URL } from "@/services/versionApi";

const CDN = "https://dgz43izxcyy2a.cloudfront.net";
const LOG_BASE = "https://n36lqnqjjj.execute-api.us-east-1.amazonaws.com";
const LOG_URL = `${LOG_BASE}/downloads/log`;
const STABLE_PATH = "/releases-cdn/releases/stable/latest.json";
const BETA_PATH = "/releases-cdn/releases/beta/latest.json";

function latest(channel: "stable" | "beta", version: string, shaChar: string) {
  return {
    version,
    channel,
    mandatory: false,
    min_supported_version: "",
    release_notes: "notes",
    download_url: `${CDN}/releases/${version}/Setup_CardioX_${version}.exe`,
    sha256: shaChar.repeat(64),
    size_bytes: 179_333_423,
    published_at: "2026-10-13T05:00:09Z",
  };
}
const stableJson = latest("stable", "2.0.0", "c");
const betaJson = latest("beta", "2.1.0", "d");

type LogHandler = (init: RequestInit) => Promise<Response>;

function stubFetch(logHandler: LogHandler) {
  const calls: { url: string; init?: RequestInit }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      calls.push({ url, init });
      if (url === STABLE_PATH) return new Response(JSON.stringify(stableJson), { status: 200 });
      if (url === BETA_PATH) return new Response(JSON.stringify(betaJson), { status: 200 });
      if (url === VALIDATE_COMPANY_CODE_URL) {
        return new Response(JSON.stringify({ success: true, employee_name: "Test User" }), { status: 200 });
      }
      if (url === LOG_URL) return logHandler(init ?? {});
      return new Response("unexpected", { status: 599 });
    })
  );
  return calls;
}

const ok = () => Promise.resolve(new Response(JSON.stringify({ success: true, data: { logged: true } }), { status: 200 }));

async function verifyAndGetBetaButton() {
  render(
    <MemoryRouter initialEntries={["/version"]}>
      <VersionDownloadPage />
    </MemoryRouter>
  );
  fireEvent.change(screen.getByPlaceholderText("Enter your employee code"), { target: { value: "DM485" } });
  fireEvent.click(screen.getByRole("button", { name: "Verify Code" }));
  const buttons = await screen.findAllByRole("button", { name: /download for windows/i });
  return buttons[1]; // stable, beta
}

describe("/version download tracking", () => {
  let clicked: string[];
  let setItem: ReturnType<typeof vi.spyOn>;
  let sessionSetItem: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.stubEnv("VITE_RELEASES_CDN_BASE", CDN);
    vi.stubEnv("VITE_DOWNLOAD_LOG_API_BASE", LOG_BASE);
    clicked = [];
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      clicked.push(this.href);
      expect(this.rel).toBe("noopener noreferrer");
      expect(this.isConnected).toBe(true);
    });
    setItem = vi.spyOn(localStorage, "setItem");
    sessionSetItem = vi.spyOn(sessionStorage, "setItem");
  });

  afterEach(() => {
    // emp_code is never written to browser storage.
    for (const spy of [setItem, sessionSetItem]) {
      for (const args of spy.mock.calls) expect(JSON.stringify(args)).not.toContain("DM485");
    }
    expect(document.cookie).not.toContain("DM485");
    expect(window.location.href).not.toContain("DM485");
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it("200: logs emp_code, channel and version, then starts the download via a temporary link", async () => {
    const calls = stubFetch(ok);
    const button = await verifyAndGetBetaButton();
    fireEvent.click(button);

    await waitFor(() => expect(clicked).toEqual([betaJson.download_url]));
    const log = calls.find((c) => c.url === LOG_URL);
    expect(log?.init?.method).toBe("POST");
    expect(JSON.parse(String(log?.init?.body))).toEqual({ emp_code: "DM485", channel: "beta", version: "2.1.0" });
    // Temporary link removed again.
    expect(document.querySelectorAll(`a[href="${betaJson.download_url}"]`)).toHaveLength(0);
  });

  it("disables the button and shows 'Starting download…' while logging", async () => {
    let resolveLog: (r: Response) => void = () => {};
    stubFetch(() => new Promise<Response>((resolve) => (resolveLog = resolve)));
    const button = await verifyAndGetBetaButton();
    fireEvent.click(button);

    expect(await screen.findByRole("button", { name: /starting download/i })).toHaveProperty("disabled", true);
    expect(clicked).toEqual([]);

    await act(async () => resolveLog(new Response(JSON.stringify({ success: true, data: { logged: true } }), { status: 200 })));
    await waitFor(() => expect(clicked).toHaveLength(1));
    const again = screen.getAllByRole("button", { name: /download for windows/i })[1];
    expect(again).toHaveProperty("disabled", false);
  });

  it("403 NOT_ALLOWED: no download, inline error, verification required again", async () => {
    stubFetch(() =>
      Promise.resolve(
        new Response(JSON.stringify({ success: false, error: { code: "NOT_ALLOWED", message: "inactive" } }), { status: 403 })
      )
    );
    const button = await verifyAndGetBetaButton();
    fireEvent.click(button);

    expect(await screen.findByText(MSG_ACCESS_REVOKED)).toBeTruthy();
    expect(clicked).toEqual([]);
    expect(screen.getByRole("button", { name: "Verify Code" })).toBeTruthy();
    expect((document.getElementById("version-employee-name") as HTMLInputElement).value).toBe("");
    for (const b of screen.getAllByRole("button", { name: /download for windows/i })) expect(b).toHaveProperty("disabled", true);
    expect(screen.queryByText("inactive")).toBeNull(); // raw server text never shown
  });

  it("network error: still downloads and warns without personal data", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    stubFetch(() => Promise.reject(new TypeError("Failed to fetch")));
    const button = await verifyAndGetBetaButton();
    fireEvent.click(button);

    await waitFor(() => expect(clicked).toEqual([betaJson.download_url]));
    expect(warn).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(warn.mock.calls)).not.toMatch(/DM485|Test User/);
  });

  it("5xx and 400: still downloads", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    stubFetch(() => Promise.resolve(new Response("{}", { status: 503 })));
    fireEvent.click(await verifyAndGetBetaButton());
    await waitFor(() => expect(clicked).toHaveLength(1));
  });

  it("timeout (3 s): still downloads", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    stubFetch(
      (init) =>
        new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
        })
    );
    const button = await verifyAndGetBetaButton();
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    fireEvent.click(button);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    vi.useRealTimers();
    await waitFor(() => expect(clicked).toEqual([betaJson.download_url]));
  });
});
