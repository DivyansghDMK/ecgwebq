import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const metrics = [
  { label: "HR", value: "60 BPM" },
  { label: "PR", value: "160 ms" },
  { label: "QRS", value: "85 ms" },
  { label: "Axis", value: "0°" },
  { label: "QT/QTc", value: "380/400 ms" },
  { label: "Session", value: "00:21" }
];

const reports = [
  { title: "2025-11-12 15:16 | ECG Report", status: "Open" },
  { title: "2025-11-10 16:04 | ECG Report", status: "Open" },
  { title: "2025-11-10 14:35 | ECG Report", status: "Open" }
];

export function DashboardShowcase() {
  return (
    <section id="dashboard" className="mx-auto max-w-6xl px-6 py-24">
      <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
        <div className="max-w-xl space-y-6">
          <Badge className="uppercase tracking-[0.4em]">
            Clinical Operations Dashboard
          </Badge>
          <h2 className="section-heading">
            Monitor every cardiac parameter in real time
          </h2>
          <p className="section-subheading">
            CardioX aggregates live ECG signals, clinical annotations, and patient
            history into a single responsive dashboard. Designed for real-world
            cardiology labs with multi-patient monitoring.
          </p>
          <ul className="space-y-3 text-sm text-white/70">
            <li>• Dynamic calendar for scheduled ECG reviews and stress tests</li>
            <li>• AI-generated conclusions with clinician override workflow</li>
            <li>• Quick access to recent reports and collaborative comments</li>
          </ul>
        </div>
        <motion.div
          className="w-full max-w-3xl rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur-2xl"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 px-6 py-4">
            <div>
              <p className="text-sm uppercase tracking-[0.4em] text-white/50">
                ECG Monitor
              </p>
              <h3 className="mt-1 font-display text-lg text-white">
                Good Afternoon, Dr. Patel
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="success" className="tracking-[0.3em]">
                LIVE
              </Badge>
              <Badge variant="neutral" className="tracking-[0.3em]">
                ECG Lead Test 12
              </Badge>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {metrics.map((metric) => (
              <Card key={metric.label} className="border-white/10 bg-white/5">
                <CardContent className="space-y-3 p-5">
                  <p className="text-xs uppercase tracking-[0.4em] text-white/50">
                    {metric.label}
                  </p>
                  <p className="font-display text-2xl text-white">{metric.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-[1.5fr_1fr]">
            <Card className="border-white/10 bg-white/5">
              <CardContent className="p-6">
                <p className="text-xs uppercase tracking-[0.4em] text-white/60">
                  ECG Recording — Lead II
                </p>
                <div className="mt-4 h-40 w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60">
                  <img
                    src="/assets/dashboard-overview.jpg"
                    alt="ECG dashboard overview"
                    className="h-full w-full object-cover"
                  />
                </div>
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-white/5">
              <CardContent className="space-y-4 p-6">
                <p className="text-xs uppercase tracking-[0.4em] text-white/60">
                  Recent Reports
                </p>
                {reports.map((report) => (
                  <div
                    key={report.title}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70"
                  >
                    <p>{report.title}</p>
                    <button className="text-brand-electric hover:underline">
                      {report.status}
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

