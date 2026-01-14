import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, Download, FileText, Loader2, AlertCircle, X, Eye, EyeOff } from "lucide-react";
import { fetchReports } from "../../../services/reportsApi";
import { downloadPDF, createPDFPreviewURL, generatePDFfromElement } from "../../../utils/pdfGenerator";
import type { Report, ReportFilters } from "../../../types/reports";

export default function ReportsPage() {
  const navigate = useNavigate();
  
  // Admin access check
  useEffect(() => {
    const role = localStorage.getItem("role");
    const adminLoggedIn = localStorage.getItem("admin_logged_in");
    
    if (role !== "admin" && adminLoggedIn !== "true") {
      navigate("/login");
    }
  }, [navigate]);

  // State management
  const [filters, setFilters] = useState<ReportFilters>({
    name: "",
    phoneNumber: "",
    deviceId: "",
    startDate: "",
    endDate: "",
  });
  
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  // Fetch reports function
  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setSelectedReport(null);
    setPdfBlob(null);
    setPdfPreviewUrl(null);

    try {
      const response = await fetchReports(filters);
      setReports(response.reports || []);
      
      if (response.reports && response.reports.length === 0) {
        setError("No reports found matching your search criteria.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch reports. Please try again.");
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle numeric-only input (for phone number and device ID)
  const handleNumericInput = (key: keyof ReportFilters, value: string) => {
    // Remove all non-numeric characters
    const numericValue = value.replace(/[^0-9]/g, '');
    setFilters((prev) => ({
      ...prev,
      [key]: numericValue,
    }));
  };

  // Handle filter input changes
  const handleFilterChange = (key: keyof ReportFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Handle report selection
  const handleReportSelect = async (report: Report) => {
    setSelectedReport(report);
    setPdfBlob(null);
    setPdfPreviewUrl(null);
  };

  // Handle PDF download
  const handleDownloadPDF = () => {
    if (pdfBlob && selectedReport) {
      const filename = `report_${selectedReport.id}_${selectedReport.name || 'report'}.pdf`;
      downloadPDF(pdfBlob, filename);
    }
  };

  useEffect(() => {
    if (selectedReport) {
      setGeneratingPDF(true);
      setPdfBlob(null);
      setPdfPreviewUrl(null);
      requestAnimationFrame(async () => {
        try {
          const blob = await generatePDFfromElement("ecg-report");
          setPdfBlob(blob);
          setPdfPreviewUrl(createPDFPreviewURL(blob));
        } catch (err: any) {
          setError(err.message || "Failed to generate PDF. Please try again.");
        } finally {
          setGeneratingPDF(false);
        }
      });
    }
  }, [selectedReport]);
  // Clear filters
  const handleClearFilters = () => {
    setFilters({
      name: "",
      phoneNumber: "",
      deviceId: "",
      startDate: "",
      endDate: "",
    });
    setReports([]);
    setSelectedReport(null);
    setPdfBlob(null);
    setPdfPreviewUrl(null);
    setError(null);
  };

  const formatDate = (dateString: string) => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const d = new Date(dateString);
      const fmt = new Intl.DateTimeFormat('en-GB', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      return `${fmt.format(d)} ${tz}`;
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Mock Data Notice - Only show when using mock data */}
      {import.meta.env.VITE_USE_MOCK_DATA === 'true' && (
        <div className="bg-amber-50/60 border border-amber-200/70 rounded-lg p-3 flex items-center gap-2">
          <AlertCircle className="text-amber-600" size={18} />
          <p className="text-amber-800 text-sm flex-1">
            <strong>Testing Mode:</strong> Using mock data. To use real API, set VITE_API_BASE_URL in .env file.
          </p>
        </div>
      )}
      {/* Search & Filter Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-slate-200 shadow-sm p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <FileText className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Reports Management</h3>
              <p className="text-sm text-slate-600 mt-0.5">Search and manage patient reports</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all"
            >
              {showFilters ? <EyeOff size={18} className="text-emerald-600" /> : <Eye size={18} className="text-emerald-600" />}
              <span className="text-sm font-medium">{showFilters ? "Hide" : "Show"} Filters</span>
            </button>
            <motion.button
              onClick={handleSearch}
              disabled={loading}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-400/30 to-teal-400/30 text-slate-900 font-medium rounded-xl backdrop-blur-md border border-white/30 shadow-sm hover:from-emerald-400/40 hover:to-teal-400/40 hover:border-white/40 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search size={18} />
                  Search Reports
                </>
              )}
            </motion.button>
            <button
              onClick={handleClearFilters}
              className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-lg border border-slate-200 transition-all"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Search & Filter Form */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                {/* Name Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <FileText size={16} className="text-emerald-600" />
                    Name
                  </label>
                  <input
                    type="text"
                    value={filters.name || ""}
                    onChange={(e) => handleFilterChange("name", e.target.value)}
                    placeholder="Enter patient name"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white text-slate-900 placeholder:text-slate-500"
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>

                {/* Phone Number Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Search size={16} className="text-emerald-600" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={filters.phoneNumber || ""}
                    onChange={(e) => handleNumericInput("phoneNumber", e.target.value)}
                    placeholder="Enter phone number (numbers only)"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white text-slate-900 placeholder:text-slate-500"
                    onKeyPress={(e) => {
                      // Prevent non-numeric characters from being entered
                      if (!/[0-9]/.test(e.key) && e.key !== "Enter" && e.key !== "Backspace" && e.key !== "Delete" && e.key !== "Tab" && e.key !== "ArrowLeft" && e.key !== "ArrowRight") {
                        e.preventDefault();
                      }
                      if (e.key === "Enter") {
                        handleSearch();
                      }
                    }}
                    onPaste={(e) => {
                      e.preventDefault();
                      const pastedText = e.clipboardData.getData('text');
                      handleNumericInput("phoneNumber", pastedText);
                    }}
                  />
                </div>

                {/* Device ID Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Filter size={16} className="text-emerald-600" />
                    Device ID
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={filters.deviceId || ""}
                    onChange={(e) => handleNumericInput("deviceId", e.target.value)}
                    placeholder="Enter device ID (numbers only)"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white text-slate-900 placeholder:text-slate-500"
                    onKeyPress={(e) => {
                      // Prevent non-numeric characters from being entered
                      if (!/[0-9]/.test(e.key) && e.key !== "Enter" && e.key !== "Backspace" && e.key !== "Delete" && e.key !== "Tab" && e.key !== "ArrowLeft" && e.key !== "ArrowRight") {
                        e.preventDefault();
                      }
                      if (e.key === "Enter") {
                        handleSearch();
                      }
                    }}
                    onPaste={(e) => {
                      e.preventDefault();
                      const pastedText = e.clipboardData.getData('text');
                      handleNumericInput("deviceId", pastedText);
                    }}
                  />
                </div>
                
                {/* Start Date Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={filters.startDate || ""}
                    onChange={(e) => handleFilterChange("startDate", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white text-slate-900 placeholder:text-slate-500"
                  />
                </div>
                
                {/* End Date Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={filters.endDate || ""}
                    onChange={(e) => handleFilterChange("endDate", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white text-slate-900 placeholder:text-slate-500"
                  />
                </div>
              </div>

              
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-yellow-50/60 border border-yellow-200/70 rounded-lg p-4 flex items-center gap-3"
          >
            <AlertCircle className="text-yellow-600" size={20} />
            <p className="text-yellow-800 flex-1 text-sm">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-yellow-600 hover:text-yellow-800 transition-colors"
            >
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reports List (Top Section) */}
      <div className="grid grid-cols-1 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl border border-slate-200 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <FileText className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900">Reports</h3>
            </div>
            <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-full">
              {reports.length}
            </span>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="max-h-[600px] overflow-y-auto">
              <div className="grid grid-cols-5 bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                <div className="p-3 font-semibold text-slate-700">Name</div>
                <div className="p-3 font-semibold text-slate-700 border-x border-slate-200">Phone</div>
                <div className="p-3 font-semibold text-slate-700">Device ID</div>
                <div className="p-3 font-semibold text-slate-700 border-l border-slate-200">Date</div>
                <div className="p-3 font-semibold text-slate-700 border-l border-slate-200">Type</div>
              </div>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="animate-spin text-emerald-600" size={40} />
                <p className="text-slate-600 mt-4 text-sm">Loading reports...</p>
              </div>
            ) : reports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="text-slate-300" size={48} />
                <p className="text-slate-600 mt-4 text-sm">
                  {error ? "No reports found" : "Search for reports using the filters above"}
                </p>
              </div>
            ) : (
              reports.map((report, idx) => (
                <div
                  key={report.id}
                  onClick={() => handleReportSelect(report)}
                  className={`grid grid-cols-5 border-t border-slate-200 cursor-pointer transition-colors ${
                    selectedReport?.id === report.id ? "bg-emerald-50" : "odd:bg-white even:bg-slate-50 hover:bg-slate-100"
                  }`}
                >
                  <div className="p-3 text-slate-900 font-medium">{report.name || "Unnamed Report"}</div>
                  <div className="p-3 text-slate-700 border-x border-slate-200">{report.phoneNumber || "N/A"}</div>
                  <div className="p-3 text-slate-700">{report.deviceId || "N/A"}</div>
                  <div className="p-3 text-slate-700 border-l border-slate-200">{formatDate(report.date)}</div>
                  <div className="p-3 text-slate-700 border-l border-slate-200">{report.type || "-"}</div>
                </div>
              ))
            )}
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Report Details Card */}
        <div className="bg-gradient-to-br from-purple-50/30 to-pink-50/20 rounded-xl border border-purple-200/50 shadow-sm p-6 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FileText className="w-5 h-5 text-purple-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Report Details</h3>
          </div>

          {!selectedReport ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="text-gray-300" size={48} />
              <p className="text-gray-500 mt-4 text-sm">
                Select a report to view details and generate PDF
              </p>
            </div>
          ) : (
            <div className="space-y-4">
                <div
                  id="ecg-report"
                  data-report-id={selectedReport.id}
                  data-report-name={selectedReport.name || ''}
                  data-device-id={selectedReport.deviceId || ''}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-700">Org: {selectedReport.ecg?.org || '-'}</p>
                      <p className="text-sm text-gray-700">Phone No: {selectedReport.ecg?.phone || selectedReport.phoneNumber || '-'}</p>
                    </div>
                    <h4 className="text-2xl font-bold text-gray-900">ECG Report</h4>
                    <div className="w-28" />
                  </div>

                  <div className="border border-gray-300 rounded-md">
                    <div className="grid grid-cols-4 gap-0">
                      <div className="col-span-2 border-r border-gray-300 p-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="font-semibold text-gray-800">Name:</div>
                          <div className="text-gray-700">{selectedReport.ecg?.patient?.name || selectedReport.name}</div>
                          <div className="font-semibold text-gray-800">Age:</div>
                          <div className="text-gray-700">{selectedReport.ecg?.patient?.age ?? '-'}</div>
                          <div className="font-semibold text-gray-800">Gender:</div>
                          <div className="text-gray-700">{selectedReport.ecg?.patient?.gender ?? '-'}</div>
                        </div>
                      </div>
                      <div className="col-span-2 p-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="font-semibold text-gray-800">Date:</div>
                          <div className="text-gray-700">{selectedReport.ecg?.datetime?.date || formatDate(selectedReport.date).split(',')[0]}</div>
                          <div className="font-semibold text-gray-800">Time:</div>
                          <div className="text-gray-700">{selectedReport.ecg?.datetime?.time || formatDate(selectedReport.date).split(',')[1]?.trim() || '-'}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="italic font-semibold text-gray-900">Report Overview</h4>
                    <div className="mt-2 border border-gray-300 rounded-md">
                      <div className="grid grid-cols-3">
                        <div className="border-r border-gray-300 p-3">
                          <div className="font-semibold text-gray-800">Maximum Heart Rate:</div>
                          <div className="text-gray-700">{selectedReport.ecg?.overview?.maxHR ?? '-'}</div>
                        </div>
                        <div className="border-r border-gray-300 p-3">
                          <div className="font-semibold text-gray-800">Minimum Heart Rate:</div>
                          <div className="text-gray-700">{selectedReport.ecg?.overview?.minHR ?? '-'}</div>
                        </div>
                        <div className="p-3">
                          <div className="font-semibold text-gray-800">Average Heart Rate:</div>
                          <div className="text-gray-700">{selectedReport.ecg?.overview?.avgHR ?? '-'}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="italic font-semibold text-gray-900">OBSERVATION</h4>
                    <div className="mt-2 border border-gray-300 rounded-md">
                      <div className="grid grid-cols-3 bg-gray-100 border-b border-gray-300">
                        <div className="p-2 font-semibold text-gray-800">Interval Names</div>
                        <div className="p-2 font-semibold text-gray-800 border-x border-gray-300">Observed Values</div>
                        <div className="p-2 font-semibold text-gray-800">Standard Range</div>
                      </div>
                      {(selectedReport.ecg?.observation || []).map((row: any, i: number) => (
                        <div key={i} className="grid grid-cols-3 border-t border-gray-300">
                          <div className="p-2 text-gray-700">{row.name}</div>
                          <div className="p-2 text-gray-700 border-x border-gray-300">{row.value}</div>
                          <div className="p-2 text-gray-700">{row.range}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="italic font-semibold text-gray-900">ECG Report Conclusion</h4>
                    <div className="mt-2 border border-gray-300 rounded-md">
                      <div className="grid grid-cols-12 bg-gray-100 border-b border-gray-300">
                        <div className="col-span-2 p-2 font-semibold text-gray-800">S.No.</div>
                        <div className="col-span-10 p-2 font-semibold text-gray-800">Conclusion</div>
                      </div>
                      {(selectedReport.ecg?.conclusions || []).map((text: string, idx: number) => (
                        <div key={idx} className="grid grid-cols-12 border-t border-gray-300">
                          <div className="col-span-2 p-2 text-gray-700">{idx + 1}</div>
                          <div className="col-span-10 p-2 text-gray-700">{text}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

        {/* PDF Preview Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <FileText className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900">PDF Preview</h3>
          </div>

          {generatingPDF ? (
            <div className="flex flex-col items-center justify-center py-12 bg-slate-50 rounded-lg border border-slate-200">
              <Loader2 className="animate-spin text-emerald-600" size={40} />
              <p className="text-slate-600 mt-4 text-sm">Generating PDF...</p>
            </div>
          ) : pdfPreviewUrl ? (
            <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
              <iframe
                src={pdfPreviewUrl}
                className="w-full h-[400px]"
                title="PDF Preview"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 bg-slate-50 rounded-lg border border-slate-200">
              <FileText className="text-slate-300" size={48} />
              <p className="text-slate-600 mt-4 text-sm">
                {selectedReport ? "PDF will appear here after generation" : "Select a report to preview"}
              </p>
            </div>
          )
          }
          {pdfBlob && (
            <motion.button
              onClick={handleDownloadPDF}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-400/30 to-teal-400/30 text-slate-900 font-medium rounded-xl backdrop-blur-md border border-white/30 shadow-sm hover:from-emerald-400/40 hover:to-teal-400/40 hover:border-white/40 hover:shadow-md transition-all mt-4"
            >
              <Download size={18} />
              Download PDF
            </motion.button>
          )}
        </div>
      </div>
      
      <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3">
        <div className="flex flex-wrap gap-4">
          <div>Generated: {formatDate(new Date().toISOString())}</div>
          <div>Mode: {import.meta.env.VITE_USE_MOCK_DATA === 'true' ? 'Mock Data (Testing)' : 'Live API'}</div>
          <div>API: {import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}</div>
          <div>Document Version: v1.0</div>
        </div>
      </div>
    </div>
  );
}
