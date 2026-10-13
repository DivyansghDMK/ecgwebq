import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, ChevronDown, ChevronRight, FlaskConical, Loader2, RefreshCw } from "lucide-react";
import { ReleaseChannelCard } from "@/components/releases/ReleaseChannelCard";
import { useLatestRelease } from "@/hooks/useLatestRelease";
import { clearAuthSession } from "@/lib/auth";
import { formatDateIST, formatSizeMB } from "@/lib/format";
import { getReleaseApi, isMockReleaseApi, ReleaseApiError } from "@/services/releases/releaseApi";
import type { ReleaseHistoryItem, UploadHistoryItem } from "@/services/releases/types";

type ResultFilter = "all" | "ACCEPTED" | "REJECTED";
type ChannelFilter = "all" | "stable" | "beta";

const sectionTitle = "text-xl font-semibold text-slate-900 dark:text-slate-50";
const sectionHint = "text-sm text-slate-600 dark:text-slate-400";
const panel = "rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900";
const th = "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400";
const td = "px-4 py-3 text-sm text-slate-700 dark:text-slate-300 align-top";
const selectClass =
  "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200";
const secondaryBtn =
  "inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700";

const uploadKey = (u: UploadHistoryItem) => `${u.at}|${u.source_key}|${u.version}|${u.result}`;
const byNewest = (a: UploadHistoryItem, b: UploadHistoryItem) => Date.parse(b.at) - Date.parse(a.at);

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function ChannelBadge({ channel }: { channel: string }) {
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
      {channel || "—"}
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
  const api = useMemo(() => getReleaseApi(), []);
  const usingMock = isMockReleaseApi();

  const stable = useLatestRelease("stable");
  const beta = useLatestRelease("beta");

  const [releases, setReleases] = useState<ReleaseHistoryItem[]>([]);
  const [releasesLoading, setReleasesLoading] = useState(true);
  const [releasesError, setReleasesError] = useState<string | null>(null);

  const [uploads, setUploads] = useState<UploadHistoryItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [uploadsLoading, setUploadsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [uploadsError, setUploadsError] = useState<string | null>(null);
  const [resultFilter, setResultFilter] = useState<ResultFilter>("all");
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  /** Returns true when the error was an auth failure and we redirected to login. */
  const redirectIfUnauthorized = useCallback(
    (error: unknown): boolean => {
      if (error instanceof ReleaseApiError && error.isAuthError) {
        clearAuthSession("admin");
        navigate("/login_admin", { replace: true, state: { from: location } });
        return true;
      }
      return false;
    },
    [navigate, location]
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

  const loadUploads = useCallback(
    async (cursor: string | null) => {
      if (cursor) {
        setLoadingMore(true);
      } else {
        setUploadsLoading(true);
      }
      setUploadsError(null);
      try {
        const page = await api.getUploads({ cursor });
        setUploads((previous) => {
          const merged = cursor ? [...previous, ...page.items] : page.items;
          return [...merged].sort(byNewest);
        });
        setNextCursor(page.next_cursor);
      } catch (error) {
        if (!redirectIfUnauthorized(error)) {
          setUploadsError(errorMessage(error));
        }
      } finally {
        setUploadsLoading(false);
        setLoadingMore(false);
      }
    },
    [api, redirectIfUnauthorized]
  );

  useEffect(() => {
    void loadReleases();
    void loadUploads(null);
    // Load once on mount; retries are user-triggered.
  }, []);

  const visibleUploads = useMemo(
    () =>
      uploads.filter(
        (u) => (resultFilter === "all" || u.result === resultFilter) && (channelFilter === "all" || u.channel === channelFilter)
      ),
    [uploads, resultFilter, channelFilter]
  );

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
    setExpanded(new Set());
    void loadReleases();
    void loadUploads(null);
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
          Release and upload history below is <strong>mock data</strong>. Set <code>VITE_USE_MOCK_RELEASE_API=false</code> and{" "}
          <code>VITE_RELEASE_API_BASE</code> to use the real API. &quot;Live now&quot; always reads the CDN.
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
          <ReleaseChannelCard channel="stable" state={stable.state} onRetry={stable.retry} variant="admin" showPolicy />
          <ReleaseChannelCard channel="beta" state={beta.state} onRetry={beta.retry} variant="admin" showPolicy />
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
                      <td className={`${td} font-mono text-xs`}>{r.installer_file || "—"}</td>
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
          {uploadsLoading ? (
            <LoadingRow text="Loading upload history…" />
          ) : uploadsError && uploads.length === 0 ? (
            <ErrorBox message={uploadsError} onRetry={() => void loadUploads(null)} />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                  <thead>
                    <tr>
                      <th className={th}>Uploaded (IST)</th>
                      <th className={th}>Result</th>
                      <th className={th}>Version</th>
                      <th className={th}>Channel</th>
                      <th className={th}>Source</th>
                      <th className={th}>Reasons</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {visibleUploads.length === 0 && (
                      <tr>
                        <td className={td} colSpan={6}>
                          No uploads match these filters.
                        </td>
                      </tr>
                    )}
                    {visibleUploads.map((u) => {
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
                            <td className={`${td} font-semibold text-slate-900 dark:text-slate-100`}>{u.version || "—"}</td>
                            <td className={td}>
                              <ChannelBadge channel={u.channel} />
                            </td>
                            <td className={`${td} break-all font-mono text-xs`}>{u.source_key || "—"}</td>
                            <td className={td}>
                              {canExpand ? (
                                <button
                                  type="button"
                                  onClick={() => toggleReasons(key)}
                                  aria-expanded={isOpen}
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
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <span>
                  Showing {visibleUploads.length} of {uploads.length} loaded
                  {resultFilter !== "all" || channelFilter !== "all" ? " (filters apply to loaded rows)" : ""}
                </span>
                {uploadsError && (
                  <span className="text-red-600 dark:text-red-300" role="alert">
                    {uploadsError}
                  </span>
                )}
                {nextCursor && (
                  <button type="button" onClick={() => void loadUploads(nextCursor)} disabled={loadingMore} className={secondaryBtn}>
                    {loadingMore && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                    Load more
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
