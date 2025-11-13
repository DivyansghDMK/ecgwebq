import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const analysisMetrics = [
  {
    label: "Heart Rate",
    value: "60 bpm",
    status: "Normal"
  },
  {
    label: "PR Interval",
    value: "160 ms",
    status: "Normal"
  },
  {
    label: "QRS Duration",
    value: "85 ms",
    status: "Normal"
  },
  {
    label: "QT/QTc",
    value: "380 / 400 ms",
    status: "Measured"
  }
];

export function AnalysisSection() {
  return (
    <section id="analysis" className="mx-auto max-w-6xl px-6 py-24">
      <div className="mb-12 max-w-3xl space-y-4">
        <Badge className="uppercase tracking-[0.4em]">Live PQRS Analysis</Badge>
        <h2 className="section-heading">
          Advanced waveform intelligence for every lead
        </h2>
        <p className="section-subheading">
          CardioX delivers high-fidelity waveform rendering with zoom controls,
          amplitude scaling, and AI-generated interpretations. Clinicians can surface
          trends, spot arrhythmias, and annotate rhythms in real time.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <motion.div
          className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur-xl"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          <p className="text-xs uppercase tracking-[0.4em] text-white/60">
            Lead II • Detailed waveform analysis
          </p>
          <div className="mt-4 h-[320px] overflow-hidden rounded-3xl border border-white/10 bg-slate-950/60">
            <img
              src="/assets/analysis-lead-ii.jpg"
              alt="Lead II waveform analysis screen"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <Badge variant="neutral" className="tracking-[0.3em]">
              Rhythm Interpretation: Sinus Bradycardia
            </Badge>
            <p className="text-xs uppercase tracking-[0.35em] text-white/50">
              Amplification controls • Auto smoothing • Crash recovery
            </p>
          </div>
        </motion.div>

        <div className="space-y-6">
          <motion.div
            className="rounded-3xl border border-white/10 bg-white/5 p-6"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <h3 className="font-display text-2xl text-white">
              Automated interpretations with clinician oversight
            </h3>
            <p className="mt-3 text-sm text-white/70">
              Combined local + cloud engines interpret thousands of rhythms, while
              cardiologists retain full control with manual overrides and annotations.
            </p>
            <ul className="mt-5 space-y-3 text-sm text-white/70">
              <li>• AI-driven anomaly detection and trend tagging</li>
              <li>• Layered annotations for multi-specialist collaboration</li>
              <li>• Export structured insights via JSON or HL7-compatible payloads</li>
            </ul>
          </motion.div>

          <motion.div
            className="grid gap-4 md:grid-cols-2"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            {analysisMetrics.map((metric) => (
              <Card key={metric.label} className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle>{metric.label}</CardTitle>
                  <Badge variant="neutral" className="tracking-[0.3em]">
                    {metric.status}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-lg text-white">
                    {metric.value}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

