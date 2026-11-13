// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import ReleasesPage from "../ReleasesPage";

const BASE = "https://n36lqnqjjj.execute-api.us-east-1.amazonaws.com";
const TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbiJ9.c2lnbmF0dXJl";
const XSS = "<script>alert(1)</script>";
const DAY = 24 * 60 * 60 * 1000;

const summaryItems = [
  { emp_code: "DM1", employee_name: "Asha Rao", is_active: true, downloads: 3, last_downloaded_at: "2026-11-10T05:00:00Z", last_version: "1.3.10" },
  { emp_code: "DM2", employee_name: XSS, is_active: true, downloads: 0, last_downloaded_at: null, last_version: null },
  { emp_code: "DM3", employee_name: "Bob Left", is_active: false, downloads: 2, last_downloaded_at: "2026-09-01T05:00:00Z", last_version: "1.3.8" },
  { emp_code: "DM4", employee_name: "Neha Singh", is_active: true, downloads: 1, last_downloaded_at: "2026-11-01T05:00:00Z", last_version: "1.3.9" },
];

function logRow(i: number, ageMs: number, emp_code = "DM1", employee_name = "Asha Rao") {
  return {
    id: i,
    emp_code,
    employee_name,
    channel: i % 3 === 0 ? "stable" : i % 3 === 1 ? "beta" : "nightly",
    version: `1.3.${i}`,
    device: "Windows 11",
    ip: `10.0.0.${i}`,
    downloaded_at: new Date(Date.now() - ageMs).toISOString(),
  };
}

type Handler = (url: URL, init?: RequestInit) => Response | undefined;
const ok = (data: unknown) => new Response(JSON.stringify({ success: true, data }), { status: 200 });

function stubFetch(handler: Handler = () => undefined) {
  const calls: { url: string; init?: RequestInit }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const raw = String(input);
      calls.push({ url: raw, init });
      if (raw.startsWith("/release-api/")) return ok({ items: [], next_cursor: null });
      if (!raw.startsWith(BASE)) return new Response("<Error/>", { status: 403 });
      const url = new URL(raw);
      const custom = handler(url, init);
      if (custom) return custom;
      if (url.pathname === "/admin/downloads/summary") return ok({ items: summaryItems });
      if (url.pathname === "/admin/downloads") {
        const limit = url.searchParams.get("limit");
        const cursor = url.searchParams.get("cursor");
        const emp = url.searchParams.get("emp_code");
        if (emp === "DM4") return ok({ items: [logRow(90, DAY, "DM4", "Neha Singh")], next_cursor: null });
        if (limit === "200") {
          // 3 rows in the last 7 days, then an older one -> stop following cursors.
          return ok({ items: [logRow(1, DAY), logRow(2, 2 * DAY), logRow(3, 6 * DAY), logRow(4, 10 * DAY)], next_cursor: "older" });
        }
        if (!cursor) return ok({ items: Array.from({ length: Number(limit) }, (_, i) => logRow(i + 1, i * 1000)), next_cursor: "p2" });
        if (cursor === "p2") return ok({ items: Array.from({ length: 5 }, (_, i) => logRow(100 + i, DAY)), next_cursor: null });
      }
      return new Response("{}", { status: 500 });
    })
  );
  return calls;
}

function LocationProbe() {
  const location = useLocation();
  return <p data-testid="location">{`${location.pathname}${location.hash}`}</p>;
}

function renderAt(entry: string) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route
          path="/artists/releases"
          element={
            <>
              <ReleasesPage />
              <LocationProbe />
            </>
          }
        />
        <Route path="/login_admin" element={<p>Admin login page</p>} />
      </Routes>
    </MemoryRouter>
  );
}

const adminCalls = (calls: { url: string; init?: RequestInit }[]) => calls.filter((c) => c.url.startsWith(BASE));

describe("Releases page: section switcher", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_RELEASES_CDN_BASE", "https://dgz43izxcyy2a.cloudfront.net");
    vi.stubEnv("VITE_RELEASE_API_BASE", "/release-api");
    vi.stubEnv("VITE_DOWNLOAD_LOG_API_BASE", BASE);
    localStorage.setItem("ecg_admin_token", TOKEN);
  });
  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("defaults to #live and switches sections via the hash", async () => {
    const calls = stubFetch();
    renderAt("/artists/releases");
    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((t) => t.textContent)).toEqual(["Live now", "Release history", "Upload history", "Employee downloadsNew"]);
    expect(screen.getByRole("tab", { name: "Live now" }).getAttribute("aria-selected")).toBe("true");
    expect(document.getElementById("releases-panel-history")?.hidden).toBe(true);
    // Downloads section is not mounted (no admin download calls) until selected.
    expect(adminCalls(calls)).toHaveLength(0);

    fireEvent.click(screen.getByRole("tab", { name: /employee downloads/i }));
    expect(screen.getByTestId("location").textContent).toBe("/artists/releases#downloads");
    expect(screen.getByRole("tab", { name: /employee downloads/i }).getAttribute("aria-selected")).toBe("true");
    expect(await screen.findByRole("heading", { name: "Employee downloads" })).toBeTruthy();

    // Keyboard: ArrowRight wraps to the first tab.
    fireEvent.keyDown(screen.getByRole("tab", { name: /employee downloads/i }), { key: "ArrowRight" });
    expect(screen.getByTestId("location").textContent).toBe("/artists/releases#live");
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Live now" }));
  });

  it("opens the bookmarked section from the hash", () => {
    stubFetch();
    renderAt("/artists/releases#uploads");
    expect(screen.getByRole("tab", { name: "Upload history" }).getAttribute("aria-selected")).toBe("true");
    expect(document.getElementById("releases-panel-uploads")?.hidden).toBe(false);
    expect(document.getElementById("releases-panel-live")?.hidden).toBe(true);
  });
});

describe("Employee downloads section", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_RELEASES_CDN_BASE", "https://dgz43izxcyy2a.cloudfront.net");
    vi.stubEnv("VITE_RELEASE_API_BASE", "/release-api");
    vi.stubEnv("VITE_DOWNLOAD_LOG_API_BASE", BASE);
    localStorage.setItem("ecg_admin_token", TOKEN);
    localStorage.setItem("ecg_admin_user", JSON.stringify({ userId: "1", role: "admin", name: "Admin" }));
  });
  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("computes the stat cards from fixtures", async () => {
    stubFetch();
    renderAt("/artists/releases#downloads");
    await waitFor(() => expect(within(screen.getByTestId("stat-total")).getByText("6")).toBeTruthy());
    expect(within(screen.getByTestId("stat-employees")).getByText("3")).toBeTruthy();
    expect(within(screen.getByTestId("stat-employees")).getByText("of 3 active")).toBeTruthy();
    expect(within(screen.getByTestId("stat-never")).getByText("1")).toBeTruthy();
    await waitFor(() => expect(within(screen.getByTestId("stat-last7")).getByText("3")).toBeTruthy());
  });

  it("search and Show filter the By employee table; default sort is downloads desc", async () => {
    stubFetch();
    renderAt("/artists/releases#downloads");
    const table = await screen.findByTestId("summary-table");
    const codes = () => within(table).queryAllByRole("row").slice(1).map((r) => r.querySelector("td")?.textContent);
    expect(codes()).toEqual(["DM1", "DM3", "DM4", "DM2"]);

    fireEvent.change(screen.getByPlaceholderText("Search code or name"), { target: { value: "neha" } });
    expect(codes()).toEqual(["DM4"]);
    fireEvent.change(screen.getByPlaceholderText("Search code or name"), { target: { value: "" } });

    fireEvent.change(screen.getByRole("combobox", { name: /show/i }), { target: { value: "never" } });
    expect(codes()).toEqual(["DM2"]);
    fireEvent.change(screen.getByRole("combobox", { name: /show/i }), { target: { value: "downloaded" } });
    expect(codes()).toEqual(["DM1", "DM3", "DM4"]);
    // Access badges
    expect(within(table).getByText("Left")).toBeTruthy();
  });

  it("renders a <script> employee name as plain text", async () => {
    stubFetch();
    renderAt("/artists/releases#downloads");
    expect(await screen.findByText(XSS)).toBeTruthy();
    expect(document.querySelectorAll("script")).toHaveLength(0);
    expect(document.body.innerHTML).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });

  it("'View log' sets the employee-code filter (server-side emp_code)", async () => {
    const calls = stubFetch();
    renderAt("/artists/releases#downloads");
    const table = await screen.findByTestId("summary-table");
    const neha = within(table).getByText("DM4").closest("tr") as HTMLElement;
    fireEvent.click(within(neha).getByRole("button", { name: "View log" }));

    expect((screen.getByPlaceholderText("e.g. DM485") as HTMLInputElement).value).toBe("DM4");
    await waitFor(() => expect(calls.some((c) => new URL(c.url, "http://x").searchParams.get("emp_code") === "DM4")).toBe(true));
    const log = screen.getByTestId("log-table");
    await waitFor(() => expect(within(log).getByText("Neha Singh")).toBeTruthy());
    // DM2 (0 downloads) has no View log link.
    const dm2 = within(table).getByText("DM2").closest("tr") as HTMLElement;
    expect(within(dm2).queryByRole("button", { name: "View log" })).toBeNull();
  });

  it("an invalid code in the filter is not sent", async () => {
    const calls = stubFetch();
    renderAt("/artists/releases#downloads");
    await screen.findByTestId("log-table");
    const input = screen.getByPlaceholderText("e.g. DM485");
    fireEvent.change(input, { target: { value: "D1&x" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(await screen.findByText(/Use 2 letters followed by numbers/)).toBeTruthy();
    expect(calls.some((c) => c.url.includes("emp_code="))).toBe(false);
  });

  it("paginates the log with a cursor stack and page cache", async () => {
    const calls = stubFetch();
    renderAt("/artists/releases#downloads");
    const status = screen.getByTestId("log-page-status");
    await waitFor(() => expect(status.textContent).toBe("Page 1 · Showing 1–20"));
    expect(status.getAttribute("aria-live")).toBe("polite");

    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    await waitFor(() => expect(status.textContent).toBe("Page 2 · Showing 21–25"));
    expect(calls.some((c) => c.url.includes("cursor=p2"))).toBe(true);
    expect(screen.getByRole("button", { name: "Next page" })).toHaveProperty("disabled", true);

    const before = calls.length;
    fireEvent.click(screen.getByRole("button", { name: "Previous page" }));
    await waitFor(() => expect(status.textContent).toBe("Page 1 · Showing 1–20"));
    expect(calls.length).toBe(before); // served from cache

    // Channel badges: beta / stable / other
    const log = screen.getByTestId("log-table");
    expect(within(log).getAllByText("beta").length).toBeGreaterThan(0);
    expect(within(log).getAllByText("stable").length).toBeGreaterThan(0);
    expect(within(log).getAllByText("nightly").length).toBeGreaterThan(0);

    // Rows per page resets to page 1 with the new limit.
    fireEvent.change(screen.getByRole("combobox", { name: /rows per page/i }), { target: { value: "50" } });
    await waitFor(() => expect(status.textContent).toBe("Page 1 · Showing 1–50"));
  });

  it("sends the admin token only in the Authorization header", async () => {
    const calls = stubFetch();
    renderAt("/artists/releases#downloads");
    await screen.findByTestId("summary-table");
    await waitFor(() => expect(screen.getByTestId("log-page-status").textContent).toContain("Showing"));
    const admin = adminCalls(calls);
    expect(admin.length).toBeGreaterThan(0);
    for (const call of admin) {
      expect(call.url).not.toContain(TOKEN);
      expect(decodeURIComponent(call.url)).not.toContain(TOKEN);
      expect((call.init?.headers as Record<string, string>).Authorization).toBe(`Bearer ${TOKEN}`);
    }
  });

  it("401 clears the admin session and goes to /login_admin", async () => {
    stubFetch((url) => (url.pathname === "/admin/downloads/summary" ? new Response("{}", { status: 401 }) : undefined));
    renderAt("/artists/releases#downloads");
    expect(await screen.findByText("Admin login page")).toBeTruthy();
    expect(localStorage.getItem("ecg_admin_token")).toBeNull();
  });

  it("shows a generic error with Retry (never the raw server message)", async () => {
    let fail = true;
    stubFetch((url) =>
      url.pathname === "/admin/downloads/summary" && fail
        ? new Response(JSON.stringify({ success: false, error: { code: "X", message: "Traceback: secret internals" } }), { status: 500 })
        : undefined
    );
    renderAt("/artists/releases#downloads");
    expect(await screen.findByText("The downloads service returned an error.")).toBeTruthy();
    expect(document.body.textContent).not.toContain("Traceback");
    fail = false;
    fireEvent.click(screen.getAllByRole("button", { name: "Retry" })[0]);
    expect(await screen.findByTestId("summary-table")).toBeTruthy();
  });

  it("shows the empty state", async () => {
    stubFetch((url) =>
      url.pathname === "/admin/downloads/summary"
        ? ok({ items: [] })
        : url.pathname === "/admin/downloads"
          ? ok({ items: [], next_cursor: null })
          : undefined
    );
    renderAt("/artists/releases#downloads");
    await waitFor(() => expect(screen.getAllByText("No downloads recorded yet")).toHaveLength(2));
  });

  it("exports summary and log as CSV files following cursors", async () => {
    const blobs: Blob[] = [];
    const names: string[] = [];
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: (b: Blob) => (blobs.push(b), "blob:x"), revokeObjectURL: () => {} }));
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      names.push(this.download);
    });
    const calls = stubFetch((url) => {
      if (url.pathname === "/admin/downloads" && url.searchParams.get("limit") === "200") {
        const cursor = url.searchParams.get("cursor");
        if (!cursor) return ok({ items: [logRow(1, DAY, "DM1", "=HYPERLINK(1)")], next_cursor: "e2" });
        if (cursor === "e2") return ok({ items: [logRow(2, 9 * DAY)], next_cursor: null });
        return ok({ items: [], next_cursor: null });
      }
      return undefined;
    });
    renderAt("/artists/releases#downloads");
    await screen.findByTestId("summary-table");
    fireEvent.click(screen.getByRole("button", { name: /export to excel/i }));
    await waitFor(() => expect(names).toHaveLength(2));
    expect(names[0]).toMatch(/^employee-downloads-summary-\d{4}-\d{2}-\d{2}\.csv$/);
    expect(names[1]).toMatch(/^employee-downloads-log-\d{4}-\d{2}-\d{2}\.csv$/);
    expect(calls.some((c) => c.url.includes("cursor=e2"))).toBe(true);

    const bytes = await new Promise<Uint8Array>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
      reader.readAsArrayBuffer(blobs[1]);
    });
    expect(Array.from(bytes.slice(0, 3))).toEqual([0xef, 0xbb, 0xbf]); // UTF-8 BOM
    const text = new TextDecoder("utf-8", { ignoreBOM: true }).decode(bytes);
    expect(text.charCodeAt(0)).toBe(0xfeff);
    expect(text).toContain(`"'=HYPERLINK(1)"`);
    expect(text.trim().split("\r\n")).toHaveLength(3); // header + 2 rows
  });
});
