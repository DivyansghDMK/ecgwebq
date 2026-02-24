 
 import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { FileText, Eye, RefreshCcw, LayoutDashboard, LogOut, Heart, CheckCircle, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchDoctorReports, fetchReviewedReports, DoctorReportSummary } from "@/api/ecgApi";
import { ReviewModal, DoctorReport } from "./ReviewModal";

export const DoctorReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [reports, setReports] = useState<DoctorReport[]>([]);
  const [reviewedReports, setReviewedReports] = useState<DoctorReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewedLoading, setReviewedLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewedError, setReviewedError] = useState<string | null>(null);
  const [selected, setSelected] = useState<DoctorReport | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'reviewed'>('pending');
  
  // Pagination states
  const [pendingPage, setPendingPage] = useState(1);
  const [reviewedPage, setReviewedPage] = useState(1);
  const REPORTS_PER_PAGE = 10;

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get doctorName from localStorage
      const doctorName = localStorage.getItem("ecg_doctor_name");
      if (!doctorName) {
        setError("Doctor name not found. Please review a report first to set your Doctor Name.");
        setReports([]);
        return;
      }
      
      const data = await fetchDoctorReports();
      setReports(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load reports.");
    } finally {
      setLoading(false);
    }
  };

  const loadReviewedReports = async () => {
    setReviewedLoading(true);
    setReviewedError(null);
    try {
      // Get doctorName from localStorage
      const doctorName = localStorage.getItem("ecg_doctor_name");
      if (!doctorName) {
        setReviewedError("Doctor name not found. Please review a report first to set your Doctor Name.");
        setReviewedReports([]);
        return;
      }
      
      const data = await fetchReviewedReports();
      setReviewedReports(data);
    } catch (err: any) {
      setReviewedError(err?.message || "Failed to load reviewed reports.");
    } finally {
      setReviewedLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
    loadReviewedReports();
  }, []);

  const handleReview = (report: DoctorReport) => {
    setSelected(report);
    setReviewOpen(true);
  };

  const handleSubmitted = (reviewedReport: DoctorReport) => {
    // Remove from pending list
    setReports(prev => prev.filter(r => r.key !== reviewedReport.key));
    
    // Add to reviewed list with timestamp (convert to DoctorReportSummary)
    const reviewedSummary: DoctorReportSummary = {
      key: reviewedReport.key,
      fileName: reviewedReport.fileName,
      url: reviewedReport.url,
      uploadedAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };
    
    setReviewedReports(prev => {
      const updated = [reviewedSummary, ...prev];
      return updated;
    });
    
    // Reset to first page of reviewed reports
    setReviewedPage(1);
    
    // Switch to reviewed tab to show the newly reviewed report
    setActiveTab('reviewed');
  };

  const isReportsActive = location.pathname === '/doctor/reports';

  // Pagination helpers
  const getCurrentPendingReports = () => {
    const startIndex = (pendingPage - 1) * REPORTS_PER_PAGE;
    const endIndex = startIndex + REPORTS_PER_PAGE;
    return reports.slice(startIndex, endIndex);
  };

  const getCurrentReviewedReports = () => {
    const startIndex = (reviewedPage - 1) * REPORTS_PER_PAGE;
    const endIndex = startIndex + REPORTS_PER_PAGE;
    return reviewedReports.slice(startIndex, endIndex);
  };

  const getTotalPendingPages = () => Math.ceil(reports.length / REPORTS_PER_PAGE);
  const getTotalReviewedPages = () => Math.ceil(reviewedReports.length / REPORTS_PER_PAGE);

  const PaginationControls = ({ 
    currentPage, 
    totalPages, 
    setPage, 
    totalItems 
  }: { 
    currentPage: number; 
    totalPages: number; 
    setPage: (page: number) => void; 
    totalItems: number; 
  }) => {
    const startItem = (currentPage - 1) * REPORTS_PER_PAGE + 1;
    const endItem = Math.min(currentPage * REPORTS_PER_PAGE, totalItems);
    
    return (
      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800">
        <div className="text-xs text-slate-400">
          Showing {startItem}-{endItem} of {totalItems} reports
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-1 rounded text-slate-400 hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} />
          </motion.button>
          <span className="text-xs text-slate-400 min-w-[60px] text-center">
            Page {currentPage} of {totalPages}
          </span>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-1 rounded text-slate-400 hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={16} />
          </motion.button>
        </div>
      </div>
    );
  };

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
              onClick={() => {
                loadReports();
                loadReviewedReports();
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-100 shadow hover:bg-slate-700"
            >
              <RefreshCcw size={14} />
              Refresh
            </motion.button>
          </div>

          {/* Tabs */}
          <div className="mb-6 flex gap-1 rounded-xl bg-slate-800/50 p-1 w-fit">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('pending')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'pending'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock size={16} />
              Pending Reports ({reports.length})
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('reviewed')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'reviewed'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CheckCircle size={16} />
              Reviewed Reports ({reviewedReports.length})
            </motion.button>
          </div>

          {/* Pending Reports Section */}
          {activeTab === 'pending' && (
            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl">
              <div className="border-b border-slate-800 bg-slate-900/80 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Pending ECG PDF Reports
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
                  No pending PDF reports available.
                </div>
              ) : (
                <>
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
                        {getCurrentPendingReports().map((report) => (
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
                  {getTotalPendingPages() > 1 && (
                    <PaginationControls
                      currentPage={pendingPage}
                      totalPages={getTotalPendingPages()}
                      setPage={setPendingPage}
                      totalItems={reports.length}
                    />
                  )}
                </>
              )}
            </div>
          )}

          {/* Reviewed Reports Section */}
          {activeTab === 'reviewed' && (
            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl">
              <div className="border-b border-slate-800 bg-slate-900/80 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Reviewed ECG PDF Reports
                </p>
              </div>

              {reviewedLoading ? (
                <div className="flex items-center justify-center py-10 text-sm text-slate-300">
                  Loading reviewed reports...
                </div>
              ) : reviewedError ? (
                <div className="flex items-center justify-center py-10 text-sm text-red-300">
                  {reviewedError}
                </div>
              ) : reviewedReports.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-sm text-slate-400">
                  <CheckCircle className="mb-3 h-10 w-10 text-slate-700" />
                  No reviewed PDF reports available yet.
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-800 text-sm">
                      <thead className="bg-slate-900/80">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                            File Name
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Reviewed Date
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
                        {getCurrentReviewedReports().map((report) => (
                          <tr key={report.key} className="hover:bg-slate-900/60">
                            <td className="px-4 py-3 text-slate-100">
                              {report.fileName}
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-400">
                              {report.uploadedAt
                                ? new Date(report.uploadedAt).toLocaleString()
                                : report.lastModified
                                ? new Date(report.lastModified).toLocaleString()
                                : "--"}
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-400">
                              {report.lastModified || report.uploadedAt
                                ? new Date(report.lastModified || report.uploadedAt!).toLocaleString()
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
                                <div className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-400">
                                  <CheckCircle size={14} />
                                  Reviewed
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {getTotalReviewedPages() > 1 && (
                    <PaginationControls
                      currentPage={reviewedPage}
                      totalPages={getTotalReviewedPages()}
                      setPage={setReviewedPage}
                      totalItems={reviewedReports.length}
                    />
                  )}
                </>
              )}
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
  );
};

export default DoctorReportsPage;


