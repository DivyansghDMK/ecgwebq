import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  FileClock,
  FileText,
  LayoutDashboard,
  LogOut,
  Mail,
  Moon,
  RefreshCcw,
  Stethoscope,
  Sun,
  UserCircle2,
} from "lucide-react";
import { fetchDoctorReports, fetchReviewedReports, type DoctorReportSummary } from "@/api/ecgApi";
import { useAuth } from "@/contexts/AuthContext";
import { useDoctorTheme } from "./useDoctorTheme";
import "./doctor-theme.css";

interface DashboardAlert {
  type: "overdue" | "new";
  message: string;
}

function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value?: string): string {
  if (!value) {
    return "--";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "--";
  }

  return parsed.toLocaleString();
}

function getStartOfToday(now: Date): Date {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  return start;
}

function getStartOfWeek(now: Date): Date {
  const start = new Date(now);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

function safeDate(value?: string): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getTurnaroundMinutes(report: DoctorReportSummary): number | null {
  const assignedAt = safeDate(report.assignedAt || report.lastModified || report.uploadedAt);
  const reviewedAt = safeDate(report.reviewedAt || report.uploadedAt || report.lastModified);

  if (!assignedAt || !reviewedAt) {
    return null;
  }

  const diff = reviewedAt.getTime() - assignedAt.getTime();
  if (diff < 0) {
    return null;
  }

  return Math.round(diff / 60000);
}

function formatTurnaround(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes === 0 ? `${hours}h` : `${hours}h ${remainingMinutes}m`;
}

function buildAlerts(pendingReports: DoctorReportSummary[], now: Date): DashboardAlert[] {
  const alerts: DashboardAlert[] = [];
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const overdueCount = pendingReports.filter((report) => {
    const assignedAt = safeDate(report.assignedAt || report.lastModified || report.uploadedAt);
    return assignedAt ? assignedAt < oneDayAgo : false;
  }).length;

  const newlyAssignedCount = pendingReports.filter((report) => {
    const assignedAt = safeDate(report.assignedAt || report.lastModified || report.uploadedAt);
    return assignedAt ? assignedAt >= oneDayAgo : false;
  }).length;

  if (overdueCount > 0) {
    alerts.push({
      type: "overdue",
      message: `${overdueCount} pending report${overdueCount === 1 ? "" : "s"} older than 24 hours`,
    });
  }

  if (newlyAssignedCount > 0) {
    alerts.push({
      type: "new",
      message: `${newlyAssignedCount} newly assigned report${newlyAssignedCount === 1 ? "" : "s"} in the last 24 hours`,
    });
  }

  return alerts;
}

const DoctorDashboardPresentation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useDoctorTheme();

  const [pendingReports, setPendingReports] = useState<DoctorReportSummary[]>([]);
  const [reviewedReports, setReviewedReports] = useState<DoctorReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);

    try {
      const [pending, reviewed] = await Promise.all([
        fetchDoctorReports(),
        fetchReviewedReports(),
      ]);

      setPendingReports(pending);
      setReviewedReports(reviewed);
    } catch (err: any) {
      setError(err?.message || "Failed to load doctor dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const now = useMemo(() => new Date(), []);
  const formattedDate = useMemo(() => formatLongDate(now), [now]);

  const metrics = useMemo(() => {
    const startOfToday = getStartOfToday(now);
    const startOfWeek = getStartOfWeek(now);

    const reviewedToday = reviewedReports.filter((report) => {
      const reviewedAt = safeDate(report.reviewedAt || report.uploadedAt || report.lastModified);
      return reviewedAt ? reviewedAt >= startOfToday : false;
    }).length;

    const reviewedThisWeek = reviewedReports.filter((report) => {
      const reviewedAt = safeDate(report.reviewedAt || report.uploadedAt || report.lastModified);
      return reviewedAt ? reviewedAt >= startOfWeek : false;
    }).length;

    const turnaroundSamples = reviewedReports
      .map((report) => getTurnaroundMinutes(report))
      .filter((value): value is number => value !== null);

    const avgTurnaroundMinutes =
      turnaroundSamples.length > 0
        ? Math.round(turnaroundSamples.reduce((sum, value) => sum + value, 0) / turnaroundSamples.length)
        : null;

    return {
      pendingCount: pendingReports.length,
      reviewedToday,
      reviewedThisWeek,
      avgTurnaroundMinutes,
    };
  }, [now, pendingReports.length, reviewedReports]);

  const alerts = useMemo(() => buildAlerts(pendingReports, now), [now, pendingReports]);
  const pendingPreview = useMemo(() => pendingReports.slice(0, 5), [pendingReports]);
  const reviewedPreview = useMemo(
    () =>
      [...reviewedReports]
        .sort((a, b) => {
          const aDate = safeDate(a.reviewedAt || a.uploadedAt || a.lastModified)?.getTime() || 0;
          const bDate = safeDate(b.reviewedAt || b.uploadedAt || b.lastModified)?.getTime() || 0;
          return bDate - aDate;
        })
        .slice(0, 6),
    [reviewedReports]
  );

  const metricCards = [
    {
      key: "pending",
      title: "Pending Reports",
      value: String(metrics.pendingCount),
      icon: FileClock,
      accent: "from-orange-500 to-amber-500",
    },
    {
      key: "today",
      title: "Reviewed Today",
      value: String(metrics.reviewedToday),
      icon: CheckCircle2,
      accent: "from-emerald-500 to-teal-500",
    },
    {
      key: "week",
      title: "Reviewed This Week",
      value: String(metrics.reviewedThisWeek),
      icon: CalendarDays,
      accent: "from-cyan-500 to-blue-500",
    },
  ];

  if (metrics.avgTurnaroundMinutes !== null) {
    metricCards.push({
      key: "turnaround",
      title: "Average Turnaround",
      value: formatTurnaround(metrics.avgTurnaroundMinutes),
      icon: Clock3,
      accent: "from-violet-500 to-indigo-500",
    });
  }

  const isReportsActive = location.pathname === "/doctor/reports";

  return (
    <div className="doctor-workspace min-h-screen bg-slate-950 text-slate-50 flex" data-theme={theme}>
      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        className="doctor-sidebar fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-white/10 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 shadow-2xl lg:flex lg:flex-col"
      >
        <div className="doctor-sidebar-header border-b border-white/10 p-6 flex justify-center">
          <img
            src="/cardiox-logo.png"
            alt="CardioX Logo"
            className="h-12 w-auto object-contain"
          />
        </div>

        <nav className="space-y-1 p-4">
          {[
            { name: "Dashboard", icon: LayoutDashboard, path: "/doctor" },
            { name: "Reports", icon: FileText, path: "/doctor/reports" },
          ].map((item) => (
            <motion.button
              key={item.path}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(item.path)}
              className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition-all ${
                (!isReportsActive && item.path === "/doctor") || (isReportsActive && item.path === "/doctor/reports")
                  ? "bg-gradient-to-r from-brand-orange via-brand-electric to-brand-focus text-white shadow-glow"
                  : "doctor-nav-idle text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-5 w-5" />
                {item.name}
              </div>
            </motion.button>
          ))}
        </nav>

        <div className="doctor-sidebar-footer mt-auto border-t border-white/10 p-4 space-y-2">
          <motion.button
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={toggleTheme}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition-all hover:bg-white/10"
            aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
          >
            {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            {theme === "light" ? "Dark mode" : "Light mode"}
          </motion.button>
          <motion.button
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              logout("doctor");
              navigate("/login");
            }}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-400 transition-all hover:bg-red-900/20"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </motion.button>
        </div>
      </motion.aside>

      <div className="flex-1 lg:ml-64">
        <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="doctor-page-title text-3xl font-bold text-white">Healthcare Professional Dashboard</h1>
              <p className="doctor-page-subtitle mt-1 text-sm text-slate-400">Operational view for your assigned ECG work.</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => void loadDashboard()}
              className="doctor-refresh-button inline-flex items-center gap-2 self-start rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-100 shadow hover:bg-slate-700"
            >
              <RefreshCcw size={16} />
              Refresh
            </motion.button>
          </div>

          {loading ? (
            <div className="space-y-6">
              <div className="h-48 animate-pulse rounded-3xl border border-white/10 bg-white/5" />
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="h-32 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
                ))}
              </div>
              <div className="grid gap-6 xl:grid-cols-3">
                <div className="h-96 animate-pulse rounded-2xl border border-white/10 bg-white/5 xl:col-span-2" />
                <div className="h-64 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
              </div>
            </div>
          ) : error ? (
            <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-8 text-center">
              <AlertTriangle className="mx-auto h-10 w-10 text-rose-300" />
              <h2 className="mt-4 text-xl font-semibold text-white">Unable to load dashboard</h2>
              <p className="mt-2 text-sm text-rose-100/90">{error}</p>
              <button
                type="button"
                onClick={() => void loadDashboard()}
                className="mt-5 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
              >
                Try again
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="doctor-hero-card overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800"
              >
                <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
                  <div className="space-y-4">
                    <div className="doctor-badge inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-cyan-100">
                      <Stethoscope className="h-3.5 w-3.5" />
                      Logged-in healthcare professional view
                    </div>
                    <div>
                      <h2 className="doctor-card-title text-3xl font-semibold text-white">Welcome, {user?.name || "Healthcare Professional"}</h2>
                      <p className="doctor-muted mt-2 text-sm text-slate-300">{formattedDate}</p>
                    </div>
                    <p className="doctor-muted max-w-2xl text-sm leading-7 text-slate-300">
                      You have <span className="doctor-card-title font-semibold text-white">{metrics.pendingCount} pending reports</span> and{" "}
                      <span className="doctor-card-title font-semibold text-white">{metrics.reviewedToday} reviewed today</span>.
                    </p>
                  </div>

                  <div className="doctor-profile-card rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500/25 to-cyan-500/25 text-white">
                        <UserCircle2 className="h-9 w-9" />
                      </div>
                      <div>
                        <h3 className="doctor-card-title text-lg font-semibold text-white">{user?.name || "Healthcare Professional"}</h3>
                        <p className="doctor-muted text-sm text-slate-400">Healthcare professional session</p>
                      </div>
                    </div>
                    {user?.email && (
                      <div className="doctor-profile-inner mt-4 flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-slate-200">
                        <Mail className="h-4 w-4 text-cyan-300" />
                        {user.email}
                      </div>
                    )}
                  </div>
                </div>
              </motion.section>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {metricCards.map((card, index) => (
                  <motion.div
                    key={card.key}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.06 }}
                    className="doctor-metric-card rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-xl"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <div className={`rounded-2xl bg-gradient-to-br ${card.accent} p-3 text-white shadow-lg`}>
                        <card.icon className="h-5 w-5" />
                      </div>
                    </div>
                    <p className="doctor-muted text-sm text-slate-400">{card.title}</p>
                    <div className="doctor-card-title mt-2 text-3xl font-semibold text-white">{card.value}</div>
                  </motion.div>
                ))}
              </div>

              <div className="grid gap-6 xl:grid-cols-3">
                <motion.section
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="doctor-panel overflow-hidden rounded-2xl border border-white/10 bg-slate-900/75 shadow-xl xl:col-span-2"
                >
                  <div className="doctor-panel-divider flex items-center justify-between border-b border-white/10 px-5 py-4">
                    <div>
                      <h2 className="doctor-table-title text-lg font-semibold text-white">Pending Queue Preview</h2>
                      <p className="doctor-muted text-xs text-slate-400">Top pending reports assigned to you</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate("/doctor/reports")}
                      className="inline-flex items-center gap-1 text-sm font-medium text-brand-orange hover:text-brand-electric"
                    >
                      View full queue
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>

                  {pendingPreview.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                      <FileClock className="mb-3 h-10 w-10 text-slate-700" />
                      <h3 className="text-base font-semibold text-white">No pending reports</h3>
                      <p className="mt-2 text-sm text-slate-400">You are all caught up for now.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-white/10 text-sm">
                        <thead className="doctor-table-head bg-slate-900/80">
                          <tr>
                            <th className="doctor-table-heading px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Report</th>
                            <th className="doctor-table-heading px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Patient</th>
                            <th className="doctor-table-heading px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Assigned</th>
                            <th className="doctor-table-heading px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Status</th>
                            <th className="doctor-table-heading px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">Action</th>
                          </tr>
                        </thead>
                        <tbody className="doctor-table-body divide-y divide-white/10">
                          {pendingPreview.map((report) => (
                            <tr key={report.id} className="doctor-table-row hover:bg-white/5">
                              <td className="px-5 py-4">
                                <div className="doctor-table-cell-strong font-medium text-white">{report.fileName}</div>
                                <div className="text-xs text-slate-500">{report.reportType || "ECG"}</div>
                              </td>
                              <td className="doctor-table-cell px-5 py-4 text-slate-300">{report.patientName || "--"}</td>
                              <td className="doctor-table-cell px-5 py-4 text-slate-300">
                                {formatDateTime(report.assignedAt || report.lastModified || report.uploadedAt)}
                              </td>
                              <td className="px-5 py-4">
                                <span className="inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
                                  {report.status || "pending"}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => navigate("/doctor/reports")}
                                    className="rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:from-orange-600 hover:to-amber-600"
                                  >
                                    Review now
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => report.url && window.open(report.url, "_blank")}
                                    disabled={!report.url}
                                    className="doctor-secondary-button inline-flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                    Open
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </motion.section>

                {alerts.length > 0 && (
                  <motion.section
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="doctor-alert-card rounded-2xl border border-white/10 bg-slate-900/75 p-5 shadow-xl"
                  >
                    <div className="mb-4 flex items-center gap-2">
                      <div className="rounded-xl bg-amber-500/15 p-2 text-amber-300">
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="doctor-card-title text-lg font-semibold text-white">Reminders</h2>
                        <p className="doctor-muted text-xs text-slate-400">Derived from your current queue</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {alerts.map((alert) => (
                        <div key={alert.message} className="doctor-alert-inner rounded-2xl border border-white/10 bg-white/5 p-4">
                          <p className="doctor-table-cell text-sm leading-6 text-slate-200">{alert.message}</p>
                        </div>
                      ))}
                    </div>
                  </motion.section>
                )}
              </div>

              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="doctor-panel overflow-hidden rounded-2xl border border-white/10 bg-slate-900/75 shadow-xl"
              >
                <div className="doctor-panel-divider flex items-center justify-between border-b border-white/10 px-5 py-4">
                  <div>
                    <h2 className="doctor-table-title text-lg font-semibold text-white">Recent Reviewed Reports</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate("/doctor/reports")}
                    className="inline-flex items-center gap-1 text-sm font-medium text-brand-orange hover:text-brand-electric"
                  >
                    Open reports
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>

                {reviewedPreview.length === 0 ? (
                  <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                    <CheckCircle2 className="mb-3 h-10 w-10 text-slate-700" />
                    <h3 className="text-base font-semibold text-white">No reviewed reports yet</h3>
                    <p className="mt-2 text-sm text-slate-400">Completed reports will appear here once you review them.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-white/10 text-sm">
                      <thead className="doctor-table-head bg-slate-900/80">
                        <tr>
                          <th className="doctor-table-heading px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Report</th>
                          <th className="doctor-table-heading px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Patient</th>
                          <th className="doctor-table-heading px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Type</th>
                          <th className="doctor-table-heading px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Reviewed At</th>
                          <th className="doctor-table-heading px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Status</th>
                          <th className="doctor-table-heading px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">Action</th>
                        </tr>
                      </thead>
                      <tbody className="doctor-table-body divide-y divide-white/10">
                        {reviewedPreview.map((report) => (
                          <tr key={report.id} className="doctor-table-row hover:bg-white/5">
                            <td className="px-5 py-4">
                              <div className="doctor-table-cell-strong font-medium text-white">{report.fileName}</div>
                            </td>
                            <td className="doctor-table-cell px-5 py-4 text-slate-300">{report.patientName || "--"}</td>
                            <td className="doctor-table-cell px-5 py-4 text-slate-300">{report.reportType || "ECG"}</td>
                            <td className="doctor-table-cell px-5 py-4 text-slate-300">
                              {formatDateTime(report.reviewedAt || report.uploadedAt || report.lastModified)}
                            </td>
                            <td className="px-5 py-4">
                              <span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                                {report.status || "reviewed"}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <button
                                type="button"
                                onClick={() => report.url && window.open(report.url, "_blank")}
                                disabled={!report.url}
                                className="doctor-secondary-button inline-flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboardPresentation;
