import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Calendar, Download, Wind, Settings, BarChart3, LineChart, PieChart as PieIcon } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart as RLineChart, Line, PieChart, Pie, Cell } from "recharts";
const deckmountLogo = new URL("../../assets/DeckMount Photo.png", import.meta.url).href;

export default function ReportsAnalytics() {
  const navigate = useNavigate();
  const { state } = useLocation() as { state?: any };
  const [isDarkMode, setIsDarkMode] = useState(() => typeof window !== "undefined" && localStorage.getItem("theme") === "dark");

  const report = useMemo(() => {
    if (state?.dummyReport) return state.dummyReport;
    try {
      const s = localStorage.getItem("report_generated_json");
      if (s) return JSON.parse(s);
    } catch {}
    return null;
  }, [state]);
  const range = useMemo(() => ({
    startDate: report?.header?.range?.startDate || state?.startDate || new Date().toISOString().slice(0, 10),
    endDate: report?.header?.range?.endDate || state?.endDate || new Date().toISOString().slice(0, 10),
    fileName: state?.fileName || localStorage.getItem("report_uploaded_file") || "generated_report.json",
    patient: report?.header?.patient || state?.patient || {
      name: "Demo Patient",
      id: "#DEMO123",
      dob: "1990-01-01",
      gender: "Female",
    },
  }), [state, report]);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    try {
      localStorage.setItem("theme", isDarkMode ? "dark" : "light");
    } catch {}
  }, [isDarkMode]);

  const dates: string[] = report?.charts?.dates || [];
  type SeriesPoint = { date: string; value: number };
  const usageHours: SeriesPoint[] = (report?.charts?.usageHoursDaily || []).map((v: number, i: number) => ({ date: dates[i], value: v }));
  const pressure: SeriesPoint[] = (report?.charts?.pressureDaily || []).map((v: number, i: number) => ({ date: dates[i], value: v }));
  const ahi: SeriesPoint[] = (report?.charts?.ahiDaily || []).map((v: number, i: number) => ({ date: dates[i], value: v }));
  const leak: SeriesPoint[] = (report?.charts?.leakDaily || []).map((v: number, i: number) => ({ date: dates[i], value: v }));
  const tidal: SeriesPoint[] = (report?.charts?.tidalVolumeDaily || []).map((v: number, i: number) => ({ date: dates[i], value: v }));
  const respRate: SeriesPoint[] = (report?.charts?.respRateDaily || []).map((v: number, i: number) => ({ date: dates[i], value: v }));
  const minuteVent: SeriesPoint[] = (report?.charts?.minuteVentDaily || []).map((v: number, i: number) => ({ date: dates[i], value: v }));
  const therapySummary = report?.therapy?.eventsPerHour || { AI: 0, HI: 0, AHI: 0 };
  const deviceInfo = {
    serialNumber: report?.header?.serialNumber || "-",
    deviceModel: report?.header?.deviceModel || "-",
    mode: report?.header?.mode || "-",
    ipap: report?.header?.ipap ?? "-",
    epap: report?.header?.epap ?? "-"
  };
  const usageSummary = report?.usage || { daysUsed: 0, totalDays: 0, ge4HoursDays: 0, lt4HoursDays: 0, usageHoursTotal: 0, averageUsageTotalDays: 0, averageUsageDaysUsed: 0, medianUsageDaysUsed: 0 };
  const PIE_COLORS = ["#14b8a6", "#3b82f6", "#f59e0b"];
  const kpis = {
    avgPressure: pressure.length ? Math.round(pressure.reduce((acc: number, p: SeriesPoint) => acc + p.value, 0) / pressure.length * 10) / 10 : 0,
    compliance: usageSummary.totalDays ? Math.round((usageSummary.ge4HoursDays / usageSummary.totalDays) * 100) : 0,
    leakRate: leak.length ? Math.round(leak.reduce((acc: number, l: SeriesPoint) => acc + l.value, 0) / leak.length * 10) / 10 : 0,
  };

  const onDownload = () => {
    const content = JSON.stringify(report || {}, null, 2);
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report_${range.startDate}_${range.endDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`min-h-screen flex font-sans transition-colors duration-300 ${isDarkMode ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-800"}`}>
      <aside className={`w-64 backdrop-blur-md border-r fixed h-full z-20 hidden md:flex flex-col transition-colors duration-300 ${isDarkMode ? "bg-slate-900/90 border-slate-700" : "bg-white/80 border-slate-200"}`}>
        <div className="p-6">
          <div className={`flex items-center gap-3 font-bold text-xl ${isDarkMode ? "text-white" : "text-slate-800"}`}>
            <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
              <Wind size={20} />
            </div>
            <span>CPAP/BiPAP</span>
          </div>
          <button
            type="button"
            onClick={() => setIsDarkMode((d) => !d)}
            className={`mt-3 inline-flex items-center justify-center rounded-lg ${isDarkMode ? "bg-white/10 ring-1 ring-white/15" : ""} p-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500/40`}
            aria-label="Toggle theme"
          >
            <img src={deckmountLogo} alt="DeckMount" className="h-8 w-auto" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {[
            { name: "Dashboard", icon: LayoutDashboard, to: "/cpap/dashboard" },
            { name: "Reports", icon: Calendar, active: true, to: "/cpap/reports" },
            { name: "Settings", icon: Settings, to: "/cpap/settings" },
          ].map((item) => (
            <button
              key={item.name}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                item.active ? "bg-teal-500/10 text-teal-500 shadow-sm" : isDarkMode ? "text-slate-400 hover:bg-slate-800 hover:text-slate-200" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              }`}
              onClick={() => item.to ? navigate(item.to) : null}
            >
              <item.icon size={18} />
              {item.name}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 md:ml-64 p-8 transition-colors duration-300">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-slate-800"}`}>Therapy Report</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm font-medium text-slate-500 bg-teal-100 dark:bg-teal-900/30 dark:text-teal-400 text-teal-600 px-2 py-0.5 rounded-md">
                File: {range.fileName} • {range.startDate} → {range.endDate}
              </span>
            </div>
          </div>
          <button
            onClick={onDownload}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-teal-500 hover:bg-teal-600 text-white font-semibold shadow-md shadow-teal-500/20 transition-all active:scale-95"
          >
            <Download size={18} />
            Download Report
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`rounded-3xl p-6 shadow-sm border lg:col-span-2 ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={18} className="text-teal-500" />
              <h3 className={`font-bold ${isDarkMode ? "text-white" : "text-slate-700"}`}>Device</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Serial Number</span><span className="font-semibold">{deviceInfo.serialNumber}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Device</span><span className="font-semibold">{deviceInfo.deviceModel}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Mode</span><span className="font-semibold">{deviceInfo.mode}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">IPAP</span><span className="font-semibold">{deviceInfo.ipap}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">EPAP</span><span className="font-semibold">{deviceInfo.epap}</span></div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`rounded-3xl p-6 shadow-sm border lg:col-span-1 ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}>
            <div className="flex items-center gap-2 mb-4">
              <PieIcon size={18} className="text-amber-500" />
              <h3 className={`font-bold ${isDarkMode ? "text-white" : "text-slate-700"}`}>Therapy</h3>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-xl p-3 border text-center">
                <div className="text-xs text-slate-500 dark:text-slate-400">AI</div>
                <div className="mt-1 text-xl font-bold text-teal-500">{therapySummary.AI}</div>
              </div>
              <div className="rounded-xl p-3 border text-center">
                <div className="text-xs text-slate-500 dark:text-slate-400">HI</div>
                <div className="mt-1 text-xl font-bold text-indigo-500">{therapySummary.HI}</div>
              </div>
              <div className="rounded-xl p-3 border text-center">
                <div className="text-xs text-slate-500 dark:text-slate-400">AHI</div>
                <div className="mt-1 text-xl font-bold text-emerald-500">{therapySummary.AHI}</div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 gap-6 mt-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`rounded-3xl p-6 shadow-sm border ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={18} className="text-blue-500" />
              <h3 className={`font-bold ${isDarkMode ? "text-white" : "text-slate-700"}`}>Usage</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm mb-4">
              <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Usage days</span><span className="font-semibold">{usageSummary.daysUsed}/{usageSummary.totalDays}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">≥ 4 hour days</span><span className="font-semibold">{usageSummary.ge4HoursDays}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">&lt; 4 hour days</span><span className="font-semibold">{usageSummary.lt4HoursDays}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Usage hours</span><span className="font-semibold">{usageSummary.usageHoursTotal} Hours</span></div>
              <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Average (Total Days)</span><span className="font-semibold">{usageSummary.averageUsageTotalDays}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Median (Days Used)</span><span className="font-semibold">{usageSummary.medianUsageDaysUsed}</span></div>
            </div>
            <div style={{ width: "100%", height: 240 }}>
              <ResponsiveContainer>
                <BarChart data={usageHours}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#334155" : "#e2e8f0"} />
                  <XAxis dataKey="date" stroke={isDarkMode ? "#94a3b8" : "#64748b"} />
                  <YAxis stroke={isDarkMode ? "#94a3b8" : "#64748b"} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#14b8a6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
           </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`rounded-3xl p-6 shadow-sm border ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}>
            <div className="flex items-center gap-2 mb-4">
              <LineChart size={18} className="text-teal-500" />
              <h3 className={`font-bold ${isDarkMode ? "text-white" : "text-slate-700"}`}>KPIs</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className={`rounded-xl p-4 border ${isDarkMode ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">Compliance</div>
                <div className="mt-2 text-3xl font-bold text-emerald-500">{kpis.compliance}%</div>
              </div>
              <div className={`rounded-xl p-4 border ${isDarkMode ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">Leak Rate</div>
                <div className="mt-2 text-3xl font-bold text-amber-500">{kpis.leakRate} L/min</div>
              </div>
              <div className={`rounded-xl p-4 border col-span-2 ${isDarkMode ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">Average Pressure</div>
                <div className="mt-2 text-2xl font-bold text-blue-500">{kpis.avgPressure} CmH2O</div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 gap-6 mt-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`rounded-3xl p-6 shadow-sm border lg:col-span-1 ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={18} className="text-purple-500" />
              <h3 className={`font-bold ${isDarkMode ? "text-white" : "text-slate-700"}`}>Pressure (cmH2O)</h3>
            </div>
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={pressure}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#334155" : "#e2e8f0"} />
                  <XAxis dataKey="date" stroke={isDarkMode ? "#94a3b8" : "#64748b"} />
                  <YAxis stroke={isDarkMode ? "#94a3b8" : "#64748b"} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`rounded-3xl p-6 shadow-sm border lg:col-span-1 ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={18} className="text-emerald-500" />
              <h3 className={`font-bold ${isDarkMode ? "text-white" : "text-slate-700"}`}>AHI (events/hour)</h3>
            </div>
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={ahi}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#334155" : "#e2e8f0"} />
                  <XAxis dataKey="date" stroke={isDarkMode ? "#94a3b8" : "#64748b"} />
                  <YAxis stroke={isDarkMode ? "#94a3b8" : "#64748b"} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`rounded-3xl p-6 shadow-sm border lg:col-span-1 ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={18} className="text-amber-500" />
              <h3 className={`font-bold ${isDarkMode ? "text-white" : "text-slate-700"}`}>Leak</h3>
            </div>
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={leak}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#334155" : "#e2e8f0"} />
                  <XAxis dataKey="date" stroke={isDarkMode ? "#94a3b8" : "#64748b"} />
                  <YAxis stroke={isDarkMode ? "#94a3b8" : "#64748b"} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 gap-6 mt-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`rounded-3xl p-6 shadow-sm border lg:col-span-1 ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={18} className="text-indigo-500" />
              <h3 className={`font-bold ${isDarkMode ? "text-white" : "text-slate-700"}`}>Tidal Volume</h3>
            </div>
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={tidal}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#334155" : "#e2e8f0"} />
                  <XAxis dataKey="date" stroke={isDarkMode ? "#94a3b8" : "#64748b"} />
                  <YAxis stroke={isDarkMode ? "#94a3b8" : "#64748b"} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`rounded-3xl p-6 shadow-sm border lg:col-span-1 ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={18} className="text-sky-500" />
              <h3 className={`font-bold ${isDarkMode ? "text-white" : "text-slate-700"}`}>Respiratory Rate</h3>
            </div>
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={respRate}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#334155" : "#e2e8f0"} />
                  <XAxis dataKey="date" stroke={isDarkMode ? "#94a3b8" : "#64748b"} />
                  <YAxis stroke={isDarkMode ? "#94a3b8" : "#64748b"} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0ea5e9" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`rounded-3xl p-6 shadow-sm border lg:col-span-1 ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={18} className="text-emerald-500" />
              <h3 className={`font-bold ${isDarkMode ? "text-white" : "text-slate-700"}`}>Minute Ventilation</h3>
            </div>
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={minuteVent}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#334155" : "#e2e8f0"} />
                  <XAxis dataKey="date" stroke={isDarkMode ? "#94a3b8" : "#64748b"} />
                  <YAxis stroke={isDarkMode ? "#94a3b8" : "#64748b"} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#14b8a6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
