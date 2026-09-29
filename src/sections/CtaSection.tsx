import { EcgTrace, Reveal, Section, btnPrimary } from "./ui";

const EMAIL_HREF =
  "mailto:ankur.kumar@deckmount.in?subject=CardioX%20Clinical%20Inquiry&body=Hi%20Deckmount%20team%2C%0A%0AI%20am%20interested%20in%20connecting%20with%20you%20about%20CardioX.%20Please%20reach%20out%20with%20the%20next%20steps.%0A%0ARegards%2C%0A";

const contacts = [
  { label: "Solutions team", text: "ankur.kumar@deckmount.in", href: "mailto:ankur.kumar@deckmount.in" },
  { label: "Direct", text: "+91 87000 76769", href: "tel:+918700076769" },
  { label: "Company", text: "1800 309 2499", href: "tel:18003092499" },
  { label: "Web", text: "deckmount.in", href: "https://deckmount.in/" }
];

export function CtaSection() {
  return (
    <Section id="cta" className="py-8 md:py-12">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl bg-ink px-6 py-14 text-white shadow-[0_30px_80px_-30px_rgba(18,16,15,0.6)] sm:px-12 md:py-20">
          <EcgTrace className="pointer-events-none absolute inset-x-0 top-1/2 h-40 -translate-y-1/2 opacity-[0.18]" />
          <div className="relative mx-auto max-w-3xl text-center">
            <p className="font-mono text-[0.72rem] uppercase tracking-[0.24em] text-[#FF8A3D]">Ready to deploy</p>
            <h2 className="mt-4 font-head text-3xl font-semibold leading-[1.1] md:text-5xl">
              Bring ECG and oxygen data into one place
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/70">
              The ECG module is production-ready, backend integration slots are open, and
              the architecture already includes oxygen telemetry.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <a href="tel:+918700076769" className={btnPrimary}>
                Schedule a call
              </a>
              <a
                href={EMAIL_HREF}
                className="inline-flex items-center rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white transition hover:border-white hover:bg-white/10"
              >
                Email the team
              </a>
            </div>
            <dl className="mt-12 grid gap-x-8 gap-y-4 border-t border-white/15 pt-8 text-left sm:grid-cols-2">
              {contacts.map((c) => (
                <div key={c.label}>
                  <dt className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-white/45">{c.label}</dt>
                  <dd>
                    <a
                      href={c.href}
                      target={c.href.startsWith("http") ? "_blank" : undefined}
                      rel={c.href.startsWith("http") ? "noreferrer" : undefined}
                      className="text-white/90 underline decoration-white/30 underline-offset-4 transition hover:decoration-white"
                    >
                      {c.text}
                    </a>
                  </dd>
                </div>
              ))}
              <div className="sm:col-span-2">
                <dt className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-white/45">HQ</dt>
                <dd className="text-white/80">683, Udyog Vihar, Phase 5, Gurugram, Haryana 122016</dd>
              </div>
            </dl>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
