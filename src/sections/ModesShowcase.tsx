import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const modeGroups = [
  {
    id: "12x1",
    title: "12:1 Mode",
    subtitle: "12 rows, 1 column",
    description:
      "Built for uninterrupted vertical lead review, 12:1 mode gives clinicians a continuous single-column reading layout that works especially well for focused morphology inspection, print-style review, and calm side-by-side theme switching.",
    highlights: [
      "Best for full sequential lead review with a familiar report-like flow",
      "Ideal when cardiologists want one lead per row for cleaner long-form reading",
      "Available in Light, Dark, and Graph presentation styles"
    ],
    variants: [
      {
        title: "Light Mode",
        image: "/src/Assets/121LightMode.png",
        caption: "Bright clinical canvas for clear day-shift review"
      },
      {
        title: "Dark Mode",
        image: "/src/Assets/121_dARKmODE.png",
        caption: "Reduced glare for focused long-session monitoring"
      },
      {
        title: "Graph Mode",
        image: "/src/Assets/121GraphMode.png",
        caption: "ECG-paper style overlay for manual trace interpretation"
      }
    ]
  },
  {
    id: "6x2",
    title: "6:2 Mode",
    subtitle: "6 rows, 2 columns",
    description:
      "Designed for compact comparison, 6:2 mode organizes leads into two balanced columns so teams can compare related waveform groups faster while keeping more information visible on a single screen.",
    highlights: [
      "Useful for quick cross-lead comparison during active acquisition",
      "Fits more waveform context in one viewport without losing readability",
      "Supports Light, Dark, and Graph styles for different clinical preferences"
    ],
    variants: [
      {
        title: "Light Mode",
        image: "/src/Assets/62LightMode.png",
        caption: "High-clarity layout for broad lead comparison"
      },
      {
        title: "Dark Mode",
        image: "/src/Assets/62DarkMode.png",
        caption: "Comfortable low-glare monitoring for longer sessions"
      },
      {
        title: "Graph Mode",
        image: "/src/Assets/62GraphMode.png",
        caption: "Grid-backed review for measurement-friendly interpretation"
      }
    ]
  }
];

export function ModesShowcase() {
  return (
    <section id="modes" className="mx-auto max-w-6xl px-6 py-24">
      <div className="mb-12 max-w-3xl space-y-4">
        <Badge className="uppercase tracking-[0.4em]">Display Modes</Badge>
        <h2 className="section-heading">
          Switch between 12:1 and 6:2 layouts across light, dark, and graph views
        </h2>
        <p className="section-subheading">
          CardioX lets clinicians choose the waveform arrangement that best fits the task at
          hand. Use 12:1 for long-form lead-by-lead review, or switch to 6:2 for denser
          comparison across two columns. Each layout is available in Light, Dark, and Graph
          styles so teams can work in the viewing mode that feels most natural.
        </p>
      </div>

      <div className="space-y-12">
        {modeGroups.map((group, groupIndex) => (
          <motion.div
            key={group.id}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: groupIndex * 0.08 }}
            viewport={{ once: true, amount: 0.2 }}
            className="rounded-[36px] border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur-xl"
          >
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.4fr]">
              <div className="space-y-5">
                <div>
                  <Badge variant="neutral" className="tracking-[0.3em]">
                    {group.subtitle}
                  </Badge>
                  <h3 className="mt-4 font-display text-3xl text-white">{group.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-white/70">{group.description}</p>
                </div>

                <div className="space-y-3">
                  {group.highlights.map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/75"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-3">
                {group.variants.map((variant, variantIndex) => (
                  <motion.div
                    key={variant.title}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, delay: variantIndex * 0.08 }}
                    viewport={{ once: true, amount: 0.2 }}
                  >
                    <Card className="border-white/10 bg-slate-950/40">
                      <CardHeader>
                        <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/80">
                          <div className="relative aspect-[16/9] w-full">
                            <img
                              src={variant.image}
                              alt={`${group.title} ${variant.title}`}
                              loading="lazy"
                              className="absolute inset-0 h-full w-full object-contain object-center p-2"
                            />
                          </div>
                        </div>
                        <p className="text-xs uppercase tracking-[0.35em] text-white/40">
                          {variant.title}
                        </p>
                        <CardTitle>{variant.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription>{variant.caption}</CardDescription>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
