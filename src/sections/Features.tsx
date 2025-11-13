import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Activity, BrainCircuit, Smartphone, Stethoscope } from "lucide-react";

const featureData = [
  {
    icon: BrainCircuit,
    title: "AI Rhythm Intelligence",
    description:
      "Deckmount's neural engine interprets live PQRS patterns, highlights anomalies instantly, and learns from every clinical review.",
    badge: "Synced with CardioX Cloud"
  },
  {
    icon: Activity,
    title: "12-Lead Precision",
    description:
      "Visualize every lead with ultra-low latency. Fine-tuned scaling ensures accurate waveform morphology for cardiology diagnostics.",
    badge: "FDA-ready pipeline"
  },
  {
    icon: Smartphone,
    title: "Omni-Channel Access",
    description:
      "Access the CardioX experience across desktop dashboards, tablet command centers, and mobile companion apps with a unified login.",
    badge: "Secure clinical mobility"
  },
  {
    icon: Stethoscope,
    title: "Clinical Workflow Control",
    description:
      "Configure filters, acquisition modes, and reporting templates from a single control panel built for high-volume cardiac labs.",
    badge: "Deckmount certified"
  }
];

export function Features() {
  return (
    <section id="features" className="relative mx-auto max-w-6xl px-6 py-24">
      <div className="mb-12 max-w-3xl">
        <Badge variant="neutral" className="uppercase tracking-[0.4em] text-white/80">
          Engineered for cardiology teams
        </Badge>
        <h2 className="mt-6 section-heading">
          Everything your ECG lab needs in one beautifully orchestrated platform
        </h2>
        <p className="mt-4 section-subheading">
          Move from signal capture to actionable insight with CardioX. Every module
          reflects the workflows of electrophysiologists, technicians, and clinical
          administrators.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {featureData.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            viewport={{ once: true, amount: 0.2 }}
          >
            <Card className="h-full">
              <CardHeader>
                <feature.icon className="h-10 w-10 text-brand-electric" />
                <CardTitle>{feature.title}</CardTitle>
                <Badge className="tracking-[0.3em]">{feature.badge}</Badge>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

