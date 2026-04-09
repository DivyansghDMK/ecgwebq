import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const reviewTools = [
  {
    title: "Magnified Signal Review",
    description:
      "Zoom into waveform segments to inspect local signal morphology, isolate beat-level changes, and support manual validation during report review.",
    image: "/src/Assets/Waveform_Analysis.png",
    caption: "Magnifier mode"
  },
  {
    title: "Ruler-Based Measurement",
    description:
      "Measure intervals and amplitudes directly on fetched ECG data with visual rulers that help clinicians validate RR, PR, and QRS timing by hand.",
    image: "/src/Assets/ruler.png",
    caption: "Ruler tool"
  },
  {
    title: "Caliper Precision Reading",
    description:
      "Use digital calipers for quick manual reading of rhythm spacing and waveform width when a second look is needed before final interpretation.",
    image: "/src/Assets/caliper.png",
    caption: "Caliper tool"
  },
  {
    title: "Manual Annotation Workflow",
    description:
      "Mark suspicious segments, add clinician notes, and save review decisions on top of API-fetched reports for richer downstream analysis.",
    image: "/src/Assets/annotate.png",
    caption: "Annotate mode"
  }
];

const workflowPoints = [
  "Mobile app captures and uploads ECG reports into the review pipeline",
  "Waveform data is fetched through API for secure desktop-side analysis",
  "Clinicians can inspect, measure, annotate, and manually validate difficult rhythms",
  "JSON and PDF outputs stay aligned with reviewed waveform decisions"
];

export function WaveformAnalysisShowcase() {
  return (
    <section id="waveform-analysis" className="mx-auto max-w-6xl px-6 py-24">
      <div className="mb-12 max-w-3xl space-y-4">
        <Badge className="uppercase tracking-[0.4em]">Waveform Analysis</Badge>
        <h2 className="section-heading">
          Review mobile-captured reports with magnification and manual measurement tools
        </h2>
        <p className="section-subheading">
          CardioX brings API-fetched ECG reports from the mobile app into a dedicated
          waveform review workspace. Teams can zoom into local signal segments, take
          manual readings with ruler and caliper tools, and annotate suspicious regions
          before exporting the final clinical report.
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1.35fr_1fr]">
        <motion.div
          className="self-start rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur-xl"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, amount: 0.25 }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-white/50">
                API-Fetched Review Workspace
              </p>
              <h3 className="mt-2 font-display text-2xl text-white">
                Interactive waveform inspection for clinician-led validation
              </h3>
            </div>
            <Badge variant="neutral" className="tracking-[0.3em]">
              Mobile App Report Review
            </Badge>
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70">
            <div className="relative aspect-[16/10] w-full">
              <img
                src="/src/Assets/Waveform_Analysis.png"
                alt="Waveform analysis workspace with magnifier, ruler, caliper, and annotation tools"
                loading="lazy"
                className="absolute inset-0 h-full w-full object-contain object-center p-2"
              />
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {workflowPoints.map((point) => (
              <div
                key={point}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/75"
              >
                {point}
              </div>
            ))}
          </div>
        </motion.div>

        <div className="grid self-start gap-6">
          {reviewTools.map((tool, index) => (
            <motion.div
              key={tool.title}
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: index * 0.08 }}
              viewport={{ once: true, amount: 0.25 }}
            >
              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70">
                    <div className="relative aspect-[16/9] w-full">
                      <img
                        src={tool.image}
                        alt={tool.title}
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-contain object-center p-2"
                      />
                    </div>
                  </div>
                  <p className="text-xs uppercase tracking-[0.35em] text-white/40">
                    {tool.caption}
                  </p>
                  <CardTitle>{tool.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{tool.description}</CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
