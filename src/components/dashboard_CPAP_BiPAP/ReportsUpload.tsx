import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, UploadCloud, FileCheck2, Calendar, Wind, Settings, User, Cpu, ChevronLeft, ChevronRight } from "lucide-react";
const deckmountLogo = new URL("../../assets/DeckMount Photo.png", import.meta.url).href;

export default function ReportsUpload() {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(() => typeof window !== "undefined" && localStorage.getItem("theme") === "dark");
  const [fileName, setFileName] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [currentYear, setCurrentYear] = useState(Math.min(2050, Math.max(1990, new Date().getFullYear())));
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const years = Array.from({ length: 2050 - 1990 + 1 }, (_, i) => 1990 + i);
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const leadingEmpty = Array(firstDayOfMonth).fill(0);
  const today = new Date();
  const [selectionMode, setSelectionMode] = useState<"start" | "end">("start");
  const [rangeStart, setRangeStart] = useState<Date | null>(new Date());
  const [rangeEnd, setRangeEnd] = useState<Date | null>(new Date());

  const patient = useMemo(
    () => ({
      name: "Kanishka Sharma",
      id: "#889KMT889",
      dob: "2002-05-13",
      gender: "Female",
      deviceUID: localStorage.getItem("report_device_number") || "7012026272",
      phone: localStorage.getItem("report_admin_phone") || "8521478653",
    }),
    []
  );

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    try {
      localStorage.setItem("theme", isDarkMode ? "dark" : "light");
    } catch {}
  }, [isDarkMode]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFileName(f.name);
      try {
        localStorage.setItem("report_uploaded_file", f.name);
      } catch {}
    }
  };

  const goPrevMonth = () => {
    const prevMonth = currentMonth - 1;
    if (prevMonth < 0) {
      if (currentYear > 1990) {
        setCurrentYear(currentYear - 1);
        setCurrentMonth(11);
      }
    } else {
      setCurrentMonth(prevMonth);
    }
  };

  const goNextMonth = () => {
    const nextMonth = currentMonth + 1;
    if (nextMonth > 11) {
      if (currentYear < 2050) {
        setCurrentYear(currentYear + 1);
        setCurrentMonth(0);
      }
    } else {
      setCurrentMonth(nextMonth);
    }
  };

  const onSelectDay = (day: number) => {
    const d = new Date(currentYear, currentMonth, day);
    if (selectionMode === "start") {
      setRangeStart(d);
      const iso = d.toISOString().slice(0, 10);
      setStartDate(iso);
      try { localStorage.setItem("report_start_date", iso); } catch {}
      if (rangeEnd && d > rangeEnd) {
        setRangeEnd(d);
        const endIso = d.toISOString().slice(0, 10);
        setEndDate(endIso);
        try { localStorage.setItem("report_end_date", endIso); } catch {}
      }
    } else {
      setRangeEnd(d);
      const iso = d.toISOString().slice(0, 10);
      setEndDate(iso);
      try { localStorage.setItem("report_end_date", iso); } catch {}
      if (rangeStart && d < rangeStart) {
        setRangeStart(d);
        const startIso = d.toISOString().slice(0, 10);
        setStartDate(startIso);
        try { localStorage.setItem("report_start_date", startIso); } catch {}
      }
    }
  };

  const onGenerate = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    const dates: string[] = Array.from({ length: days }, (_, i) => {
      const d = new Date(start.getTime());
      d.setDate(start.getDate() + i);
      return d.toISOString().slice(0, 10);
    });
    const seed = 17;
    const rnd = (i: number, min: number, max: number) => {
      const x = Math.sin(i * seed) * 10000;
      const frac = x - Math.floor(x);
      return Math.round((min + frac * (max - min)) * 10) / 10;
    };
    const mode = "BiPAP (ST MODE)";
    const ipap = 12;
    const epap = 6;
    const usageHoursDaily = dates.map((_, i) => rnd(i + 1, 0, 8));
    const pressureDaily = dates.map((_, i) => rnd(i + 2, 8, 14));
    const ahiDaily = dates.map((_, i) => rnd(i + 3, 0, 1));
    const hiDaily = dates.map((_, i) => rnd(i + 4, 0, 1));
    const aiDaily = dates.map((_, i) => rnd(i + 5, 0, 0.5));
    const leakDaily = dates.map((_, i) => rnd(i + 6, 0, 60));
    const tidalVolumeDaily = dates.map((_, i) => Math.round(rnd(i + 7, 300, 600)));
    const respRateDaily = dates.map((_, i) => Math.round(rnd(i + 8, 10, 20)));
    const minuteVentDaily = dates.map((_, i) => rnd(i + 9, 2, 6));
    const daysUsed = usageHoursDaily.filter(h => h > 0).length;
    const ge4 = usageHoursDaily.filter(h => h >= 4).length;
    const lt4 = usageHoursDaily.filter(h => h > 0 && h < 4).length;
    const usageHoursTotal = Math.round(usageHoursDaily.reduce((a, b) => a + b, 0) * 10) / 10;
    const avgTotalDays = Math.round((usageHoursTotal / days) * 10) / 10;
    const avgDaysUsed = Math.round((usageHoursTotal / Math.max(1, daysUsed)) * 10) / 10;
    const sortedUsed = usageHoursDaily.filter(h => h > 0).slice().sort((a, b) => a - b);
    const medianUsed = sortedUsed.length ? sortedUsed[Math.floor(sortedUsed.length / 2)] : 0;
    const report = {
      header: {
        patient,
        range: { startDate, endDate },
        serialNumber: patient.deviceUID,
        deviceModel: "VT 100 / VT 200",
        mode,
        ipap,
        epap
      },
      therapy: {
        eventsPerHour: {
          AI: Math.round(aiDaily.reduce((a, b) => a + b, 0) / days * 100) / 100,
          HI: Math.round(hiDaily.reduce((a, b) => a + b, 0) / days * 100) / 100,
          AHI: Math.round(ahiDaily.reduce((a, b) => a + b, 0) / days * 100) / 100
        },
        thresholdLeakLpm: 24.0
      },
      usage: {
        daysUsed,
        totalDays: days,
        ge4HoursDays: ge4,
        lt4HoursDays: lt4,
        usageHoursTotal,
        averageUsageTotalDays: avgTotalDays,
        averageUsageDaysUsed: avgDaysUsed,
        medianUsageDaysUsed: Math.round(medianUsed * 10) / 10
      },
      charts: {
        dates,
        usageHoursDaily,
        pressureDaily,
        ahiDaily,
        hiDaily,
        aiDaily,
        leakDaily,
        tidalVolumeDaily,
        respRateDaily,
        minuteVentDaily
      }
    };
    try {
      localStorage.setItem("report_generated_json", JSON.stringify(report));
      localStorage.setItem("report_uploaded_file", fileName || "generated_report.json");
    } catch {}
    navigate("/cpap/reports/analytics", { state: { fileName: fileName || "generated_report.json", startDate, endDate, patient, dummyReport: report } });
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
            <h1 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-slate-800"}`}>Upload & Prepare Report</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm font-medium text-slate-500 bg-teal-100 dark:bg-teal-900/30 dark:text-teal-400 text-teal-600 px-2 py-0.5 rounded-md">Please upload data and select date range</span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`rounded-3xl p-6 shadow-sm border transition-colors duration-300 lg:col-span-2 ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`rounded-2xl p-4 border ${isDarkMode ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                <div className="flex items-center gap-2 mb-3">
                  <UploadCloud size={18} className="text-teal-500" />
                  <div className="text-sm font-semibold">Upload Data File</div>
                </div>
                <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-2xl p-6 cursor-pointer ${isDarkMode ? "border-slate-700 bg-slate-900" : "border-slate-300 bg-white"}`}>
                  <input type="file" className="hidden" onChange={onFileChange} />
                  <UploadCloud size={24} className={`${isDarkMode ? "text-slate-300" : "text-slate-500"}`} />
                  <span className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Click to browse or drag and drop</span>
                </label>
                {fileName && (
                  <div className="mt-3 flex items-center gap-2 text-emerald-500 text-sm">
                    <FileCheck2 size={18} />
                    <span>File uploaded successfully: {fileName}</span>
                  </div>
                )}
              </div>

              <div className={`rounded-2xl p-4 border ${isDarkMode ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar size={18} className="text-indigo-500" />
                  <div className="text-sm font-semibold">Date Range</div>
                </div>
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400">Selecting:</span>
                  <div className="flex rounded-lg overflow-hidden">
                    <button
                      className={`px-3 py-1 text-xs font-medium ${selectionMode === "start" ? "bg-teal-500 text-white" : isDarkMode ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-700"}`}
                      onClick={() => setSelectionMode("start")}
                    >
                      Start
                    </button>
                    <button
                      className={`px-3 py-1 text-xs font-medium ${selectionMode === "end" ? "bg-teal-500 text-white" : isDarkMode ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-700"}`}
                      onClick={() => setSelectionMode("end")}
                    >
                      End
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {monthNames[currentMonth]} {currentYear}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={goPrevMonth} className={`p-2 rounded-lg ${isDarkMode ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600"} disabled:opacity-50`} disabled={currentYear === 1990 && currentMonth === 0}>
                      <ChevronLeft size={16} />
                    </button>
                    <select
                      value={currentMonth}
                      onChange={(e) => setCurrentMonth(Number(e.target.value))}
                      className={`text-xs rounded-md px-2 py-1 ${isDarkMode ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-700"}`}
                    >
                      {monthNames.map((m, i) => <option key={m} value={i}>{m}</option>)}
                    </select>
                    <select
                      value={currentYear}
                      onChange={(e) => setCurrentYear(Number(e.target.value))}
                      className={`text-xs rounded-md px-2 py-1 ${isDarkMode ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-700"}`}
                    >
                      {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <button onClick={goNextMonth} className={`p-2 rounded-lg ${isDarkMode ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600"} disabled:opacity-50`} disabled={currentYear === 2050 && currentMonth === 11}>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-xs mt-2">
                  {["S","M","T","W","T","F","S"].map((d, i) => (
                    <div key={`${d}-${i}`} className="text-slate-400 font-medium py-2">{d}</div>
                  ))}
                  {leadingEmpty.map((_, i) => <div key={`e-${i}`} />)}
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                    const d = new Date(currentYear, currentMonth, day);
                    const isToday = today.getFullYear() === currentYear && today.getMonth() === currentMonth && today.getDate() === day;
                    const isStart = rangeStart && d.getFullYear() === rangeStart.getFullYear() && d.getMonth() === rangeStart.getMonth() && d.getDate() === rangeStart.getDate();
                    const isEnd = rangeEnd && d.getFullYear() === rangeEnd.getFullYear() && d.getMonth() === rangeEnd.getMonth() && d.getDate() === rangeEnd.getDate();
                    const inRange = rangeStart && rangeEnd && d >= rangeStart && d <= rangeEnd;
                    return (
                      <button
                        key={day}
                        onClick={() => onSelectDay(day)}
                        className={`py-2 rounded-lg transition-colors ${
                          isStart || isEnd
                            ? "bg-teal-500 text-white"
                            : inRange
                              ? isDarkMode ? "bg-teal-900/20 text-white" : "bg-teal-50 text-teal-700"
                              : isToday
                                ? "bg-blue-500 text-white shadow-md shadow-blue-500/30"
                                : isDarkMode 
                                  ? "text-slate-400 hover:bg-slate-700" 
                                  : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs">
                  <span className="px-2 py-1 rounded bg-teal-500/10 text-teal-600 dark:text-teal-400">Start: {startDate}</span>
                  <span className="px-2 py-1 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">End: {endDate}</span>
                </div>
                <button
                  disabled={!fileName}
                  onClick={onGenerate}
                  className={`mt-4 w-full rounded-full py-2.5 font-semibold transition-all ${
                    fileName ? "bg-teal-500 hover:bg-teal-600 text-white" : "bg-slate-300 text-slate-600 cursor-not-allowed"
                  }`}
                >
                  Generate Reports
                </button>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className={`rounded-3xl p-6 shadow-sm border ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}>
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDarkMode ? "bg-teal-900/30 text-teal-400" : "bg-teal-50 text-teal-600"}`}>
                <User size={16} />
              </div>
              <h3 className={`font-bold ${isDarkMode ? "text-white" : "text-slate-700"}`}>Patient Profile</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Patient Name</span><span className="font-semibold">{patient.name}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Patient ID</span><span className="font-semibold">{patient.id}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Date of Birth</span><span className="font-semibold">{patient.dob}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Gender</span><span className="font-semibold">{patient.gender}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Device UID</span><span className="font-semibold">{patient.deviceUID}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Admin Phone</span><span className="font-semibold">{patient.phone}</span></div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
