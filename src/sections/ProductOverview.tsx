import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const productPillars = [
  {
    title: "Deckmount ECG Monitor",
    subtitle: "Real-time monitoring & analytics",
    description:
      "Desktop-grade application engineered for clinicians, technicians, and home healthcare teams. CardioX keeps critical rhythms visible across every environment."
  },
  {
    title: "Deployment Ready",
    subtitle: "Windows & macOS builds",
    description:
      "Distributed via PyInstaller bundles with offline-first data storage, ensuring hospitals and remote clinics remain connected to insights at all times."
  },
  {
    title: "Secure by Design",
    subtitle: "Cloud + local resilience",
    description:
      "Redundant storage keeps reports safe, with automated sync to CardioX Cloud and encrypted handoff for API integrations."
  }
];

const capabilityHighlights = [
  "Live ECG waveform rendering with hospital-grade filtering",
  "Auto-calculated PR, QRS, QT/QTc, ST, and trajectory metrics",
  "Combined PDF + JSON report generation in one click",
  "Adaptive noise reduction for high-motion capture environments",
  "Unique share links with AWS S3, Azure, GCS, API, FTP, or Dropbox destinations",
  "Offline-first workflows with smart duplicate capture prevention"
];

export function ProductOverview() {
  return (
    <section id="overview" className="mx-auto max-w-6xl px-6 py-24">
      <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <Badge className="uppercase tracking-[0.4em]">Product Overview</Badge>
          <h2 className="mt-6 section-heading">
            Deckmount ECG Monitor empowers continuous cardiac intelligence
          </h2>
          <p className="mt-4 section-subheading">
            Built to detect. Designed to last. CardioX transforms ECG data into
            instantaneous insights while preserving clinician-friendly workflows.
            Optimized for reliability, crash recovery, and rapid deployment across
            hospital networks.
          </p>
          <div className="mt-8 space-y-4 text-sm text-white/70">
            {capabilityHighlights.map((item) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                viewport={{ once: true, amount: 0.5 }}
                className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"
              >
                <span className="mt-1 inline-flex h-2 w-2 flex-none rounded-full bg-brand-electric shadow-glow" />
                <p>{item}</p>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-6">
          {productPillars.map((pillar, index) => (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true, amount: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-brand-electric">{pillar.title}</CardTitle>
                  <Badge variant="neutral" className="tracking-[0.3em]">
                    {pillar.subtitle}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <CardDescription>{pillar.description}</CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

