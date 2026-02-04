import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const supportServices = [
  {
    title: "Deployment & Environment Setup",
    description:
      "Remote configuration assistance across Windows and macOS, driver installation, and automated build pipelines.",
    points: [
      "PyInstaller packaging with signed installers",
      "Multi-device architecture planning (ECG + CPAP + BiPAP + Oxygen)",
      "Cloud provisioning for AWS S3, Azure, GCS, API, FTP, or Dropbox"
    ]
  },
  {
    title: "Clinical Onboarding & Training",
    description:
      "Hands-on training for cardiologists, technicians, and support staff to master CardioX workflows quickly.",
    points: [
      "Role-focused workshops and certification paths",
      "Custom reporting templates with branding and clinical formatting",
      "Dedicated success engineers and priority response SLAs"
    ]
  },
  {
    title: "Documentation & Architecture",
    description:
      "Keep your team aligned with comprehensive guides and future-proof architectural blueprints.",
    points: [
      "Admin guide and troubleshooting playbooks",
      "Backend/API integration roadmap (FastAPI or Node.js)",
      "Unified platform blueprint ready to scale to respiratory data"
    ]
  }
];

export function SupportSection() {
  return (
    <section id="support" className="mx-auto max-w-6xl px-6 py-24">
      <div className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl space-y-4">
          <Badge className="uppercase tracking-[0.4em]">Assistance & Support</Badge>
          <h2 className="section-heading">
            Partner with Deckmount specialists every step of the way
          </h2>
          <p className="section-subheading">
            From deployment to staff training, our team ensures CardioX integrates
            seamlessly into your clinical workflow while meeting compliance and scaling
            needs.
          </p>
        </div>
        <Button asChild className="uppercase tracking-[0.3em]">
          <a href="mailto:ankur.kumar@deckmount.in">Talk to Solutions Team</a>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {supportServices.map((service, index) => (
          <motion.div
            key={service.title}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle>{service.title}</CardTitle>
                <CardDescription>{service.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-white/70">
                {service.points.map((point) => (
                  <div key={point} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    {point}
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

