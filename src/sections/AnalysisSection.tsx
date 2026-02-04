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
        <div className="space-y-6">
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
            <div className="mt-4 overflow-hidden rounded-3xl border border-white/10 bg-slate-950/60">
              <div className="relative aspect-[16/10] w-full md:aspect-[16/9]">
                <img
                  src="/assets/analysis-lead-ii.jpg"
                  alt="Lead II waveform analysis screen"
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-contain sm:object-cover"
                />
              </div>
            </div>
            <div className="mt-6 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <Badge variant="neutral" className="tracking-[0.3em]">
                  Rhythm Interpretation: Sinus Bradycardia
                </Badge>
                <p className="text-xs uppercase tracking-[0.35em] text-white/50">
                  Amplification controls • Auto smoothing • Crash recovery
                </p>
              </div>
              <p className="rounded-3xl border border-white/10 bg-gradient-to-r from-brand-orange/15 via-brand-electric/10 to-transparent px-6 py-5 text-base font-semibold text-white md:text-lg">
                It can record patient signals continuously for 24 hours and generate focused
                analytics covering the last <span className="font-bold text-brand-electric">2 hours</span>.
              </p>
            </div>
          </motion.div>

          <motion.div
            className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur-xl"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">
              Waveform insights library
            </p>
            <ul className="mt-4 space-y-3 text-sm text-white/80">
              {[
                "Atrial arrhythmias: atrial fibrillation, flutter, supraventricular tachycardia, junctional rhythms",
                "Ventricular events: ventricular ectopics, ventricular tachycardia, premature ventricular complexes",
                "Conduction changes: AV blocks (first, second, high-grade), bundle branch blocks, WPW patterns",
                "Ischemia profiles: anterior, inferior, lateral, and septal myocardial infarction variations"
              ].map((item) => (
                <li
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 leading-relaxed"
                >
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-xs uppercase tracking-[0.35em] text-white/50">
              Reference templates keep clinicians aligned on morphology decisions
            </p>
          </motion.div>

          <motion.div
            className="rounded-3xl border-2 border-brand-electric/50 bg-gradient-to-br from-brand-electric/10 via-brand-orange/5 to-transparent p-6 shadow-glow"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <div className="mb-3 flex items-center gap-2">
              <Badge className="bg-brand-electric/20 text-brand-electric uppercase tracking-[0.3em]">
                Core Algorithms
              </Badge>
            </div>
            <h4 className="font-display text-xl text-white">Advanced Signal Processing</h4>
            <p className="mt-3 text-sm text-white/80">
              Uses advanced signal processing to automatically detect heartbeats, filter noise,
              and identify irregular rhythms. Adapts to different heart rates and provides stable,
              accurate readings.
            </p>
            <div className="mt-5 space-y-3 text-xs text-white/70">
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5">
                <span className="font-semibold text-brand-electric">Pan-Tompkins QRS Detection:</span>{" "}
                Industry-standard algorithm with bandpass filtering, differentiation, and adaptive peak detection
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5">
                <span className="font-semibold text-brand-electric">Multi-Strategy Detection:</span>{" "}
                Automatically selects optimal strategy (Conservative 40–120 BPM, Normal 100–180 BPM, Tight 160–300 BPM)
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5">
                <span className="font-semibold text-brand-electric">Butterworth Filtering:</span>{" "}
                4th-order bandpass filter (0.5–40 Hz) removes noise and baseline wander
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5">
                <span className="font-semibold text-brand-electric">Statistical Arrhythmia Detection:</span>{" "}
                Atrial fibrillation, ventricular tachycardia, PVCs, bradycardia/tachycardia, and normal sinus rhythm analysis
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5">
                <span className="font-semibold text-brand-electric">PQRST Wave Detection:</span>{" "}
                Identifies all ECG waveform components with QRS axis calculation using Lead I and aVF vectors
              </div>
            </div>
          </motion.div>
        </div>

        <div className="space-y-6">
          <motion.div
            className="grid gap-6"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
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
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h4 className="font-display text-xl text-white">
                Automated Arrhythmia Screening
              </h4>
              <p className="mt-3 text-sm text-white/70">
                Continuously analyzes live ECG to flag atrial fibrillation, ventricular
                tachycardia, premature ventricular contractions, sinus bradycardia, and
                sinus tachycardia—confirming normal sinus rhythm when appropriate.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h4 className="font-display text-xl text-white">Dynamic Clinical Conclusions</h4>
              <p className="mt-3 text-sm text-white/70">
                Builds a live Findings & Recommendations summary from current ECG metrics,
                storing narratives with time stamps so clinicians have instant,
                plain-language insights to review or share.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h4 className="font-display text-xl text-white">AI Image Model Training</h4>
              <p className="mt-3 text-sm text-white/70">
                CardioX incorporates a continual learning pipeline where annotated ECG waveforms
                feed convolutional and transformer-based models. Each confirmed diagnosis becomes
                a labeled frame, enriching the dataset for future inference cycles.
              </p>
              <ul className="mt-4 space-y-3 text-sm text-white/70">
                <li>• Curates ECG images with clinician-approved labels before training.</li>
                <li>• Uses data augmentation to preserve morphology while expanding diversity.</li>
                <li>• Pushes updated models to the device for on-site arrhythmia detection.</li>
              </ul>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h4 className="font-display text-xl text-white">CardioX Diagnostic Coverage</h4>
              <p className="mt-3 text-sm text-white/70">
                Our CardioX engine recognizes over 80 diagnostic ECG patterns—including
                ischemia, arrhythmias, conduction blocks, and nuanced HRV trends.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
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
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

