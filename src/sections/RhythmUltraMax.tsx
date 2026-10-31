import { useState, type ComponentType } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Bluetooth, Check, Cloud, HeartPulse, Monitor, Smartphone, Usb } from "lucide-react";
import { cn } from "@/lib/utils";
import { Frame, Section, SectionHead, btnGhost, btnPrimary } from "./ui";

const deviceImage = new URL("../Assets/rhythm-app/rhythm-ultra-max.webp", import.meta.url).href;
const appImages = {
  electrode: new URL("../Assets/rhythm-app/electrode-placement.webp", import.meta.url).href,
  recording: new URL("../Assets/rhythm-app/twelve-lead-recording.webp", import.meta.url).href,
  live: new URL("../Assets/rhythm-app/live-monitor.webp", import.meta.url).href,
  reports: new URL("../Assets/rhythm-app/reports.webp", import.meta.url).href
};
const cardioxImage = new URL("../Assets/Waveform_Analysis.webp", import.meta.url).href;

interface Stage {
  id: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  role: string;
  name: string;
  pitch: string;
  points: string[];
  chips: string[];
}

const stages: Stage[] = [
  {
    id: "hardware",
    icon: HeartPulse,
    role: "Hardware",
    name: "Rhythm Ultra Max Portable ECG",
    pitch: "A 298 g, 12-lead ECG you carry in one hand. Hospital-grade signal wherever the patient is.",
    points: [
      "12 leads from 10 electrodes, recorded at the same time",
      "24-bit, 1000 samples per second on every channel, so fine detail is not lost",
      "Fluke tested and supported by 1,000 clinical trials",
      "5–6 hours of recording on a single charge"
    ],
    chips: ["24-bit ADC", "1000 sps / ch", "298 g", "4000 mAh"]
  },
  {
    id: "app",
    icon: Smartphone,
    role: "Mobile app",
    name: "Rhythm Ultra",
    pitch: "Pair over Bluetooth, follow the electrode map, and record a 10-second ECG on calibrated paper.",
    points: [
      "A body map shows exactly where each electrode goes",
      "Live monitor shows BPM, PR, QRS, QT and QTc as the trace runs",
      "Reports back up to the cloud and share as a PDF over WhatsApp or email"
    ],
    chips: ["Android 9.0+", "Bluetooth 5.0", "10 s ECG", "Cloud backup"]
  },
  {
    id: "cardiox",
    icon: Monitor,
    role: "Desktop analysis",
    name: "CardioX",
    pitch: "Open the same report on your desktop for a closer look and a reviewed diagnosis.",
    points: [
      "Magnifier, ruler and caliper for manual measurement",
      "HRV, hyperkalaemia screening and automated interpretation of 42 findings",
      "Annotate, review and export a PDF report",
      "Or plug the device in over USB and record straight into CardioX"
    ],
    chips: ["Windows 10+", "USB", "80+ patterns", "PDF + JSON"]
  }
];

// What travels between one stage and the next.
const links = [
  { icon: Bluetooth, label: "Bluetooth 5.0" },
  { icon: Cloud, label: "Cloud sync" }
];

function StageVisual({ id }: { id: string }) {
  if (id === "hardware") {
    return (
      <img
        src={deviceImage}
        alt="Rhythm Ultra Max Portable ECG device, Fluke tested"
        className="mx-auto block h-auto w-full max-w-[34rem] rounded-3xl shadow-[0_24px_50px_-24px_rgba(18,16,15,0.5)] ring-1 ring-black/10"
      />
    );
  }
  if (id === "app") {
    const phones = [
      { src: appImages.electrode, alt: "Rhythm Ultra app: electrode placement" },
      { src: appImages.recording, alt: "Rhythm Ultra app: 12-lead recording" },
      { src: appImages.live, alt: "Rhythm Ultra app: live monitor" },
      { src: appImages.reports, alt: "Rhythm Ultra app: reports" }
    ];
    return (
      <div className="grid grid-cols-4 gap-2.5 sm:gap-4">
        {phones.map((p, i) => (
          <div
            key={p.alt}
            className={cn(
              "rounded-[1.1rem] bg-ink p-[3px] shadow-[0_18px_40px_-18px_rgba(18,16,15,0.55)] ring-1 ring-black/60 sm:rounded-[1.5rem] sm:p-1",
              i % 2 === 1 && "sm:translate-y-6"
            )}
          >
            <img src={p.src} alt={p.alt} loading="lazy" className="block h-auto w-full rounded-[0.9rem] bg-white sm:rounded-[1.25rem]" />
          </div>
        ))}
      </div>
    );
  }
  return <Frame src={cardioxImage} alt="CardioX waveform review workspace with magnifier, ruler and caliper" />;
}

export function RhythmUltraMax() {
  const [active, setActive] = useState(0);
  const stage = stages[active];

  return (
    <Section id="rhythm">
      <SectionHead
        eyebrow="The Rhythm system"
        title="From the bedside to the desktop, one report"
        lede="Rhythm Ultra Max records the ECG. The Rhythm Ultra app captures and shares it. CardioX takes the analysis further. Tap a step to see what it does."
      />

      {/* Track: three steps joined by what travels between them */}
      <div role="tablist" aria-label="Rhythm system steps" className="flex flex-col md:flex-row md:items-stretch">
        {stages.map((s, i) => {
          const isActive = i === active;
          const link = links[i];
          return (
            <div key={s.id} className="contents">
              <button
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls="rhythm-panel"
                onClick={() => setActive(i)}
                className={cn(
                  "flex flex-1 items-center gap-4 rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B93A00] md:flex-col md:items-start md:gap-3 md:p-5",
                  isActive
                    ? "border-ink bg-ink text-white shadow-[0_18px_40px_-18px_rgba(18,16,15,0.55)]"
                    : "border-ink/20 bg-white/70 text-ink hover:border-ink/50 hover:bg-white"
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-11 w-11 flex-none items-center justify-center rounded-xl",
                    isActive ? "bg-brand-orange text-ink" : "bg-ink/[0.07] text-[#B93A00]"
                  )}
                >
                  <s.icon className="h-5 w-5" aria-hidden />
                </span>
                <span>
                  <span
                    className={cn(
                      "block font-mono text-[0.65rem] uppercase tracking-[0.18em]",
                      isActive ? "text-[#FF8A3D]" : "text-[#6B5C60]"
                    )}
                  >
                    {s.role}
                  </span>
                  <span className="mt-0.5 block font-head text-lg font-semibold leading-snug">{s.name}</span>
                </span>
              </button>

              {link ? (
                <div
                  aria-hidden
                  className="flex items-center justify-center gap-3 py-2 md:w-36 md:flex-none md:flex-col md:gap-1.5 md:py-0"
                >
                  <span className="hidden font-mono text-[0.62rem] uppercase tracking-[0.16em] text-[#6B5C60] md:block">
                    {link.label}
                  </span>
                  <span className="flex items-center gap-2 md:w-full">
                    <span
                      className={cn(
                        "h-6 w-px md:h-px md:flex-1",
                        i < active ? "bg-brand-orange" : "bg-ink/25"
                      )}
                    />
                    <link.icon className={cn("h-4 w-4 flex-none", i < active ? "text-[#B93A00]" : "text-ink/40")} />
                    <span
                      className={cn(
                        "h-6 w-px md:h-px md:flex-1",
                        i < active ? "bg-brand-orange" : "bg-ink/25"
                      )}
                    />
                  </span>
                  <span className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-[#6B5C60] md:hidden">
                    {link.label}
                  </span>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      <p className="mt-3 flex items-center gap-2 font-mono text-[0.65rem] uppercase tracking-[0.16em] text-[#6B5C60]">
        <Usb className="h-3.5 w-3.5" aria-hidden /> Or connect the device to CardioX directly over USB
      </p>

      {/* Panel for the selected step */}
      <div id="rhythm-panel" role="tabpanel" className="mt-8 rounded-3xl bg-white/60 p-5 ring-1 ring-ink/10 sm:p-8 lg:p-10">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={stage.id}
            className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-14"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <div>
              <p className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-[#B93A00]">
                Step {active + 1} of {stages.length} · {stage.role}
              </p>
              <h3 className="mt-3 text-3xl font-semibold leading-[1.1] text-ink md:text-4xl">{stage.name}</h3>
              <p className="mt-4 text-lg leading-relaxed text-[#4A3F42]">{stage.pitch}</p>
              <ul className="mt-6 space-y-3">
                {stage.points.map((p) => (
                  <li key={p} className="flex items-start gap-3 text-[0.98rem] leading-snug text-ink/90">
                    <Check className="mt-0.5 h-4 w-4 flex-none text-[#B93A00]" aria-hidden />
                    {p}
                  </li>
                ))}
              </ul>
              <ul className="mt-6 flex flex-wrap gap-2">
                {stage.chips.map((c) => (
                  <li
                    key={c}
                    className="rounded-full bg-ink/[0.07] px-3 py-1 font-mono text-[0.7rem] uppercase tracking-[0.12em] text-ink/80"
                  >
                    {c}
                  </li>
                ))}
              </ul>
            </div>
            <div className="pb-6">
              <StageVisual id={stage.id} />
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex items-center justify-between border-t border-ink/10 pt-5">
          <button
            type="button"
            onClick={() => setActive((a) => Math.max(0, a - 1))}
            disabled={active === 0}
            className="inline-flex items-center gap-2 text-sm font-semibold text-ink transition hover:text-[#B93A00] disabled:pointer-events-none disabled:opacity-30"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden /> Previous
          </button>
          {active < stages.length - 1 ? (
            <button
              type="button"
              onClick={() => setActive((a) => Math.min(stages.length - 1, a + 1))}
              className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ink/85"
            >
              Next: {stages[active + 1].name} <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <a href="mailto:ankur.kumar@deckmount.in?subject=Rhythm%20Ultra%20Max%20and%20CardioX" className={btnPrimary}>
                Talk to the solutions team
              </a>
              <a href="#login-section" className={btnGhost}>
                Log in to CardioX
              </a>
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}
