import { Frame, Reveal, Section } from "./ui";

const reportHistoryImage = new URL("../Assets/Report_History.png", import.meta.url).href;

const historyHighlights = [
  "Search reports by patient name and reopen prior ECG sessions",
  "Preview a record before opening the full report or sending it for review",
  "Track each report as pending, reviewed or follow-up"
];

export function ReportHistorySection() {
  return (
    <Section id="reports" className="pt-0 md:pt-0">
      <div className="grid items-center gap-8 lg:grid-cols-[1.45fr_1fr] lg:gap-14">
        <Reveal>
          <Frame src={reportHistoryImage} alt="ECG report history with search, table and preview panel" />
        </Reveal>
        <Reveal delay={0.1}>
          <div className="ruler mb-4 w-24" aria-hidden />
          <p className="font-mono text-[0.7rem] font-medium uppercase tracking-[0.22em] text-[#B93A00]">
            Report history
          </p>
          <h2 className="mt-3 text-3xl font-semibold leading-[1.1] text-ink md:text-[2.3rem]">
            Find any archived ECG in seconds
          </h2>
          <p className="mt-4 leading-relaxed text-[#4A3F42]">
            Reports live in one workspace, so teams can locate older studies, check their
            metadata, preview them and carry on with the review without leaving the app.
          </p>
          <ul className="mt-6 divide-y divide-ink/15 border-y border-ink/15">
            {historyHighlights.map((item) => (
              <li key={item} className="py-3.5 text-[0.95rem] text-[#4A3F42]">
                {item}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </Section>
  );
}
