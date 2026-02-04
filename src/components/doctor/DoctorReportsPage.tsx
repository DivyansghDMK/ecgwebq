import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { FileText, Eye, RefreshCcw, LayoutDashboard, LogOut, Heart } from "lucide-react";
import { fetchDoctorReports } from "@/api/ecgApi";
import { ReviewModal, DoctorReport } from "./ReviewModal";

export const DoctorReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [reports, setReports] = useState<DoctorReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<DoctorReport | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDoctorReports();
      setReports(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleReview = (report: DoctorReport) => {
    setSelected(report);
    setReviewOpen(true);
  };

  const handleSubmitted = () => {
    // Refresh list after upload (optional)
    loadReports();
  };

  const isReportsActive = location.pathname === '/doctor/reports';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        className="fixed left-0 top-0 z-40 h-screen w-64 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-r border-white/10 flex flex-col shadow-2xl"
      >
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-brand-orange to-brand-electric rounded-xl shadow-glow">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-white">CARDIOX</h2>
              <p className="text-xs text-white/60">ECG Reports</p>
            </div>
          </div>
        </div>
        
        <nav className="p-4 space-y-1">
          {[
            { name: 'Dashboard', icon: LayoutDashboard, id: 'dashboard', path: '/doctor' },
            { name: 'Reports', icon: FileText, id: 'reports', path: '/doctor/reports' },
          ].map((item) => (
            <motion.button
              key={item.id}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                (item.id === 'reports' && isReportsActive) || (item.id === 'dashboard' && !isReportsActive)
                  ? 'bg-gradient-to-r from-brand-orange via-brand-electric to-brand-focus text-white shadow-glow'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </motion.button>
          ))}
        </nav>
        
        <div className="p-4 border-t border-white/10 mt-auto">
          <motion.button
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-900/20 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </motion.button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 ml-64">
        <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-orange-500/20 p-2 text-orange-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Doctor Reports</h1>
              <p className="text-xs text-slate-400">
                Review uploaded ECG PDF reports and submit your findings.
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={loadReports}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-100 shadow hover:bg-slate-700"
          >
            <RefreshCcw size={14} />
            Refresh
          </motion.button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl">
          <div className="border-b border-slate-800 bg-slate-900/80 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Recent ECG PDF Reports
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10 text-sm text-slate-300">
              Loading reports...
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-10 text-sm text-red-300">
              {error}
            </div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-sm text-slate-400">
              <FileText className="mb-3 h-10 w-10 text-slate-700" />
              No PDF reports available yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800 text-sm">
                <thead className="bg-slate-900/80">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                      File Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Last Modified
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {reports.map((report) => (
                    <tr key={report.key} className="hover:bg-slate-900/60">
                      <td className="px-4 py-3 text-slate-100">
                        {report.fileName}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {(report.lastModified || (report as any).uploadedAt)
                          ? new Date((report.lastModified || (report as any).uploadedAt)!).toLocaleString()
                          : "--"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <motion.button
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => report.url && window.open(report.url, "_blank")}
                            className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-700"
                          >
                            <Eye size={14} />
                            Preview
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => handleReview(report)}
                            className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:from-orange-600 hover:to-amber-600"
                          >
                            Review
                          </motion.button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <ReviewModal
          open={reviewOpen}
          report={selected}
          onClose={() => setReviewOpen(false)}
          onSubmitted={handleSubmitted}
        />
        </div>
      </div>
    </div>
  );
};

export default DoctorReportsPage;


