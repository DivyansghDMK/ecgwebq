import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Wind, Activity, Settings, Calendar, LogOut, Bell, Search, User, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { fetchReports } from "../../services/reportsApi";
const deckmountLogo = new URL('../../assets/DeckMount Photo.png', import.meta.url).href;

export default function CPAPDashboard() {
  const [isDarkMode, setIsDarkMode] = useState(() => typeof window !== 'undefined' && localStorage.getItem('theme') === 'dark');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<any[]>([]);

  const [currentYear, setCurrentYear] = useState(Math.min(2050, Math.max(1990, new Date().getFullYear())));
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const years = Array.from({ length: 2050 - 1990 + 1 }, (_, i) => 1990 + i);
  
  // Calculate data from real reports
  const monthlyData = useMemo(() => {
    if (reports.length === 0) {
      return monthNames.map((name, index) => ({ name, value: 0 }));
    }
    
    return monthNames.map((name, index) => {
      const monthReports = reports.filter(r => {
        const reportDate = new Date(r.date);
        return reportDate.getMonth() === index && reportDate.getFullYear() === currentYear;
      });
      return { name, value: monthReports.length };
    });
  }, [reports, currentYear]);

  const distributionData = monthlyData;
  const totalUsers = distributionData.reduce((acc, d) => acc + d.value, 0);

  // Fetch real data from API
  useEffect(() => {
    const fetchCPAPData = async () => {
      try {
        setLoading(true);
        const response = await fetchReports();
        setReports(response.reports || []);
      } catch (error) {
        console.error('Failed to fetch CPAP data:', error);
        setReports([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCPAPData();
  }, []);
 

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

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const leadingEmpty = Array(firstDayOfMonth).fill(0);
  const today = new Date();

  const activeUsersTrend = useMemo(() => {
    if (reports.length === 0) {
      return [
        { name: 'Mon', value: 0 },
        { name: 'Tue', value: 0 },
        { name: 'Wed', value: 0 },
        { name: 'Thu', value: 0 },
        { name: 'Fri', value: 0 },
        { name: 'Sat', value: 0 },
        { name: 'Sun', value: 0 },
      ];
    }
    
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map(day => {
      const dayReports = reports.filter(r => {
        const reportDay = new Date(r.date).toLocaleDateString('en-US', { weekday: 'short' });
        return reportDay === day;
      });
      return { name: day, value: dayReports.length };
    });
  }, [reports]);

  const DARK_PALETTE = ['#1f77b4','#2ca02c','#ff7f0e','#d62728','#9467bd','#8c564b','#e377c2','#7f7f7f','#bcbd22','#17becf','#3b82f6','#10b981'];
  const LIGHT_PALETTE = ['#93c5fd','#a7f3d0','#fde68a','#feb2b2','#c4b5fd','#f5d0c5','#fbcfe8','#d1d5db','#e5e7eb','#a5f3fc','#c7d2fe','#bbf7d0'];

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

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const hasVisited = localStorage.getItem('hasVisited');
        if (!hasVisited) {
          localStorage.setItem('hasVisited', 'true');
        }
      }
    } catch {}
  }, []);

  return (
    <div className={`min-h-screen flex font-sans transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-800'}`}>
      {/* Sidebar - Glassmorphism */}
      <aside className={`w-64 backdrop-blur-md border-r fixed h-full z-20 hidden md:flex flex-col transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-slate-900/90 border-slate-700' 
          : 'bg-white/80 border-slate-200'
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
            onClick={() => {
              const enabled = typeof window !== 'undefined' ? localStorage.getItem('logoToggleEnabled') !== 'false' : true;
              if (enabled) setIsDarkMode((d) => !d);
            }}
            onKeyDown={(e) => {
              const enabled = typeof window !== 'undefined' ? localStorage.getItem('logoToggleEnabled') !== 'false' : true;
              if (enabled && (e.key === 'Enter' || e.key === ' ')) setIsDarkMode((d) => !d);
            }}
            className={`mt-3 inline-flex items-center justify-center rounded-lg ${isDarkMode ? 'bg-white/10 ring-1 ring-white/15' : ''} p-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500/40`}
            aria-label="Toggle theme"
          >
            <img src={deckmountLogo} alt="DeckMount" className="h-8 w-auto" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {[
            { name: 'Dashboard', icon: LayoutDashboard, active: true },
            { name: 'CPAP Mode', icon: Wind },
            { name: 'AutoCPAP Mode', icon: Activity },
            { name: 'S Mode', icon: Activity },
            { name: 'T Mode', icon: Activity },
            { name: 'VAPS Mode', icon: Activity },
            { name: 'ST Mode', icon: Activity },
            { name: 'Reports', icon: Calendar },
            { name: 'Settings', icon: Settings },
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
                if (item.name === 'Settings') navigate('/cpap/settings');
                else if (item.name === 'AutoCPAP Mode') navigate('/cpap/auto_cpap_mode');
                else if (item.name === 'Dashboard') navigate('/cpap/dashboard');
                else if (item.name === 'CPAP Mode') navigate('/cpap/cpap_mode');
          else if (item.name === 'S Mode') navigate('/cpap/s_mode');
          else if (item.name === 'T Mode') navigate('/cpap/t_mode');
          else if (item.name === 'ST Mode') navigate('/cpap/st_mode');
          else if (item.name === 'VAPS Mode') navigate('/cpap/vaps_mode');
          else if (item.name === 'Reports') navigate('/cpap/reports');
        }}
            >
              <item.icon size={18} />
              {item.name}
            </button>
          ))}
        </nav>

        <div className={`p-4 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
          <button onClick={() => navigate('/cpap/login')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
            isDarkMode 
              ? 'text-red-400 hover:bg-red-900/20' 
              : 'text-red-500 hover:bg-red-50'
          }`}>
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-8 transition-colors duration-300">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
              {(() => {
                const h = new Date().getHours();
                if (h >= 5 && h < 12) return 'Good Morning';
                if (h >= 12 && h < 18) return 'Good Afternoon';
                return 'Good Evening';
              })()}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm font-medium text-slate-500 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 text-emerald-700 px-2 py-0.5 rounded-md">
                {typeof window !== 'undefined' && localStorage.getItem('hasVisited') === 'true' ? 'Welcome back' : 'Welcome'}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm font-medium text-slate-500 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400 text-orange-600 px-2 py-0.5 rounded-md">Current Mode: T Mode</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100/50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-medium border border-emerald-200 dark:border-emerald-800">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                Connected
             </div>
             <button className={`p-2 transition-colors ${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-600'}`}>
                <Bell size={20} />
             </button>
             <div className={`w-10 h-10 rounded-full border-2 overflow-hidden ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-200 border-white shadow-sm'}`}>
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" alt="Admin" />
             </div>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           
           {/* 1. Admin Controls (Hero Card) */}
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className={`rounded-3xl p-6 shadow-sm border transition-colors duration-300 lg:col-span-1 ${
               isDarkMode 
                 ? 'bg-slate-800 border-slate-700' 
                 : 'bg-white border-slate-100'
             }`}
           >
              <div className="flex items-center gap-2 mb-6">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-teal-900/30 text-teal-400' : 'bg-teal-50 text-teal-600'}`}>
                   <Settings size={16} />
                </div>
                <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-700'}`}>Admin Controls</h3>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                   <label className="text-xs font-semibold text-slate-400 ml-1">SERIAL</label>
                   <input 
                      type="text" 
                      placeholder="Enter Serial No" 
                      className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all ${
                        isDarkMode 
                          ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' 
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-semibold text-slate-400 ml-1">MACHINE TYPE</label>
                   <select
                     className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none ${
                       isDarkMode 
                         ? 'bg-slate-900 border-slate-700 text-white' 
                         : 'bg-slate-50 border-slate-200 text-slate-700'
                     }`}
                     defaultValue="BiPAP"
                   >
                     <option value="CPAP">CPAP</option>
                     <option value="BiPAP">BiPAP</option>
                   </select>
                </div>
                <button className="w-full bg-gradient-to-r from-teal-500 to-blue-500 text-white font-medium py-2.5 rounded-xl shadow-lg shadow-teal-500/20 hover:opacity-90 transition-all active:scale-95">
                   View Device Data
                </button>
              </div>
           </motion.div>

           {/* 2. Active Users Stat */}
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.1 }}
           className={`rounded-3xl p-6 shadow-sm border transition-colors duration-300 lg:col-span-1 flex flex-col justify-between ${
             isDarkMode 
               ? 'bg-slate-800 border-slate-700' 
               : 'bg-white border-slate-100'
           }`}
          >
              <div className="flex items-center gap-2 mb-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                   <Users size={16} />
                </div>
                <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-700'}`}>Active Users</h3>
              </div>
              
              { (typeof window === 'undefined' ? true : localStorage.getItem('showMiniStatsActiveUsers') !== 'false') && (
              <div className="grid grid-cols-2 gap-3 mb-2">
                <div className={`rounded-xl p-3 border ${
                  isDarkMode ? 'bg-slate-700/40 border-slate-600' : 'bg-blue-50/40 border-blue-100'
                }`}>
                  <div className={`text-xs ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Total Users</div>
                  <div className="text-2xl font-bold text-emerald-500">{totalUsers}</div>
                </div>
                <div className={`rounded-xl p-3 border ${
                  isDarkMode ? 'bg-slate-700/40 border-slate-600' : 'bg-blue-50/40 border-blue-100'
                }`}>
                  <div className={`text-xs ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Active Users</div>
                  <div className="text-2xl font-bold text-blue-500">2</div>
                </div>
              </div>
              ) }
              
              <div className="flex-1 flex flex-col items-center justify-center">
                 <span className="text-6xl font-bold text-blue-500 tracking-tight">2</span>
                 <p className="text-sm text-slate-400 mt-2">Currently online users</p>
                 <p className="text-xs text-slate-500 dark:text-slate-400">across all devices</p>
                 <div className="mt-4 w-full h-20">
                   <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={activeUsersTrend}>
                        <defs>
                          <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.6}/>
                            <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" hide />
                        <YAxis hide />
                        <Tooltip contentStyle={{ borderRadius: 12, border: 'none', backgroundColor: isDarkMode ? '#1e293b' : '#fff', color: isDarkMode ? '#fff' : '#000' }} />
                        <Area type="monotone" dataKey="value" stroke="#60a5fa" fillOpacity={1} fill="url(#colorUsers)" />
                      </AreaChart>
                   </ResponsiveContainer>
                 </div>
                 <div className="mt-2 text-xs text-slate-400">
                   Trend +12% this week • Peak 5 today
                 </div>
              </div>
           </motion.div>

           {/* 3. Calendar */}
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.2 }}
             className={`rounded-3xl p-6 shadow-sm border transition-colors duration-300 lg:col-span-1 ${
               isDarkMode 
                 ? 'bg-slate-800 border-slate-700' 
                 : 'bg-white border-slate-100'
             }`}
           >
              <div className="flex items-center mb-4 justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-50 text-purple-600'}`}>
                    <Calendar size={16} />
                  </div>
                  <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-700'}`}>Calendar</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={goPrevMonth} className={`p-2 rounded-lg ${isDarkMode ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600'} disabled:opacity-50`} disabled={currentYear === 1990 && currentMonth === 0}>
                    <ChevronLeft size={16} />
                  </button>
                  <select
                    value={currentMonth}
                    onChange={(e) => setCurrentMonth(Number(e.target.value))}
                    className={`text-xs rounded-md px-2 py-1 ${isDarkMode ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700'}`}
                  >
                    {monthNames.map((m, i) => <option key={m} value={i}>{m}</option>)}
                  </select>
                  <select
                    value={currentYear}
                    onChange={(e) => setCurrentYear(Number(e.target.value))}
                    className={`text-xs rounded-md px-2 py-1 ${isDarkMode ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700'}`}
                  >
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <button onClick={goNextMonth} className={`p-2 rounded-lg ${isDarkMode ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600'} disabled:opacity-50`} disabled={currentYear === 2050 && currentMonth === 11}>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-xs mt-2">
                {['S','M','T','W','T','F','S'].map((d, i) => (
                  <div key={`${d}-${i}`} className="text-slate-400 font-medium py-2">{d}</div>
                ))}
                {leadingEmpty.map((_, i) => <div key={`e-${i}`} />)}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                  const isToday = today.getFullYear() === currentYear && today.getMonth() === currentMonth && today.getDate() === day;
                  const selected = selectedDate && selectedDate.getFullYear() === currentYear && selectedDate.getMonth() === currentMonth && selectedDate.getDate() === day;
                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDate(new Date(currentYear, currentMonth, day))}
                      className={`py-2 rounded-lg transition-colors ${
                        selected
                          ? 'bg-teal-500 text-white'
                          : isToday
                            ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30'
                            : isDarkMode 
                              ? 'text-slate-400 hover:bg-slate-700' 
                              : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
           </motion.div>

           {/* 4. Monthly Users Chart */}
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.3 }}
             className={`rounded-3xl p-6 shadow-sm border transition-colors duration-300 lg:col-span-2 h-80 ${
               isDarkMode 
                 ? 'bg-slate-800 border-slate-700' 
                 : 'bg-white border-slate-100'
             }`}
           >
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1 h-6 bg-teal-500 rounded-full"></div>
                <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-700'}`}>Monthly Users</h3>
              </div>
              
              <div className="w-full h-56">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#f1f5f9'} />
                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                       <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                       <Tooltip 
                          cursor={{fill: isDarkMode ? '#1e293b' : '#f8fafc'}} 
                          contentStyle={{
                             borderRadius: '12px', 
                             border: 'none', 
                             boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                             backgroundColor: isDarkMode ? '#1e293b' : '#fff',
                             color: isDarkMode ? '#fff' : '#000'
                          }} 
                       />
                       <Bar dataKey="value" fill="#60a5fa" radius={[6, 6, 0, 0]} barSize={32} />
                    </BarChart>
                 </ResponsiveContainer>
              </div>
           </motion.div>

           {/* 5. User Distribution Pie Chart */}
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.4 }}
             className={`rounded-3xl p-6 shadow-sm border transition-colors duration-300 lg:col-span-1 h-80 ${
               isDarkMode 
                 ? 'bg-slate-800 border-slate-700' 
                 : 'bg-white border-slate-100'
             }`}
           >
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1 h-6 bg-purple-500 rounded-full"></div>
                <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-700'}`}>User Distribution</h3>
              </div>
              
              <div className="w-full h-56 relative">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                           data={distributionData}
                           cx="50%"
                           cy="50%"
                           innerRadius={(() => {
                             const t = typeof window === 'undefined' ? 20 : Number(localStorage.getItem('userDistributionDonutThickness') ?? '20');
                             const clamped = Math.max(14, Math.min(28, isNaN(t) ? 20 : t));
                             return 80 - clamped;
                           })()}
                           outerRadius={80}
                           paddingAngle={5}
                           dataKey="value"
                         >
                           {distributionData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={(() => {
                               const invert = typeof window === 'undefined' ? true : localStorage.getItem('userDistributionInvertPalette') !== 'false';
                               const palette = invert ? (isDarkMode ? LIGHT_PALETTE : DARK_PALETTE) : DARK_PALETTE;
                               return palette[index % palette.length];
                             })()} />
                           ))}
                        </Pie>
                       <Tooltip contentStyle={{
                          borderRadius: '12px', 
                          border: 'none', 
                          backgroundColor: isDarkMode ? '#1e293b' : '#fff',
                          color: isDarkMode ? '#fff' : '#000'
                       }} />
                    </PieChart>
                 </ResponsiveContainer>
                 {/* Center Text */}
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                    <span className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-700'}`}>24</span>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Total</p>
                 </div>
              </div>
           </motion.div>

        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-3xl p-6 shadow-sm border transition-colors duration-300 lg:col-span-2 ${
              isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
            }`}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-emerald-500 rounded-full"></div>
              <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-700'}`}>Recent Events</h3>
            </div>
            <div className="space-y-3">
              {[
                { t: 'Device DM-102 connected', time: '2m ago' },
                { t: 'Alert resolved: Low pressure', time: '15m ago' },
                { t: 'Firmware update scheduled', time: '1h ago' },
                { t: 'User session ended', time: '3h ago' },
              ].map((e, i) => (
                <div key={i} className={`flex items-center justify-between px-4 py-3 rounded-xl ${isDarkMode ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className={isDarkMode ? 'text-white' : 'text-slate-700'}>{e.t}</span>
                  </div>
                  <span className="text-xs text-slate-400">{e.time}</span>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-3xl p-6 shadow-sm border transition-colors duration-300 ${
              isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
            }`}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
              <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-700'}`}>Quick Stats</h3>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Devices Online</span>
                  <span className="font-semibold text-blue-500">14</span>
                </div>
                <div className={`h-2 rounded-full mt-2 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
                  <div className="h-2 rounded-full bg-blue-500" style={{ width: '70%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Alerts</span>
                  <span className="font-semibold text-red-500">3</span>
                </div>
                <div className={`h-2 rounded-full mt-2 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
                  <div className="h-2 rounded-full bg-red-500" style={{ width: '20%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Avg Usage (hrs)</span>
                  <span className="font-semibold text-emerald-500">6.5</span>
                </div>
                <div className={`h-2 rounded-full mt-2 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
                  <div className="h-2 rounded-full bg-emerald-500" style={{ width: '65%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Compliance Rate</span>
                  <span className="font-semibold text-teal-500">92%</span>
                </div>
                <div className={`h-2 rounded-full mt-2 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
                  <div className="h-2 rounded-full bg-teal-500" style={{ width: '92%' }}></div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
