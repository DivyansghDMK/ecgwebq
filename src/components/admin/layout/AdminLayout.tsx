import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, AlertCircle, X } from "lucide-react";
import { useState, useEffect } from "react";

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('admin_theme');
      return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // Apply theme to document and admin-root
  useEffect(() => {
    const root = document.documentElement;
    const adminRoot = document.querySelector('.admin-root') as HTMLElement;
    
    if (isDarkMode) {
      root.classList.add('dark');
      if (adminRoot) {
        adminRoot.classList.add('dark');
      }
    } else {
      root.classList.remove('dark');
      if (adminRoot) {
        adminRoot.classList.remove('dark');
      }
    }
    try {
      localStorage.setItem('admin_theme', isDarkMode ? 'dark' : 'light');
    } catch {}
  }, [isDarkMode]);

  // Toggle theme function
  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const navItems = [
    { path: "/artists", label: "Dashboard", match: (path: string) => path === "/artists" || path === "/artists/" },
    { path: "/artists/users", label: "Users", match: (path: string) => path.includes("users") },
    { path: "/artists/reports", label: "Reports", match: (path: string) => path.includes("reports") },
    { path: "/artists/s3-browser", label: "S3 Browser", match: (path: string) => path.includes("s3-browser") },
    { path: "/artists/graphs", label: "Graphs", match: (path: string) => path.includes("graphs") },
  ];

  const isActive = (matchFn: (path: string) => boolean) => matchFn(location.pathname);

  return (
    <div className={`admin-root min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-slate-950' : 'bg-gradient-to-br from-gray-50 via-white to-gray-50'}`}>
      {/* Enhanced Header Section */}
      <div className={`border-b-2 shadow-lg transition-colors duration-300 ${isDarkMode ? 'bg-slate-900/90 backdrop-blur-sm border-slate-800' : 'bg-white border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            {/* Left Side - CardioX Logo (same as main UI) */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-4"
            >
              {/* CardioX Logo - Orange circle with CX, matching main UI - Clickable to toggle theme */}
              <motion.button
                onClick={toggleTheme}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-3 cursor-pointer group"
                aria-label="Toggle theme"
              >
                <motion.div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 via-orange-600 to-amber-500 shadow-lg group-hover:shadow-xl transition-all duration-300"
                  animate={{
                    boxShadow: [
                      "0 0 40px rgba(255, 138, 61, 0.25)",
                      "0 0 30px rgba(255, 138, 61, 0.15)",
                      "0 0 40px rgba(255, 138, 61, 0.25)"
                    ]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <span className="font-bold text-xl text-white">CX</span>
                </motion.div>
                <div>
                  <p className={`font-bold text-lg uppercase tracking-[0.3em] transition-colors ${isDarkMode ? 'text-orange-500' : 'text-orange-600'}`}>
                    CardioX
                  </p>
                  <p className={`text-xs uppercase tracking-[0.3em] transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    by Deckmount
                  </p>
                </div>
              </motion.button>
              
              {/* Title Section */}
              <div className={`flex flex-col ml-2 border-l-2 pl-4 transition-colors ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                <h1 className={`text-2xl font-bold bg-clip-text text-transparent transition-colors ${isDarkMode ? 'bg-gradient-to-r from-white via-gray-100 to-white text-transparent' : 'bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900'}`}>
                  Admin Dashboard
                </h1>
                <p className={`text-xs mt-0.5 transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Management Portal</p>
              </div>
            </motion.div>

            {/* Right Side - Enhanced Logout Button */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-3"
            >
              <motion.button
                whileHover={{ scale: 1.05, x: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowLogoutModal(true)}
                className="group relative flex items-center gap-2 bg-gradient-to-r from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:via-red-700 hover:to-red-800 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:shadow-red-500/50 transition-all duration-300 overflow-hidden"
              >
                {/* Animated background effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                <LogOut className="w-4 h-4 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
                <span className="relative z-10">Logout</span>
              </motion.button>
            </motion.div>
          </div>
        </div>

        {/* Enhanced Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-6 pb-4">
          <div className={`relative flex gap-2 p-1.5 rounded-2xl transition-colors ${isDarkMode ? 'bg-slate-800/50' : 'bg-gray-100/50'}`}>
            {navItems.map((item, index) => {
              const active = isActive(item.match);
              return (
                <motion.button
                  key={item.path}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(item.path)}
                  className={`relative px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 z-10 ${
                    active
                      ? "text-white shadow-lg"
                      : isDarkMode 
                        ? "text-gray-300 hover:text-white" 
                        : "text-gray-700 hover:text-gray-900"
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 rounded-xl shadow-md shadow-orange-500/50"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{item.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="max-w-7xl mx-auto px-6 py-6 transition-colors">
        <Outlet />
      </div>

      {/* Custom Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutModal(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => setShowLogoutModal(false)}
            >
              <motion.div
                onClick={(e) => e.stopPropagation()}
                className={`relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${
                  isDarkMode 
                    ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700' 
                    : 'bg-white border border-gray-200'
                }`}
              >
                {/* Decorative gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-orange-500/5 to-transparent pointer-events-none" />
                
                {/* Close button */}
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className={`absolute top-4 right-4 p-2 rounded-lg transition-colors ${
                    isDarkMode 
                      ? 'text-gray-400 hover:bg-slate-700 hover:text-white' 
                      : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Content */}
                <div className="p-8">
                  {/* Icon */}
                  <div className="flex justify-center mb-6">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      className="p-4 rounded-full bg-gradient-to-br from-red-500 to-orange-500 shadow-lg shadow-red-500/50"
                    >
                      <AlertCircle className="w-12 h-12 text-white" />
                    </motion.div>
                  </div>

                  {/* Title */}
                  <h2 className={`text-2xl font-bold text-center mb-3 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Confirm Logout
                  </h2>

                  {/* Message */}
                  <p className={`text-center mb-8 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Are you sure you want to logout? You'll need to login again to access the dashboard.
                  </p>

                  {/* Buttons */}
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowLogoutModal(false)}
                      className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
                        isDarkMode
                          ? 'bg-slate-700 text-white hover:bg-slate-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        localStorage.removeItem("admin_logged_in");
                        localStorage.removeItem("role");
                        localStorage.removeItem("token");
                        navigate("/login");
                      }}
                      className="flex-1 py-3 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:via-red-700 hover:to-red-800 shadow-lg hover:shadow-xl hover:shadow-red-500/50 transition-all duration-300"
                    >
                      Logout
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
