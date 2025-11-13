import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const controlFeatures = [
  {
    title: "Precision Controls",
    items: [
      "Switch between 12:1 and 6:2 lead layouts instantly",
      "Printer-ready templates with millimeter calibration",
      "Configurable filters: baseline wander, notch, and muscle artifact"
    ]
  },
  {
    title: "Workflow Automation",
    items: [
      "Auto-save ECG snapshots on session start",
      "Smart timers maintain rhythm fidelity up to 30 minutes",
      "Role-based presets for clinicians, technicians, and home caregivers"
    ]
  }
];

export function ControlPanel() {
  return (
    <section id="control" className="mx-auto max-w-6xl px-6 py-24">
      <div className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-4">
          <Badge className="uppercase tracking-[0.4em]">ECG Control Panel</Badge>
          <h2 className="section-heading">
            Command center for acquisition, filtering, and report capture
          </h2>
          <p className="section-subheading">
            CardioX presents a focused control surface that keeps technicians in flow.
            Configure acquisition modes, engage demo simulations, capture screen
            recordings, and generate diagnostic reports with a single tap—without leaving
            the live view.
          </p>
        </div>
        <Button variant="secondary" className="w-full max-w-xs uppercase tracking-[0.3em]">
          Explore Control Demo
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <motion.div
          className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur-xl"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4">
                <img
                  src="/assets/control-panel-idle.jpg"
                  alt="CardioX control panel idle mode"
                  className="h-60 w-full rounded-2xl object-cover"
                />
                <p className="mt-3 text-xs uppercase tracking-[0.3em] text-white/60">
                  Idle Mode • Awaiting ECG capture
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4">
                <img
                  src="/assets/control-panel-live.jpg"
                  alt="CardioX control panel live mode"
                  className="h-60 w-full rounded-2xl object-cover"
                />
                <p className="mt-3 text-xs uppercase tracking-[0.3em] text-white/60">
                  Live Mode • Demo ON
                </p>
              </div>
            </div>
            <div className="flex flex-col justify-between rounded-3xl border border-white/10 bg-gradient-to-br from-black/60 via-slate-900/60 to-brand-orange/10 p-6">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-brand-electric">
                  Real-time controls
                </p>
                <h3 className="mt-3 font-display text-2xl text-white">
                  Capture, filter, and export without delay
                </h3>
                <p className="mt-4 text-sm text-white/70">
                  Packed with quick actions including screen capture, printer presets,
                  filter tuning, and session recording toggles.
                </p>
              </div>
              <div className="mt-6 space-y-3 text-sm text-white/70">
                <p>• CPU utilization optimized to ~20-30% during live acquisition</p>
                <p>• Memory cleanup run-loop maintains stable baselines</p>
                <p>• Crash logger persists diagnostics for rapid recovery</p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="space-y-6">
          {controlFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true, amount: 0.3 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>
                    {index === 0
                      ? "Fine control over every lead and filter parameter"
                      : "Automated sequences keep patient data in sync"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-white/70">
                  {feature.items.map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                    >
                      {item}
                    </div>
                  ))}
                </CardContent>
                {index === 1 ? (
                  <CardFooter className="text-xs uppercase tracking-[0.3em] text-white/50">
                    Works offline with local fallback and sync queue
                  </CardFooter>
                ) : null}
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

