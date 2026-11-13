import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDownloadsAdminApi, DownloadsApiError, EMP_CODE_PATTERN, logDownload } from "../downloadsApi";

const BASE = "https://n36lqnqjjj.execute-api.us-east-1.amazonaws.com";
const TOKEN = "test-admin-token-not-a-jwt";

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });

describe("downloadsApi", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_DOWNLOAD_LOG_API_BASE", BASE);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it("validates employee codes as 2 uppercase letters + 1–8 digits", () => {
    for (const ok of ["DM485", "AB1", "XY12345678"]) expect(EMP_CODE_PATTERN.test(ok)).toBe(true);
    for (const bad of ["dm485", "D485", "DM", "DM123456789", "DM48A", "DM 485", "<b>1"]) expect(EMP_CODE_PATTERN.test(bad)).toBe(false);
  });

  describe("logDownload", () => {
    it("POSTs emp_code, channel and version to the configured base", async () => {
      const fetchImpl = vi.fn(async () => json(200, { success: true, data: { logged: true } }));
      await expect(logDownload({ empCode: "DM485", channel: "beta", version: "1.3.10" }, { fetchImpl })).resolves.toBe("logged");
      const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
      expect(url).toBe(`${BASE}/downloads/log`);
      expect(init.method).toBe("POST");
      expect(JSON.parse(String(init.body))).toEqual({ emp_code: "DM485", channel: "beta", version: "1.3.10" });
    });

    it("treats a duplicate (logged:false) as success", async () => {
      const fetchImpl = vi.fn(async () => json(200, { success: true, data: { logged: false } }));
      await expect(logDownload({ empCode: "DM485", channel: "beta", version: "1.3.10" }, { fetchImpl })).resolves.toBe("logged");
    });

    it("maps 403 NOT_ALLOWED to not_allowed and other errors to failed", async () => {
      const input = { empCode: "DM485", channel: "beta", version: "1.3.10" };
      const r403 = vi.fn(async () => json(403, { success: false, error: { code: "NOT_ALLOWED", message: "x" } }));
      expect(await logDownload(input, { fetchImpl: r403 })).toBe("not_allowed");
      const r400 = vi.fn(async () => json(400, { success: false, error: { code: "BAD_REQUEST", message: "x" } }));
      expect(await logDownload(input, { fetchImpl: r400 })).toBe("failed");
      const r500 = vi.fn(async () => json(500, {}));
      expect(await logDownload(input, { fetchImpl: r500 })).toBe("failed");
      const rNet = vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      });
      expect(await logDownload(input, { fetchImpl: rNet })).toBe("failed");
    });

    it("times out after 3 seconds", async () => {
      vi.useFakeTimers();
      const fetchImpl = vi.fn(
        (_url: RequestInfo | URL, init?: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
          })
      );
      const pending = logDownload({ empCode: "DM485", channel: "beta", version: "1.3.10" }, { fetchImpl });
      await vi.advanceTimersByTimeAsync(2999);
      expect((fetchImpl.mock.calls[0][1] as RequestInit).signal?.aborted).toBe(false);
      await vi.advanceTimersByTimeAsync(1);
      await expect(pending).resolves.toBe("failed");
    });

    it("never sends an invalid code", async () => {
      const fetchImpl = vi.fn();
      expect(await logDownload({ empCode: "dm485'--", channel: "beta", version: "1" }, { fetchImpl })).toBe("failed");
      expect(fetchImpl).not.toHaveBeenCalled();
    });
  });

  describe("admin client", () => {
    it("sends the token only in the Authorization header and builds the query with URLSearchParams", async () => {
      const fetchImpl = vi.fn(async () => json(200, { success: true, data: { items: [], next_cursor: null } }));
      const api = createDownloadsAdminApi({ fetchImpl, getHeaders: () => ({ Authorization: `Bearer ${TOKEN}` }) });
      await api.getLog({ limit: 50, cursor: "abc&x=1", empCode: "DM485" });
      const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
      expect(url).toBe(`${BASE}/admin/downloads?limit=50&cursor=abc%26x%3D1&emp_code=DM485`);
      expect(url).not.toContain(TOKEN);
      expect((init.headers as Record<string, string>).Authorization).toBe(`Bearer ${TOKEN}`);
    });

    it("rejects an invalid emp_code filter without calling the API", async () => {
      const fetchImpl = vi.fn();
      const api = createDownloadsAdminApi({ fetchImpl, getHeaders: () => ({}) });
      await expect(api.getLog({ empCode: "DM1&limit=999" })).rejects.toBeInstanceOf(DownloadsApiError);
      expect(fetchImpl).not.toHaveBeenCalled();
    });

    it("401 is an auth error with a generic message (no server text, no token)", async () => {
      const fetchImpl = vi.fn(async () => json(401, { success: false, error: { code: "UNAUTHORIZED", message: `bad token ${TOKEN}` } }));
      const api = createDownloadsAdminApi({ fetchImpl, getHeaders: () => ({ Authorization: `Bearer ${TOKEN}` }) });
      const error = await api.getSummary().catch((e: unknown) => e);
      expect(error).toBeInstanceOf(DownloadsApiError);
      expect((error as DownloadsApiError).isAuthError).toBe(true);
      expect((error as Error).message).not.toContain(TOKEN);
      expect((error as Error).message).not.toContain("bad token");
    });

    it("server errors never surface the raw server message", async () => {
      const fetchImpl = vi.fn(async () => json(500, { success: false, error: { code: "X", message: "stack trace at line 4" } }));
      const api = createDownloadsAdminApi({ fetchImpl, getHeaders: () => ({}) });
      await expect(api.getSummary()).rejects.toThrow("The downloads service returned an error.");
    });

    it("coerces untrusted fields to strings/numbers", async () => {
      const fetchImpl = vi.fn(async () =>
        json(200, {
          success: true,
          data: { items: [{ emp_code: "DM1", employee_name: { html: "<b>" }, is_active: "yes", downloads: "5", last_version: 7 }] },
        })
      );
      const api = createDownloadsAdminApi({ fetchImpl, getHeaders: () => ({}) });
      expect(await api.getSummary()).toEqual([
        { emp_code: "DM1", employee_name: "", is_active: false, downloads: 0, last_downloaded_at: null, last_version: null },
      ]);
    });
  });
});
