import { Reveal, Section, SectionHead, btnPrimary } from "./ui";

const supportServices = [
  {
    title: "Deployment & environment setup",
    description:
      "Remote configuration across Windows and macOS, driver installation and automated build pipelines.",
    points: [
      "PyInstaller packaging with signed installers",
      "Multi-device architecture planning (ECG + Oxygen)"
    ]
  },
  {
    title: "Clinical onboarding & training",
    description:
      "Hands-on training so cardiologists, technicians and support staff learn CardioX workflows quickly.",
    points: [
      "Role-focused workshops and certification paths",
      "Custom reporting templates with branding and clinical formatting",
      "Dedicated success engineers and priority response SLAs"
    ]
  },
  {
    title: "Documentation & architecture",
    description:
      "Guides and architectural blueprints that keep your team aligned as you grow.",
    points: [
      "Admin guide and troubleshooting playbooks",
      "Backend/API integration roadmap (FastAPI or Node.js)",
      "Unified platform blueprint ready to scale to respiratory data"
    ]
  }
];

export function SupportSection() {
  return (
    <Section id="support">
      <SectionHead
        eyebrow="Assistance & support"
        title="Deckmount specialists with you from install to training"
        lede="Our team fits CardioX into your clinical workflow, and helps you meet compliance and scaling needs along the way."
        action={
          <a href="mailto:ankur.kumar@deckmount.in" className={btnPrimary}>
            Talk to the solutions team
          </a>
        }
      />
      <div className="grid gap-10 md:grid-cols-3 md:gap-8">
        {supportServices.map((service, i) => (
          <Reveal key={service.title} delay={i * 0.06}>
            <h3 className="border-b-2 border-ink pb-3 text-xl font-semibold text-ink">{service.title}</h3>
            <p className="mt-3 text-[0.95rem] leading-relaxed text-[#4A3F42]">{service.description}</p>
            <ul className="mt-3 divide-y divide-ink/15 border-t border-ink/15">
              {service.points.map((p) => (
                <li key={p} className="py-3 text-[0.92rem] leading-snug text-ink/85">
                  {p}
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
