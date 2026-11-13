// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import VersionDownloadPage from "../VersionDownloadPage";
import { MSG_NETWORK, MSG_NOT_RECOGNISED, MSG_RATE_LIMITED } from "@/hooks/useVersionVerification";

const XSS_NAME = "<script>alert(1)</script>";
const LOG_BASE = "https://n36lqnqjjj.execute-api.us-east-1.amazonaws.com";
const VERIFY_URL = `${LOG_BASE}/version/verify`;

type Reply = { status: number; body?: unknown } | "network";

/** Fake responses (not real Response objects) so they resolve on microtasks only. */
function stubVerify(replies: Reply[] | ((code: string) => Reply)) {
  const queue = Array.isArray(replies) ? [...replies] : null;
  const fn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url !== VERIFY_URL) {
      return { ok: false, status: 404, json: async () => ({}) } as unknown as Response;
    }
    const code = JSON.parse(String(init?.body)).emp_code as string;
    const reply = queue ? (queue.shift() ?? { status: 404 }) : (replies as (c: string) => Reply)(code);
    if (reply === "network") throw new TypeError("Failed to fetch");
    return { ok: reply.status >= 200 && reply.status < 300, status: reply.status, json: async () => reply.body ?? {} } as unknown as Response;
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

const verifyCalls = (fn: ReturnType<typeof vi.fn>) => fn.mock.calls.filter(([u]) => String(u) === VERIFY_URL).length;

const success = (name = "Asha Rao"): Reply => ({ status: 200, body: { success: true, employee_name: name, data: { employee_name: name } } });
const notRecognised: Reply = { status: 403, body: { success: false, error: { code: "NOT_RECOGNISED" } } };

function renderPage() {
  render(
    <MemoryRouter initialEntries={["/version"]}>
      <VersionDownloadPage />
    </MemoryRouter>
  );
}

const codeInput = () => screen.getByPlaceholderText("Enter your employee code") as HTMLInputElement;
const nameInput = () => document.getElementById("version-employee-name") as HTMLInputElement;
const verifyButton = () => screen.getByRole("button", { name: /verify code|verifying/i }) as HTMLButtonElement;

async function attempt(code: string, fn: ReturnType<typeof vi.fn>, expectedCalls: number) {
  fireEvent.change(codeInput(), { target: { value: code } });
  fireEvent.click(verifyButton());
  await waitFor(() => expect(verifyCalls(fn)).toBe(expectedCalls));
  await waitFor(() => expect(verifyButton().textContent).toContain("Verify Code"));
}

describe("/version employee-code check (hardened)", () => {
  let storageWrites: unknown[][];

  beforeEach(() => {
    vi.stubEnv("VITE_RELEASES_CDN_BASE", "https://dgz43izxcyy2a.cloudfront.net");
    vi.stubEnv("VITE_DOWNLOAD_LOG_API_BASE", LOG_BASE);
    storageWrites = [];
    vi.spyOn(localStorage, "setItem").mockImplementation((...args) => void storageWrites.push(args));
    vi.spyOn(sessionStorage, "setItem").mockImplementation((...args) => void storageWrites.push(args));
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it("shows the name only in the Employee Name field after success; changing the code clears it", async () => {
    stubVerify([success()]);
    renderPage();
    expect(nameInput().value).toBe("");

    fireEvent.change(codeInput(), { target: { value: "DM485" } });
    fireEvent.click(verifyButton());
    await waitFor(() => expect(nameInput().value).toBe("Asha Rao"));

    // Request: the rate-limited endpoint, body { emp_code }, no Authorization header.
    const fetchMock = vi.mocked(fetch);
    const call = fetchMock.mock.calls.find(([u]) => String(u) === VERIFY_URL);
    expect(call).toBeDefined();
    const init = call![1] as RequestInit;
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({ emp_code: "DM485" });
    expect(new Headers(init.headers).has("Authorization")).toBe(false);
    expect(fetchMock.mock.calls.some(([u]) => String(u).includes("validate-company-code"))).toBe(false);

    // Not in any attribute (other than the input's own value), title or aria text, nor the URL.
    for (const el of Array.from(document.body.querySelectorAll("*"))) {
      for (const attr of Array.from(el.attributes)) {
        if (el === nameInput() && attr.name === "value") continue;
        expect(attr.value).not.toContain("Asha Rao");
      }
    }
    expect(window.location.href).not.toContain("Asha");

    fireEvent.change(codeInput(), { target: { value: "DM48" } });
    expect(nameInput().value).toBe("");
    expect(document.body.textContent).not.toContain("Asha Rao");
  });

  it("never writes the name or code to localStorage/sessionStorage", async () => {
    stubVerify([success()]);
    renderPage();
    fireEvent.change(codeInput(), { target: { value: "DM485" } });
    fireEvent.click(verifyButton());
    await waitFor(() => expect(nameInput().value).toBe("Asha Rao"));
    expect(JSON.stringify(storageWrites)).not.toMatch(/Asha|DM485/);
  });

  it("renders a name containing <script> as plain text", async () => {
    stubVerify([success(XSS_NAME)]);
    renderPage();
    fireEvent.change(codeInput(), { target: { value: "DM485" } });
    fireEvent.click(verifyButton());
    await waitFor(() => expect(nameInput().value).toBe(XSS_NAME));
    expect(document.querySelectorAll("script")).toHaveLength(0);
    // Only present as the input's value (inert text); nowhere as markup or text nodes.
    const clone = document.body.cloneNode(true) as HTMLElement;
    clone.querySelector("#version-employee-name")?.removeAttribute("value");
    expect(clone.innerHTML).not.toContain("alert(1)");
  });

  it("every failed verification shows the same generic message", async () => {
    const fn = stubVerify([
      { status: 403, body: { success: false, error: { code: "NOT_RECOGNISED", message: "Employee inactive" } } },
      { status: 400, body: { success: false, error: { code: "BAD_REQUEST", message: "Wrong prefix" } } },
      { status: 200, body: { success: true, employee_name: "", message: "User does not exist" } },
    ]);
    renderPage();
    for (let i = 1; i <= 3; i += 1) {
      await attempt(`DM48${i}`, fn, i);
      expect(screen.getByText(MSG_NOT_RECOGNISED)).toBeTruthy();
      expect(document.body.textContent).not.toMatch(/does not exist|inactive|Wrong prefix/i);
    }
  });

  it("network errors show the retry message", async () => {
    const fn = stubVerify(["network", { status: 503 }]);
    renderPage();
    await attempt("DM485", fn, 1);
    expect(screen.getByText(MSG_NETWORK)).toBeTruthy();
    await attempt("DM486", fn, 2);
    expect(screen.getByText(MSG_NETWORK)).toBeTruthy();
  });

  it("HTTP 429 shows the wait message and disables Verify for 60 s", async () => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "Date"] });
    const fn = stubVerify([{ status: 429, body: { success: false, error: { code: "TOO_MANY_ATTEMPTS" } } }, success()]);
    renderPage();
    fireEvent.change(codeInput(), { target: { value: "DM485" } });
    fireEvent.click(verifyButton());

    expect(await screen.findByText(MSG_RATE_LIMITED)).toBeTruthy();
    expect(verifyButton().disabled).toBe(true);
    fireEvent.click(verifyButton());
    expect(verifyCalls(fn)).toBe(1);

    await act(async () => {
      vi.advanceTimersByTime(59_000);
    });
    expect(verifyButton().disabled).toBe(true);
    await act(async () => {
      vi.advanceTimersByTime(1_000);
    });
    expect(verifyButton().disabled).toBe(false);
  });

  it("4 failures disable Verify for 60 s with a live countdown", async () => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "Date"] });
    const fn = stubVerify(() => notRecognised);
    renderPage();
    for (let i = 1; i <= 3; i += 1) await attempt(`DM10${i}`, fn, i);
    expect(verifyButton().disabled).toBe(false);

    fireEvent.change(codeInput(), { target: { value: "DM104" } });
    fireEvent.click(verifyButton());
    expect(await screen.findByText("Too many wrong attempts. Please wait 60 seconds.")).toBeTruthy();
    expect(verifyButton().disabled).toBe(true);

    await act(async () => {
      vi.advanceTimersByTime(1_000);
    });
    expect(screen.getByText("Too many wrong attempts. Please wait 59 seconds.")).toBeTruthy();

    // Changing the code during the lock does not re-enable Verify.
    fireEvent.change(codeInput(), { target: { value: "DM105" } });
    expect(verifyButton().disabled).toBe(true);
    fireEvent.click(verifyButton());
    expect(verifyCalls(fn)).toBe(4);

    await act(async () => {
      vi.advanceTimersByTime(59_000);
    });
    expect(verifyButton().disabled).toBe(false);
    expect(screen.queryByText(/Too many wrong attempts/)).toBeNull();
  });

  it("a successful verification resets the failure count", async () => {
    let n = 0;
    const fn = stubVerify(() => (++n === 4 ? success() : notRecognised));
    renderPage();
    for (let i = 1; i <= 3; i += 1) await attempt(`DM20${i}`, fn, i);
    fireEvent.change(codeInput(), { target: { value: "DM204" } });
    fireEvent.click(verifyButton());
    await waitFor(() => expect(nameInput().value).toBe("Asha Rao"));

    // Three more failures: not locked (count was reset).
    for (let i = 5; i <= 7; i += 1) await attempt(`DM20${i}`, fn, i);
    expect(verifyButton().disabled).toBe(false);
    expect(screen.queryByText(/Too many wrong attempts/)).toBeNull();
  });
});
