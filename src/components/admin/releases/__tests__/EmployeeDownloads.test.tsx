// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import ReleasesPage from "../ReleasesPage";

const BASE = "https://n36lqnqjjj.execute-api.us-east-1.amazonaws.com";
// Plain placeholder. The app only accepts a 3-part token, so build that shape at runtime
// from harmless parts (no JWT-like literal in the repo).
const TOKEN = ["test-admin-hdr", "test-admin-pld", "test-admin-sig"].join(".");
const XSS = "<script>alert(1)</script>";
const DAY = 24 * 60 * 60 * 1000;

const summaryItems = [
  { emp_code: "DM1", employee_name: "Asha Rao", is_active: true, downloads: 3, last_downloaded_at: "2026-11-10T05:00:00Z", last_version: "1.3.10" },
  { emp_code: "DM2", employee_name: "Zero Active", is_active: true, downloads: 0, last_downloaded_at: null, last_version: null },
  { emp_code: "DM3", employee_name: "Bob Left", is_active: false, downloads: 2, last_downloaded_at: "2026-09-01T05:00:00Z", last_version: "1.3.8" },
  { emp_code: "DM4", employee_name: "Neha Singh", is_active: true, downloads: 1, last_downloaded_at: "2026-11-01T05:00:00Z", last_version: "1.3.9" },
  { emp_code: "DM5", employee_name: XSS, is_active: true, downloads: 1, last_downloaded_at: "2026-11-12T05:00:00Z", last_version: "1.3.10" },
  { emp_code: "DM6", employee_name: "Zero Left", is_active: false, downloads: 0, last_downloaded_at: null, last_version: null },
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

type Handler = (url: URL, init?: RequestInit) => Response | Promise<Response> | undefined;
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
      const custom = await handler(url, init);
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

  it("shows exactly 3 stat cards computed from fixtures", async () => {
    stubFetch();
    renderAt("/artists/releases#downloads");
    await waitFor(() => expect(within(screen.getByTestId("stat-total")).getByText("7")).toBeTruthy());
    expect(screen.getByTestId("stat-employees").textContent).toBe("Employees who downloaded4");
    await waitFor(() => expect(within(screen.getByTestId("stat-last7")).getByText("3")).toBeTruthy());
    expect(document.querySelectorAll('[data-testid^="stat-"]')).toHaveLength(3);
    expect(screen.queryByText(/never downloaded/i)).toBeNull();
    expect(screen.queryByText(/ active$/)).toBeNull();
  });

  it("lists only employees who downloaded (left ones too), sorted by downloads, most recent, code", async () => {
    stubFetch();
    renderAt("/artists/releases#downloads");
    const table = await screen.findByTestId("summary-table");
    const codes = () => within(table).queryAllByRole("row").slice(1).map((r) => r.querySelector("td")?.textContent);
    // DM5 and DM4 both have 1 download: DM5 downloaded more recently.
    expect(codes()).toEqual(["DM1", "DM3", "DM5", "DM4"]);
    expect(within(table).queryByText("Zero Active")).toBeNull();
    expect(within(table).queryByText("Zero Left")).toBeNull();
    // A left employee who downloaded is shown with the Left badge.
    const bob = within(table).getByText("DM3").closest("tr") as HTMLElement;
    expect(within(bob).getByText("Left")).toBeTruthy();
    expect(within(bob).getByRole("button", { name: "View log" })).toBeTruthy();
    // No Show filter any more.
    expect(screen.queryByRole("combobox", { name: /show/i })).toBeNull();
    expect(screen.queryByText("Never downloaded")).toBeNull();
  });

  it("search (code or name) applies to downloaded employees only", async () => {
    stubFetch();
    renderAt("/artists/releases#downloads");
    const table = await screen.findByTestId("summary-table");
    const codes = () => within(table).queryAllByRole("row").slice(1).map((r) => r.querySelector("td")?.textContent);
    const search = screen.getByPlaceholderText("Search code or name");
    fireEvent.change(search, { target: { value: "neha" } });
    expect(codes()).toEqual(["DM4"]);
    fireEvent.change(search, { target: { value: "dm3" } });
    expect(codes()).toEqual(["DM3"]);
    fireEvent.change(search, { target: { value: "zero" } });
    expect(within(table).getByText("No employees match this search.")).toBeTruthy();
  });

  const rowFor = (table: HTMLElement, code: string) => within(table).getByText(code).closest("tr") as HTMLElement;
  const logButton = (table: HTMLElement, code: string) => within(rowFor(table, code)).getByRole("button", { name: /view log|hide log/i });
  const empCodeParams = (calls: { url: string }[]) =>
    calls.map((c) => new URL(c.url, "http://x").searchParams.get("emp_code")).filter((v): v is string => v !== null);

  it("hides the Download log by default; Last 7 days is still computed", async () => {
    const calls = stubFetch();
    renderAt("/artists/releases#downloads");
    await screen.findByTestId("summary-table");
    await waitFor(() => expect(within(screen.getByTestId("stat-last7")).getByText("3")).toBeTruthy());
    expect(screen.queryByTestId("log-table")).toBeNull();
    expect(screen.queryByRole("heading", { name: /download log/i })).toBeNull();
    // Only the summary and the 7-day count are requested (limit=200, no emp_code).
    const logCalls = adminCalls(calls).filter((c) => new URL(c.url).pathname === "/admin/downloads");
    expect(logCalls.every((c) => new URL(c.url).searchParams.get("limit") === "200")).toBe(true);
    expect(empCodeParams(calls)).toEqual([]);
    // No free-text employee-code filter any more.
    expect(screen.queryByPlaceholderText("e.g. DM485")).toBeNull();
    expect(screen.queryAllByRole("textbox")).toHaveLength(0);
  });

  it("View log opens the log for that employee (server-side emp_code) and focuses its heading", async () => {
    const calls = stubFetch();
    renderAt("/artists/releases#downloads");
    const table = await screen.findByTestId("summary-table");
    const button = logButton(table, "DM4");
    expect(button.tagName).toBe("BUTTON");
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(button.getAttribute("aria-controls")).toBe("employee-download-log");
    fireEvent.click(button);

    const heading = await screen.findByRole("heading", { name: "Download log — DM4 · Neha Singh" });
    expect(document.activeElement).toBe(heading);
    expect(document.getElementById("employee-download-log")?.contains(heading)).toBe(true);
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(button.textContent).toBe("Hide log");
    await waitFor(() => expect(empCodeParams(calls)).toEqual(["DM4"]));

    const log = screen.getByTestId("log-table");
    expect(within(log).getAllByRole("columnheader").map((h) => h.textContent)).toEqual([
      "Time (IST)",
      "Version",
      "Channel",
      "Device",
      "IP address",
    ]);
    await waitFor(() => expect(within(log).getByText("1.3.90")).toBeTruthy());
    expect(within(log).queryByText("Neha Singh")).toBeNull(); // name is in the heading, not the table
  });

  it("Close hides the log and returns focus to that employee's View log button", async () => {
    stubFetch();
    renderAt("/artists/releases#downloads");
    const table = await screen.findByTestId("summary-table");
    fireEvent.click(logButton(table, "DM1"));
    await screen.findByTestId("log-table");

    fireEvent.click(screen.getByRole("button", { name: "Close download log" }));
    expect(screen.queryByTestId("log-table")).toBeNull();
    const button = logButton(table, "DM1");
    expect(document.activeElement).toBe(button);
    expect(button.textContent).toBe("View log");
    expect(button.getAttribute("aria-expanded")).toBe("false");
  });

  it("the same View log button toggles the log closed", async () => {
    stubFetch();
    renderAt("/artists/releases#downloads");
    const table = await screen.findByTestId("summary-table");
    fireEvent.click(logButton(table, "DM1"));
    await screen.findByTestId("log-table");
    fireEvent.click(logButton(table, "DM1"));
    expect(screen.queryByTestId("log-table")).toBeNull();
    expect(logButton(table, "DM1").textContent).toBe("View log");
  });

  it("switching employees resets to page 1 and aborts the old request", async () => {
    let hungSignal: AbortSignal | undefined;
    const calls = stubFetch((url, init) => {
      if (url.pathname === "/admin/downloads" && url.searchParams.get("emp_code") === "DM3") {
        hungSignal = init?.signal ?? undefined;
        return new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
        });
      }
      return undefined;
    });
    renderAt("/artists/releases#downloads");
    const table = await screen.findByTestId("summary-table");

    // DM1 has 2 pages: go to page 2.
    fireEvent.click(logButton(table, "DM1"));
    const status = await screen.findByTestId("log-page-status");
    await waitFor(() => expect(status.textContent).toBe("Page 1 · Showing 1–20"));
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    await waitFor(() => expect(screen.getByTestId("log-page-status").textContent).toBe("Page 2 · Showing 21–25"));

    // Switch to DM3 (request hangs), then to DM4 before it answers.
    fireEvent.click(logButton(table, "DM3"));
    expect(await screen.findByRole("heading", { name: "Download log — DM3 · Bob Left" })).toBeTruthy();
    await waitFor(() => expect(hungSignal).toBeDefined());
    expect(screen.getByTestId("log-page-status").textContent).toBe("Page 1");
    fireEvent.click(logButton(table, "DM4"));
    expect(hungSignal?.aborted).toBe(true);

    expect(await screen.findByRole("heading", { name: "Download log — DM4 · Neha Singh" })).toBeTruthy();
    await waitFor(() => expect(screen.getByTestId("log-page-status").textContent).toBe("Page 1 · Showing 1–1"));
    expect(logButton(table, "DM3").textContent).toBe("View log");
    expect(empCodeParams(calls).slice(-1)).toEqual(["DM4"]);
  });

  it("paginates the open log with a cursor stack and page cache", async () => {
    const calls = stubFetch();
    renderAt("/artists/releases#downloads");
    const table = await screen.findByTestId("summary-table");
    fireEvent.click(logButton(table, "DM1"));
    const status = await screen.findByTestId("log-page-status");
    await waitFor(() => expect(status.textContent).toBe("Page 1 · Showing 1–20"));
    expect(status.getAttribute("aria-live")).toBe("polite");

    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    await waitFor(() => expect(status.textContent).toBe("Page 2 · Showing 21–25"));
    const p2 = calls.find((c) => c.url.includes("cursor=p2"));
    expect(new URL(p2!.url).searchParams.get("emp_code")).toBe("DM1");
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

  it("shows the empty state for an employee with no log rows", async () => {
    stubFetch((url) =>
      url.pathname === "/admin/downloads" && url.searchParams.get("emp_code") === "DM4" ? ok({ items: [], next_cursor: null }) : undefined
    );
    renderAt("/artists/releases#downloads");
    const table = await screen.findByTestId("summary-table");
    fireEvent.click(logButton(table, "DM4"));
    expect(await screen.findByText("No downloads recorded for this employee.")).toBeTruthy();
  });

  it("shows a generic error with Retry inside the open log", async () => {
    let fail = true;
    stubFetch((url) =>
      url.pathname === "/admin/downloads" && url.searchParams.get("emp_code") === "DM4" && fail
        ? new Response(JSON.stringify({ success: false, error: { code: "X", message: "db stack trace" } }), { status: 500 })
        : undefined
    );
    renderAt("/artists/releases#downloads");
    const table = await screen.findByTestId("summary-table");
    fireEvent.click(logButton(table, "DM4"));
    expect(await screen.findByText("The downloads service returned an error.")).toBeTruthy();
    expect(document.body.textContent).not.toContain("stack trace");
    fail = false;
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    const log = await screen.findByTestId("log-table");
    await waitFor(() => expect(within(log).getByText("1.3.90")).toBeTruthy());
  });

  it("renders a <script> employee name as plain text (table and log heading)", async () => {
    stubFetch();
    renderAt("/artists/releases#downloads");
    expect(await screen.findByText(XSS)).toBeTruthy();
    fireEvent.click(logButton(screen.getByTestId("summary-table"), "DM5"));
    expect(await screen.findByRole("heading", { name: `Download log — DM5 · ${XSS}` })).toBeTruthy();
    expect(document.querySelectorAll("script")).toHaveLength(0);
    expect(document.body.innerHTML).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    // The selected employee is never put in the URL or storage.
    expect(screen.getByTestId("location").textContent).toBe("/artists/releases#downloads");
    expect(JSON.stringify({ ...localStorage })).not.toContain("DM5");
    expect(JSON.stringify({ ...sessionStorage })).not.toContain("DM5");
  });

  it("leaving the section clears the selected employee", async () => {
    stubFetch();
    renderAt("/artists/releases#downloads");
    const table = await screen.findByTestId("summary-table");
    fireEvent.click(logButton(table, "DM1"));
    await screen.findByTestId("log-table");
    fireEvent.click(screen.getByRole("tab", { name: "Live now" }));
    fireEvent.click(screen.getByRole("tab", { name: /employee downloads/i }));
    await screen.findByTestId("summary-table");
    expect(screen.queryByTestId("log-table")).toBeNull();
  });

  it("sends the admin token only in the Authorization header", async () => {
    const calls = stubFetch();
    renderAt("/artists/releases#downloads");
    const table = await screen.findByTestId("summary-table");
    fireEvent.click(within(table).getAllByRole("button", { name: "View log" })[0]);
    await waitFor(() => expect(screen.getByTestId("log-page-status").textContent).toContain("Showing"));
    await waitFor(() => expect(within(screen.getByTestId("stat-last7")).getByText("3")).toBeTruthy());
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

  it("shows the empty state when nobody has downloaded (0-download employees are not listed)", async () => {
    stubFetch((url) =>
      url.pathname === "/admin/downloads/summary"
        ? ok({ items: summaryItems.filter((i) => i.downloads === 0) })
        : url.pathname === "/admin/downloads"
          ? ok({ items: [], next_cursor: null })
          : undefined
    );
    renderAt("/artists/releases#downloads");
    await waitFor(() => expect(screen.getAllByText("No downloads recorded yet.")).toHaveLength(1));
    expect(screen.queryByTestId("log-table")).toBeNull();
    expect(screen.queryByTestId("summary-table")).toBeNull();
    expect(screen.queryByText("Zero Active")).toBeNull();
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

    const readBlob = (blob: Blob) =>
      new Promise<Uint8Array>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
        reader.readAsArrayBuffer(blob);
      });
    const decode = (b: Uint8Array) => new TextDecoder("utf-8", { ignoreBOM: true }).decode(b);

    // Summary CSV: only employees with downloads > 0, in table order.
    const summaryText = decode(await readBlob(blobs[0]));
    const summaryLines = summaryText.slice(1).trim().split("\r\n");
    expect(summaryLines.slice(1).map((l) => l.split(",")[0])).toEqual(['"DM1"', '"DM3"', '"DM5"', '"DM4"']);
    expect(summaryText).not.toMatch(/Zero Active|Zero Left|DM2|DM6/);

    const bytes = await readBlob(blobs[1]);
    expect(Array.from(bytes.slice(0, 3))).toEqual([0xef, 0xbb, 0xbf]); // UTF-8 BOM
    const text = decode(bytes);
    expect(text.charCodeAt(0)).toBe(0xfeff);
    expect(text).toContain(`"'=HYPERLINK(1)"`);
    expect(text.trim().split("\r\n")).toHaveLength(3); // header + 2 rows
  });
});
