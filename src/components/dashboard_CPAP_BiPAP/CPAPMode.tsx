import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Wind, Activity, Settings, Calendar, LogOut, ChevronUp, ChevronDown, Gauge } from 'lucide-react';
const deckmountLogo = new URL('../../assets/DeckMount Photo.png', import.meta.url).href;

export default function CPAPMode() {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(() => typeof window !== 'undefined' && localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    } catch {}
  }, [isDarkMode]);

  const defaults = useMemo(() => ({
    pressure: 4
  }), []);

  const [pressure, setPressure] = useState(() => {
    const v = typeof window !== 'undefined' ? localStorage.getItem('cpap_pressure') : null;
    return v ? Number(v) : defaults.pressure;
  });
  const [status, setStatus] = useState<'idle' | 'saved' | 'reset'>('idle');
  const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

  const save = () => {
    try {
      localStorage.setItem('cpap_pressure', String(pressure));
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 2000);
    } catch {
      setStatus('idle');
    }
  };

  const reset = () => {
    setPressure(defaults.pressure);
    try {
      localStorage.removeItem('cpap_pressure');
    } catch {}
    setStatus('reset');
    setTimeout(() => setStatus('idle'), 2000);
  };

  return (
    <div className={`min-h-screen flex font-sans transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-800'}`}>
      <aside className={`w-64 backdrop-blur-md border-r fixed h-full z-20 hidden md:flex flex-col transition-colors duration-300 ${
        isDarkMode ? 'bg-slate-900/90 border-slate-700' : 'bg-white/80 border-slate-200'
      }`}>
        <div className="p-6">
          <div className={`flex items-center gap-3 font-bold text-xl ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
            <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
              <Wind size={20} />
            </div>
            <span>CPAP/BiPAP</span>
          </div>
          <button
            type="button"
            onClick={() => setIsDarkMode(d => !d)}
            className={`mt-3 inline-flex items-center justify-center rounded-lg ${isDarkMode ? 'bg-white/10 ring-1 ring-white/15' : ''} p-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500/40`}
            aria-label="Toggle theme"
          >
            <img src={deckmountLogo} alt="DeckMount" className="h-8 w-auto" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {[
            { name: 'Dashboard', icon: LayoutDashboard, to: '/cpap/dashboard' },
            { name: 'CPAP Mode', icon: Wind, active: true, to: '/cpap/cpap_mode' },
            { name: 'AutoCPAP Mode', icon: Activity, to: '/cpap/auto_cpap_mode' },
            { name: 'Reports', icon: Calendar, to: '/cpap/reports' },
            { name: 'Settings', icon: Settings, to: '/cpap/settings' },
          ].map((item) => (
            <button
              key={item.name}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                item.active
                  ? 'bg-teal-500/10 text-teal-500 shadow-sm'
                  : isDarkMode
                    ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }`}
              onClick={() => item.to ? navigate(item.to) : null}
            >
              <item.icon size={18} />
              {item.name}
            </button>
          ))}
        </nav>
        <div className={`p-4 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
          <button onClick={() => navigate('/cpap/login')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
            isDarkMode ? 'text-red-400 hover:bg-red-900/20' : 'text-red-500 hover:bg-red-50'
          }`}>
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 md:ml-64 p-8 transition-colors duration-300">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>CPAP Mode</h1>
          </div>
          <div className="flex items-center gap-3">
            {status === 'saved' && (
              <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">Saved</span>
            )}
            {status === 'reset' && (
              <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">Reset</span>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-3xl p-6 shadow-sm border transition-colors duration-300 ${
              isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
            }`}
          >
            <div className="flex items-center gap-2 mb-6">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-teal-900/30 text-teal-400' : 'bg-teal-50 text-teal-600'}`}>
                <Gauge size={16} />
              </div>
              <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-700'}`}>Set Pressure</h3>
            </div>

            <div className="text-sm font-semibold text-slate-700 dark:text-white">( {pressure.toFixed(1)} CmH2O )</div>
            <div className="mt-3 flex items-center gap-2">
              <button
                className={`px-3 py-2 rounded-xl ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-700'} border ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}
                onClick={() => setPressure(p => clamp(Number((p - 0.5).toFixed(1)), 4, 20))}
              >
                <ChevronDown size={18} />
              </button>
              <input
                type="number"
                step={0.5}
                min={4}
                max={20}
                value={pressure}
                onChange={(e) => setPressure(clamp(Number(e.target.value), 4, 20))}
                className={`rounded-xl px-3 py-2 border w-28 ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-700'}`}
              />
              <button
                className={`px-3 py-2 rounded-xl ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-700'} border ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}
                onClick={() => setPressure(p => clamp(Number((p + 0.5).toFixed(1)), 4, 20))}
              >
                <ChevronUp size={18} />
              </button>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={save}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-teal-500 to-sky-500 text-white shadow-lg shadow-teal-500/20 active:scale-95"
              >
                Save
              </button>
              <button
                onClick={reset}
                className={`${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-700'} border ${isDarkMode ? 'border-slate-700' : 'border-slate-200'} inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold active:scale-95`}
              >
                Reset
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`rounded-3xl p-6 shadow-sm border transition-colors duration-300 ${
              isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
            }`}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                <LayoutDashboard size={16} />
              </div>
              <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-700'}`}>Quick Overview</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between"><span className="text-slate-500 dark:text-slate-300">Set Pressure</span><span className="text-slate-700 dark:text-white">{pressure.toFixed(1)} CmH2O</span></div>
              <div className="flex items-center justify-between"><span className="text-slate-500 dark:text-slate-300">Mode</span><span className="text-slate-700 dark:text-white">CPAP</span></div>
              <div className="flex items-center justify-between"><span className="text-slate-500 dark:text-slate-300">Last Saved</span><span className="text-slate-700 dark:text-white">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
