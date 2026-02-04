import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const galleryItems = [
  {
    title: "Admin Control Panel",
    description:
      "Manage users, link reports, and sync access across cloud and local infrastructure with zero downtime provisioning.",
    image: "/assets/login-screen.jpg"
  },
  {
    title: "Clinical Dashboard Overview",
    description:
      "Monitor patient sessions, review recent reports, and watch live vitals with responsive widgets built for cardiology teams.",
    image: "/assets/dashboard-overview.jpg"
  },
  {
    title: "ECG 12-Lead Live Test",
    description:
      "Command center view for acquisition and filtering, featuring BPM, PR, QRS, ST, QT/QTc metrics with demo controls.",
    image: "/assets/ecg-12-lead.jpg"
  },
  {
    title: "Control Panel Live",
    description:
      "Live control center with attractive real-time visuals and smooth interactions for demos.",
    image: "/assets/control-panel-live.jpg"
  }
];

export function ExperienceGallery() {
  return (
    <section id="gallery" className="mx-auto max-w-6xl px-6 py-24">
      <div className="mb-12 max-w-3xl space-y-4">
        <Badge className="uppercase tracking-[0.4em]">Experience CardioX</Badge>
        <h2 className="section-heading">
          Explore the desktop experience from diagnostics to analytics
        </h2>
        <p className="section-subheading">
          Walk through the key screens of the Deckmount ECG Monitor. Each stage highlights
          the clinician journey—from administration and dashboards to live ECG acquisition
          and analysis.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {galleryItems.map((item, index) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <Card className="h-full border-white/10 bg-white/5">
              <CardContent className="space-y-4 p-6">
                <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/40">
                  <div className="relative aspect-[16/10] w-full">
                    <img
                    src={item.image}
                      alt={item.title}
                    loading="lazy"
                      className="absolute inset-0 h-full w-full object-contain sm:object-cover"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-display text-xl text-white">{item.title}</h3>
                  <p className="text-sm text-white/70">{item.description}</p>
                </div>
                <p className="text-xs uppercase tracking-[0.35em] text-white/40">
                  {String(index + 1).padStart(2, "0")} • Deckmount CardioX
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

