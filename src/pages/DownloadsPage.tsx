import { Link } from "react-router-dom";
import { AlertCircle, CheckCircle2, Download, Loader2, Monitor, PackageOpen, RefreshCw } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ChecksumPanel, fileNameFromUrl } from "@/components/releases/ReleaseChannelCard";
import { SUPPORT_SECTION_PATH, SYSTEM_REQUIREMENTS } from "@/constants/downloads";
import { useLatestRelease } from "@/hooks/useLatestRelease";
import { formatDateIST, formatSizeMB } from "@/lib/format";
import type { LatestRelease } from "@/services/releases/types";

const card = "rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-2xl sm:p-8";

/** Public download page: stable channel only, no login. */
export default function DownloadsPage() {
  // Public users only ever get the stable channel — never beta.
  const { state, retry } = useLatestRelease("stable");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Navbar />

      <main className="mx-auto w-full max-w-[84rem] px-5 pb-20 pt-32 sm:px-8">
        <header className="mx-auto max-w-3xl text-center">
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-brand-orange">Downloads</p>
          <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-white md:text-5xl">Download CardioX</h1>
          <p className="mt-4 text-base text-white/60 md:text-lg">
            Install the CardioX desktop software to record, review and report ECGs with your RhythmUltra device.
          </p>
        </header>

        <div className="mx-auto mt-12 grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <section className={card} aria-labelledby="download-title" aria-busy={state.status === "loading"}>
            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-brand-orange/15 text-brand-orange">
                <Monitor className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 id="download-title" className="text-2xl font-semibold text-white">
                CardioX for Windows
              </h2>
            </div>

            {state.status === "loading" && (
              <div className="flex items-center gap-3 py-10 text-sm text-white/60" role="status">
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                Checking for the latest version…
              </div>
            )}

            {state.status === "none" && (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <PackageOpen className="h-10 w-10 text-white/40" aria-hidden="true" />
                <h3 className="text-xl font-semibold text-white">Download coming soon</h3>
                <p className="max-w-md text-sm text-white/60">The first public release will be available here shortly.</p>
                <Link
                  to={SUPPORT_SECTION_PATH}
                  className="mt-2 text-sm font-semibold text-brand-orange underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
                >
                  Contact support
                </Link>
              </div>
            )}

            {state.status === "error" && (
              <div className="space-y-4 py-4">
                <div
                  className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
                  role="alert"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-none" aria-hidden="true" />
                  <span>
                    We couldn&apos;t load the download right now. {state.message}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={retry}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-focus"
                >
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  Retry
                </button>
              </div>
            )}

            {state.status === "ok" && <StableRelease release={state.release} />}
          </section>

          <aside className={card} aria-labelledby="requirements-title">
            <h2 id="requirements-title" className="text-lg font-semibold text-white">
              System requirements
            </h2>
            <ul className="mt-4 space-y-3">
              {SYSTEM_REQUIREMENTS.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-white/70">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-brand-orange" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function StableRelease({ release }: { release: LatestRelease }) {
  return (
    <div className="space-y-6">
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <dt className="text-xs uppercase tracking-wider text-white/45">Version</dt>
          <dd className="mt-1 text-lg font-semibold text-white">{release.version}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-white/45">Released</dt>
          <dd className="mt-1 text-sm font-medium text-white/85">{formatDateIST(release.published_at)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-white/45">Size</dt>
          <dd className="mt-1 text-sm font-medium text-white/85">{formatSizeMB(release.size_bytes)}</dd>
        </div>
      </dl>

      <div>
        <h3 className="mb-2 text-xs uppercase tracking-wider text-white/45">Release notes</h3>
        {/* Plain text only; React escapes it and whitespace-pre-line keeps line breaks. */}
        <p className="max-h-60 overflow-y-auto whitespace-pre-line break-words rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/75">
          {release.release_notes.trim() || "No release notes."}
        </p>
      </div>

      <a
        href={release.download_url}
        rel="noopener noreferrer"
        className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-brand-orange px-8 py-4 text-base font-semibold text-ink shadow-glow transition hover:bg-[#ff7d38] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-focus focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:w-auto"
      >
        <Download className="h-5 w-5" aria-hidden="true" />
        Download for Windows
      </a>

      <ChecksumPanel sha256={release.sha256} fileName={fileNameFromUrl(release.download_url)} variant="glass" />
    </div>
  );
}
