import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wind, Lock, User, ArrowRight, Activity } from 'lucide-react';
const deckmountLogo = new URL('../../assets/DeckMount Photo.png', import.meta.url).href;

export default function CPAPLogin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => typeof window !== 'undefined' && localStorage.getItem('theme') === 'dark');

  const handleLogin = (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate login delay
    setTimeout(() => {
      setLoading(false);
      navigate('/cpap/dashboard');
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin(e);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-teal-100 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute top-40 right-0 w-72 h-72 bg-blue-100 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-emerald-50 rounded-full blur-3xl opacity-60"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 border border-white/50">
          
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500 shadow-lg shadow-teal-500/20 mb-4 text-white">
              <Wind size={32} strokeWidth={2} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">CPAP / BiPAP</h1>
            <div className="mt-3 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  const enabled = typeof window !== 'undefined' ? localStorage.getItem('logoToggleEnabled') !== 'false' : true;
                  if (!enabled) return;
                  const next = !isDarkMode;
                  setIsDarkMode(next);
                  try { localStorage.setItem('theme', next ? 'dark' : 'light'); } catch {}
                  if (next) document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark');
                }}
                className="focus:outline-none focus:ring-2 focus:ring-teal-500/40 rounded-lg"
                aria-label="Toggle theme"
              > 
                <img src={deckmountLogo} alt="DeckMount" className="h-6 w-auto" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 ml-1 uppercase tracking-wider">Username</label>
              <div className="relative group">
                <div className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-teal-500 transition-colors">
                  <User size={20} />
                </div>
                <input 
                  type="text" 
                  placeholder="Enter Admin Username"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-slate-700 focus:outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-500/10 transition-all placeholder:text-slate-400"
                  required
                  onKeyDown={handleKeyDown}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 ml-1 uppercase tracking-wider">Password</label>
              <div className="relative group">
                <div className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-teal-500 transition-colors">
                  <Lock size={20} />
                </div>
                <input 
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-12 text-slate-700 focus:outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-500/10 transition-all placeholder:text-slate-400"
                  required
                  onKeyDown={handleKeyDown}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-lg leading-none hover:scale-110 transition-transform focus:outline-none"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-semibold py-3.5 rounded-2xl shadow-lg shadow-teal-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group mt-8"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  Access Dashboard
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-slate-400">
              Authorized personnel only. <br/> 
              <span className="text-slate-300">System v2.4.0</span>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
