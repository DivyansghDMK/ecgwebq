import { Logo } from "./Logo";
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
        label: "683, Udyog Vihar, Phase 5, Gurugram, Haryana 122016, India"
      },
      { label: "deckmount.in", href: "https://deckmount.in/" }
    ]
  }
];

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-ink text-white">
      <div className="mx-auto flex w-full max-w-[84rem] flex-col gap-12 px-6 py-14 sm:px-8 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm space-y-6">
          <Logo />
          <p className="text-sm text-white/60">
            CardioX by Deckmount delivers real-time ECG monitoring, analytics, and secure
            report management trusted by clinicians worldwide.
          </p>
          <a
            href="mailto:ankur.kumar@deckmount.in?subject=CardioX%20demo%20request"
            className="inline-flex rounded-full bg-brand-orange px-6 py-2.5 text-sm font-semibold text-ink transition hover:bg-[#ff7d38]"
          >
            Book a demo
          </a>
        </div>
        <div className="grid flex-1 grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.5fr]">
          {footerLinks.map((column) => (
            <div key={column.heading} className="space-y-4 min-w-0">
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-white/40">
                {column.heading}
              </p>
              <ul className="space-y-2 text-sm text-white/70 break-words">
                {column.items.map((item) => (
                  <li key={item.label} className="break-words">
                    {item.href ? (
                      <a
                        href={item.href}
                        className="transition hover:text-white break-words"
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
        </div>
      </div>
      <div className="border-t border-white/5 py-6 text-center font-mono text-[0.68rem] uppercase tracking-[0.2em] text-white/45">
        © {new Date().getFullYear()} Deckmount Healthcare. All rights reserved.
      </div>
    </footer>
  );
}

