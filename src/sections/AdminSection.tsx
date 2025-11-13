import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { AutoCarousel } from "@/components/AutoCarousel";

const deviceStats = [
  { label: "Sampling Rate", value: "500 sps / lead" },
  { label: "ADC Resolution", value: "12–16 bit" },
  { label: "Recording Window", value: "Up to 2 hrs" }
];

const deviceFeatures = [
  {
    title: "Filtering & Signal Conditioning",
    description:
      "Clinical-grade filtering stack keeps every waveform pristine in high-noise environments.",
    bullets: [
      "ECG / EMG adaptive filters with anti-drift baseline removal",
      "Configurable cut-offs for artifact suppression (10–20 Hz window)",
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
      "AI-assisted algorithms deliver live interpretations"
    ]
  }
];

export function AdminSection() {
  return (
    <section id="device" className="mx-auto max-w-6xl px-6 py-24">
      <div className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl space-y-4">
          <Badge className="uppercase tracking-[0.4em]">Device Feature Map</Badge>
          <h2 className="section-heading">
            CardioX device engineering keeps every signal stable end to end
          </h2>
          <p className="section-subheading">
            From analog front-end design to cloud protocols, CardioX hardware blends
            hospital-grade accuracy with smart connectivity. Explore the device stack that
            powers our 12-lead ECG experience.
          </p>
        </div>
        <Badge variant="neutral" className="uppercase tracking-[0.4em]">
          Built for clinical uptime
        </Badge>
      </div>

      <motion.div
        className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur-xl"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true, amount: 0.3 }}
      >
        <p className="text-xs uppercase tracking-[0.4em] text-white/60">
          Device Console • Live telemetry
        </p>
        <div className="mt-4 overflow-hidden rounded-3xl border border-white/10 bg-slate-950/60">
          <AutoCarousel
            className="aspect-[16/10] w-full"
            images={[
              { src: "/assets/ecg-12-lead.jpg", alt: "CardioX device live telemetry" },
              { src: "/assets/control-panel-live.jpg", alt: "Control panel live mode" },
              { src: "/assets/control-panel-idle.jpg", alt: "Control panel idle mode" },
              { src: "/assets/dashboard-overview.jpg", alt: "Clinical dashboard overview" },
              { src: "/assets/analysis-lead-ii.jpg", alt: "Lead II detailed analysis" },
              { src: "/assets/login-screen.jpg", alt: "Secure login portal" }
            ]}
            interval={3000}
          />
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {deviceStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70"
            >
              <p className="text-xs uppercase tracking-[0.35em] text-white/40">{stat.label}</p>
              <p className="mt-2 font-display text-xl text-white md:text-2xl">{stat.value}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {deviceFeatures.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: (index % 3) * 0.1 }}
            viewport={{ once: true, amount: 0.2 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-white/70">
                {feature.bullets.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                  >
                    {item}
                  </div>
                ))}
              </CardContent>
              {index === deviceFeatures.length - 1 ? (
                <CardFooter className="text-xs uppercase tracking-[0.3em] text-white/50">
                  Firmware-ready for future cardiopulmonary modules
                </CardFooter>
              ) : null}
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

