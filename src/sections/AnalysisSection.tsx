import { Frame, Readout, Reveal, Section, SectionHead } from "./ui";

const leadImage = new URL("../Assets/Lead_II.png", import.meta.url).href;

const analysisMetrics = [
  { label: "Heart rate", value: "60 bpm" },
  { label: "PR interval", value: "160 ms" },
  { label: "QRS duration", value: "85 ms" },
  { label: "QT/QTc", value: "380/400 ms" }
];

const interpretation = [
  "Each finding shown with the measurement behind it",
  "Manual annotation, ruler and caliper on every lead",
  "Export as PDF and JSON, or send as HL7"
];

const blocks = [
  {
    title: "Automated arrhythmia screening",
    body: "Reads atrial fibrillation and flutter, ventricular tachycardia, AV blocks, bundle branch blocks, premature beats, sinus bradycardia and tachycardia, and names sinus rhythm only when P waves lead every QRS."
  },
  {
    title: "Clear clinical conclusions",
    body: "The report is decided by the strip it prints. Findings use standard cardiograph wording, and an interval that could not be measured reads \"--\", never a guessed number."
  },
  {
    title: "Limits for every age",
    body: "Children from 1 to 17 years are read against normal heart rate, axis and PR limits for their age band, approved by our consulting cardiologist and checked on 2,156 labelled children's ECGs."
  }
];

export function AnalysisSection() {
  return (
    <Section id="analysis">
      <SectionHead
        eyebrow="Live PQRS analysis"
        title="Waveform intelligence for every lead"
        lede="High-fidelity rendering with zoom, amplitude scaling and automatic interpretation. Clinicians can spot arrhythmias, measure by hand and annotate rhythms as they happen."
      />

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:gap-10">
        <Reveal className="flex flex-col gap-5">
          <Frame src={leadImage} alt="Lead II waveform analysis screen" />
          <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-[#6B5C60]">
            <span className="rounded-full bg-ink px-3 py-1.5 text-[#FF8A3D]">Rhythm: sinus bradycardia</span>
            <span>Amplification · auto smoothing · crash recovery</span>
          </div>
          <p className="border-l-4 border-brand-orange bg-white/60 px-5 py-4 text-lg font-medium leading-snug text-ink">
            Analyses <span className="text-[#B93A00]">10 seconds</span> of all 12 leads and prints
            the report from that same strip.
          </p>
        </Reveal>

        <Reveal delay={0.1} className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-3">
            {analysisMetrics.map((m) => (
              <Readout key={m.label} label={m.label} value={m.value} tone="paper" />
            ))}
          </div>
          <div className="rounded-2xl bg-ink p-6 text-white">
            <p className="font-head text-6xl font-semibold leading-none text-[#FF8A3D]">42</p>
            <p className="mt-3 text-sm leading-relaxed text-white/75">
              findings on our consulting cardiologist's list, including arrhythmias, conduction
              blocks, chamber enlargement, ST and T changes.
            </p>
          </div>
          <div>
            <h3 className="border-b-2 border-ink pb-3 text-xl font-semibold text-ink">
              Automated interpretation, clinician in control
            </h3>
            <p className="mt-3 text-[0.95rem] leading-relaxed text-[#4A3F42]">
              The app interprets on the PC, offline. Cardiologists review, measure and
              annotate before the report is final.
            </p>
            <ul className="mt-2 divide-y divide-ink/15">
              {interpretation.map((i) => (
                <li key={i} className="py-2.5 text-[0.92rem] text-[#4A3F42]">
                  {i}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>

      <div className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
        {blocks.map((b, i) => (
          <Reveal key={b.title} delay={i * 0.06}>
            <h3 className="border-b-2 border-ink pb-3 text-xl font-semibold text-ink">{b.title}</h3>
            <p className="mt-3 text-[0.95rem] leading-relaxed text-[#4A3F42]">{b.body}</p>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
