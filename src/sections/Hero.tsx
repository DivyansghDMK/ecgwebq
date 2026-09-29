import { motion } from "framer-motion";
import { EcgTrace, Readout, btnPrimary } from "./ui";

const readings = [
  { label: "HR", value: "60 bpm" },
  { label: "PR", value: "160 ms" },
  { label: "QRS", value: "85 ms" },
  { label: "QT/QTc", value: "380/400" }
];

export function Hero() {
  return (
    <section id="hero" className="relative overflow-hidden bg-ink pt-16 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_75%_40%,rgba(255,107,26,0.16),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-grid-dark bg-[size:32px_32px] opacity-60" />

      <div className="relative mx-auto grid w-full max-w-[84rem] items-center gap-12 px-5 py-14 sm:px-8 md:py-24 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <p className="font-mono text-[0.72rem] font-medium uppercase tracking-[0.24em] text-[#FF8A3D]">
            CardioX · Deckmount ECG Monitor
          </p>
          <h1
            className="mt-5 font-head font-semibold leading-[1.02] tracking-tight"
            style={{ fontSize: "clamp(2.5rem, 6vw, 4.75rem)" }}
          >
            Built to detect.
            <br />
            <span className="text-[#FF8A3D]">Designed to last.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/70 md:text-lg">
            12-lead ECG acquisition, waveform analysis and report management for
            cardiologists, technicians and clinics. Works offline, syncs to the cloud when
            it can.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <a href="#login-section" className={btnPrimary}>
              Open the portal
            </a>
            <a
              href="#gallery"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white transition hover:border-white hover:bg-white/10"
            >
              See the screens <span aria-hidden>→</span>
            </a>
          </div>
          <p className="mt-10 font-mono text-xs uppercase tracking-[0.2em] text-white/45">
            12 leads · 1000 sps per lead · 24-bit ADC
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
          className="rounded-2xl bg-[#0B0A09] p-4 ring-1 ring-white/10 shadow-[0_30px_80px_-30px_rgba(255,107,26,0.35)] sm:p-5"
        >
          <div className="flex items-center justify-between font-mono text-[0.68rem] uppercase tracking-[0.2em] text-white/50">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
              Lead II
            </span>
            <span>25 mm/s · 10 mm/mV</span>
          </div>

          <div
            className="relative mt-4 h-44 overflow-hidden rounded-xl bg-black sm:h-52"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,107,26,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(255,107,26,0.10) 1px, transparent 1px)",
              backgroundSize: "24px 24px"
            }}
          >
            <EcgTrace className="absolute inset-0" />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {readings.map((r) => (
              <Readout key={r.label} label={r.label} value={r.value} />
            ))}
          </div>
          <p className="mt-3 text-right font-mono text-[0.65rem] uppercase tracking-[0.18em] text-white/35">
            Sample waveform
          </p>
        </motion.div>
      </div>
      <div className="h-2 w-full opacity-40 [background-image:linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:16px_8px]" aria-hidden />
    </section>
  );
}
