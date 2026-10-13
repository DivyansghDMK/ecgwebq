import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createHttpReleaseApi,
  createMockReleaseApi,
  isMockReleaseApi,
  ReleaseApiError,
} from "../releaseApi";

describe("mock release API", () => {
  const api = createMockReleaseApi({ delayMs: 0 });

  it("returns the beta releases newest first", async () => {
    const releases = await api.getReleases();
    expect(releases.map((r) => r.version)).toEqual(["1.2.5", "1.2.4", "1.2.2", "0.9.1"]);
    expect(releases.every((r) => r.channel === "beta")).toBe(true);
    expect(releases.every((r) => /^[0-9a-f]{64}$/.test(r.sha256))).toBe(true);
    expect(releases[0].installer_file).toBe("CardioX-Setup-1.2.5.exe");
  });

  it("pages uploads with next_cursor until null, newest first", async () => {
    const first = await api.getUploads({ limit: 50 });
    expect(first.items).toHaveLength(50);
    expect(first.next_cursor).toEqual(expect.any(String));

    const second = await api.getUploads({ limit: 50, cursor: first.next_cursor });
    expect(second.next_cursor).toBeNull();

    const all = [...first.items, ...second.items];
    const times = all.map((u) => Date.parse(u.at));
    expect([...times].sort((a, b) => b - a)).toEqual(times);
    expect(new Set(all.map((u) => `${u.at}|${u.version}`)).size).toBe(all.length);
  });

  it("includes ACCEPTED and REJECTED rows; rejected rows have reasons", async () => {
    const { items } = await api.getUploads({ limit: 100 });
    const rejected = items.filter((u) => u.result === "REJECTED");
    expect(items.some((u) => u.result === "ACCEPTED")).toBe(true);
    expect(rejected.length).toBeGreaterThan(0);
    expect(rejected.every((u) => u.reasons.length > 0)).toBe(true);

    const reasons = rejected.flatMap((u) => u.reasons).join("\n");
    expect(reasons).toContain("version 0.9.1 already exists in releases/");
    expect(reasons).toContain("installer SHA-256 mismatch: manifest");
    expect(reasons).toContain("0.9.0 is lower than live 0.9.1 on the beta channel");
  });

  async function fetchAll(query: Parameters<typeof api.getUploads>[0] = {}, limit = 20) {
    const pages = [];
    let cursor: string | null = null;
    do {
      const page = await api.getUploads({ ...query, limit, cursor });
      pages.push(page);
      cursor = page.next_cursor;
    } while (cursor && pages.length < 50);
    return pages;
  }

  it("filters by result on the server side", async () => {
    const { items } = await api.getUploads({ limit: 100, result: "REJECTED" });
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((u) => u.result === "REJECTED")).toBe(true);
  });

  it("filters by channel on the server side", async () => {
    const { items } = await api.getUploads({ limit: 100, channel: "stable" });
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((u) => u.channel === "stable")).toBe(true);
  });

  it("combines result and channel filters", async () => {
    const all = (await api.getUploads({ limit: 100 })).items;
    const expected = all.filter((u) => u.result === "ACCEPTED" && u.channel === "beta");
    const { items } = await api.getUploads({ limit: 100, result: "ACCEPTED", channel: "beta" });
    expect(items).toEqual(expected);

    const none = await api.getUploads({ limit: 100, result: "ACCEPTED", channel: "stable" });
    expect(none).toEqual({ items: [], next_cursor: null });
  });

  it.each([20, 50])("pages with limit %i until next_cursor is null", async (limit) => {
    const total = (await api.getUploads({ limit: 100 })).items.length;
    const pages = await fetchAll({}, limit);

    expect(pages).toHaveLength(Math.ceil(total / limit));
    pages.slice(0, -1).forEach((p) => {
      expect(p.items).toHaveLength(limit);
      expect(p.next_cursor).toEqual(expect.any(String));
    });
    const last = pages[pages.length - 1];
    expect(last.items).toHaveLength(total - limit * (pages.length - 1));
    expect(last.next_cursor).toBeNull();
  });

  it("pages within a filtered result set", async () => {
    const expected = (await api.getUploads({ limit: 100, result: "REJECTED" })).items;
    const pages = await fetchAll({ result: "REJECTED" }, 5);
    expect(pages.flatMap((p) => p.items)).toEqual(expected);
    expect(pages[pages.length - 1].next_cursor).toBeNull();
  });

  it("rejects an invalid cursor", async () => {
    await expect(api.getUploads({ cursor: "garbage" })).rejects.toMatchObject({ status: 400, code: "INVALID_CURSOR" });
  });
});

describe("HTTP release API", () => {
  function jsonResponse(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
  }

  it("sends the admin bearer token and builds the uploads URL", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ success: true, data: { items: [], next_cursor: null } }));
    const api = createHttpReleaseApi("https://api.example.com/prod/", {
      fetchImpl: fetchImpl as unknown as typeof fetch,
      getHeaders: () => ({ Authorization: "Bearer test.jwt.token" }),
    });

    await api.getUploads({ limit: 50, cursor: "abc=" });

    expect(fetchImpl).toHaveBeenCalledWith("https://api.example.com/prod/admin/uploads?limit=50&cursor=abc%3D", {
      method: "GET",
      headers: { Authorization: "Bearer test.jwt.token" },
    });
  });

  it("sends result and channel only when set", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ success: true, data: { items: [], next_cursor: null } }));
    const api = createHttpReleaseApi("https://api.example.com", { fetchImpl: fetchImpl as unknown as typeof fetch });

    await api.getUploads({ limit: 20, result: "REJECTED", channel: "beta" });
    await api.getUploads({ limit: 20 });

    const urls = fetchImpl.mock.calls.map((call) => (call as unknown[])[0]);
    expect(urls).toEqual([
      "https://api.example.com/admin/uploads?limit=20&result=REJECTED&channel=beta",
      "https://api.example.com/admin/uploads?limit=20",
    ]);
  });

  it("maps release items and ignores unknown fields", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ success: true, data: { items: [{ version: "1.2.5", channel: "beta", extra: 1 }] } })
    );
    const api = createHttpReleaseApi("https://api.example.com", { fetchImpl: fetchImpl as unknown as typeof fetch });
    const [item] = await api.getReleases();
    expect(item.version).toBe("1.2.5");
    expect(item).not.toHaveProperty("extra");
  });

  it.each([401, 403])("marks HTTP %i as an auth error", async (status) => {
    const fetchImpl = vi.fn(async () => jsonResponse({ success: false, error: { message: "Forbidden", code: "AUTH" } }, status));
    const api = createHttpReleaseApi("https://api.example.com", { fetchImpl: fetchImpl as unknown as typeof fetch });
    const error = await api.getReleases().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ReleaseApiError);
    expect((error as ReleaseApiError).isAuthError).toBe(true);
  });

  it("surfaces API error message and code", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ success: false, error: { message: "Boom", code: "INTERNAL" } }, 500));
    const api = createHttpReleaseApi("https://api.example.com", { fetchImpl: fetchImpl as unknown as typeof fetch });
    await expect(api.getReleases()).rejects.toMatchObject({ message: "Boom", code: "INTERNAL", status: 500 });
  });

  it("fails clearly when the base URL is missing", async () => {
    await expect(createHttpReleaseApi(undefined).getReleases()).rejects.toMatchObject({ code: "CONFIG" });
  });
});

describe("isMockReleaseApi", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults to mock", () => {
    vi.stubEnv("VITE_USE_MOCK_RELEASE_API", "");
    expect(isMockReleaseApi()).toBe(true);
  });

  it("is off only for 'false'", () => {
    vi.stubEnv("VITE_USE_MOCK_RELEASE_API", "false");
    expect(isMockReleaseApi()).toBe(false);
    vi.stubEnv("VITE_USE_MOCK_RELEASE_API", "true");
    expect(isMockReleaseApi()).toBe(true);
  });
});
