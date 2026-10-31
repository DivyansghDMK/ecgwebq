import { ArrowUpRight } from "lucide-react";
import { Frame, Readout, Reveal, Section, SectionHead } from "./ui";

const dashboardImage = new URL("../Assets/Dashboard.webp", import.meta.url).href;

const metrics = [
  { label: "HR", value: "60 bpm" },
  { label: "PR", value: "160 ms" },
  { label: "QRS", value: "85 ms" },
  { label: "Axis", value: "0°" },
  { label: "QT/QTc", value: "380/400" },
  { label: "Session", value: "00:21" }
];

const reports = ["100937", "100930", "100911"].map((stamp) => ({
  fileName: `ECG_Report_12_1_20260408_${stamp}.pdf`,
  date: "2026-04-08",
  time: "10:09 AM",
  label: "12-lead ECG report",
  href: new URL(`../Assets/reports/ECG_Report_12_1_20260408_${stamp}.pdf`, import.meta.url).href
}));

const points = [
  "Calendar for scheduled ECG reviews and stress tests",
  "Automatic conclusions with the evidence behind each finding",
  "Recent reports and collaborative comments one click away"
];

export function DashboardShowcase() {
  return (
    <Section id="dashboard">
      <SectionHead
        eyebrow="Clinical operations dashboard"
        title="Every cardiac parameter, in real time"
        lede="Live ECG signals, clinical annotations and patient history in one responsive dashboard, designed for cardiology labs that monitor several patients at once."
      />

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:gap-8">
        <Reveal className="flex flex-col gap-6">
          <Frame src={dashboardImage} alt="CardioX clinical dashboard with Lead II recording" />
          <ul className="grid gap-4 sm:grid-cols-3">
            {points.map((p) => (
              <li key={p} className="border-t-2 border-brand-orange pt-3 text-sm leading-snug text-[#4A3F42]">
                {p}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="flex h-full flex-col gap-6 rounded-2xl bg-ink p-5 text-white shadow-[0_18px_40px_-18px_rgba(18,16,15,0.55)] sm:p-6">
            <div className="flex items-center justify-between font-mono text-[0.68rem] uppercase tracking-[0.2em] text-white/50">
              <span>ECG monitor · 12-lead test</span>
              <span className="flex items-center gap-2 text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> Live
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
              {metrics.map((m) => (
                <Readout key={m.label} label={m.label} value={m.value} />
              ))}
            </div>
            <div className="mt-auto">
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-white/50">Recent reports</p>
              <ul className="mt-3 divide-y divide-white/10 border-y border-white/10">
                {reports.map((r) => (
                  <li key={r.fileName}>
                    <a
                      href={r.href}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex items-center justify-between gap-4 py-3 text-sm"
                    >
                      <span>
                        <span className="block text-white">{r.label}</span>
                        <span className="block font-mono text-xs text-white/50">
                          {r.date} · {r.time}
                        </span>
                      </span>
                      <ArrowUpRight className="h-4 w-4 text-[#FF8A3D] transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-label="Open report" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
