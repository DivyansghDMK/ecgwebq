import { Reveal, ScreenTabs, Section, SectionHead, type ScreenItem } from "./ui";

const waveformAnalysisImage = new URL("../Assets/Waveform_Analysis.webp", import.meta.url).href;
const rulerImage = new URL("../Assets/ruler.webp", import.meta.url).href;
const caliperImage = new URL("../Assets/caliper.webp", import.meta.url).href;
const annotateImage = new URL("../Assets/annotate.webp", import.meta.url).href;

const reviewTools: ScreenItem[] = [
  {
    title: "Magnified signal review",
    kicker: "Magnifier",
    description:
      "Zoom into waveform segments to inspect local morphology, isolate beat-level changes and validate manually during report review.",
    image: waveformAnalysisImage
  },
  {
    title: "Ruler-based measurement",
    kicker: "Ruler",
    description:
      "Measure intervals and amplitudes directly on fetched ECG data. Visual rulers help clinicians check RR, PR and QRS timing by hand.",
    image: rulerImage
  },
  {
    title: "Caliper precision reading",
    kicker: "Caliper",
    description:
      "Digital calipers give a quick manual reading of rhythm spacing and waveform width when a second look is needed before final interpretation.",
    image: caliperImage
  },
  {
    title: "Manual annotation",
    kicker: "Annotate",
    description:
      "Mark suspicious segments, add clinician notes and save review decisions on top of API-fetched reports for downstream analysis.",
    image: annotateImage
  }
];

const workflow = [
  "The mobile app captures ECG reports and uploads them to the review pipeline",
  "Waveform data is fetched through the API for secure desktop-side analysis",
  "Clinicians inspect, measure, annotate and validate difficult rhythms",
  "JSON and PDF outputs stay aligned with the reviewed waveform decisions"
];

export function WaveformAnalysisShowcase() {
  return (
    <Section id="waveform-analysis">
      <SectionHead
        eyebrow="Waveform review workspace"
        title="Review mobile-captured reports with magnifier, ruler and caliper"
        lede="Reports captured in the mobile app open in a dedicated review workspace. Zoom into a segment, take manual readings, annotate suspicious regions, then export the final clinical report."
      />
      <ScreenTabs items={reviewTools} />

      <ol className="mt-14 grid gap-8 border-t border-ink/15 pt-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {workflow.map((step, i) => (
          <Reveal key={step} delay={i * 0.06}>
            <li className="list-none">
              <span className="font-mono text-sm font-medium text-[#B93A00]">Step {i + 1}</span>
              <p className="mt-2 text-[0.95rem] leading-snug text-[#4A3F42]">{step}</p>
            </li>
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}
