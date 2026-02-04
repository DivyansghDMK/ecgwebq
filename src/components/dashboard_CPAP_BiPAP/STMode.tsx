import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Activity, Settings, Calendar, LogOut, ChevronUp, ChevronDown, Gauge, Timer, Zap, Wind } from 'lucide-react';
const deckmountLogo = new URL('../../assets/DeckMount Photo.png', import.meta.url).href;

export default function STMode() {
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
    ipap: 10.0,
    epap: 10.0,
    startEpap: 10.0,
    backupRate: 10.0,
    tiMin: 1.0,
    tiMax: 1.0,
    riseTime: 200.0, // mSec
    sensitivity: 10.0,
  }), []);

  const [ipap, setIpap] = useState(() => {
    const v = typeof window !== 'undefined' ? localStorage.getItem('stmode_ipap') : null;
    return v ? Number(v) : defaults.ipap;
  });
  const [epap, setEpap] = useState(() => {
    const v = typeof window !== 'undefined' ? localStorage.getItem('stmode_epap') : null;
    return v ? Number(v) : defaults.epap;
  });
  const [startEpap, setStartEpap] = useState(() => {
    const v = typeof window !== 'undefined' ? localStorage.getItem('stmode_startEpap') : null;
    return v ? Number(v) : defaults.startEpap;
  });
  const [backupRate, setBackupRate] = useState(() => {
    const v = typeof window !== 'undefined' ? localStorage.getItem('stmode_backupRate') : null;
    return v ? Number(v) : defaults.backupRate;
  });
  const [tiMin, setTiMin] = useState(() => {
    const v = typeof window !== 'undefined' ? localStorage.getItem('stmode_tiMin') : null;
    return v ? Number(v) : defaults.tiMin;
  });
  const [tiMax, setTiMax] = useState(() => {
    const v = typeof window !== 'undefined' ? localStorage.getItem('stmode_tiMax') : null;
    return v ? Number(v) : defaults.tiMax;
  });
  const [riseTime, setRiseTime] = useState(() => {
    const v = typeof window !== 'undefined' ? localStorage.getItem('stmode_riseTime') : null;
    return v ? Number(v) : defaults.riseTime;
  });
  const [sensitivity, setSensitivity] = useState(() => {
    const v = typeof window !== 'undefined' ? localStorage.getItem('stmode_sensitivity') : null;
    return v ? Number(v) : defaults.sensitivity;
  });

  const [status, setStatus] = useState<'idle' | 'saved' | 'reset'>('idle');
  const [lastSaved, setLastSaved] = useState<number | null>(() => {
      const v = typeof window !== 'undefined' ? localStorage.getItem('stmode_lastSaved') : null;
      return v ? Number(v) : null;
  });

  const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));
  const round = (val: number) => Math.round(val * 10) / 10;

  const saveAll = () => {
    try {
      localStorage.setItem('stmode_ipap', String(ipap));
      localStorage.setItem('stmode_epap', String(epap));
      localStorage.setItem('stmode_startEpap', String(startEpap));
      localStorage.setItem('stmode_backupRate', String(backupRate));
      localStorage.setItem('stmode_tiMin', String(tiMin));
      localStorage.setItem('stmode_tiMax', String(tiMax));
      localStorage.setItem('stmode_riseTime', String(riseTime));
      localStorage.setItem('stmode_sensitivity', String(sensitivity));
      const now = Date.now();
      localStorage.setItem('stmode_lastSaved', String(now));
      setLastSaved(now);
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 2000);
    } catch {
      setStatus('idle');
    }
  };

  const resetAll = () => {
    setIpap(defaults.ipap);
    setEpap(defaults.epap);
    setStartEpap(defaults.startEpap);
    setBackupRate(defaults.backupRate);
    setTiMin(defaults.tiMin);
    setTiMax(defaults.tiMax);
    setRiseTime(defaults.riseTime);
    setSensitivity(defaults.sensitivity);
    try {
      localStorage.removeItem('stmode_ipap');
      localStorage.removeItem('stmode_epap');
      localStorage.removeItem('stmode_startEpap');
      localStorage.removeItem('stmode_backupRate');
      localStorage.removeItem('stmode_tiMin');
      localStorage.removeItem('stmode_tiMax');
      localStorage.removeItem('stmode_riseTime');
      localStorage.removeItem('stmode_sensitivity');
      localStorage.removeItem('stmode_lastSaved');
    } catch {}
    setLastSaved(null);
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
            { name: 'S Mode', icon: Activity, to: '/cpap/s_mode' },
            { name: 'T Mode', icon: Timer, to: '/cpap/t_mode' },
            { name: 'ST Mode', icon: Zap, active: true, to: '/cpap/st_mode' },
            { name: 'VAPS Mode', icon: Gauge, to: '/cpap/vaps_mode' },
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
              onClick={() => {
                if (item.name === 'Reports') navigate('/cpap/reports');
                else if (item.to) navigate(item.to);
              }}
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
            <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>BiPAP ST Mode</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm font-medium text-slate-500 bg-teal-100 dark:bg-teal-900/30 dark:text-teal-400 text-teal-600 px-2 py-0.5 rounded-md">Current Mode: ST Mode</span>
            </div>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-3xl p-6 shadow-sm border transition-colors duration-300 lg:col-span-2 ${
              isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
            }`}
          >
            <div className="flex items-center gap-2 mb-6">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-teal-900/30 text-teal-400' : 'bg-teal-50 text-teal-600'}`}>
                <Zap size={16} />
              </div>
              <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-700'}`}>ST Mode Settings</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* IPAP */}
              <div className={`rounded-2xl p-4 border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gauge size={16} className="text-sky-500" />
                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">IPAP</div>
                  </div>
                  <div className="text-sm font-semibold text-slate-700 dark:text-white">{ipap.toFixed(1)} CmH2O</div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    className={`px-3 py-2 rounded-xl ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-700'} border ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}
                    onClick={() => setIpap(p => clamp(round(p - 0.5), Math.max(4, epap + 2), 30))}
                  >
                    <ChevronDown size={18} />
                  </button>
                  <input
                    type="number"
                    step={0.5}
                    value={ipap}
                    onChange={(e) => setIpap(clamp(Number(e.target.value), Math.max(4, epap + 2), 30))}
                    className={`rounded-xl px-3 py-2 border w-24 ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-700'}`}
                  />
                  <button
                    className={`px-3 py-2 rounded-xl ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-700'} border ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}
                    onClick={() => setIpap(p => clamp(round(p + 0.5), Math.max(4, epap + 2), 30))}
                  >
                    <ChevronUp size={18} />
                  </button>
                </div>
              </div>

              {/* EPAP */}
              <div className={`rounded-2xl p-4 border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gauge size={16} className="text-indigo-500" />
                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">EPAP</div>
                  </div>
                  <div className="text-sm font-semibold text-slate-700 dark:text-white">{epap.toFixed(1)} CmH2O</div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    className={`px-3 py-2 rounded-xl ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-700'} border ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}
                    onClick={() => setEpap(p => clamp(round(p - 0.5), 4, Math.min(25, ipap - 2)))}
                  >
                    <ChevronDown size={18} />
                  </button>
                  <input
                    type="number"
                    step={0.5}
                    value={epap}
                    onChange={(e) => setEpap(clamp(Number(e.target.value), 4, Math.min(25, ipap - 2)))}
                    className={`rounded-xl px-3 py-2 border w-24 ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-700'}`}
                  />
                  <button
                    className={`px-3 py-2 rounded-xl ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-700'} border ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}
                    onClick={() => setEpap(p => clamp(round(p + 0.5), 4, Math.min(25, ipap - 2)))}
                  >
                    <ChevronUp size={18} />
                  </button>
                </div>
              </div>

              {/* Start EPAP */}
               <div className={`rounded-2xl p-4 border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gauge size={16} className="text-blue-500" />
                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">Start EPAP</div>
                  </div>
                  <div className="text-sm font-semibold text-slate-700 dark:text-white">{startEpap.toFixed(1)} CmH2O</div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    className={`px-3 py-2 rounded-xl ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-700'} border ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}
                    onClick={() => setStartEpap(p => clamp(round(p - 0.5), 4, epap))}
                  >
                    <ChevronDown size={18} />
                  </button>
                  <input
                    type="number"
                    step={0.5}
                    value={startEpap}
                    onChange={(e) => setStartEpap(clamp(Number(e.target.value), 4, epap))}
                    className={`rounded-xl px-3 py-2 border w-24 ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-700'}`}
                  />
                  <button
                    className={`px-3 py-2 rounded-xl ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-700'} border ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}
                    onClick={() => setStartEpap(p => clamp(round(p + 0.5), 4, epap))}
                  >
                    <ChevronUp size={18} />
                  </button>
                </div>
              </div>

              {/* Backup Rate */}
              <div className={`rounded-2xl p-4 border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity size={16} className="text-rose-500" />
                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">Backup Rate</div>
                  </div>
                  <div className="text-sm font-semibold text-slate-700 dark:text-white">{backupRate.toFixed(1)} /min</div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    className={`px-3 py-2 rounded-xl ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-700'} border ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}
                    onClick={() => setBackupRate(r => clamp(round(r - 0.5), 0, 60))}
                  >
                    <ChevronDown size={18} />
                  </button>
                  <input
                    type="number"
                    step={0.5}
                    value={backupRate}
                    onChange={(e) => setBackupRate(clamp(Number(e.target.value), 0, 60))}
                    className={`rounded-xl px-3 py-2 border w-24 ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-700'}`}
                  />
                  <button
                    className={`px-3 py-2 rounded-xl ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-700'} border ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}
                    onClick={() => setBackupRate(r => clamp(round(r + 0.5), 0, 60))}
                  >
                    <ChevronUp size={18} />
                  </button>
                </div>
              </div>

              {/* Ti Min */}
              <div className={`rounded-2xl p-4 border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Timer size={16} className="text-rose-500" />
                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">Ti Min</div>
                  </div>
                  <div className="text-sm font-semibold text-slate-700 dark:text-white">{tiMin.toFixed(1)} Sec</div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    className={`px-3 py-2 rounded-xl ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-700'} border ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}
                    onClick={() => setTiMin(t => clamp(round(t - 0.1), 0.1, tiMax))}
                  >
                    <ChevronDown size={18} />
                  </button>
                  <input
                    type="number"
                    step={0.1}
                    value={tiMin}
                    onChange={(e) => setTiMin(clamp(Number(e.target.value), 0.1, tiMax))}
                    className={`rounded-xl px-3 py-2 border w-24 ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-700'}`}
                  />
                  <button
                    className={`px-3 py-2 rounded-xl ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-700'} border ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}
                    onClick={() => setTiMin(t => clamp(round(t + 0.1), 0.1, tiMax))}
                  >
                    <ChevronUp size={18} />
                  </button>
                </div>
              </div>

               {/* Ti Max */}
               <div className={`rounded-2xl p-4 border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Timer size={16} className="text-rose-600" />
                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">Ti Max</div>
                  </div>
                  <div className="text-sm font-semibold text-slate-700 dark:text-white">{tiMax.toFixed(1)} Sec</div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    className={`px-3 py-2 rounded-xl ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-700'} border ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}
                    onClick={() => setTiMax(t => clamp(round(t - 0.1), tiMin, 4.0))}
                  >
                    <ChevronDown size={18} />
                  </button>
                  <input
                    type="number"
                    step={0.1}
                    value={tiMax}
                    onChange={(e) => setTiMax(clamp(Number(e.target.value), tiMin, 4.0))}
                    className={`rounded-xl px-3 py-2 border w-24 ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-700'}`}
                  />
                  <button
                    className={`px-3 py-2 rounded-xl ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-700'} border ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}
                    onClick={() => setTiMax(t => clamp(round(t + 0.1), tiMin, 4.0))}
                  >
                    <ChevronUp size={18} />
                  </button>
                </div>
              </div>

              {/* Rise Time */}
              <div className={`rounded-2xl p-4 border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap size={16} className="text-amber-500" />
                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">Rise Time</div>
                  </div>
                  <div className="text-sm font-semibold text-slate-700 dark:text-white">{riseTime.toFixed(1)} mSec</div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    className={`px-3 py-2 rounded-xl ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-700'} border ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}
                    onClick={() => setRiseTime(r => clamp(round(r - 10), 0, 500))}
                  >
                    <ChevronDown size={18} />
                  </button>
                  <input
                    type="number"
                    step={10}
                    value={riseTime}
                    onChange={(e) => setRiseTime(clamp(Number(e.target.value), 0, 500))}
                    className={`rounded-xl px-3 py-2 border w-24 ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-700'}`}
                  />
                  <button
                    className={`px-3 py-2 rounded-xl ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-700'} border ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}
                    onClick={() => setRiseTime(r => clamp(round(r + 10), 0, 500))}
                  >
                    <ChevronUp size={18} />
                  </button>
                </div>
              </div>

               {/* Sensitivity */}
               <div className={`rounded-2xl p-4 border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity size={16} className="text-purple-500" />
                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">Sensitivity</div>
                  </div>
                  <div className="text-sm font-semibold text-slate-700 dark:text-white">{sensitivity.toFixed(1)}</div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    className={`px-3 py-2 rounded-xl ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-700'} border ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}
                    onClick={() => setSensitivity(s => clamp(round(s - 0.1), 1, 5))}
                  >
                    <ChevronDown size={18} />
                  </button>
                  <input
                    type="number"
                    step={0.1}
                    value={sensitivity}
                    onChange={(e) => setSensitivity(clamp(Number(e.target.value), 1, 5))}
                    className={`rounded-xl px-3 py-2 border w-24 ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-700'}`}
                  />
                  <button
                    className={`px-3 py-2 rounded-xl ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-700'} border ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}
                    onClick={() => setSensitivity(s => clamp(round(s + 0.1), 1, 5))}
                  >
                    <ChevronUp size={18} />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-8">
              <button
                onClick={saveAll}
                className="px-6 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-full font-medium transition-colors shadow-sm shadow-teal-500/20 text-sm"
              >
                Save Changes
              </button>
              <button
                onClick={resetAll}
                className={`px-6 py-2.5 rounded-full font-medium transition-colors border text-sm ${
                  isDarkMode
                    ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Reset to Default
              </button>
            </div>
          </motion.div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className={`rounded-3xl p-6 shadow-sm border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}
            >
              <h3 className={`font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-700'}`}>Quick Overview</h3>
              <div className="space-y-4">
                <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-slate-900/50' : 'bg-slate-50'}`}>
                  <div className="text-sm text-slate-500 mb-1">Pressure Range</div>
                  <div className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                    {epap.toFixed(1)} - {ipap.toFixed(1)} <span className="text-sm font-normal text-slate-500">cmH2O</span>
                  </div>
                </div>
                <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-slate-900/50' : 'bg-slate-50'}`}>
                  <div className="text-sm text-slate-500 mb-1">Backup Rate</div>
                  <div className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                    {backupRate.toFixed(1)} <span className="text-sm font-normal text-slate-500">/min</span>
                  </div>
                </div>
                {lastSaved && (
                  <div className="text-xs text-center text-slate-400 mt-4">
                    Last updated: {new Date(lastSaved).toLocaleTimeString()}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
