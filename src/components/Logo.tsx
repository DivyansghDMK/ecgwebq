import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <motion.div
        className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-electric via-brand-orange to-brand-focus shadow-glow"
        animate={{
          boxShadow: [
            "0 0 40px rgba(255, 138, 61, 0.25)",
            "0 0 30px rgba(255, 138, 61, 0.15)",
            "0 0 40px rgba(255, 138, 61, 0.25)"
          ]
        }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <span className="font-display text-xl font-semibold text-slate-950">CX</span>
      </motion.div>
      <div>
        <p className="font-display text-lg font-semibold uppercase tracking-[0.3em] text-brand-electric">
          CardioX
        </p>
        <p className="text-xs uppercase tracking-[0.3em] text-white/60">
          by Deckmount
        </p>
      </div>
    </div>
  );
}

