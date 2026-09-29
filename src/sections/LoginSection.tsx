import { Link } from "react-router-dom";
import { Activity, ArrowRight, Wind } from "lucide-react";
import { Reveal, Section, SectionHead } from "./ui";

const loginOptions = [
  {
    id: "ecg",
    title: "ECG",
    description: "Monitoring and analysis dashboard for cardiologists and clinical teams.",
    icon: Activity,
    route: "/login",
    disabled: false,
    accent: "border-t-brand-orange",
    iconClass: "bg-brand-orange/15 text-[#B93A00]"
  },
  {
    id: "cpap-bipap",
    title: "CPAP / BiPAP",
    description: "Therapy dashboards, reports, modes and machine settings.",
    icon: Wind,
    route: "/cpap/login",
    disabled: true,
    accent: "border-t-teal-600",
    iconClass: "bg-teal-600/15 text-teal-800"
  }
];

export function LoginSection() {
  return (
    <Section id="login-section">
      <SectionHead
        eyebrow="Secure access"
        title="Choose your platform"
        lede="Sign in to the dashboard for the device you work with."
      />
      <div className="grid gap-6 md:grid-cols-2">
        {loginOptions.map((option, i) => (
          <Reveal key={option.id} delay={i * 0.08}>
            {option.disabled ? (
              <div
                aria-disabled="true"
                className={`flex h-full cursor-not-allowed flex-col rounded-2xl border border-ink/15 border-t-4 bg-white/50 p-7 opacity-75 ${option.accent}`}
              >
                <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${option.iconClass}`}>
                  <option.icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-5 text-2xl font-semibold text-ink">Log in for {option.title}</h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-[#4A3F42]">{option.description}</p>
                <span className="mt-8 inline-flex w-fit rounded-full bg-ink/[0.07] px-3 py-1 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-ink/70">
                  Under construction
                </span>
              </div>
            ) : (
              <Link
                to={option.route}
                className={`group flex h-full flex-col rounded-2xl border border-ink/15 border-t-4 bg-white/75 p-7 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_18px_40px_-20px_rgba(18,16,15,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink ${option.accent}`}
              >
                <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${option.iconClass}`}>
                  <option.icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-5 text-2xl font-semibold text-ink">Log in for {option.title}</h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-[#4A3F42]">{option.description}</p>
                <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-ink">
                  Continue
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden />
                </span>
              </Link>
            )}
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
