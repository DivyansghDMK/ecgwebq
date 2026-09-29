import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Section, SectionHead } from "./ui";

const mode121Light = new URL("../Assets/121LightMode.webp", import.meta.url).href;
const mode121Dark = new URL("../Assets/121_dARKmODE.webp", import.meta.url).href;
const mode121Graph = new URL("../Assets/121GraphMode.webp", import.meta.url).href;
const mode62Light = new URL("../Assets/62LightMode.webp", import.meta.url).href;
const mode62Dark = new URL("../Assets/62DarkMode.webp", import.meta.url).href;
const mode62Graph = new URL("../Assets/62GraphMode.webp", import.meta.url).href;

const themes = ["Light", "Dark", "Graph"] as const;
type Theme = (typeof themes)[number];

const layouts = [
  {
    id: "12x1",
    title: "12:1",
    subtitle: "12 rows, 1 column",
    description:
      "One lead per row in a continuous single column. Suits focused morphology inspection and print-style review.",
    highlights: [
      "Full sequential lead review with a familiar report-like flow",
      "Cleaner long-form reading, one lead per row",
      "Light, Dark and Graph styles"
    ],
    images: { Light: mode121Light, Dark: mode121Dark, Graph: mode121Graph } as Record<Theme, string>
  },
  {
    id: "6x2",
    title: "6:2",
    subtitle: "6 rows, 2 columns",
    description:
      "Leads split into two balanced columns, so related waveforms sit side by side and more fits on one screen.",
    highlights: [
      "Quick cross-lead comparison during live acquisition",
      "More waveform context in one viewport, still readable",
      "Light, Dark and Graph styles"
    ],
    images: { Light: mode62Light, Dark: mode62Dark, Graph: mode62Graph } as Record<Theme, string>
  }
];

const themeCaptions: Record<Theme, string> = {
  Light: "Bright clinical canvas for day-shift review",
  Dark: "Reduced glare for long monitoring sessions",
  Graph: "ECG-paper grid for manual measurement"
};

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-full bg-ink/[0.07] p-1">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          role="radio"
          aria-checked={value === opt}
          onClick={() => onChange(opt)}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B93A00]",
            value === opt ? "bg-ink text-white shadow" : "text-ink/70 hover:text-ink"
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export function ModesShowcase() {
  const [layoutId, setLayoutId] = useState("12x1");
  const [theme, setTheme] = useState<Theme>("Dark");
  const layout = layouts.find((l) => l.id === layoutId) ?? layouts[0];
  const image = layout.images[theme];

  return (
    <Section id="modes">
      <SectionHead
        eyebrow="Display modes"
        title="Two lead layouts, three viewing styles"
        lede="Pick the arrangement that fits the task. 12:1 for lead-by-lead reading, 6:2 for denser comparison. Each comes in Light, Dark and Graph."
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.6fr)] lg:gap-12">
        <div className="flex flex-col gap-7">
          <div>
            <p className="mb-2 font-mono text-[0.68rem] uppercase tracking-[0.2em] text-[#6B5C60]">Layout</p>
            <div className="grid grid-cols-2 gap-3">
              {layouts.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  aria-pressed={l.id === layoutId}
                  onClick={() => setLayoutId(l.id)}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B93A00]",
                    l.id === layoutId ? "border-ink bg-ink text-white" : "border-ink/20 bg-white/50 hover:border-ink/50"
                  )}
                >
                  <span className="block font-head text-2xl font-semibold">{l.title}</span>
                  <span
                    className={cn(
                      "block font-mono text-[0.65rem] uppercase tracking-[0.14em]",
                      l.id === layoutId ? "text-white/60" : "text-[#6B5C60]"
                    )}
                  >
                    {l.subtitle}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 font-mono text-[0.68rem] uppercase tracking-[0.2em] text-[#6B5C60]">Style</p>
            <Segmented label="Viewing style" options={themes} value={theme} onChange={setTheme} />
            <p className="mt-3 text-sm text-[#4A3F42]">{themeCaptions[theme]}</p>
          </div>

          <div>
            <p className="leading-relaxed text-[#4A3F42]">{layout.description}</p>
            <ul className="mt-4 divide-y divide-ink/15 border-y border-ink/15">
              {layout.highlights.map((h) => (
                <li key={h} className="py-3 text-[0.95rem] text-[#4A3F42]">
                  {h}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl bg-ink p-1.5 shadow-[0_18px_40px_-18px_rgba(18,16,15,0.55)] ring-1 ring-black/60 lg:self-start">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-black">
            <AnimatePresence mode="wait" initial={false}>
              <motion.img
                key={image}
                src={image}
                alt={`${layout.title} layout, ${theme} style`}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-contain"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
              />
            </AnimatePresence>
          </div>
        </div>
      </div>
    </Section>
  );
}
