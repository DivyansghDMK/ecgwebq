import React, { useState } from "react";
import { UploadCloud, AlertCircle } from "lucide-react";
import { ECGLeadChart, ECGPoint } from "./ECGLeadChart";
import { computeECGMetrics } from "@/utils/ecgCalculations";

type LeadName =
  | "I"
  | "II"
  | "III"
  | "aVR"
  | "aVL"
  | "aVF"
  | "V1"
  | "V2"
  | "V3"
  | "V4"
  | "V5"
  | "V6";

interface ECGJson {
  sampling_rate: number;
  leads: Record<LeadName, number[]>;
}

const LEAD_GRID: LeadName[][] = [
  ["I", "II", "III"],
  ["aVR", "aVL", "aVF"],
  ["V1", "V2", "V3"],
  ["V4", "V5", "V6"],
];

// Plot window in seconds
const WINDOW_SECONDS = 6;

const LEAD_COLORS: Record<LeadName, string> = {
  I: "#f97373",
  II: "#22c55e",
  III: "#38bdf8",
  aVR: "#10b981",
  aVL: "#eab308",
  aVF: "#ec4899",
  V1: "#6366f1",
  V2: "#8b5cf6",
  V3: "#06b6d4",
  V4: "#fb923c",
  V5: "#22c55e",
  V6: "#f97316",
};

interface ParsedECGData {
  samplingRate: number;
  pointsByLead: Record<LeadName, ECGPoint[]>;
}

// Clinical summary metrics – values will be wired later
const METRICS = ["BPM", "PR", "QRS", "P", "QT/QTc"];

const ECGGraphsPage: React.FC = () => {
  const [parsedData, setParsedData] = useState<ParsedECGData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<{
    bpm: number | null;
    pr: number | null;
    qrs: number | null;
    p: number | null;
    qt: number | null;
    qtc: number | null;
  }>({
    bpm: null,
    pr: null,
    qrs: null,
    p: null,
    qt: null,
    qtc: null,
  });

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = async (
    event
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setParsedData(null);
    setMetrics({
      bpm: null,
      pr: null,
      qrs: null,
      p: null,
      qt: null,
      qtc: null,
    });
    setFileName(file.name);

    if (!/^ecg_data_.*\.json$/i.test(file.name)) {
      setError(
        "Warning: File name does not match expected pattern ecg_data_*.json. Parsing will still be attempted."
      );
    }

    try {
      const text = await file.text();
      const json = JSON.parse(text) as ECGJson;

      if (
        typeof json.sampling_rate !== "number" ||
        !json.leads ||
        typeof json.leads !== "object"
      ) {
        throw new Error("Invalid ECG JSON format.");
      }

      const samplingRate = json.sampling_rate;
      if (samplingRate <= 0) {
        throw new Error("Sampling rate must be a positive number.");
      }

      const maxSamples = Math.floor(WINDOW_SECONDS * samplingRate);
      const pointsByLead: Record<LeadName, ECGPoint[]> = {
        I: [],
        II: [],
        III: [],
        aVR: [],
        aVL: [],
        aVF: [],
        V1: [],
        V2: [],
        V3: [],
        V4: [],
        V5: [],
        V6: [],
      };

      (Object.keys(pointsByLead) as LeadName[]).forEach((lead) => {
        const values = json.leads[lead];
        if (!Array.isArray(values)) {
          throw new Error(`Lead ${lead} is missing or not an array.`);
        }
        const sliced = values.slice(0, maxSamples);
        pointsByLead[lead] = sliced.map((value, index) => ({
          t: index / samplingRate,
          value,
        }));
      });

      setParsedData({ samplingRate, pointsByLead });

      // Compute ECG summary metrics from Lead II
      const leadII = json.leads["II"];
      if (Array.isArray(leadII) && leadII.length > 0) {
        const m = computeECGMetrics(leadII, samplingRate);
        setMetrics(m);
      }
    } catch (err) {
      console.error(err);
      setParsedData(null);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to parse ECG JSON file. Please check the format."
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* File upload (comes first) */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Upload ECG JSON
            </h3>
            <p className="text-xs text-slate-500">
              Select a file named like <code>ecg_data_*.json</code> to preview
              12‑lead ECG waveforms for the first {WINDOW_SECONDS} seconds.
            </p>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-md hover:from-orange-600 hover:to-amber-600">
            <UploadCloud size={16} />
            <span>Choose JSON file</span>
            <input
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        </div>
        {fileName && (
          <p className="mt-2 text-xs text-slate-600">
            Selected file: <span className="font-medium">{fileName}</span>
          </p>
        )}
        {error && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            <AlertCircle size={14} className="mt-[2px] flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}
      </section>

      {/* Metrics + 12‑lead graphs combined card */}
      <section className="rounded-2xl bg-white shadow-sm border border-slate-200 px-6 py-5 space-y-4">
        {/* Metrics strip in one line */}
        <div className="flex flex-wrap items-center justify-between gap-6">
          {METRICS.map((label) => {
            let display = "--";
            if (label === "BPM" && metrics.bpm != null) {
              display = metrics.bpm.toString();
            } else if (label === "PR" && metrics.pr != null) {
              display = `${Math.round(metrics.pr)} ms`;
            } else if (label === "QRS" && metrics.qrs != null) {
              display = `${Math.round(metrics.qrs)} ms`;
            } else if (label === "P" && metrics.p != null) {
              display = `${Math.round(metrics.p)} ms`;
            } else if (label === "QT/QTc" && metrics.qt != null && metrics.qtc != null) {
              display = `${Math.round(metrics.qt)}/${Math.round(metrics.qtc)} ms`;
            }

            return (
              <div key={label} className="flex flex-col items-center min-w-[80px]">
                <span className="text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase">
                  {label}
                </span>
                <span className="mt-1 text-2xl font-bold text-slate-900">{display}</span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-2">
          <h2 className="text-lg font-semibold text-slate-900">
            12‑Lead ECG Graphs
          </h2>
          {parsedData && (
            <p className="text-xs text-slate-500">
              Sampling rate:{" "}
              <span className="font-medium">
                {parsedData.samplingRate} Hz
              </span>{" "}
              • Window:{" "}
              <span className="font-medium">
                0–{WINDOW_SECONDS} s
              </span>{" "}
              • Amplitude
              range: <span className="font-medium">‑4096 to +4096</span>
            </p>
          )}
        </div>

        {!parsedData ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-12 text-center">
            <p className="text-sm font-medium text-slate-700">
              Upload an ECG JSON file above to view the 12‑lead waveforms.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Expected structure includes <code>sampling_rate</code> and 12
              leads (I, II, III, aVR, aVL, aVF, V1–V6).
            </p>
          </div>
        ) : (
          <div className="grid gap-4 pt-2">
            {LEAD_GRID.map((row, rowIndex) => (
              <div
                key={rowIndex}
                className="grid gap-4 md:grid-cols-3 md:gap-3"
              >
                {row.map((lead) => (
                  <ECGLeadChart
                    key={lead}
                    leadName={lead}
                    data={parsedData.pointsByLead[lead]}
                    color={LEAD_COLORS[lead]}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default ECGGraphsPage;


