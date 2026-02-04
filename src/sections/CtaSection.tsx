import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function CtaSection() {
  return (
    <section
      id="cta"
      className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-[40px] border border-brand-orange/40 bg-gradient-to-br from-brand-orange/60 via-brand-electric/30 to-brand-orange/10 px-6 py-20 text-white shadow-[0_0_120px_rgba(255,138,61,0.28)]"
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
        <h2 className="mt-6 font-display text-3xl text-white md:text-4xl">
          Deploy CardioX today and unlock unified cardiopulmonary intelligence
        </h2>
        <p className="mt-4 text-base text-white/80">
          ECG module is production-ready, backend integration slots are open, and the
          architecture blueprint already includes CPAP, BiPAP, and Oxygen telemetry.
          Let’s build your connected cardiac command center.
        </p>
        <div className="mt-6 space-y-2 text-sm text-white/80">
          <p>
            <strong>Solutions Team:</strong>{" "}
            <a
              href="mailto:ankur.kumar@deckmount.in"
              className="underline decoration-white/70 decoration-dashed"
            >
              ankur.kumar@deckmount.in
            </a>
          </p>
          <p>
            <strong>Direct:</strong>{" "}
            <a href="tel:+918700076769" className="underline decoration-white/70 decoration-dashed">
              +91 87000 76769
            </a>{" "}
            • <strong>Company:</strong>{" "}
            <a href="tel:18003092499" className="underline decoration-white/70 decoration-dashed">
              1800 309 2499
            </a>
          </p>
          <p>
            <strong>HQ:</strong> 260, Phase IV, Udyog Vihar, Sector 18, Gurugram, Haryana 122015 ·{" "}
            <a
              href="https://deckmount.in/"
              target="_blank"
              rel="noreferrer"
              className="underline decoration-white/70 decoration-dashed"
            >
              deckmount.in
            </a>
          </p>
        </div>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Button asChild className="min-w-[200px] bg-slate-950 text-white hover:bg-slate-800">
            <a href="tel:+918700076769">Schedule Strategy Call</a>
          </Button>
          <Button
            variant="secondary"
            className="min-w-[200px] border-white/50 bg-white/20 text-white hover:bg-white/40"
          >
            Download Architecture Deck
          </Button>
        </div>
        <div className="mt-6 flex flex-col gap-2 text-xs uppercase tracking-[0.35em] text-white/60 sm:flex-row sm:items-center sm:justify-center">
          <span>Bundled installers • API-ready • Offline mode • Crash recovery</span>
          <Button
            asChild
            variant="ghost"
            className="mt-2 inline-flex w-auto rounded-full border border-white/30 bg-white/10 px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-white hover:bg-white/20 sm:mt-0"
          >
            <a href="mailto:ankur.kumar@deckmount.in?subject=CardioX%20Clinical%20Inquiry&body=Hi%20Deckmount%20team%2C%0A%0AI%20am%20interested%20in%20connecting%20with%20you%20about%20CardioX.%20Please%20reach%20out%20with%20the%20next%20steps.%0A%0ARegards%2C%0A">
              Connect via Email
            </a>
          </Button>
        </div>
      </motion.div>
    </section>
  );
}

