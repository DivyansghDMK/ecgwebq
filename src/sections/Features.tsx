import { Activity, BrainCircuit, Smartphone, Stethoscope } from "lucide-react";
import { Reveal, Section, SectionHead } from "./ui";

const featureData = [
  {
    icon: BrainCircuit,
    title: "AI rhythm intelligence",
    description:
      "Deckmount's neural engine interprets live PQRS patterns, highlights anomalies instantly, and learns from every clinical review.",
    tag: "Synced with CardioX Cloud"
  },
  {
    icon: Activity,
    title: "12-lead precision",
    description:
      "Visualize every lead with ultra-low latency. Fine-tuned scaling ensures accurate waveform morphology for cardiology diagnostics.",
    tag: "FDA-ready pipeline"
  },
  {
    icon: Smartphone,
    title: "Access anywhere",
    description:
      "Use CardioX across desktop dashboards, tablet command centers, and mobile companion apps with a single login.",
    tag: "Secure clinical mobility"
  },
  {
    icon: Stethoscope,
    title: "Clinical workflow control",
    description:
      "Configure filters, acquisition modes, and reporting templates from a single control panel built for high-volume cardiac labs.",
    tag: "Deckmount certified"
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
