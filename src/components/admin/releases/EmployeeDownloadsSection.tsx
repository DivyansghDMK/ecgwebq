import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, ChevronLeft, ChevronRight, FileSpreadsheet, FlaskConical, Loader2, RefreshCw, Search, X } from "lucide-react";
import { clearAuthSession } from "@/lib/auth";
import { formatDateIST, formatOptional } from "@/lib/format";
import {
  createDownloadsAdminApi,
  DownloadsApiError,
  isValidEmpCode,
  LOG_PAGE_MAX,
  type DownloadLogItem,
  type DownloadLogPage,
  type DownloadsAdminApi,
  type DownloadSummaryItem,
} from "@/services/downloads/downloadsApi";
import {
  computeSummaryStats,
  countLast7Days,
  downloadedEmployees,
  pageReachesOlderThan7Days,
} from "@/services/downloads/downloadStats";
import { downloadCsv, toCsv } from "@/services/downloads/csv";
import {
  canGoNext,
  canGoPrevious,
  currentPage,
  cursorForPage,
  isPageCached,
  uploadPaginationReducer,
  visibleRange,
  type UploadPaginationState,
} from "@/services/releases/uploadPagination";

const PAGE_SIZES = [20, 50, 100] as const;
type PageSize = (typeof PAGE_SIZES)[number];

/** Safety limits when following cursors. */
export const EXPORT_MAX_ROWS = 10_000;
const LAST7_MAX_PAGES = 50;

const sectionTitle = "text-xl font-semibold text-slate-900 dark:text-slate-50";
const sectionHint = "text-sm text-slate-600 dark:text-slate-400";
const subTitle = "text-lg font-semibold text-slate-900 dark:text-slate-50";
const panel = "rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900";
const th = "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400";
const td = "px-4 py-3 text-sm text-slate-700 dark:text-slate-300 align-top";
const inputClass =
  "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200";
const secondaryBtn =
  "inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700";

const LOG_PANEL_ID = "employee-download-log";

const GENERIC_ERROR = "Something went wrong. Please try again.";

type LogPaginationState = UploadPaginationState<DownloadLogPage>;
const initialLogPagination: LogPaginationState = { pageIndex: 0, cursors: [null], pages: {} };
const logReducer = uploadPaginationReducer<DownloadLogPage>;

type Loadable<T> = { status: "loading" } | { status: "ok"; value: T } | { status: "error"; message: string };

function safeMessage(error: unknown): string {
  return error instanceof DownloadsApiError ? error.message : GENERIC_ERROR;
}

function isAbort(error: unknown): boolean {
  return error instanceof DownloadsApiError && error.kind === "aborted";
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
}

function istDate(iso: string | null): string {
  return iso ? formatDateIST(iso) : "Never";
}

function todayStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

export function DownloadChannelBadge({ channel }: { channel: string }) {
  if (!channel) {
    return <span className="text-slate-400 dark:text-slate-500">—</span>;
  }
  const tone =
    channel === "beta"
      ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
      : channel === "stable"
        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
        : "bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-300";
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${tone}`}>
      {channel === "beta" && <FlaskConical className="h-3 w-3" aria-hidden="true" />}
      {channel}
    </span>
  );
}

function AccessBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${
        active
          ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300"
          : "bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-300"
      }`}
    >
      {active ? "Active" : "Left"}
    </span>
  );
}

function ErrorBox({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-3 p-6">
      <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-300" role="alert">
        <AlertCircle className="h-4 w-4" aria-hidden="true" />
        {message}
      </div>
      <button type="button" onClick={onRetry} className={secondaryBtn}>
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
        Retry
      </button>
    </div>
  );
}

function LoadingRow({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 p-6 text-sm text-slate-600 dark:text-slate-400" role="status">
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
      {text}
    </div>
  );
}

function StatCard({ label, value, hint, testId }: { label: string; value: string; hint?: string; testId: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900" data-testid={testId}>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-50">{value}</p>
      {hint && <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{hint}</p>}
    </div>
  );
}

interface EmployeeDownloadsSectionProps {
  /** Bumped by the page's Refresh button. */
  reloadKey?: number;
  /** For tests; defaults to the real admin client. */
  api?: DownloadsAdminApi;
  /** For tests; defaults to Date.now(). */
  now?: () => number;
}

export function EmployeeDownloadsSection({ reloadKey = 0, api: apiProp, now = Date.now }: EmployeeDownloadsSectionProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const locationRef = useRef(location);
  locationRef.current = location;
  const api = useMemo(() => apiProp ?? createDownloadsAdminApi(), [apiProp]);
  const nowRef = useRef(now);
  nowRef.current = now;

  const [summary, setSummary] = useState<Loadable<DownloadSummaryItem[]>>({ status: "loading" });
  const [last7, setLast7] = useState<Loadable<{ count: number; capped: boolean }>>({ status: "loading" });
  const [summaryReload, setSummaryReload] = useState(0);
  const [last7Reload, setLast7Reload] = useState(0);

  const [search, setSearch] = useState("");

  /** Employee whose log is open (React state only: never in the URL or storage). null = log hidden. */
  const [selected, setSelected] = useState<{ code: string; name: string } | null>(null);
  const [pageSize, setPageSize] = useState<PageSize>(20);
  const [pagination, dispatch] = useReducer(logReducer, initialLogPagination);
  const [loadingPage, setLoadingPage] = useState<number | null>(null);
  const [logError, setLogError] = useState<{ message: string; pageIndex: number } | null>(null);
  const [logReload, setLogReload] = useState(0);

  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<{ tone: "info" | "error"; text: string } | null>(null);

  const logControllerRef = useRef<AbortController | null>(null);
  const exportControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const logHeadingRef = useRef<HTMLHeadingElement>(null);
  const viewLogButtonsRef = useRef<Map<string, HTMLButtonElement>>(new Map());
  const focusLogHeadingRef = useRef(false);
  const tableHeadRef = useRef<HTMLTableSectionElement>(null);
  const scrollOnPageChangeRef = useRef(false);

  /** Returns true when the error was an auth failure and we redirected to login (same as the Releases page). */
  const redirectIfUnauthorized = useCallback(
    (error: unknown): boolean => {
      if (error instanceof DownloadsApiError && error.isAuthError) {
        clearAuthSession("admin");
        navigate("/login_admin", { replace: true, state: { from: locationRef.current } });
        return true;
      }
      return false;
    },
    [navigate]
  );

  // --- Summary --------------------------------------------------------------
  useEffect(() => {
    const controller = new AbortController();
    setSummary({ status: "loading" });
    api
      .getSummary({ signal: controller.signal })
      .then((items) => {
        if (!controller.signal.aborted) setSummary({ status: "ok", value: items });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || isAbort(error)) return;
        if (!redirectIfUnauthorized(error)) setSummary({ status: "error", message: safeMessage(error) });
      });
    return () => controller.abort();
  }, [api, redirectIfUnauthorized, reloadKey, summaryReload]);

  // --- Last 7 days (follow cursors until rows are older than 7 days) ---------
  useEffect(() => {
    const controller = new AbortController();
    setLast7({ status: "loading" });
    (async () => {
      const current = nowRef.current();
      let cursor: string | null = null;
      let count = 0;
      for (let pageNo = 0; pageNo < LAST7_MAX_PAGES; pageNo += 1) {
        const page: DownloadLogPage = await api.getLog({ limit: LOG_PAGE_MAX, cursor, signal: controller.signal });
        count += countLast7Days(page.items, current);
        if (!page.next_cursor || page.next_cursor === cursor || pageReachesOlderThan7Days(page.items, current)) {
          return { count, capped: false };
        }
        cursor = page.next_cursor;
      }
      return { count, capped: true };
    })()
      .then((value) => {
        if (!controller.signal.aborted) setLast7({ status: "ok", value });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || isAbort(error)) return;
        if (!redirectIfUnauthorized(error)) setLast7({ status: "error", message: safeMessage(error) });
      });
    return () => controller.abort();
  }, [api, redirectIfUnauthorized, reloadKey, last7Reload]);

  // --- Download log (cursor pagination like Upload history) -----------------
  const selectedCode = selected?.code ?? null;

  const abortLog = useCallback(() => {
    requestIdRef.current += 1;
    logControllerRef.current?.abort();
    logControllerRef.current = null;
  }, []);

  const fetchLogPage = useCallback(
    async (index: number, cursor: string | null) => {
      if (!selectedCode) return;
      logControllerRef.current?.abort();
      const controller = new AbortController();
      logControllerRef.current = controller;
      const requestId = ++requestIdRef.current;
      setLoadingPage(index);
      setLogError(null);
      try {
        const page = await api.getLog({
          limit: pageSize,
          cursor,
          empCode: selectedCode,
          signal: controller.signal,
        });
        if (requestId !== requestIdRef.current) return;
        dispatch({ type: "pageLoaded", index, page });
        dispatch({ type: "goTo", index });
      } catch (error) {
        if (requestId !== requestIdRef.current || isAbort(error)) return;
        scrollOnPageChangeRef.current = false;
        if (!redirectIfUnauthorized(error)) setLogError({ message: safeMessage(error), pageIndex: index });
      } finally {
        if (requestId === requestIdRef.current) setLoadingPage(null);
      }
    },
    [api, pageSize, selectedCode, redirectIfUnauthorized]
  );

  // Employee switched, page size changed or Refresh: abort the old request, back to page 1.
  useEffect(() => {
    abortLog();
    dispatch({ type: "reset" });
    setLogError(null);
    setLoadingPage(null);
    if (selectedCode) {
      void fetchLogPage(0, null);
    }
  }, [fetchLogPage, selectedCode, abortLog, reloadKey, logReload]);

  // Move keyboard focus to the log heading after "View log".
  useEffect(() => {
    if (selectedCode && focusLogHeadingRef.current) {
      focusLogHeadingRef.current = false;
      logHeadingRef.current?.focus();
    }
  }, [selectedCode]);

  // Abort everything when the section is left.
  useEffect(
    () => () => {
      requestIdRef.current += 1;
      logControllerRef.current?.abort();
      exportControllerRef.current?.abort();
    },
    []
  );

  useEffect(() => {
    if (scrollOnPageChangeRef.current) {
      scrollOnPageChangeRef.current = false;
      tableHeadRef.current?.scrollIntoView?.({ block: "nearest", behavior: prefersReducedMotion() ? "auto" : "smooth" });
    }
  }, [pagination.pageIndex]);

  /** "View log" toggles: opens this employee's log, switches from another one, or closes it. */
  const toggleLog = (code: string, name: string) => {
    if (selectedCode === code) {
      setSelected(null); // focus stays on this (now "View log") button
      return;
    }
    focusLogHeadingRef.current = true;
    setSelected({ code, name });
  };

  const closeLog = () => {
    const code = selectedCode;
    setSelected(null);
    if (code) viewLogButtonsRef.current.get(code)?.focus();
  };

  const isLoadingLog = loadingPage !== null;
  const page = currentPage(pagination);
  const rows: DownloadLogItem[] = page?.items ?? [];
  const range = visibleRange(pagination);

  const goToPage = (index: number) => {
    if (isLoadingLog || index < 0) return;
    scrollOnPageChangeRef.current = true;
    if (isPageCached(pagination, index)) {
      setLogError(null);
      dispatch({ type: "goTo", index });
      return;
    }
    const cursor = cursorForPage(pagination, index);
    if (cursor === undefined) {
      scrollOnPageChangeRef.current = false;
      return;
    }
    void fetchLogPage(index, cursor);
  };

  const retryLog = () => {
    if (!logError) return;
    if (!page) {
      setLogReload((k) => k + 1);
      return;
    }
    void fetchLogPage(logError.pageIndex, cursorForPage(pagination, logError.pageIndex) ?? null);
  };

  // --- Derived ---------------------------------------------------------------
  const summaryItems = useMemo(() => (summary.status === "ok" ? summary.value : []), [summary]);
  const stats = useMemo(() => computeSummaryStats(summaryItems), [summaryItems]);
  const downloaded = useMemo(() => downloadedEmployees(summaryItems), [summaryItems]);
  const visibleSummary = useMemo(() => downloadedEmployees(downloaded, search), [downloaded, search]);

  const statValue = (value: number) => (summary.status === "ok" ? String(value) : summary.status === "loading" ? "…" : "—");
  const last7Value =
    last7.status === "ok" ? `${last7.value.count}${last7.value.capped ? "+" : ""}` : last7.status === "loading" ? "…" : "—";

  // --- Export ----------------------------------------------------------------
  const exportCsv = async () => {
    if (exporting) return;
    exportControllerRef.current?.abort();
    const controller = new AbortController();
    exportControllerRef.current = controller;
    setExporting(true);
    setExportMessage(null);
    try {
      const summaryRows = await api.getSummary({ signal: controller.signal });
      const logRows: DownloadLogItem[] = [];
      let cursor: string | null = null;
      let truncated = false;
      for (;;) {
        const pageData: DownloadLogPage = await api.getLog({ limit: LOG_PAGE_MAX, cursor, signal: controller.signal });
        logRows.push(...pageData.items);
        if (logRows.length >= EXPORT_MAX_ROWS) {
          truncated = logRows.length > EXPORT_MAX_ROWS || Boolean(pageData.next_cursor);
          logRows.length = Math.min(logRows.length, EXPORT_MAX_ROWS);
          break;
        }
        if (!pageData.next_cursor || pageData.next_cursor === cursor) break;
        cursor = pageData.next_cursor;
      }
      if (controller.signal.aborted) return;

      const stamp = todayStamp();
      downloadCsv(
        `employee-downloads-summary-${stamp}.csv`,
        toCsv(
          ["E-Code", "Name", "Access", "Downloads", "Last downloaded (IST)", "Last version"],
          downloadedEmployees(summaryRows).map((r) => [
            r.emp_code,
            r.employee_name,
            r.is_active ? "Active" : "Left",
            r.downloads,
            r.last_downloaded_at ? formatDateIST(r.last_downloaded_at) : "",
            r.last_version ?? "",
          ])
        )
      );
      downloadCsv(
        `employee-downloads-log-${stamp}.csv`,
        toCsv(
          ["Time (IST)", "Time (UTC)", "E-Code", "Name", "Version", "Channel", "Device", "IP address"],
          logRows.map((r) => [formatDateIST(r.downloaded_at), r.downloaded_at, r.emp_code, r.employee_name, r.version, r.channel, r.device, r.ip])
        )
      );
      setExportMessage(
        truncated
          ? { tone: "info", text: `Exported. The log file contains the newest ${EXPORT_MAX_ROWS.toLocaleString("en-IN")} rows only.` }
          : { tone: "info", text: "Exported 2 CSV files (summary and log)." }
      );
    } catch (error) {
      if (controller.signal.aborted || isAbort(error)) return;
      if (!redirectIfUnauthorized(error)) setExportMessage({ tone: "error", text: `Export failed. ${safeMessage(error)}` });
    } finally {
      if (exportControllerRef.current === controller) {
        exportControllerRef.current = null;
        setExporting(false);
      }
    }
  };

  return (
    <section className="space-y-6" aria-labelledby="employee-downloads-title">
      {/* a) Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="employee-downloads-title" className={sectionTitle}>
            Employee downloads
          </h2>
          <p className={sectionHint}>Who downloaded the installer from the /version page, when, and which build.</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <button type="button" onClick={() => void exportCsv()} disabled={exporting} className={secondaryBtn}>
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />}
            {exporting ? "Exporting…" : "Export to Excel"}
          </button>
          <span
            className={`text-xs ${exportMessage?.tone === "error" ? "text-red-600 dark:text-red-300" : "text-slate-500 dark:text-slate-400"}`}
            aria-live="polite"
          >
            {exportMessage?.text ?? ""}
          </span>
        </div>
      </div>

      {/* b) Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard testId="stat-total" label="Total downloads" value={statValue(stats.totalDownloads)} />
        <StatCard testId="stat-employees" label="Employees who downloaded" value={statValue(stats.employeesDownloaded)} />
        <StatCard testId="stat-last7" label="Last 7 days" value={last7Value} hint={last7.status === "error" ? last7.message : undefined} />
      </div>
      {last7.status === "error" && (
        <button type="button" onClick={() => setLast7Reload((k) => k + 1)} className={secondaryBtn}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Retry last 7 days
        </button>
      )}

      {/* c) By employee */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h3 className={subTitle}>By employee</h3>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Search className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Search employees</span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search code or name"
                className={inputClass}
                maxLength={100}
              />
            </label>
          </div>
        </div>
        <div className={panel}>
          {summary.status === "loading" ? (
            <LoadingRow text="Loading employees…" />
          ) : summary.status === "error" ? (
            <ErrorBox message={summary.message} onRetry={() => setSummaryReload((k) => k + 1)} />
          ) : downloaded.length === 0 ? (
            <p className="p-6 text-sm text-slate-600 dark:text-slate-400">No downloads recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800" data-testid="summary-table">
                <thead>
                  <tr>
                    <th className={th}>E-Code</th>
                    <th className={th}>Name</th>
                    <th className={th}>Access</th>
                    <th className={th}>Downloads</th>
                    <th className={th}>Last downloaded (IST)</th>
                    <th className={th}>Last version</th>
                    <th className={th}>
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {visibleSummary.length === 0 && (
                    <tr>
                      <td className={td} colSpan={7}>
                        No employees match this search.
                      </td>
                    </tr>
                  )}
                  {visibleSummary.map((r) => (
                    <tr key={r.emp_code}>
                      <td className={`${td} font-mono font-semibold text-slate-900 dark:text-slate-100`}>{formatOptional(r.emp_code)}</td>
                      <td className={td}>{formatOptional(r.employee_name)}</td>
                      <td className={td}>
                        <AccessBadge active={r.is_active} />
                      </td>
                      <td className={td}>{r.downloads}</td>
                      <td className={`${td} whitespace-nowrap`}>{istDate(r.last_downloaded_at)}</td>
                      <td className={td}>{formatOptional(r.last_version)}</td>
                      <td className={td}>
                        {isValidEmpCode(r.emp_code) ? (
                          <button
                            type="button"
                            ref={(el) => {
                              if (el) viewLogButtonsRef.current.set(r.emp_code, el);
                              else viewLogButtonsRef.current.delete(r.emp_code);
                            }}
                            onClick={() => toggleLog(r.emp_code, r.employee_name)}
                            aria-expanded={selectedCode === r.emp_code}
                            aria-controls={LOG_PANEL_ID}
                            className="whitespace-nowrap text-sm font-medium text-orange-600 hover:text-orange-700 hover:underline dark:text-orange-400 dark:hover:text-orange-300"
                          >
                            {selectedCode === r.emp_code ? "Hide log" : "View log"}
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* d) Download log: only for the employee picked with "View log" */}
      {selected && (
        <section id={LOG_PANEL_ID} className="scroll-mt-4 space-y-3" aria-labelledby="download-log-title">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 id="download-log-title" ref={logHeadingRef} tabIndex={-1} className={`${subTitle} focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50 rounded`}>
              Download log — {selected.code} · {formatOptional(selected.name)}
            </h3>
            <button type="button" onClick={closeLog} aria-label="Close download log" className={secondaryBtn}>
              <X className="h-4 w-4" aria-hidden="true" />
              Close
            </button>
          </div>

          <div className={panel}>
            {logError && !page ? (
              <ErrorBox message={logError.message} onRetry={retryLog} />
            ) : (
              <>
                <div className="relative overflow-x-auto" aria-busy={isLoadingLog}>
                  <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800" data-testid="log-table">
                    <thead ref={tableHeadRef} className="scroll-mt-4">
                      <tr>
                        <th className={th}>Time (IST)</th>
                        <th className={th}>Version</th>
                        <th className={th}>Channel</th>
                        <th className={th}>Device</th>
                        <th className={th}>IP address</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y divide-slate-100 transition-opacity dark:divide-slate-800 ${isLoadingLog ? "opacity-40" : ""}`}>
                      {rows.length === 0 && (
                        <tr>
                          <td className={`${td} h-32`} colSpan={5}>
                            {isLoadingLog ? "" : "No downloads recorded for this employee."}
                          </td>
                        </tr>
                      )}
                      {rows.map((r, i) => (
                        <tr key={r.id || `${r.downloaded_at}-${i}`}>
                          <td className={`${td} whitespace-nowrap`}>{formatDateIST(r.downloaded_at)}</td>
                          <td className={`${td} font-semibold text-slate-900 dark:text-slate-100`}>{formatOptional(r.version)}</td>
                          <td className={td}>
                            <DownloadChannelBadge channel={r.channel} />
                          </td>
                          <td className={`${td} max-w-xs break-words`}>{formatOptional(r.device)}</td>
                          <td className={`${td} font-mono text-xs`}>{formatOptional(r.ip)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {isLoadingLog && (
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 top-12 flex items-start justify-center pt-8" role="status">
                      <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm text-slate-700 shadow dark:bg-slate-800 dark:text-slate-200">
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        Loading page {(loadingPage ?? 0) + 1}…
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
                  <span aria-live="polite" aria-atomic="true" data-testid="log-page-status">
                    Page {pagination.pageIndex + 1}
                    {range ? ` · Showing ${range.from}–${range.to}` : ""}
                  </span>

                  {logError && (
                    <span className="flex items-center gap-2 text-red-600 dark:text-red-300" role="alert">
                      {logError.message}
                      <button type="button" onClick={retryLog} className="font-semibold underline" aria-label="Retry loading this page">
                        Retry
                      </button>
                    </span>
                  )}

                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2">
                      Rows per page
                      <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value) as PageSize)} className={inputClass}>
                        {PAGE_SIZES.map((size) => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="button"
                      onClick={() => goToPage(pagination.pageIndex - 1)}
                      disabled={!canGoPrevious(pagination) || isLoadingLog}
                      aria-label="Previous page"
                      className={secondaryBtn}
                    >
                      <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={() => goToPage(pagination.pageIndex + 1)}
                      disabled={!canGoNext(pagination) || isLoadingLog}
                      aria-label="Next page"
                      className={secondaryBtn}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      )}
    </section>
  );
}
