import { Fragment, useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, ChevronDown, ChevronLeft, ChevronRight, FlaskConical, Loader2, RefreshCw } from "lucide-react";
import { ReleaseChannelCard } from "@/components/releases/ReleaseChannelCard";
import { useLatestRelease } from "@/hooks/useLatestRelease";
import { clearAuthSession } from "@/lib/auth";
import { formatDateIST, formatOptional, formatSizeMB } from "@/lib/format";
import { getReleaseApi, isMockReleaseApi, ReleaseApiError } from "@/services/releases/releaseApi";
import {
  canGoNext,
  canGoPrevious,
  currentPage,
  cursorForPage,
  initialUploadPagination,
  isPageCached,
  uploadPaginationReducer,
  visibleRange,
} from "@/services/releases/uploadPagination";
import type { ReleaseHistoryItem, UploadHistoryItem } from "@/services/releases/types";

type ResultFilter = "all" | "ACCEPTED" | "REJECTED";
type ChannelFilter = "all" | "stable" | "beta";

const PAGE_SIZES = [20, 50, 100] as const;
type PageSize = (typeof PAGE_SIZES)[number];

const sectionTitle = "text-xl font-semibold text-slate-900 dark:text-slate-50";
const sectionHint = "text-sm text-slate-600 dark:text-slate-400";
const panel = "rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900";
const th = "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400";
const td = "px-4 py-3 text-sm text-slate-700 dark:text-slate-300 align-top";
const selectClass =
  "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200";
const secondaryBtn =
  "inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700";

const uploadKey = (u: UploadHistoryItem) => `${u.at}|${u.source_key}|${u.version}|${u.result}`;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

function ChannelBadge({ channel }: { channel: string | null }) {
  if (!channel) {
    return <span className="text-slate-400 dark:text-slate-500">—</span>;
  }
  const beta = channel === "beta";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${
        beta
          ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
      }`}
    >
      {beta && <FlaskConical className="h-3 w-3" aria-hidden="true" />}
      {channel}
    </span>
  );
}

function ResultBadge({ result }: { result: string }) {
  const accepted = result === "ACCEPTED";
  return (
    <span
      className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${
        accepted
          ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300"
          : "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300"
      }`}
    >
      {result || "—"}
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

export default function ReleasesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationRef = useRef(location);
  locationRef.current = location;
  const api = useMemo(() => getReleaseApi(), []);
  // PROD inlined so production builds drop the banner as well.
  const usingMock = !import.meta.env.PROD && isMockReleaseApi();

  const stable = useLatestRelease("stable");
  const beta = useLatestRelease("beta");

  const [releases, setReleases] = useState<ReleaseHistoryItem[]>([]);
  const [releasesLoading, setReleasesLoading] = useState(true);
  const [releasesError, setReleasesError] = useState<string | null>(null);

  const [pageSize, setPageSize] = useState<PageSize>(20);
  const [resultFilter, setResultFilter] = useState<ResultFilter>("all");
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("all");
  const [pagination, dispatch] = useReducer(uploadPaginationReducer, initialUploadPagination);
  const [loadingPage, setLoadingPage] = useState<number | null>(0);
  const [uploadsError, setUploadsError] = useState<{ message: string; pageIndex: number } | null>(null);
  const [lockedHeight, setLockedHeight] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [reloadKey, setReloadKey] = useState(0);

  const requestIdRef = useRef(0);
  const tableWrapRef = useRef<HTMLDivElement>(null);
  const tableHeadRef = useRef<HTMLTableSectionElement>(null);
  const scrollOnPageChangeRef = useRef(false);

  /** Returns true when the error was an auth failure and we redirected to login. */
  const redirectIfUnauthorized = useCallback(
    (error: unknown): boolean => {
      if (error instanceof ReleaseApiError && error.isAuthError) {
        clearAuthSession("admin");
        navigate("/login_admin", { replace: true, state: { from: locationRef.current } });
        return true;
      }
      return false;
    },
    [navigate]
  );

  const loadReleases = useCallback(async () => {
    setReleasesLoading(true);
    setReleasesError(null);
    try {
      const items = await api.getReleases();
      setReleases([...items].sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at)));
    } catch (error) {
      if (!redirectIfUnauthorized(error)) {
        setReleasesError(errorMessage(error));
      }
    } finally {
      setReleasesLoading(false);
    }
  }, [api, redirectIfUnauthorized]);

  useEffect(() => {
    void loadReleases();
  }, [loadReleases]);

  /** Fetches one upload page with the current page size and filters; stale responses are ignored. */
  const fetchUploadsPage = useCallback(
    async (index: number, cursor: string | null) => {
      const requestId = ++requestIdRef.current;
      setLockedHeight(tableWrapRef.current?.offsetHeight ?? null);
      setLoadingPage(index);
      setUploadsError(null);
      try {
        const page = await api.getUploads({
          limit: pageSize,
          cursor,
          result: resultFilter === "all" ? undefined : resultFilter,
          channel: channelFilter === "all" ? undefined : channelFilter,
        });
        if (requestId !== requestIdRef.current) {
          return;
        }
        dispatch({ type: "pageLoaded", index, page });
        dispatch({ type: "goTo", index });
        setExpanded(new Set());
      } catch (error) {
        if (requestId !== requestIdRef.current) {
          return;
        }
        scrollOnPageChangeRef.current = false;
        if (!redirectIfUnauthorized(error)) {
          setUploadsError({ message: errorMessage(error), pageIndex: index });
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setLoadingPage(null);
          setLockedHeight(null);
        }
      }
    },
    [api, pageSize, resultFilter, channelFilter, redirectIfUnauthorized]
  );

  // Page size, filters or Refresh: back to page 1 with an empty cache.
  useEffect(() => {
    dispatch({ type: "reset" });
    setExpanded(new Set());
    void fetchUploadsPage(0, null);
  }, [fetchUploadsPage, reloadKey]);

  // Bring the table header into view after the user changes page.
  useEffect(() => {
    if (scrollOnPageChangeRef.current) {
      scrollOnPageChangeRef.current = false;
      tableHeadRef.current?.scrollIntoView({ block: "nearest", behavior: prefersReducedMotion() ? "auto" : "smooth" });
    }
  }, [pagination.pageIndex]);

  const isLoadingUploads = loadingPage !== null;
  const page = currentPage(pagination);
  const rows = page?.items ?? [];
  const range = visibleRange(pagination);
  const filtersActive = resultFilter !== "all" || channelFilter !== "all";

  const goToPage = (index: number) => {
    if (isLoadingUploads || index < 0) {
      return;
    }
    scrollOnPageChangeRef.current = true;
    if (isPageCached(pagination, index)) {
      setUploadsError(null);
      setExpanded(new Set());
      dispatch({ type: "goTo", index });
      return;
    }
    const cursor = cursorForPage(pagination, index);
    if (cursor === undefined) {
      scrollOnPageChangeRef.current = false;
      return;
    }
    void fetchUploadsPage(index, cursor);
  };

  const retryUploads = () => {
    if (!uploadsError) {
      return;
    }
    const cursor = cursorForPage(pagination, uploadsError.pageIndex);
    void fetchUploadsPage(uploadsError.pageIndex, cursor ?? null);
  };

  const toggleReasons = (key: string) => {
    setExpanded((previous) => {
      const next = new Set(previous);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const refreshAll = () => {
    stable.retry();
    beta.retry();
    void loadReleases();
    setReloadKey((key) => key + 1);
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Releases</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">Live desktop builds, release history and installer upload history.</p>
        </div>
        <button type="button" onClick={refreshAll} className={secondaryBtn}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Refresh
        </button>
      </div>

      {usingMock && (
        <div
          className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
          role="note"
        >
          Release and upload history below is <strong>mock data</strong> (local development only). Remove{" "}
          <code>VITE_USE_MOCK_RELEASE_API=true</code> to use the real API. &quot;Live now&quot; always reads the CDN.
        </div>
      )}

      {/* A. Live now */}
      <section className="space-y-4" aria-labelledby="live-now-title">
        <div>
          <h2 id="live-now-title" className={sectionTitle}>
            Live now
          </h2>
          <p className={sectionHint}>What the CDN serves in releases/&lt;channel&gt;/latest.json right now.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <ReleaseChannelCard channel="stable" state={stable.state} onRetry={stable.retry} variant="admin" showPolicy showDetails />
          <ReleaseChannelCard channel="beta" state={beta.state} onRetry={beta.retry} variant="admin" showPolicy showDetails />
        </div>
      </section>

      {/* B. Release history */}
      <section className="space-y-4" aria-labelledby="release-history-title">
        <div>
          <h2 id="release-history-title" className={sectionTitle}>
            Release history
          </h2>
          <p className={sectionHint}>Every version ever published, newest first.</p>
        </div>
        <div className={panel}>
          {releasesLoading ? (
            <LoadingRow text="Loading release history…" />
          ) : releasesError ? (
            <ErrorBox message={releasesError} onRetry={() => void loadReleases()} />
          ) : releases.length === 0 ? (
            <p className="p-6 text-sm text-slate-600 dark:text-slate-400">No releases yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                <thead>
                  <tr>
                    <th className={th}>Version</th>
                    <th className={th}>Channel</th>
                    <th className={th}>Published (IST)</th>
                    <th className={th}>Size</th>
                    <th className={th}>Mandatory</th>
                    <th className={th}>Min supported</th>
                    <th className={th}>Installer</th>
                    <th className={th}>SHA-256</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {releases.map((r) => (
                    <tr key={`${r.channel}-${r.version}`}>
                      <td className={`${td} font-semibold text-slate-900 dark:text-slate-100`}>{r.version}</td>
                      <td className={td}>
                        <ChannelBadge channel={r.channel} />
                      </td>
                      <td className={`${td} whitespace-nowrap`}>{formatDateIST(r.published_at)}</td>
                      <td className={`${td} whitespace-nowrap`}>{formatSizeMB(r.size_bytes)}</td>
                      <td className={td}>{r.mandatory ? "Yes" : "No"}</td>
                      <td className={td}>{r.min_supported_version || "None"}</td>
                      <td className={`${td} font-mono text-xs`}>{formatOptional(r.installer_file)}</td>
                      <td className={`${td} font-mono text-xs`} title={r.sha256}>
                        {r.sha256 ? `${r.sha256.slice(0, 12)}…` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* C. Upload history */}
      <section className="space-y-4" aria-labelledby="upload-history-title">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="upload-history-title" className={sectionTitle}>
              Upload history
            </h2>
            <p className={sectionHint}>Installer uploads and whether the pipeline accepted them, newest first.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              Result
              <select value={resultFilter} onChange={(e) => setResultFilter(e.target.value as ResultFilter)} className={selectClass}>
                <option value="all">All</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              Channel
              <select value={channelFilter} onChange={(e) => setChannelFilter(e.target.value as ChannelFilter)} className={selectClass}>
                <option value="all">All</option>
                <option value="stable">Stable</option>
                <option value="beta">Beta</option>
              </select>
            </label>
          </div>
        </div>

        <div className={panel}>
          {uploadsError && !page ? (
            <ErrorBox message={uploadsError.message} onRetry={retryUploads} />
          ) : (
            <>
              <div
                ref={tableWrapRef}
                className="relative overflow-x-auto"
                style={isLoadingUploads && lockedHeight ? { minHeight: lockedHeight } : undefined}
                aria-busy={isLoadingUploads}
              >
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                  <thead ref={tableHeadRef} className="scroll-mt-4">
                    <tr>
                      <th className={th}>Uploaded (IST)</th>
                      <th className={th}>Result</th>
                      <th className={th}>Version</th>
                      <th className={th}>Channel</th>
                      <th className={th}>Source</th>
                      <th className={th}>Reasons</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y divide-slate-100 transition-opacity dark:divide-slate-800 ${isLoadingUploads ? "opacity-40" : ""}`}>
                    {rows.length === 0 && (
                      <tr>
                        <td className={`${td} h-40`} colSpan={6}>
                          {isLoadingUploads ? "" : filtersActive ? "No uploads match these filters." : "No uploads yet."}
                        </td>
                      </tr>
                    )}
                    {rows.map((u) => {
                      const key = uploadKey(u);
                      const isOpen = expanded.has(key);
                      const canExpand = u.result === "REJECTED" && u.reasons.length > 0;
                      return (
                        <Fragment key={key}>
                          <tr>
                            <td className={`${td} whitespace-nowrap`}>{formatDateIST(u.at)}</td>
                            <td className={td}>
                              <ResultBadge result={u.result} />
                            </td>
                            <td className={`${td} font-semibold text-slate-900 dark:text-slate-100`}>{formatOptional(u.version)}</td>
                            <td className={td}>
                              <ChannelBadge channel={u.channel} />
                            </td>
                            <td className={`${td} break-all font-mono text-xs`}>{formatOptional(u.source_key)}</td>
                            <td className={td}>
                              {canExpand ? (
                                <button
                                  type="button"
                                  onClick={() => toggleReasons(key)}
                                  aria-expanded={isOpen}
                                  disabled={isLoadingUploads}
                                  className="inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
                                >
                                  {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                  {isOpen ? "Hide" : "Show"} {u.reasons.length === 1 ? "reason" : `${u.reasons.length} reasons`}
                                </button>
                              ) : (
                                <span className="text-slate-400 dark:text-slate-500">—</span>
                              )}
                            </td>
                          </tr>
                          {canExpand && isOpen && (
                            <tr className="bg-red-50/60 dark:bg-red-500/5">
                              <td className={td} colSpan={6}>
                                <ul className="list-disc space-y-1 pl-5 text-sm text-red-800 dark:text-red-200">
                                  {u.reasons.map((reason, index) => (
                                    <li key={index} className="break-words">
                                      {reason}
                                    </li>
                                  ))}
                                </ul>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>

                {isLoadingUploads && (
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 top-12 flex items-start justify-center pt-10" role="status">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm text-slate-700 shadow dark:bg-slate-800 dark:text-slate-200">
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Loading page {(loadingPage ?? 0) + 1}…
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
                <span aria-live="polite" aria-atomic="true">
                  Page {pagination.pageIndex + 1}
                  {range ? ` · Showing ${range.from}–${range.to}` : ""}
                </span>

                {uploadsError && (
                  <span className="flex items-center gap-2 text-red-600 dark:text-red-300" role="alert">
                    {uploadsError.message}
                    <button type="button" onClick={retryUploads} className="font-semibold underline" aria-label="Retry loading this page">
                      Retry
                    </button>
                  </span>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2">
                    Rows per page
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value) as PageSize)}
                      className={selectClass}
                    >
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
                    disabled={!canGoPrevious(pagination) || isLoadingUploads}
                    aria-label="Previous page"
                    className={secondaryBtn}
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => goToPage(pagination.pageIndex + 1)}
                    disabled={!canGoNext(pagination) || isLoadingUploads}
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
    </div>
  );
}
