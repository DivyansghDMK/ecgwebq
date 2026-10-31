import { Frame, Reveal, Section, SectionHead } from "./ui";

const liveImage = new URL("../Assets/ControlPanel.webp", import.meta.url).href;
const overlayImage = new URL("../Assets/121GraphMode.webp", import.meta.url).href;

const groups = [
  {
    title: "Precision controls",
    items: [
      "Switch between 12:1, 6:2 and 4:3 lead layouts instantly",
      "Printer-ready templates with millimeter calibration",
      "Configurable filters: baseline wander, 50/60 Hz notch and muscle artifact"
    ]
  },
  {
    title: "Workflow automation",
    items: [
      "Auto-save ECG snapshots on session start",
      "Smart timers maintain rhythm fidelity up to 30 minutes",
      "Role-based presets for clinicians, technicians, and home caregivers"
    ],
    note: "Works offline with local fallback and sync queue"
  },
  {
    title: "Runs light",
    items: [
      "CPU use held to about 20–30% during live acquisition",
      "Heavy analysis runs in the background, so the live trace never stalls",
      "Crash logger keeps diagnostics for fast recovery"
    ]
  }
];

export function ControlPanel() {
  return (
    <Section id="control">
      <SectionHead
        eyebrow="ECG control panel"
        title="Capture, filter and export without leaving the live view"
        lede="A focused control surface keeps technicians in flow. Set acquisition modes, run demo simulations, record the screen and generate a diagnostic report in a tap."
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Reveal>
          <Frame src={liveImage} alt="CardioX control panel with 12 live leads" />
          <p className="mt-3 font-mono text-xs uppercase tracking-[0.18em] text-[#6B5C60]">Live · 12 leads, 3 × 4 layout</p>
        </Reveal>
        <Reveal delay={0.08}>
          <Frame src={overlayImage} alt="CardioX control panel with the graph overlay open" />
          <p className="mt-3 font-mono text-xs uppercase tracking-[0.18em] text-[#6B5C60]">Graph overlay · ECG-paper view</p>
        </Reveal>
      </div>

      <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
        {groups.map((group, i) => (
          <Reveal key={group.title} delay={i * 0.06}>
            <h3 className="border-b-2 border-ink pb-3 text-xl font-semibold text-ink">{group.title}</h3>
            <ul className="divide-y divide-ink/15">
              {group.items.map((item) => (
                <li key={item} className="py-3 text-[0.95rem] leading-snug text-[#4A3F42]">
                  {item}
                </li>
              ))}
            </ul>
            {group.note ? (
              <p className="mt-2 font-mono text-[0.65rem] uppercase tracking-[0.16em] text-[#B93A00]">{group.note}</p>
            ) : null}
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
