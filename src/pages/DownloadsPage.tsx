import { Link } from "react-router-dom";
import { CheckCircle2, PackageOpen } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ReleaseChannelCard } from "@/components/releases/ReleaseChannelCard";
import { SUPPORT_SECTION_PATH, SYSTEM_REQUIREMENTS } from "@/constants/downloads";
import { useLatestRelease } from "@/hooks/useLatestRelease";

const ComingSoon = (
  <div className="flex flex-col items-center gap-3 py-8 text-center">
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
);

/** Public download page: stable channel only, no login, no release notes or checksums. */
export default function DownloadsPage() {
  // Public users only ever get the stable channel — never beta, never the release API.
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

        <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <ReleaseChannelCard channel="stable" state={state} onRetry={retry} title="CardioX for Windows" emptyState={ComingSoon} />

          <aside
            className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-2xl"
            aria-labelledby="requirements-title"
          >
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
