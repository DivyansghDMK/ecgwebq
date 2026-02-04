import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, Download, FileText, Loader2, AlertCircle, X, Eye, EyeOff, Phone } from "lucide-react";
import { fetchReports } from "../../../api/ecgApi";
import { downloadPDF, createPDFPreviewURL, generatePDFfromElement } from "../../../utils/pdfGenerator";
import type { ECGReportMetadata, ReportFilters } from "../../../../api/types/ecg";
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
    phone: "",
    deviceId: "",
    startDate: "",
    endDate: "",
  });
  
  const [reports, setReports] = useState<ECGReportMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<ECGReportMetadata | null>(null);
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
      console.log('Fetching reports with filters:', filters);
      const response = await fetchReports(filters);
      console.log('API response:', response);
      setReports(response.data || []);
      console.log('Reports set:', response.data || []);
      
      // Only show error if no reports found and user was actually searching
      const hasSearchFilters = Object.values(filters).some(value => value && typeof value === 'string' && value.trim() !== '');
      if (hasSearchFilters && response.data && response.data.length === 0) {
        setError("No reports found matching your search criteria.");
      } else {
        setError(null); // Clear any previous errors
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
  const numericValue = value.replace(/[^0-9]/g, '');
  setFilters((prev: ReportFilters) => ({
    ...prev,
    [key]: numericValue,
  }));
};

  // Handle filter input changes
const handleFilterChange = (key: keyof ReportFilters, value: string) => {
  setFilters((prev: ReportFilters) => ({
    ...prev,
    [key]: value,
  }));
};

  // Handle report selection
  const handleReportSelect = async (report: ECGReportMetadata) => {
    setSelectedReport(report);
    setPdfBlob(null);
    setPdfPreviewUrl(null);
  };

  // Handle PDF download
  const handleDownloadPDF = () => {
    if (pdfPreviewUrl && selectedReport) {
      const link = document.createElement('a');
      link.href = pdfPreviewUrl;
      link.download = `ECG_Report_${selectedReport.name || 'report'}_${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Handle PDF preview (separate from download)
  const handlePreviewPDF = () => {
    // Preview is already handled by the useEffect when selectedReport changes
    // This function can be used for manual refresh if needed
    if (selectedReport) {
      setGeneratingPDF(true);
      setPdfBlob(null);
      setPdfPreviewUrl(null);
      
      setTimeout(() => {
        const pdfContent = `
          <html>
            <head><title>ECG Report</title></head>
            <body>
              <h1>ECG Report</h1>
              <p><strong>Name:</strong> ${selectedReport.name || selectedReport.patient?.name || 'N/A'}</p>
              <p><strong>Phone:</strong> ${selectedReport.patient?.phone || selectedReport.phoneNumber || 'N/A'}</p>
              <p><strong>Device ID:</strong> ${selectedReport.deviceId || 'N/A'}</p>
              <p><strong>Date:</strong> ${selectedReport.timestamp || selectedReport.date || 'N/A'}</p>
              <hr>
              <div>${selectedReport.ecg ? JSON.stringify(selectedReport.ecg, null, 2) : 'No ECG data available'}</div>
            </body>
          </html>
        `;
        
        const blob = new Blob([pdfContent], { type: 'text/html' });
        setPdfBlob(blob);
        setPdfPreviewUrl(URL.createObjectURL(blob));
        setGeneratingPDF(false);
      }, 1000);
    }
  };

useEffect(() => {
  if (selectedReport) {
    setGeneratingPDF(true);
    setPdfBlob(null);
    setPdfPreviewUrl(null);
    
    // Generate PDF directly from report data
    const generatePDF = async () => {
      try {
        // Create a simple PDF preview URL from the report data
        const pdfContent = `
          <html>
            <head><title>ECG Report</title></head>
            <body>
              <h1>ECG Report</h1>
              <p><strong>Name:</strong> ${selectedReport.name || selectedReport.patient?.name || 'N/A'}</p>
              <p><strong>Phone:</strong> ${selectedReport.patient?.phone || selectedReport.phoneNumber || 'N/A'}</p>
              <p><strong>Device ID:</strong> ${selectedReport.deviceId || 'N/A'}</p>
              <p><strong>Date:</strong> ${selectedReport.timestamp || selectedReport.date || 'N/A'}</p>
              <hr>
              <div>${selectedReport.ecg ? JSON.stringify(selectedReport.ecg, null, 2) : 'No ECG data available'}</div>
            </body>
          </html>
        `;
        
        const blob = new Blob([pdfContent], { type: 'text/html' });
        setPdfBlob(blob);
        setPdfPreviewUrl(URL.createObjectURL(blob));
      } catch (err: any) {
        setError(err.message || "Failed to generate PDF. Please try again.");
      } finally {
        setGeneratingPDF(false);
      }
    };
    
    generatePDF();
  }
}, [selectedReport]);
  // Clear filters
  const handleClearFilters = () => {
    setFilters({
      name: "",
      phone: "",
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
      {(import.meta.env as any).VITE_USE_MOCK_DATA === 'true' && (
        <div className="bg-amber-50/60 dark:bg-amber-900/30 border border-amber-200/70 dark:border-amber-500/60 rounded-lg p-3 flex items-center gap-2">
          <AlertCircle className="text-amber-600 dark:text-amber-300" size={18} />
          <p className="text-amber-800 dark:text-amber-100 text-sm flex-1">
            <strong>Testing Mode:</strong> Using mock data. To use real API, set VITE_API_BASE_URL in .env file.
          </p>
        </div>
      )}
      {/* Search & Filter Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
              <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Reports Management</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">Search and manage patient reports</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
  onClick={() => setShowFilters(!showFilters)}
  whileHover={{ y: -1, scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-100 font-medium shadow-md hover:shadow-lg transition-all duration-200"
>
  {showFilters ? <EyeOff size={18} className="text-emerald-600" /> : <Eye size={18} className="text-emerald-600" />}
  <span className="text-sm font-medium">{showFilters ? "Hide" : "Show"} Filters</span>
</motion.button>
            <motion.button
  onClick={handleSearch}
  disabled={loading}
  whileHover={{ y: -2, scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:from-blue-600 hover:to-indigo-700 hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
            <motion.button
  onClick={handleClearFilters}
  whileHover={{ y: -1, scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white font-semibold rounded-xl shadow-lg hover:from-gray-600 hover:to-gray-700 hover:shadow-xl transition-all duration-200"
>
  Clear Filters
</motion.button>
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
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-700">
                {/* Name Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-100 flex items-center gap-2">
                    <FileText size={16} className="text-emerald-600 dark:text-emerald-300" />
                    Name
                  </label>
                  <input
                    type="text"
                    value={filters.name || ""}
                    onChange={(e) => handleFilterChange("name", e.target.value)}
                    placeholder="Enter patient name"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 placeholder:text-slate-500 dark:placeholder:text-slate-400"
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>

                {/* Phone Number Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-100 flex items-center gap-2">
                    <Phone size={16} className="text-emerald-600 dark:text-emerald-300" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={filters.phone || ""}
                    onChange={(e) => handleNumericInput("phone", e.target.value)}
                    placeholder="Enter phone number (numbers only)"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 placeholder:text-slate-500 dark:placeholder:text-slate-400"
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
                      handleNumericInput("phone", pastedText);
                    }}
                  />
                </div>

                {/* Device ID Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-100 flex items-center gap-2">
                    <Filter size={16} className="text-emerald-600 dark:text-emerald-300" />
                    Device ID
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={filters.deviceId || ""}
                    onChange={(e) => handleNumericInput("deviceId", e.target.value)}
                    placeholder="Enter device ID (numbers only)"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 placeholder:text-slate-500 dark:placeholder:text-slate-400"
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
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-100 flex items-center gap-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={filters.startDate || ""}
                    onChange={(e) => handleFilterChange("startDate", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 placeholder:text-slate-500 dark:placeholder:text-slate-400"
                  />
                </div>
                
                {/* End Date Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-100 flex-items-center gap-2 flex">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={filters.endDate || ""}
                    onChange={(e) => handleFilterChange("endDate", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 placeholder:text-slate-500 dark:placeholder:text-slate-400"
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
            className="bg-yellow-50/60 dark:bg-yellow-900/30 border border-yellow-200/70 dark:border-yellow-500/60 rounded-lg p-4 flex items-center gap-3"
          >
            <AlertCircle className="text-yellow-600 dark:text-yellow-300" size={20} />
            <p className="text-yellow-800 dark:text-yellow-100 flex-1 text-sm">{error}</p>
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
          className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
                <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Reports</h3>
            </div>
            <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold px-2.5 py-1 rounded-full">
              {reports.length}
            </span>
          </div>

          <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
            <div className="max-h-[600px] overflow-y-auto">
              <div className="grid grid-cols-5 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                <div className="p-3 font-semibold text-slate-700 dark:text-slate-100">Name</div>
                <div className="p-3 font-semibold text-slate-700 dark:text-slate-100 border-x border-slate-200 dark:border-slate-700">Phone</div>
                <div className="p-3 font-semibold text-slate-700 dark:text-slate-100">Device ID</div>
                <div className="p-3 font-semibold text-slate-700 dark:text-slate-100 border-l border-slate-200 dark:border-slate-700">Date</div>
                <div className="p-3 font-semibold text-slate-700 dark:text-slate-100 border-l border-slate-200 dark:border-slate-700">Type</div>
              </div>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="animate-spin text-emerald-600" size={40} />
                <p className="text-slate-600 dark:text-slate-300 mt-4 text-sm">Loading reports...</p>
              </div>
            ) : reports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="text-slate-300 dark:text-slate-600" size={48} />
                <p className="text-slate-600 dark:text-slate-300 mt-4 text-sm">
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
                  <div className="p-3 text-slate-900 dark:text-slate-50 font-medium">{report.name || report.patient?.name || "Unnamed Report"}</div>
                  <div className="p-3 text-slate-700 dark:text-slate-200 border-x border-slate-200 dark:border-slate-700">{report.patient?.phone || report.phoneNumber || "N/A"}</div>
                  <div className="p-3 text-slate-700 dark:text-slate-200">{report.deviceId || "N/A"}</div>
                  <div className="p-3 text-slate-700 dark:text-slate-200 border-l border-slate-200 dark:border-slate-700">{formatDate(report.timestamp || report.date || "")}</div>
                  <div className="p-3 text-slate-700 dark:text-slate-200 border-l border-slate-200 dark:border-slate-700">{report.type || "-"}</div>
                </div>
              ))
            )}
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Report Details Card */}
        <div className="bg-gradient-to-br from-purple-50/30 to-pink-50/20 dark:from-slate-900 dark:to-slate-900 rounded-xl border border-purple-200/50 dark:border-slate-700 shadow-sm p-6 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <FileText className="w-5 h-5 text-purple-500 dark:text-purple-200" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-slate-50">Report Details</h3>
          </div>

          {!selectedReport ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="text-gray-300 dark:text-gray-600" size={48} />
              <p className="text-gray-500 dark:text-gray-300 mt-4 text-sm">
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
                      <p className="text-sm text-gray-700 dark:text-gray-200">Org: {selectedReport.ecg?.org || '-'}</p>
                      <p className="text-sm text-gray-700 dark:text-gray-200">Phone No: {selectedReport.ecg?.phone || selectedReport.phoneNumber || '-'}</p>
                    </div>
                    <h4 className="text-2xl font-bold text-gray-900 dark:text-slate-50">ECG Report</h4>
                    <div className="w-28" />
                  </div>

                  <div className="border border-gray-300 rounded-md">
                    <div className="grid grid-cols-4 gap-0">
                      <div className="col-span-2 border-r border-gray-300 p-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="font-semibold text-gray-800 dark:text-gray-100">Name:</div>
                          <div className="text-gray-700 dark:text-gray-200">{selectedReport.ecg?.patient?.name || selectedReport.name}</div>
                          <div className="font-semibold text-gray-800 dark:text-gray-100">Age:</div>
                          <div className="text-gray-700 dark:text-gray-200">{selectedReport.ecg?.patient?.age ?? '-'}</div>
                          <div className="font-semibold text-gray-800 dark:text-gray-100">Gender:</div>
                          <div className="text-gray-700 dark:text-gray-200">{selectedReport.ecg?.patient?.gender ?? '-'}</div>
                        </div>
                      </div>
                      <div className="col-span-2 p-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="font-semibold text-gray-800 dark:text-gray-100">Date:</div>
                          <div className="text-gray-700 dark:text-gray-200">{selectedReport.ecg?.datetime?.date || formatDate(selectedReport.timestamp || selectedReport.date || "").split(',')[0]}</div>
                          <div className="font-semibold text-gray-800 dark:text-gray-100">Time:</div>
                          <div className="text-gray-700 dark:text-gray-200">{selectedReport.ecg?.datetime?.time || formatDate(selectedReport.timestamp || selectedReport.date || "").split(',')[1]?.trim() || '-'}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="italic font-semibold text-gray-900 dark:text-slate-50">Report Overview</h4>
                    <div className="mt-2 border border-gray-300 rounded-md">
                      <div className="grid grid-cols-3">
                        <div className="border-r border-gray-300 p-3">
                          <div className="font-semibold text-gray-800 dark:text-gray-100">Maximum Heart Rate:</div>
                          <div className="text-gray-700 dark:text-gray-200">{selectedReport.ecg?.overview?.maxHR ?? '-'}</div>
                        </div>
                        <div className="border-r border-gray-300 p-3">
                          <div className="font-semibold text-gray-800 dark:text-gray-100">Minimum Heart Rate:</div>
                          <div className="text-gray-700 dark:text-gray-200">{selectedReport.ecg?.overview?.minHR ?? '-'}</div>
                        </div>
                        <div className="p-3">
                          <div className="font-semibold text-gray-800 dark:text-gray-100">Average Heart Rate:</div>
                          <div className="text-gray-700 dark:text-gray-200">{selectedReport.ecg?.overview?.avgHR ?? '-'}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="italic font-semibold text-gray-900 dark:text-slate-50">OBSERVATION</h4>
                    <div className="mt-2 border border-gray-300 rounded-md">
                      <div className="grid grid-cols-3 bg-gray-100 border-b border-gray-300">
                        <div className="p-2 font-semibold text-gray-800 dark:text-gray-100">Interval Names</div>
                        <div className="p-2 font-semibold text-gray-800 dark:text-gray-100 border-x border-gray-300">Observed Values</div>
                        <div className="p-2 font-semibold text-gray-800 dark:text-gray-100">Standard Range</div>
                      </div>
                      {(selectedReport.ecg?.observation || []).map((row: any, i: number) => (
                        <div key={i} className="grid grid-cols-3 border-t border-gray-300">
                          <div className="p-2 text-gray-700 dark:text-gray-200">{row.name}</div>
                          <div className="p-2 text-gray-700 dark:text-gray-200 border-x border-gray-300">{row.value}</div>
                          <div className="p-2 text-gray-700 dark:text-gray-200">{row.range}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="italic font-semibold text-gray-900 dark:text-slate-50">ECG Report Conclusion</h4>
                    <div className="mt-2 border border-gray-300 rounded-md">
                      <div className="grid grid-cols-12 bg-gray-100 dark:bg-slate-800 border-b border-gray-300">
                        <div className="col-span-2 p-2 font-semibold text-gray-800 dark:text-gray-100">S.No.</div>
                        <div className="col-span-10 p-2 font-semibold text-gray-800 dark:text-gray-100">Conclusion</div>
                      </div>
                      {(selectedReport.ecg?.conclusions || []).map((text: string, idx: number) => (
                        <div key={idx} className="grid grid-cols-12 border-t border-gray-300">
                          <div className="col-span-2 p-2 text-gray-700 dark:text-gray-200">{idx + 1}</div>
                          <div className="col-span-10 p-2 text-gray-700 dark:text-gray-200">{text}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

        {/* PDF Preview Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
              <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50">PDF Preview</h3>
          </div>

          {generatingPDF ? (
            <div className="flex flex-col items-center justify-center py-12 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
              <Loader2 className="animate-spin text-emerald-600" size={40} />
              <p className="text-slate-600 dark:text-slate-300 mt-4 text-sm">Generating PDF...</p>
            </div>
          ) : pdfPreviewUrl ? (
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-900">
              <iframe
                src={pdfPreviewUrl}
                className="w-full h-[400px]"
                title="PDF Preview"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
              <FileText className="text-slate-300 dark:text-slate-600" size={48} />
              <p className="text-slate-600 dark:text-slate-300 mt-4 text-sm">
                {selectedReport ? "PDF will appear here after generation" : "Select a report to preview"}
              </p>
            </div>
          )
          }
          {pdfPreviewUrl && (
            <div className="flex gap-3 mt-4">
              <motion.button
                onClick={handlePreviewPDF}
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:from-blue-600 hover:to-indigo-700 hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                <Eye size={18} />
                Refresh Preview
              </motion.button>
              
              <motion.button
                onClick={handleDownloadPDF}
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl shadow-lg hover:from-emerald-600 hover:to-teal-700 hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                <Download size={18} />
                Download Report
              </motion.button>
            </div>
          )}
        </div>
      </div>
      
      <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
        <div className="flex flex-wrap gap-4">
          <div>Generated: {formatDate(new Date().toISOString())}</div>
          <div>Mode: {(import.meta.env as any).VITE_USE_MOCK_DATA === 'true' ? 'Mock Data (Testing)' : 'Live API'}</div>
          <div>API: {(import.meta.env as any).VITE_API_BASE_URL || 'http://localhost:3000/api'}</div>
          <div>Document Version: v1.0</div>
        </div>
      </div>
    </div>
  );
}
