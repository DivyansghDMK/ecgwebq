import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getVerifyUrl, verifyEmployeeCode } from "../versionApi";

const BASE = "https://n36lqnqjjj.execute-api.us-east-1.amazonaws.com";
const VERIFY_URL = `${BASE}/version/verify`;

const json = (status: number, body: unknown, headers?: Record<string, string>) =>
  new Response(JSON.stringify(body), { status, headers });

describe("verifyEmployeeCode (rate-limited endpoint)", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_DOWNLOAD_LOG_API_BASE", BASE);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it("builds the URL from VITE_DOWNLOAD_LOG_API_BASE", () => {
    expect(getVerifyUrl()).toBe(VERIFY_URL);
    vi.stubEnv("VITE_DOWNLOAD_LOG_API_BASE", `${BASE}/`);
    expect(getVerifyUrl()).toBe(VERIFY_URL);
    vi.stubEnv("VITE_DOWNLOAD_LOG_API_BASE", "");
    expect(getVerifyUrl()).toBeNull();
  });

  it("POSTs { emp_code } to /version/verify with no Authorization header or cookies", async () => {
    const fetchImpl = vi.fn(async () => json(200, { success: true, employee_name: "Asha Rao", data: { employee_name: "Asha Rao" } }));
    await verifyEmployeeCode("dm485", { fetchImpl });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(VERIFY_URL);
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({ emp_code: "DM485" });
    expect(new Headers(init.headers).has("Authorization")).toBe(false);
    expect(init.credentials).toBe("omit");
  });

  it("200 with a name -> ok (top-level or data.employee_name)", async () => {
    const top = vi.fn(async () => json(200, { success: true, employee_name: "Asha Rao", data: { employee_name: "Asha Rao" } }));
    expect(await verifyEmployeeCode("DM485", { fetchImpl: top })).toEqual({ status: "ok", employeeName: "Asha Rao" });
    const nested = vi.fn(async () => json(200, { success: true, data: { employee_name: "Ravi K" } }));
    expect(await verifyEmployeeCode("DM485", { fetchImpl: nested })).toEqual({ status: "ok", employeeName: "Ravi K" });
  });

  it("200 without a usable name -> failed", async () => {
    for (const body of [{ success: true, employee_name: "  " }, { success: false, employee_name: "X" }, { success: true }]) {
      const fetchImpl = vi.fn(async () => json(200, body));
      expect(await verifyEmployeeCode("DM485", { fetchImpl })).toEqual({ status: "failed" });
    }
  });

  it("403 NOT_RECOGNISED and 400 -> failed", async () => {
    const r403 = vi.fn(async () => json(403, { success: false, error: { code: "NOT_RECOGNISED" } }));
    expect(await verifyEmployeeCode("DM485", { fetchImpl: r403 })).toEqual({ status: "failed" });
    const r400 = vi.fn(async () => json(400, { success: false, error: { code: "BAD_REQUEST" } }));
    expect(await verifyEmployeeCode("DM485", { fetchImpl: r400 })).toEqual({ status: "failed" });
  });

  it("429 TOO_MANY_ATTEMPTS -> rate_limited", async () => {
    const fetchImpl = vi.fn(async () => json(429, { success: false, error: { code: "TOO_MANY_ATTEMPTS" } }, { "Retry-After": "900" }));
    expect(await verifyEmployeeCode("DM485", { fetchImpl })).toEqual({ status: "rate_limited" });
  });

  it("network error and 5xx -> network", async () => {
    const offline = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    });
    expect(await verifyEmployeeCode("DM485", { fetchImpl: offline })).toEqual({ status: "network" });
    const r502 = vi.fn(async () => json(502, {}));
    expect(await verifyEmployeeCode("DM485", { fetchImpl: r502 })).toEqual({ status: "network" });
  });

  it("times out after 10 seconds -> network", async () => {
    vi.useFakeTimers();
    const fetchImpl = vi.fn(
      (_url: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
        })
    );
    const pending = verifyEmployeeCode("DM485", { fetchImpl });
    await vi.advanceTimersByTimeAsync(9_999);
    expect((fetchImpl.mock.calls[0][1] as RequestInit).signal?.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await expect(pending).resolves.toEqual({ status: "network" });
  });

  it("caller abort -> aborted (ignored by the page)", async () => {
    const controller = new AbortController();
    const fetchImpl = vi.fn(
      (_url: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
        })
    );
    const pending = verifyEmployeeCode("DM485", { fetchImpl, signal: controller.signal });
    controller.abort();
    await expect(pending).resolves.toEqual({ status: "aborted" });
  });

  it("does not call anything when the base URL is not configured", async () => {
    vi.stubEnv("VITE_DOWNLOAD_LOG_API_BASE", "");
    const fetchImpl = vi.fn();
    expect(await verifyEmployeeCode("DM485", { fetchImpl })).toEqual({ status: "network" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
