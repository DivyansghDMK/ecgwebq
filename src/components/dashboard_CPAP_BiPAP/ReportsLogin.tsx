import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, Phone, Cpu, LogIn, Wind, Calendar, Settings } from "lucide-react";

// Image imports with fallback
const deckmountLogo = new URL("../../assets/DeckMount Photo.png", import.meta.url).href;
const reportImage = new URL("../../assets/report.jpg", import.meta.url).href;

// Try to load doctor illustration, fallback to report image if not found
let doctorIllustration: string;
try {
  doctorIllustration = new URL("../../assets/doctor-illustration.png", import.meta.url).href;
} catch {
  doctorIllustration = reportImage;
}

export default function ReportsLogin() {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(() => typeof window !== "undefined" && localStorage.getItem("theme") === "dark");
  const [phone, setPhone] = useState("");
  const [device, setDevice] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    try {
      localStorage.setItem("theme", isDarkMode ? "dark" : "light");
    } catch {}
  }, [isDarkMode]);

  const canLogin = phone.trim().length >= 8 && device.trim().length >= 6;

  const handleLogin = () => {
    if (!canLogin) {
      setError("Please enter valid phone and device numbers");
      return;
    }
    setError(null);
    try {
      localStorage.setItem("report_admin_phone", phone);
      localStorage.setItem("report_device_number", device);
    } catch {}
    navigate("/cpap/reports/upload");
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
            <h1 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-slate-800"}`}>Admin Reports</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm font-medium text-slate-500 bg-teal-100 dark:bg-teal-900/30 dark:text-teal-400 text-teal-600 px-2 py-0.5 rounded-md">Enter admin phone and device UID</span>
            </div>
          </div>
        </header>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`rounded-3xl p-6 shadow-sm border ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            <div className={`hidden md:block rounded-2xl overflow-hidden border ${isDarkMode ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
              <img
                src={doctorIllustration || reportImage}
                alt="Doctor illustration - Medical professional with heart health diagram"
                className="w-full h-full object-contain p-4"
                onError={(e) => { 
                  // Fallback to report image if doctor illustration fails to load
                  if (e.currentTarget.src !== reportImage) {
                    e.currentTarget.src = reportImage;
                  } else {
                    e.currentTarget.style.display = "none";
                  }
                }}
              />
            </div>
            <div className="md:col-span-2">
              <div className={`rounded-3xl overflow-hidden ${isDarkMode ? "bg-slate-900 border border-slate-700" : "bg-white border border-slate-200"} shadow-2xl`}>
                <div className="bg-gradient-to-r from-teal-500 via-sky-500 to-indigo-500 p-5 md:p-7">
                  <div className="flex items-center gap-3 text-white">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <LogIn size={18} />
                    </div>
                    <div>
                      <div className="text-lg md:text-xl font-bold">Secure Report Access</div>
                      <div className="text-xs md:text-sm opacity-90">Enter admin mobile and device UID</div>
                    </div>
                  </div>
                </div>
                <div className="p-7 md:p-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">Phone Number</label>
                      <div className="flex items-center gap-2">
                        <div className={`p-3 rounded-2xl ${isDarkMode ? "bg-slate-900 border border-slate-700" : "bg-white border border-slate-200"}`}>
                          <Phone size={18} className={isDarkMode ? "text-slate-300" : "text-slate-500"} />
                        </div>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="Enter registered mobile"
                          className={`flex-1 border rounded-2xl px-5 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all ${isDarkMode ? "bg-slate-900 border-slate-700 text-white placeholder-slate-500" : "bg-white border-slate-200 text-slate-700"}`}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">Device Number</label>
                      <div className="flex items-center gap-2">
                        <div className={`p-3 rounded-2xl ${isDarkMode ? "bg-slate-900 border border-slate-700" : "bg-white border border-slate-200"}`}>
                          <Cpu size={18} className={isDarkMode ? "text-slate-300" : "text-slate-500"} />
                        </div>
                        <input
                          type="text"
                          value={device}
                          onChange={(e) => setDevice(e.target.value)}
                          placeholder="Enter device number"
                          className={`flex-1 border rounded-2xl px-5 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all ${isDarkMode ? "bg-slate-900 border-slate-700 text-white placeholder-slate-500" : "bg-white border-slate-200 text-slate-700"}`}
                        />
                      </div>
                    </div>
                  </div>
                  {error && <div className="mt-2 text-sm text-red-500">{error}</div>}
                  <button
                    onClick={handleLogin}
                    disabled={!canLogin}
                    className={`mt-6 w-full md:w-auto md:px-10 bg-gradient-to-r from-teal-500 to-blue-500 text-white font-semibold py-3.5 rounded-full shadow-xl shadow-teal-500/20 hover:opacity-90 transition-all active:scale-95 ${!canLogin ? "opacity-60 cursor-not-allowed" : ""}`}
                  >
                    Login
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
