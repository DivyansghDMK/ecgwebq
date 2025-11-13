import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function CtaSection() {
  return (
    <section
      id="cta"
      className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-[40px] border border-brand-orange/40 bg-gradient-to-br from-brand-orange/40 via-brand-electric/20 to-transparent px-6 py-20 shadow-[0_0_120px_rgba(255,138,61,0.2)]"
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true, amount: 0.5 }}
        className="mx-auto flex max-w-3xl flex-col items-center text-center"
      >
        <Badge variant="neutral" className="tracking-[0.4em] text-slate-950">
          Ready to scale
        </Badge>
        <h2 className="mt-6 font-display text-3xl text-black md:text-4xl">
          Deploy CardioX today and unlock unified cardiopulmonary intelligence
        </h2>
        <p className="mt-4 text-base text-slate-800">
          ECG module is production-ready, backend integration slots are open, and the
          architecture blueprint already includes CPAP, BiPAP, and Oxygen telemetry.
          Let’s build your connected cardiac command center.
        </p>
        <div className="mt-6 space-y-2 text-sm text-slate-800">
          <p>
            <strong>Solutions Team:</strong>{" "}
            <a
              href="mailto:ankur.kumar@deckmount.in"
              className="underline decoration-brand-orange decoration-dashed"
            >
              ankur.kumar@deckmount.in
            </a>
          </p>
          <p>
            <strong>Direct:</strong>{" "}
            <a href="tel:+918700076769" className="underline decoration-brand-orange decoration-dashed">
              +91 87000 76769
            </a>{" "}
            • <strong>Company:</strong>{" "}
            <a href="tel:18003092499" className="underline decoration-brand-orange decoration-dashed">
              1800 309 2499
            </a>
          </p>
          <p>
            <strong>HQ:</strong> 260, Phase IV, Udyog Vihar, Sector 18, Gurugram, Haryana 122015 ·{" "}
            <a
              href="https://deckmount.in/"
              target="_blank"
              rel="noreferrer"
              className="underline decoration-brand-orange decoration-dashed"
            >
              deckmount.in
            </a>
          </p>
        </div>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Button className="min-w-[200px] bg-slate-950 text-white hover:bg-slate-900">
            Schedule Strategy Call
          </Button>
          <Button
            variant="secondary"
            className="min-w-[200px] border-slate-900 bg-white/40 text-slate-900 hover:bg-white/60"
          >
            Download Architecture Deck
          </Button>
        </div>
        <p className="mt-6 text-xs uppercase tracking-[0.35em] text-slate-800/70">
          Bundled installers • API-ready • Offline mode • Crash recovery
        </p>
      </motion.div>
    </section>
  );
}

