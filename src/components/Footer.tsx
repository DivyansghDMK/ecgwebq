import { Logo } from "./Logo";
import { Button } from "./ui/button";
import { VisitorStats } from "./VisitorStats";

type FooterLink = {
  label: string;
  href?: string;
};

const footerLinks: Array<{ heading: string; items: FooterLink[] }> = [
  {
    heading: "Platform",
    items: [
      { label: "Product Overview", href: "#overview" },
      { label: "Clinical Dashboard", href: "#dashboard" },
      { label: "Control Panel", href: "#control" },
      { label: "Device Console", href: "#device" }
    ]
  },
  {
    heading: "Resources",
    items: [
      { label: "Documentation Suite", href: "#support" },
      { label: "Architecture Blueprint", href: "#cta" },
      { label: "API Integration", href: "#support" },
      { label: "Support Portal", href: "#support" }
    ]
  },
  {
    heading: "Contact",
    items: [
      { label: "Solutions Team: ankur.kumar@deckmount.in", href: "mailto:ankur.kumar@deckmount.in" },
      { label: "Direct: +91 87000 76769", href: "tel:+918700076769" },
      { label: "Company: 1800 309 2499", href: "tel:18003092499" },
      {
        label: "260, Phase IV, Udyog Vihar, Sector 18, Gurugram, Haryana 122015"
      },
      { label: "deckmount.in", href: "https://deckmount.in/" }
    ]
  }
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-white/10 bg-slate-950/80 backdrop-blur-lg">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-14 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm space-y-6">
          <Logo />
          <p className="text-sm text-white/60">
            CardioX by Deckmount delivers real-time ECG monitoring, analytics, and secure
            report management trusted by clinicians worldwide.
          </p>
          <Button variant="secondary" className="uppercase tracking-[0.3em]">
            Book a Demo
          </Button>
        </div>
        <div className="grid flex-1 grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {footerLinks.map((column) => (
            <div key={column.heading} className="space-y-4 min-w-0">
              <p className="text-xs uppercase tracking-[0.35em] text-white/40">
                {column.heading}
              </p>
              <ul className="space-y-2 text-sm text-white/70 break-words">
                {column.items.map((item) => (
                  <li key={item.label} className="break-words">
                    {item.href ? (
                      <a
                        href={item.href}
                        className="transition hover:text-white break-all"
                        target={item.href.startsWith("http") ? "_blank" : undefined}
                        rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                      >
                        {item.label}
                      </a>
                    ) : (
                      <span className="break-words">{item.label}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="space-y-4 min-w-[250px] sm:col-span-2 lg:col-span-1 lg:min-w-[280px]">
            <VisitorStats />
          </div>
        </div>
      </div>
      <div className="border-t border-white/5 py-6 text-center text-xs uppercase tracking-[0.35em] text-white/50">
        © {new Date().getFullYear()} Deckmount Healthcare. All rights reserved.
      </div>
    </footer>
  );
}

