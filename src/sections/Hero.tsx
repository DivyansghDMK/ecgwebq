import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CardioX3DModel } from "@/components/CardioX3DModel";

export function Hero() {
  return (
    <section
      id="hero"
      className="relative flex min-h-screen items-center justify-center overflow-hidden pt-24"
    >
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-background opacity-60" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,138,61,0.15),rgba(9,11,22,0.95))]" />
        <div className="absolute inset-0 bg-grid-dark bg-[size:40px_40px] opacity-40" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9 }}
        className="relative mx-auto flex w-full max-w-6xl flex-col items-center gap-12 px-6 text-center"
      >
        <Badge className="uppercase tracking-[0.4em]">
          Built to Detect. Designed to Last.
        </Badge>
        <div className="space-y-6">
          <h1 className="font-display text-4xl leading-tight md:text-6xl">
            CardioX by Deckmount
          </h1>
          <p className="mx-auto max-w-2xl text-base text-white/70 md:text-lg">
            Experience a new era of ECG intelligence with live waveform analysis,
            predictive alerts, and an intuitive control center engineered for
            cardiologists and clinical teams.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button className="min-w-[200px] uppercase tracking-[0.3em]">
            Launch Live Demo
          </Button>
          <Button variant="secondary" className="min-w-[200px] tracking-[0.3em]">
            Download Brochure
          </Button>
        </div>

        <motion.div
          className="relative mt-12 w-full max-w-5xl"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-black/60 via-slate-900/60 to-black/60 p-8 shadow-2xl backdrop-blur-xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,138,61,0.1),transparent)]" />
            <div className="relative h-[500px] w-full md:h-[600px]">
              <CardioX3DModel className="rounded-2xl" />
            </div>
          </div>
        </motion.div>

        <div className="relative mt-16 w-full max-w-4xl rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
          <div className="grid gap-6 md:grid-cols-[1.2fr_1fr] md:gap-8">
            <motion.div
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 p-6"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true, amount: 0.4 }}
            >
              <p className="text-sm uppercase tracking-[0.4em] text-white/60">
                CARDIOX LIVE LOGIN
              </p>
              <h2 className="mt-4 font-display text-2xl text-white">
                Secure Clinical Portal
              </h2>
              <p className="mt-3 text-sm text-white/70">
                Authenticate via hospital ID, phone number, or biometric passkeys.
                Designed for rapid access without compromising security.
              </p>
              <div className="mt-6 w-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-black via-slate-900 to-slate-950 shadow-inner">
                <div className="relative aspect-[16/10] w-full">
                  <img
                    src="/assets/login-screen.jpg"
                    alt="CardioX Login Screen"
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-contain object-center opacity-90 sm:object-cover"
                  />
                </div>
              </div>
            </motion.div>

            <motion.div
              className={cn(
                "glass-panel flex flex-col gap-4 self-center border border-brand-orange/40 p-6 text-left",
                "shadow-[0_0_60px_rgba(255,138,61,0.2)]"
              )}
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.35 }}
              viewport={{ once: true, amount: 0.4 }}
            >
              <p className="text-xs uppercase tracking-[0.4em] text-brand-electric">
                Live Metric Snapshot
              </p>
              <div className="grid grid-cols-3 gap-3 text-center text-white">
                {[
                  ["HR", "60 BPM"],
                  ["PR", "160 ms"],
                  ["QTc", "400 ms"]
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-white/10 bg-white/5 px-3 py-4"
                  >
                    <p className="text-[0.65rem] uppercase tracking-[0.3em] text-white/50">
                      {label}
                    </p>
                    <p className="mt-2 font-display text-lg text-white">{value}</p>
                  </div>
                ))}
              </div>
              <p className="text-sm text-white/70">
                Real-time waveform monitoring with AI-assisted arrhythmia detection.
              </p>
              <Button variant="ghost" className="justify-between px-4 text-sm">
                Watch an ECG session replay <span aria-hidden>→</span>
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

