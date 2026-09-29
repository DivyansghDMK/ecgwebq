import { useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/* Shared building blocks for the landing page (ECG chart-paper design). */

export function Section({
  id,
  className,
  children
}: {
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn("mx-auto w-full max-w-[84rem] scroll-mt-16 px-5 py-10 sm:px-8 md:py-14", className)}
    >
      {children}
    </section>
  );
}

export function Reveal({
  children,
  delay = 0,
  className
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease: "easeOut" }}
      viewport={{ once: true, amount: 0.15 }}
    >
      {children}
    </motion.div>
  );
}

export function SectionHead({
  eyebrow,
  title,
  lede,
  action,
  className
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-10 flex flex-col gap-6 md:mb-12 lg:flex-row lg:items-end lg:justify-between", className)}>
      <div className="max-w-3xl">
        <div className="ruler mb-4 w-24" aria-hidden />
        <p className="font-mono text-[0.7rem] font-medium uppercase tracking-[0.22em] text-[#B93A00]">
          {eyebrow}
        </p>
        <h2 className="mt-3 text-3xl font-semibold leading-[1.1] text-ink md:text-[2.6rem]">{title}</h2>
        {lede ? <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#4A3F42] md:text-lg">{lede}</p> : null}
      </div>
      {action}
    </div>
  );
}

/** A dark "monitor" bezel that holds a product screenshot. */
export function Frame({
  src,
  alt,
  aspect,
  className
}: {
  src: string;
  alt: string;
  aspect?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl bg-ink p-1.5 shadow-[0_18px_40px_-18px_rgba(18,16,15,0.55)] ring-1 ring-black/60",
        className
      )}
    >
      <div className={cn("relative w-full overflow-hidden rounded-xl bg-black", aspect)}>
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className={aspect ? "absolute inset-0 h-full w-full object-contain" : "block h-auto w-full"}
        />
      </div>
    </div>
  );
}

/** Mono numeric readout, styled like a monitor parameter box. */
export function Readout({
  label,
  value,
  tone = "dark"
}: {
  label: string;
  value: string;
  tone?: "dark" | "paper";
}) {
  return (
    <div
      className={cn(
        "rounded-xl px-4 py-3",
        tone === "dark" ? "bg-white/[0.04] ring-1 ring-white/10" : "bg-white/70 ring-1 ring-black/10"
      )}
    >
      <p
        className={cn(
          "font-mono text-[0.65rem] uppercase tracking-[0.2em]",
          tone === "dark" ? "text-white/50" : "text-[#6B5C60]"
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "mt-1 whitespace-nowrap font-mono text-lg font-medium tabular-nums sm:text-xl",
          tone === "dark" ? "text-[#FF8A3D]" : "text-ink"
        )}
      >
        {value}
      </p>
    </div>
  );
}

/** Scrolling PQRST trace. The path repeats every 2 beats so the loop is seamless. */
const BEAT =
  "h60 c8 0 12 -10 22 -10 c10 0 14 10 22 10 h14 l8 8 l12 -78 l12 100 l8 -30 h28 c14 0 22 -22 38 -22 c16 0 24 22 38 22 h58";
const TRACE_PATH = `M0 70 ${BEAT} ${BEAT} ${BEAT} ${BEAT}`;

export function EcgTrace({ className, color = "#FF6B1A" }: { className?: string; color?: string }) {
  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{
        maskImage: "linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)",
        WebkitMaskImage: "linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)"
      }}
      aria-hidden
    >
      <svg
        className="ecg-scroll h-full w-[200%] max-w-none"
        viewBox="0 0 1280 140"
        preserveAspectRatio="none"
      >
        <path
          d={TRACE_PATH}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="[vector-effect:non-scaling-stroke]"
          style={{ filter: `drop-shadow(0 0 5px ${color})` }}
        />
      </svg>
    </div>
  );
}

export interface ScreenItem {
  title: string;
  kicker?: string;
  description: string;
  image: string;
}

/** Tabbed screenshot viewer: pick an item on the left, see it on the right. */
export function ScreenTabs({ items, aspect }: { items: ScreenItem[]; aspect?: string }) {
  const [active, setActive] = useState(0);
  const current = items[active];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.7fr)] lg:gap-10">
      <div role="tablist" aria-orientation="vertical" className="flex flex-col lg:self-start">
        {items.map((item, i) => {
          const isActive = i === active;
          return (
            <button
              key={item.title}
              role="tab"
              type="button"
              aria-selected={isActive}
              onClick={() => setActive(i)}
              className={cn(
                "group border-t border-ink/15 py-4 pl-4 pr-2 text-left transition-colors last:border-b",
                "border-l-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B93A00]",
                isActive ? "border-l-brand-orange bg-white/60" : "border-l-transparent hover:bg-white/40"
              )}
            >
              <span className="flex items-baseline justify-between gap-3">
                <span
                  className={cn(
                    "font-head text-lg font-semibold leading-snug",
                    isActive ? "text-ink" : "text-ink/70 group-hover:text-ink"
                  )}
                >
                  {item.title}
                </span>
                {item.kicker ? (
                  <span className="shrink-0 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-[#6B5C60]">
                    {item.kicker}
                  </span>
                ) : null}
              </span>
              {isActive ? (
                <span className="mt-2 block text-sm leading-relaxed text-[#4A3F42]">{item.description}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" className="lg:sticky lg:top-24 lg:self-start">
        <div className="overflow-hidden rounded-2xl bg-ink p-1.5 shadow-[0_18px_40px_-18px_rgba(18,16,15,0.55)] ring-1 ring-black/60">
          <div className={cn("relative w-full overflow-hidden rounded-xl bg-black", aspect ?? "aspect-[16/9]")}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.img
                key={current.image}
                src={current.image}
                alt={current.title}
                className="absolute inset-0 h-full w-full object-contain"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              />
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-full bg-brand-orange px-6 py-3 text-sm font-semibold text-ink transition hover:bg-[#ff7d38] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper";

export const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-full border border-ink/25 px-6 py-3 text-sm font-semibold text-ink transition hover:border-ink hover:bg-ink hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper";
