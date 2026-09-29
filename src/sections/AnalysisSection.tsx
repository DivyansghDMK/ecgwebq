import { Frame, Readout, Reveal, Section, SectionHead } from "./ui";

const leadImage = new URL("../Assets/Lead_II.png", import.meta.url).href;

const analysisMetrics = [
  { label: "Heart rate", value: "60 bpm" },
  { label: "PR interval", value: "160 ms" },
  { label: "QRS duration", value: "85 ms" },
  { label: "QT/QTc", value: "380/400 ms" }
];

const interpretation = [
  "AI-driven anomaly detection and trend tagging",
  "Layered annotations for multi-specialist collaboration",
  "Export structured insights via JSON or HL7-compatible payloads"
];

const blocks = [
  {
    title: "Automated arrhythmia screening",
    body: "Continuously analyzes live ECG to flag atrial fibrillation, ventricular tachycardia, premature ventricular contractions, sinus bradycardia and sinus tachycardia, and confirms normal sinus rhythm when appropriate."
  },
  {
    title: "Dynamic clinical conclusions",
    body: "Builds a live Findings & Recommendations summary from current ECG metrics and stores each narrative with a time stamp, so clinicians get plain-language notes to review or share."
  },
  {
    title: "Continual model training",
    body: "Annotated ECG waveforms feed convolutional and transformer-based models. Each confirmed diagnosis becomes a labeled frame, and updated models are pushed to the device for on-site detection."
  }
];

export function AnalysisSection() {
  return (
    <Section id="analysis">
      <SectionHead
        eyebrow="Live PQRS analysis"
        title="Waveform intelligence for every lead"
        lede="High-fidelity rendering with zoom, amplitude scaling and AI-generated interpretations. Clinicians can spot trends and arrhythmias and annotate rhythms as they happen."
      />

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:gap-10">
        <Reveal className="flex flex-col gap-5">
          <Frame src={leadImage} alt="Lead II waveform analysis screen" />
          <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-[#6B5C60]">
            <span className="rounded-full bg-ink px-3 py-1.5 text-[#FF8A3D]">Rhythm: sinus bradycardia</span>
            <span>Amplification · auto smoothing · crash recovery</span>
          </div>
          <p className="border-l-4 border-brand-orange bg-white/60 px-5 py-4 text-lg font-medium leading-snug text-ink">
            Records patient signals continuously for 24 hours and produces focused analytics
            for the last <span className="text-[#B93A00]">2 hours</span>.
          </p>
        </Reveal>

        <Reveal delay={0.1} className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-3">
            {analysisMetrics.map((m) => (
              <Readout key={m.label} label={m.label} value={m.value} tone="paper" />
            ))}
          </div>
          <div className="rounded-2xl bg-ink p-6 text-white">
            <p className="font-head text-6xl font-semibold leading-none text-[#FF8A3D]">80+</p>
            <p className="mt-3 text-sm leading-relaxed text-white/75">
              diagnostic ECG patterns recognized, including ischemia, arrhythmias, conduction
              blocks and HRV trends.
            </p>
          </div>
          <div>
            <h3 className="border-b-2 border-ink pb-3 text-xl font-semibold text-ink">
              Automated interpretation, clinician in control
            </h3>
            <p className="mt-3 text-[0.95rem] leading-relaxed text-[#4A3F42]">
              Local and cloud engines interpret rhythms while cardiologists keep manual
              overrides and annotations.
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
