import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const historyHighlights = [
  "Search reports by patient name and quickly reopen prior ECG sessions",
  "Preview records before opening the full report or sending for review",
  "Track report state across pending, reviewed, and follow-up workflows"
];

export function ReportHistorySection() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.85fr]">
        <motion.div
          className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur-xl"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75 }}
          viewport={{ once: true, amount: 0.25 }}
        >
          <p className="text-xs uppercase tracking-[0.4em] text-white/50">
            ECG Report History
          </p>
          <div className="mt-4 overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70">
            <div className="relative aspect-[16/10] w-full">
              <img
                src="/src/Assets/Report_History.png"
                alt="ECG report history view with search, table, and preview panel"
                loading="lazy"
                className="absolute inset-0 h-full w-full object-contain object-center p-2"
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.65 }}
          viewport={{ once: true, amount: 0.25 }}
        >
          <Card className="w-full border-white/10 bg-white/5">
            <CardContent className="p-6">
              <Badge className="w-fit uppercase tracking-[0.35em]">History & Review</Badge>
              <h3 className="mt-5 font-display text-3xl text-white">
                Search, preview, and reopen archived ECG reports in seconds
              </h3>
              <p className="mt-4 text-sm leading-7 text-white/70">
                CardioX keeps report history organized in a single workspace so teams can
                locate older studies, inspect report metadata, preview selected records,
                and continue review workflows without leaving the platform.
              </p>
              <div className="mt-6 space-y-3">
                {historyHighlights.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/75"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
