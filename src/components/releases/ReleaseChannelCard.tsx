import { useState, type ReactNode } from "react";
import { AlertCircle, Check, ChevronDown, Copy, Download, FlaskConical, Loader2, PackageOpen, RefreshCw, ShieldCheck } from "lucide-react";
import { formatDateIST, formatSizeMB } from "@/lib/format";
import type { Channel, LatestRelease, LatestState } from "@/services/releases/types";

type Variant = "glass" | "admin";

interface ReleaseChannelCardProps {
  channel: Channel;
  state: LatestState;
  onRetry: () => void;
  variant?: Variant;
  /** Show mandatory flag and minimum supported version (developer view). */
  showPolicy?: boolean;
  /**
   * Show release notes and "Verify download (SHA-256)" (admin only).
   * When false they are not rendered at all — not hidden — so they never reach the DOM.
   * Validation of sha256 etc. still happens in latestJson before any button is shown.
   */
  showDetails?: boolean;
  /** Overrides the channel title, e.g. "CardioX for Windows" on the public page. */
  title?: string;
  /** Replaces the default "No release published yet" content (403/404). */
  emptyState?: ReactNode;
}

const styles: Record<Variant, Record<string, string>> = {
  glass: {
    card: "relative rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-2xl shadow-2xl",
    title: "text-lg font-semibold text-white",
    muted: "text-sm text-gray-400",
    label: "text-xs uppercase tracking-wider text-gray-500",
    value: "text-sm font-medium text-gray-200",
    version: "text-3xl font-bold text-white",
    notes: "rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-gray-300",
    panel: "rounded-xl border border-white/10 bg-black/20 p-3",
    code: "text-gray-300",
    subtle: "text-gray-400 hover:text-white",
    secondaryBtn: "border border-white/15 bg-white/5 text-gray-200 hover:bg-white/10",
    error: "border border-red-500/30 bg-red-500/10 text-red-300",
  },
  admin: {
    card: "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900",
    title: "text-lg font-semibold text-slate-900 dark:text-slate-50",
    muted: "text-sm text-slate-600 dark:text-slate-400",
    label: "text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400",
    value: "text-sm font-medium text-slate-800 dark:text-slate-200",
    version: "text-3xl font-bold text-slate-900 dark:text-slate-50",
    notes: "rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300",
    panel: "rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60",
    code: "text-slate-700 dark:text-slate-300",
    subtle: "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white",
    secondaryBtn:
      "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700",
    error: "border border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300",
  },
};

const CHANNEL_TITLE: Record<Channel, string> = {
  stable: "Stable",
  beta: "Beta (testing)",
};

function fileNameFromUrl(url: string): string {
  try {
    const segments = new URL(url).pathname.split("/").filter(Boolean);
    return decodeURIComponent(segments[segments.length - 1] || "installer");
  } catch {
    return "installer";
  }
}

export function ReleaseChannelCard({
  channel,
  state,
  onRetry,
  variant = "glass",
  showPolicy = false,
  showDetails = false,
  title,
  emptyState,
}: ReleaseChannelCardProps) {
  const s = styles[variant];

  return (
    <section className={s.card} aria-labelledby={`release-${channel}-title`} aria-busy={state.status === "loading"}>
      <header className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <h3 id={`release-${channel}-title`} className={s.title}>
          {title ?? CHANNEL_TITLE[channel]}
        </h3>
        {channel === "beta" ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/15 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-300">
            <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
            Test build
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-300">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Recommended
          </span>
        )}
      </header>

      {state.status === "loading" && (
        <div className={`flex items-center gap-3 py-8 ${s.muted}`} role="status">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          Checking for the latest release…
        </div>
      )}

      {state.status === "none" && emptyState}

      {state.status === "none" && !emptyState && (
        <div className={`flex flex-col items-center gap-2 py-8 text-center ${s.muted}`}>
          <PackageOpen className="h-8 w-8 opacity-60" aria-hidden="true" />
          <p className={s.value}>No release published yet</p>
          <p className="text-xs">Nothing has been published on the {channel} channel.</p>
        </div>
      )}

      {state.status === "error" && (
        <div className="space-y-4 py-2">
          <div className={`flex items-start gap-3 rounded-xl p-4 text-sm ${s.error}`} role="alert">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span>{state.message}</span>
          </div>
          <button
            type="button"
            onClick={onRetry}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${s.secondaryBtn}`}
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Retry
          </button>
        </div>
      )}

      {state.status === "ok" && (
        <ReleaseDetails release={state.release} variant={variant} showPolicy={showPolicy} showDetails={showDetails} />
      )}
    </section>
  );
}

interface ReleaseDetailsProps {
  release: LatestRelease;
  variant: Variant;
  showPolicy: boolean;
  showDetails: boolean;
}

function ReleaseDetails({ release, variant, showPolicy, showDetails }: ReleaseDetailsProps) {
  const s = styles[variant];

  return (
    <div className="space-y-5">
      <div>
        <p className={s.version}>v{release.version}</p>
        <dl className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <dt className={s.label}>Released</dt>
            <dd className={s.value}>{formatDateIST(release.published_at)}</dd>
          </div>
          <div>
            <dt className={s.label}>Size</dt>
            <dd className={s.value}>{formatSizeMB(release.size_bytes)}</dd>
          </div>
          {showPolicy && (
            <>
              <div>
                <dt className={s.label}>Mandatory</dt>
                <dd className={s.value}>{release.mandatory ? "Yes" : "No"}</dd>
              </div>
              <div>
                <dt className={s.label}>Min supported</dt>
                <dd className={s.value}>{release.min_supported_version || "None"}</dd>
              </div>
            </>
          )}
        </dl>
      </div>

      {showDetails && (
        <div>
          <p className={`mb-2 ${s.label}`}>Release notes</p>
          {/* Rendered as text only; React escapes it and whitespace-pre-line keeps line breaks. */}
          <p className={`max-h-48 overflow-y-auto whitespace-pre-line break-words ${s.notes}`}>
            {release.release_notes.trim() || "No release notes."}
          </p>
        </div>
      )}

      <a
        href={release.download_url}
        rel="noopener noreferrer"
        className={`flex w-full items-center justify-center gap-3 rounded-2xl px-6 py-4 font-semibold text-white shadow-lg transition focus:outline-none focus-visible:ring-2 ${
          release.channel === "beta"
            ? "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 focus-visible:ring-amber-400/60"
            : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus-visible:ring-green-400/60"
        }`}
      >
        <Download className="h-5 w-5" aria-hidden="true" />
        Download for Windows
      </a>

      {showDetails && <ChecksumPanel sha256={release.sha256} fileName={fileNameFromUrl(release.download_url)} variant={variant} />}
    </div>
  );
}

function ChecksumPanel({ sha256, fileName, variant }: { sha256: string; fileName: string; variant: Variant }) {
  const s = styles[variant];
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(sha256);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
    window.setTimeout(() => setCopyState("idle"), 2500);
  };

  return (
    <details className="group">
      <summary className={`flex cursor-pointer list-none items-center gap-2 text-sm font-medium ${s.subtle}`}>
        <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden="true" />
        Verify download (SHA-256)
      </summary>
      <div className={`mt-3 space-y-3 ${s.panel}`}>
        <code className={`block break-all font-mono text-xs ${s.code}`}>{sha256}</code>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={copy}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${s.secondaryBtn}`}
          >
            {copyState === "copied" ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
            {copyState === "copied" ? "Copied" : "Copy"}
          </button>
          <span className={`text-xs ${s.muted}`} aria-live="polite">
            {copyState === "failed" ? "Copy failed — select the text and copy it manually." : ""}
          </span>
        </div>
        <p className={`text-xs ${s.muted}`}>
          In PowerShell, compare with:{" "}
          <code className="break-all font-mono">Get-FileHash .\{fileName} -Algorithm SHA256</code>
        </p>
      </div>
    </details>
  );
}
