import { AutoCarousel } from "@/components/AutoCarousel";
import { Reveal, Section, SectionHead } from "./ui";

const dashboardImage = new URL("../Assets/Dashboard.webp", import.meta.url).href;
const controlPanelImage = new URL("../Assets/ControlPanel.webp", import.meta.url).href;
const leadImage = new URL("../Assets/Lead_II.png", import.meta.url).href;
const loginImage = new URL("../Assets/Login.webp", import.meta.url).href;
const reportImage = new URL("../Assets/121GraphMode.webp", import.meta.url).href;

const deviceStats = [
  { label: "Sampling rate", value: "1000 sps", unit: "per lead" },
  { label: "ADC resolution", value: "24 bit", unit: "" },
  { label: "Recording window", value: "2 hrs", unit: "up to" }
];

const deviceFeatures = [
  {
    title: "Filtering & Signal Conditioning",
    description:
      "Clinical-grade filtering stack keeps every waveform pristine in high-noise environments.",
    bullets: [
      "ECG / EMG adaptive filters with anti-drift baseline removal",
      "Selectable cut-offs: 0.05 / 0.5 Hz baseline, 25 / 35 / 40 / 150 Hz low-pass",
      "Common-mode rejection ratio greater than 120 dB"
    ]
  },
  {
    title: "Input & Protection Architecture",
    description:
      "Engineered input circuitry delivers resilience for critical care deployments.",
    bullets: [
      "Isolated input stages with defibrillator discharge protection",
      "Inter-channel variance under 0.5 mm for consistent morphology",
      "Integrated shielding to combat mains and RF interference"
    ]
  },
  {
    title: "Acquisition & Recording Modes",
    description:
      "Flexible acquisition workflows keep your team in control of every test session.",
    bullets: [
      "12-channel and 3-channel recording modes",
      "Paper speed presets: 12.5 / 25 / 50 mm per second",
      "USB and UART COM ports for printer & accessory integration"
    ]
  },
  {
    title: "Connectivity & Storage",
    description:
      "Deckmount Device stays online and synced even in hybrid networks.",
    bullets: [
      "Wi-Fi, Bluetooth, and secure cloud connectivity",
      "Local + cloud report repository with 1,500 patient records",
      "AWS-compatible protocol with built-in duplicate prevention"
    ]
  },
  {
    title: "Performance & Telemetry",
    description:
      "Real-time metrics tuned for clinical accuracy at every heart rate.",
    bullets: [
      "ECG amplifier uses DC coupling with live artifact filtering",
      "Heart rate meter range: 40–300 bpm (±10 bpm)",
      "Latency-optimized pipeline for bedside monitoring"
    ]
  },
  {
    title: "Device Experience",
    description:
      "Reliable patient-side experience with ergonomic hardware and smart firmware.",
    bullets: [
      "7\" LCD display for waveform preview and status indicators",
      "Single charge delivers up to 2 hours or 200 ECG recordings",
      "Rule-based algorithms deliver live interpretations"
    ]
  }
];

export function AdminSection() {
  return (
    <Section id="device">
      <SectionHead
        eyebrow="Device specifications"
        title="Hardware engineered to keep every signal stable, end to end"
        lede="From analog front end to cloud protocol, the CardioX device pairs hospital-grade accuracy with smart connectivity. This is the stack behind the 12-lead ECG."
      />

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:gap-8">
        <Reveal>
          <div className="overflow-hidden rounded-2xl bg-ink p-1.5 shadow-[0_18px_40px_-18px_rgba(18,16,15,0.55)] ring-1 ring-black/60">
            <div className="overflow-hidden rounded-xl bg-black">
              <AutoCarousel
                className="aspect-[16/9] w-full rounded-none"
                images={[
                  { src: dashboardImage, alt: "Clinical dashboard overview" },
                  { src: controlPanelImage, alt: "Control panel live mode" },
                  { src: leadImage, alt: "Lead II detailed analysis" },
                  { src: loginImage, alt: "Secure login portal" },
                  { src: reportImage, alt: "12-lead ECG in graph mode" }
                ]}
                interval={3500}
              />
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1} className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 lg:grid-rows-3">
          {deviceStats.map((stat) => (
            <div key={stat.label} className="flex flex-col justify-center rounded-2xl bg-ink px-6 py-5 text-white">
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-white/50">{stat.label}</p>
              <p className="mt-1 font-mono text-3xl font-medium tabular-nums text-[#FF8A3D] md:text-4xl">
                {stat.value}
              </p>
              {stat.unit ? <p className="font-mono text-xs uppercase tracking-[0.16em] text-white/40">{stat.unit}</p> : null}
            </div>
          ))}
        </Reveal>
      </div>

      <div className="mt-14 divide-y divide-ink/15 border-y border-ink/15">
        {deviceFeatures.map((feature, index) => (
          <Reveal key={feature.title} delay={(index % 3) * 0.05}>
            <div className="grid gap-4 py-7 md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] md:gap-10">
              <div>
                <h3 className="text-xl font-semibold text-ink">{feature.title}</h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-[#4A3F42]">{feature.description}</p>
              </div>
              <ul className="grid gap-x-8 gap-y-2 text-[0.95rem] text-ink/85 lg:grid-cols-1">
                {feature.bullets.map((b) => (
                  <li key={b} className="flex gap-3 leading-snug">
                    <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-brand-orange" aria-hidden />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </div>
      <p className="mt-4 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-[#6B5C60]">
        Firmware-ready for future cardiopulmonary modules
      </p>
    </Section>
  );
}
