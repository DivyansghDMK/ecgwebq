import { Check } from "lucide-react";
import { Reveal, Section, SectionHead } from "./ui";

const productPillars = [
  {
    title: "Deckmount ECG Monitor",
    subtitle: "Real-time monitoring & analytics",
    description:
      "Desktop-grade application engineered for clinicians, technicians, and home healthcare teams. CardioX keeps critical rhythms visible across every environment."
  },
  {
    title: "Deployment ready",
    subtitle: "Windows installer, automatic updates",
    description:
      "One Windows installer that updates itself. Runs smoothly on older Core i3 PCs. Reports are saved on the PC first and sync once a connection is available, so clinics with unreliable internet keep working."
  },
  {
    title: "Secure by design",
    subtitle: "Licensed, encrypted, compiled",
    description:
      "Each PC carries a licence signed on our server and checked by the app. Logs are encrypted on the PC, the app is a compiled build, and the cloud keys it carries can only upload reports."
  }
];

const capabilityHighlights = [
  "Live ECG waveform rendering with hospital-grade filtering",
  "Auto-calculated HR, PR, QRS, QT/QTc, axis and ST in every lead",
  "12-lead, HRV and hyperkalaemia reports as PDF + JSON in one click",
  "Adaptive noise reduction for high-motion capture environments",
  "Send finished reports to the storage your team already uses, from S3 and Azure to FTP and Dropbox",
  "Offline-first workflows with smart duplicate capture prevention"
];

export function ProductOverview() {
  return (
    <Section id="overview">
      <SectionHead
        eyebrow="Product"
        title="Continuous cardiac monitoring that keeps working when the network doesn't"
        lede="CardioX turns ECG data into instant readings while keeping the workflow clinicians already know. Built for reliability, crash recovery and quick rollout across hospital networks."
      />

      <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
        <div className="divide-y divide-ink/15 border-y border-ink/15">
          {productPillars.map((pillar, i) => (
            <Reveal key={pillar.title} delay={i * 0.06}>
              <div className="grid gap-2 py-6 sm:grid-cols-[13rem_1fr] sm:gap-8">
                <div>
                  <h3 className="text-xl font-semibold text-ink">{pillar.title}</h3>
                  <p className="mt-1 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-[#B93A00]">
                    {pillar.subtitle}
                  </p>
                </div>
                <p className="leading-relaxed text-[#4A3F42]">{pillar.description}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <div className="h-full rounded-2xl bg-ink p-6 text-white shadow-[0_18px_40px_-18px_rgba(18,16,15,0.55)] sm:p-8">
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-[#FF8A3D]">What it does</p>
            <ul className="mt-5 space-y-4">
              {capabilityHighlights.map((item) => (
                <li key={item} className="flex items-start gap-3 text-[0.95rem] leading-snug text-white/85">
                  <Check className="mt-0.5 h-4 w-4 flex-none text-[#FF8A3D]" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
