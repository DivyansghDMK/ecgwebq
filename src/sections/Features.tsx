import { Activity, BookOpenCheck, Smartphone, Stethoscope } from "lucide-react";
import { Reveal, Section, SectionHead } from "./ui";

const featureData = [
  {
    icon: BookOpenCheck,
    title: "Interpretation by the rules",
    description:
      "Every finding follows published ECG criteria, with thresholds confirmed by our consulting cardiologist. A finding prints only when all of its criteria are met on the recording.",
    tag: "Tested on 113,395 labelled ECGs"
  },
  {
    icon: Activity,
    title: "12-lead precision",
    description:
      "See every lead live in 12:1, 6:2 or 4:3 layouts at calibrated 25 mm/s and 10 mm/mV, so waveform morphology reads true.",
    tag: "Fluke simulator tested"
  },
  {
    icon: Smartphone,
    title: "Access anywhere",
    description:
      "Record on the Rhythm Ultra Android app or straight into the desktop over USB, then review the same report on the desktop or the web review page.",
    tag: "Desktop · Android · Web"
  },
  {
    icon: Stethoscope,
    title: "Clinical workflow control",
    description:
      "Set filters, layouts and report details from one control panel. A filter you choose applies to every screen and every printed report.",
    tag: "Same filters everywhere"
  }
];

export function Features() {
  return (
    <Section id="features" className="pt-0 md:pt-0">
      <SectionHead
        eyebrow="Built for cardiology teams"
        title="Everything your ECG lab needs, in one platform"
        lede="From signal capture to a signed report, each module follows how electrophysiologists, technicians and clinic administrators actually work."
      />
      <div className="grid gap-y-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-y-0 lg:divide-x lg:divide-ink/15 lg:border-y lg:border-ink/15">
        {featureData.map((feature, i) => (
          <Reveal key={feature.title} delay={i * 0.06} className="lg:px-7 lg:py-8 lg:first:pl-0 lg:last:pr-0">
            <feature.icon className="h-7 w-7 text-[#B93A00]" aria-hidden />
            <h3 className="mt-5 text-xl font-semibold text-ink">{feature.title}</h3>
            <p className="mt-3 text-[0.95rem] leading-relaxed text-[#4A3F42]">{feature.description}</p>
            <p className="mt-4 font-mono text-[0.65rem] uppercase tracking-[0.16em] text-[#6B5C60]">{feature.tag}</p>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
