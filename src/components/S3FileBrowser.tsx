/**
 * S3 File Browser Component
 * Displays all files from S3 bucket with search, pagination, and PDF preview
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { fetchS3Files, fetchAndroidS3Files, fetchAndroidS3FilesList, fetchAndroidS3FileUrl, fetchS3FileContent, formatFileSize, formatTimestamp, handleApiError } from '../api/ecgApi';
import { S3File, S3FilesResponse, AndroidS3FilesResponse } from '../api/types/ecg';

import { Download, Eye, Search, X, FileText, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

const S3FileBrowser: React.FC = () => {
  const DEFAULT_PAGE_SIZE = 20;

  // Source management
  type SourceType = 'cardiox' | 'rhythm-ultra';
  const [activeSource, setActiveSource] = useState<SourceType>('cardiox');
  const [cardioxTotal, setCardioxTotal] = useState(0);
  const [rhythmUltraFiles, setRhythmUltraFiles] = useState<S3File[]>([]);
  const [rhythmUltraLoaded, setRhythmUltraLoaded] = useState(false);

  // Android pagination state (server-side)
  const [androidPagination, setAndroidPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });

  // Android file URL cache (5-minute TTL)
  const [androidUrlCache, setAndroidUrlCache] = useState<Map<string, { url: string; timestamp: number }>>(new Map());

  // Android reports state for Rhythm Ultra tab
  const [androidReports, setAndroidReports] = useState<S3File[]>([]);
  const [androidReportsLoaded, setAndroidReportsLoaded] = useState(false);
  const [androidSearch, setAndroidSearch] = useState('');
  const [androidTotalCount, setAndroidTotalCount] = useState(0);
  const [androidCurrentPage, setAndroidCurrentPage] = useState(1);
  const [androidPageSize, setAndroidPageSize] = useState(20);

  // Display state
  const [files, setFiles] = useState<S3File[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [selectedFile, setSelectedFile] = useState<S3File | null>(null);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [jsonContent, setJsonContent] = useState<any | null>(null);
  const [loadingJson, setLoadingJson] = useState<boolean>(false);
  const [loadingPdf, setLoadingPdf] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const getVisiblePages = (page: number = currentPage, total: number = totalPages) => {
    const pages = new Set<number>();

    [1, 2, total - 1, total].forEach((p) => {
      if (p >= 1 && p <= total) pages.add(p);
    });

    for (let p = page - 2; p <= page + 2; p += 1) {
      if (p >= 1 && p <= total) pages.add(p);
    }

    return Array.from(pages).sort((a, b) => a - b);
  };

  // Load files from S3
  const loadFiles = async (page: number = 1, searchQuery: string = '', limit: number = pageSize, bypassCache: boolean = false) => {
    setLoading(true);
    setError('');

    try {
      if (activeSource === 'cardiox') {
        // CardioX: server-side pagination (metadata.total from API)
        const response = await fetchS3Files(page, limit, searchQuery);
        console.log('[S3FileBrowser] raw CardioX response:', response);

        const fetchedFiles: S3File[] = response?.files ?? [];
        const total = response?.pagination?.total ?? fetchedFiles.length;

        console.log('[S3FileBrowser] loaded CardioX files count:', fetchedFiles.length);
        console.log('[S3FileBrowser] CardioX metadata.total:', total);

        setFiles(fetchedFiles);
        setCardioxTotal(total);
        setCurrentPage(page);
      } else {
        // Rhythm Ultra (Android): Use existing /android/s3-files endpoint with caching
        // If cache is available and not bypassing, skip fetch
        if (!bypassCache && androidReportsLoaded) {
          return;
        }

        // Fetch all reports from the endpoint (returns all in one call)
        const response: AndroidS3FilesResponse = await fetchAndroidS3FilesList(1, 1000, ''); // Reasonable limit

        console.log('[S3FileBrowser] raw Android response:', response);

        const reports: S3File[] = response?.data?.reports ?? [];
        const totalCount = response?.data?.total_count ?? 0;

        console.log('[S3FileBrowser] loaded Android reports count:', reports.length);
        console.log('[S3FileBrowser] Android total_count:', totalCount);

        setAndroidReports(reports);
        setAndroidTotalCount(totalCount);
        setAndroidReportsLoaded(true);
      }
    } catch (err) {
      console.error('[S3FileBrowser] fetch error:', err);
      setError(handleApiError(err));
      if (activeSource === 'cardiox') {
        setFiles([]);
        setCardioxTotal(0);
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (activeSource === 'rhythm-ultra') {
      // For Rhythm Ultra, just trigger load to refresh cache if needed
      loadFiles(1, search, pageSize);
    } else {
      loadFiles(1, search, pageSize);
    }
  }, [activeSource, pageSize, androidPageSize]);

  // Handle source switch
  const handleSourceSwitch = (source: SourceType) => {
    setActiveSource(source);
    setSearch('');
    setAndroidSearch('');
    setCurrentPage(1);
    setAndroidCurrentPage(1);
    setError('');
    // Clear Android cache when switching back to CardioX to avoid confusion
    if (source === 'cardiox') {
      setRhythmUltraFiles([]);
      setRhythmUltraLoaded(false);
      setAndroidReports([]);
      setAndroidReportsLoaded(false);
      setAndroidTotalCount(0);
      setCardioxTotal(0);
    }
  };

  // Handle refresh (bypass cache)
  const handleRefresh = () => {
    // Clear cache for active source and reload
    if (activeSource === 'cardiox') {
      setCardioxTotal(0);
    } else {
      setAndroidReportsLoaded(false);
      setAndroidTotalCount(0);
    }
    loadFiles(1, search, pageSize, true);
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeSource === 'rhythm-ultra') {
      // Client-side search for Rhythm Ultra - no API call needed
      // Reset to page 1 when searching
      setAndroidCurrentPage(1);
    } else {
      loadFiles(1, search, pageSize);
    }
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    loadFiles(page, search, pageSize);
  };

  // Calculate total files for display
  const getTotalFiles = (): number => {
    if (activeSource === 'rhythm-ultra') {
      // Filter based on search
      if (androidSearch) {
        const query = androidSearch.toLowerCase();
        return androidReports.filter(file =>
        (file.mobile_number?.toLowerCase().includes(query) ||
          file.patient_name?.toLowerCase().includes(query) ||
          file.machine_serial?.toLowerCase().includes(query))
        ).length;
      }
      return androidTotalCount > 0 ? androidTotalCount : androidReports.length;
    }
    return cardioxTotal > 0 ? cardioxTotal : files.length;
  };

  const totalFiles = getTotalFiles();
  const totalPages = activeSource === 'rhythm-ultra'
    ? Math.max(1, Math.ceil(totalFiles / androidPageSize))
    : Math.max(1, Math.ceil(totalFiles / pageSize));

  // Get filtered reports for Rhythm Ultra (for pagination)
  const getFilteredAndroidReports = (): S3File[] => {
    if (!androidSearch) return androidReports;
    const query = androidSearch.toLowerCase();
    return androidReports.filter(file =>
      file.mobile_number?.toLowerCase().includes(query) ||
      file.patient_name?.toLowerCase().includes(query) ||
      file.machine_serial?.toLowerCase().includes(query)
    );
  };

  const filteredAndroidReports = getFilteredAndroidReports();
  const androidTotalPages = Math.max(1, Math.ceil(filteredAndroidReports.length / androidPageSize));
  const androidStartIdx = (androidCurrentPage - 1) * androidPageSize;
  const paginatedAndroidReports = filteredAndroidReports.slice(androidStartIdx, androidStartIdx + androidPageSize);

  // Handle file preview
  const handlePreview = async (file: S3File) => {
    const s3Key = activeSource === 'rhythm-ultra' ? (file.s3_key || file.key) : file.key;
    if (!s3Key) return;

    setSelectedFile(file);
    setShowPreview(true);
    setJsonContent(null);
    setPreviewUrl(null);
    setError('');

    // Cleanup previous blob URL if any
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    // For Rhythm Ultra files, always fetch JSON content
    if (activeSource === 'rhythm-ultra') {
      setLoadingJson(true);
      try {
        // Check cache first
        const cached = androidUrlCache.get(s3Key);
        const now = Date.now();
        let fileUrl: string | undefined;

        if (cached && (now - cached.timestamp) < 5 * 60 * 1000) {
          fileUrl = cached.url;
        } else {
          const urlData = await fetchAndroidS3FileUrl(s3Key, false);
          const fetchedUrl = urlData.url;
          fileUrl = fetchedUrl;
          // Cache the URL (only if we got a valid URL)
          if (fetchedUrl) {
            setAndroidUrlCache(prev => new Map(prev).set(s3Key, { url: fetchedUrl, timestamp: now }));
          }
        }

        if (!fileUrl) {
          setError('No file URL available');
          setLoadingJson(false);
          return;
        }

        // Fetch JSON content from the presigned URL
        const response = await fetch(fileUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const jsonData = await response.json();
        setJsonContent(jsonData);
      } catch (err) {
        const errorMessage = handleApiError(err);
        setError(`Failed to load JSON content: ${errorMessage}`);
        console.error('Error loading JSON:', err);
      } finally {
        setLoadingJson(false);
      }
    } else {
      // For CardioX files, use the url field directly from list response
      let fileUrl: string | undefined = file.url;

      if (!fileUrl) {
        setError('No file URL available');
        return;
      }

      if (file.type === 'application/pdf') {
        setLoadingPdf(true);
        try {
          // Fetch PDF as blob to bypass Content-Disposition: attachment
          // This allows it to be displayed in the iframe instead of triggering a download
          const response = await fetch(fileUrl);
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          const blob = await response.blob();
          const pdfBlob = new Blob([blob], { type: 'application/pdf' });
          const blobUrl = URL.createObjectURL(pdfBlob);
          setPreviewUrl(blobUrl);
        } catch (err) {
          console.error('Error fetching PDF blob:', err);
          // Fallback to direct URL if blob fetch fails
          setPreviewUrl(fileUrl);
        } finally {
          setLoadingPdf(false);
        }
      } else if (file.type === 'application/json' || file.name.endsWith('.json')) {
        setLoadingJson(true);
        try {
          const response = await fetch(fileUrl);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const jsonData = await response.json();
          setJsonContent(jsonData);
        } catch (err) {
          // Fallback to proxy if direct fetch fails
          try {
            const jsonData = await fetchS3FileContent(file.key);
            if (jsonData) {
              setJsonContent(jsonData);
            } else {
              throw new Error('Failed to fetch JSON content');
            }
          } catch (proxyErr) {
            const errorMessage = handleApiError(proxyErr);
            setError(`Failed to load JSON content: ${errorMessage}`);
            console.error('Error loading JSON:', proxyErr);
          }
        } finally {
          setLoadingJson(false);
        }
      }
    }
  };

  // Handle file download
  const handleDownload = async (file: S3File) => {
    const s3Key = activeSource === 'rhythm-ultra' ? (file.s3_key || file.key) : file.key;
    if (!s3Key) return;

    try {
      let fileUrl: string | undefined;

      // For Rhythm Ultra files, always fetch a fresh presigned URL with download=true
      // Never use cache for downloads to avoid stale URLs (5-minute expiry)
      if (activeSource === 'rhythm-ultra') {
        const urlData = await fetchAndroidS3FileUrl(s3Key, true);
        const fetchedUrl = urlData.url;
        fileUrl = fetchedUrl;
      } else {
        // For CardioX files, use the url field directly from list response
        fileUrl = file.url;
      }

      if (!fileUrl) {
        throw new Error('No file URL available');
      }

      // For Rhythm Ultra files with download=true, navigate directly (server handles Content-Disposition)
      if (activeSource === 'rhythm-ultra') {
        window.location.href = fileUrl;
      } else {
        // For CardioX files, use fetch+blob to force download
        const response = await fetch(fileUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      }
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(`Failed to download file: ${errorMessage}`);
      console.error('Download failed:', err);
    }
  };

  // Close preview
  const closePreview = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setShowPreview(false);
    setSelectedFile(null);
    setJsonContent(null);
    setPreviewUrl(null);
    setError(''); // Clear error when closing preview
  };

  return (
    <div className="min-h-screen p-4 pb-28 sm:p-6 sm:pb-32">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-50 mb-2">S3 File Browser</h1>
              <p className="text-gray-600 dark:text-slate-300">Browse and download files from AWS S3 bucket</p>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                onClick={() => handleSourceSwitch('cardiox')}
                whileHover={{ y: -1, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${activeSource === 'cardiox'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-slate-600 hover:bg-gray-200 dark:hover:bg-slate-700'
                  }`}
              >
                CardioX
              </motion.button>
              <motion.button
                onClick={() => handleSourceSwitch('rhythm-ultra')}
                whileHover={{ y: -1, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${activeSource === 'rhythm-ultra'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-slate-600 hover:bg-gray-200 dark:hover:bg-slate-700'
                  }`}
              >
                Rhythm Ultra
              </motion.button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
          <form onSubmit={handleSearch} className="flex flex-col gap-4 lg:flex-row">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500" size={20} />
              <input
                type="text"
                value={activeSource === 'rhythm-ultra' ? androidSearch : search}
                onChange={(e) => {
                  if (activeSource === 'rhythm-ultra') {
                    setAndroidSearch(e.target.value);
                  } else {
                    setSearch(e.target.value);
                  }
                }}
                placeholder={activeSource === 'rhythm-ultra' ? "Search by mobile number, name, or device ID..." : "Search files by name..."}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 placeholder:text-slate-500 dark:placeholder:text-slate-400"
              />
            </div>
            <motion.button
              type="submit"
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:from-blue-600 hover:to-indigo-700 hover:shadow-xl transition-all duration-200"
            >
              <Search size={18} className="inline mr-2" />
              Search
            </motion.button>
            <motion.button
              type="button"
              onClick={() => {
                if (activeSource === 'rhythm-ultra') {
                  setAndroidSearch('');
                  setAndroidCurrentPage(1);
                } else {
                  setSearch('');
                  loadFiles(1, '', pageSize);
                }
              }}
              whileHover={{ y: -1, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white font-semibold rounded-xl shadow-lg hover:from-gray-600 hover:to-gray-700 hover:shadow-xl transition-all duration-200"
            >
              Clear
            </motion.button>
          </form>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {activeSource === 'rhythm-ultra'
                ? (filteredAndroidReports.length > 0
                  ? `Showing page ${androidCurrentPage} of ${androidTotalPages} with ${filteredAndroidReports.length} total reports`
                  : `Showing up to ${androidPageSize} reports per page`)
                : totalFiles > 0
                  ? `Showing page ${currentPage} of ${totalPages} with ${totalFiles} total files`
                  : `Showing up to ${pageSize} files per page`}
            </p>
            <div className="flex items-center gap-4">
              <motion.button
                onClick={handleRefresh}
                whileHover={{ y: -1, scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                title="Refresh file list"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                Refresh
              </motion.button>
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                {activeSource === 'rhythm-ultra' ? 'Reports per page' : 'Files per page'}
                <select
                  value={activeSource === 'rhythm-ultra' ? androidPageSize : pageSize}
                  onChange={(e) => {
                    const newSize = Number(e.target.value);
                    if (activeSource === 'rhythm-ultra') {
                      setAndroidPageSize(newSize);
                      setAndroidCurrentPage(1);
                    } else {
                      setPageSize(newSize);
                    }
                  }}
                  className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-50 outline-none"
                >
                  {[20, 50, 100, 200].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-slate-600 dark:text-slate-300 text-sm">
              {activeSource === 'rhythm-ultra' ? 'Loading all reports...' : 'Loading files...'}
            </p>
          </div>
        )}

        {/* Files Table */}
        {!loading && ((activeSource === 'cardiox' && files?.length > 0) || (activeSource === 'rhythm-ultra' && androidReports?.length > 0)) && (
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                <thead className="bg-gray-50 dark:bg-slate-800">
                  {activeSource === 'cardiox' ? (
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        File Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Size
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Last Modified
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  ) : (
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Mobile No
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Device ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Report Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Report Layout
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  )}
                </thead>
                <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-800">
                  {activeSource === 'cardiox' ? (
                    files.map((file) => (
                      <tr key={file.key} className="hover:bg-gray-50 dark:hover:bg-slate-800/80">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-slate-50">
                          {file.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {formatFileSize(file.size)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          <span className={`px-2 py-1 text-xs rounded-full ${file.type === 'application/pdf'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                            }`}>
                            {file.type === 'application/pdf' ? 'PDF' : 'JSON'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {formatTimestamp(file.lastModified)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          {(file.type === 'application/pdf' || file.type === 'application/json') && (
                            <motion.button
                              onClick={() => handlePreview(file)}
                              whileHover={{ y: -2, scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg shadow-md hover:from-blue-600 hover:to-indigo-700 hover:shadow-lg transition-all duration-200"
                            >
                              <Eye size={16} />
                              Preview
                            </motion.button>
                          )}
                          <motion.button
                            onClick={() => handleDownload(file)}
                            whileHover={{ y: -2, scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-lg shadow-md hover:from-emerald-600 hover:to-teal-700 hover:shadow-lg transition-all duration-200"
                          >
                            <Download size={16} />
                            Download
                          </motion.button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    // Use paginated reports for Rhythm Ultra
                    paginatedAndroidReports.map((file) => (
                      <tr key={file.key} className="hover:bg-gray-50 dark:hover:bg-slate-800/80">
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-slate-50">
                          {file.mobile_number || file.mobileNumber || '-'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {file.patient_name || file.name || '-'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {file.machine_serial || '-'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {file.report_date || formatTimestamp(file.lastModified)}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                            {file.report_type || file.reportType || '-'}
                          </span>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {file.report_layout || '-'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium space-x-2 sticky right-0 bg-white dark:bg-slate-900 shadow-l">
                          <motion.button
                            onClick={() => handlePreview(file)}
                            whileHover={{ y: -2, scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg shadow-md hover:from-blue-600 hover:to-indigo-700 hover:shadow-lg transition-all duration-200 text-sm"
                          >
                            <Eye size={14} />
                            Preview
                          </motion.button>
                          <motion.button
                            onClick={() => handleDownload(file)}
                            whileHover={{ y: -2, scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-lg shadow-md hover:from-emerald-600 hover:to-teal-700 hover:shadow-lg transition-all duration-200 text-sm"
                          >
                            <Download size={14} />
                            Download
                          </motion.button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {activeSource === 'cardiox' && totalPages > 1 && (
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-5 border-t border-slate-200 dark:from-slate-800 dark:to-slate-900 dark:border-slate-700 sm:px-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="shrink-0">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      Showing <span className="font-bold text-slate-900 dark:text-slate-100">{((currentPage - 1) * pageSize) + 1}</span> to{' '}
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {Math.min(currentPage * pageSize, totalFiles)}
                      </span>{' '}
                      of <span className="font-bold text-slate-900 dark:text-slate-100">{totalFiles}</span> results
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1}
                      className="relative inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-sm"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7 7M15 5l-7-7 7-7" />
                      </svg>
                      Previous
                    </button>

                    {/* Page Numbers */}
                    <div className="flex flex-wrap items-center gap-1">
                      {getVisiblePages(currentPage, totalPages).map((page, index, visiblePages) => (
                        <React.Fragment key={page}>
                          {index > 0 && page - visiblePages[index - 1] > 1 && (
                            <span className="px-2 py-2 text-sm font-medium text-slate-400">
                              ...
                            </span>
                          )}
                          <button
                            onClick={() => handlePageChange(page)}
                            className={`relative inline-flex min-w-10 items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${page === currentPage
                                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg transform scale-105 border-0'
                                : 'border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-300 hover:shadow-md'
                              }`}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      ))}
                    </div>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                      className="relative inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-sm"
                    >
                      Next
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
            {/* Pagination - Rhythm Ultra */}
            {activeSource === 'rhythm-ultra' && androidTotalPages > 1 && (
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-5 border-t border-slate-200 dark:from-slate-800 dark:to-slate-900 dark:border-slate-700 sm:px-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="shrink-0">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      Showing <span className="font-bold text-slate-900 dark:text-slate-100">{((androidCurrentPage - 1) * androidPageSize) + 1}</span> to{' '}
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {Math.min(androidCurrentPage * androidPageSize, filteredAndroidReports.length)}
                      </span>{' '}
                      of <span className="font-bold text-slate-900 dark:text-slate-100">{filteredAndroidReports.length}</span> reports
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setAndroidCurrentPage(androidCurrentPage - 1)}
                      disabled={androidCurrentPage <= 1}
                      className="relative inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-sm"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7 7M15 5l-7-7 7-7" />
                      </svg>
                      Previous
                    </button>

                    {/* Page Numbers */}
                    <div className="flex flex-wrap items-center gap-1">
                      {getVisiblePages().map((page, index, visiblePages) => (
                        <React.Fragment key={page}>
                          {index > 0 && page - visiblePages[index - 1] > 1 && (
                            <span className="px-2 py-2 text-sm font-medium text-slate-400">
                              ...
                            </span>
                          )}
                          <button
                            onClick={() => setAndroidCurrentPage(page)}
                            className={`relative inline-flex min-w-10 items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${page === androidCurrentPage
                                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg transform scale-105 border-0'
                                : 'border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-300 hover:shadow-md'
                              }`}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      ))}
                    </div>

                    <button
                      onClick={() => setAndroidCurrentPage(androidCurrentPage + 1)}
                      disabled={androidCurrentPage >= androidTotalPages}
                      className="relative inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-sm"
                    >
                      Next
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* No Files State */}
        {!loading && ((activeSource === 'cardiox' && files.length === 0) || (activeSource === 'rhythm-ultra' && androidReports.length === 0)) && !error && (
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center">
            <div className="text-gray-400 dark:text-gray-500 text-lg mb-2">
              {activeSource === 'rhythm-ultra' ? 'No reports found' : 'No files found'}
            </div>
            <p className="text-gray-500 dark:text-gray-300">
              {activeSource === 'rhythm-ultra'
                ? (androidSearch ? 'Try adjusting your search terms' : 'No reports available')
                : (search ? 'Try adjusting your search terms' : 'No files available in the S3 bucket')}
            </p>
          </div>
        )}

        {/* PDF Preview Modal */}
        {showPreview && selectedFile && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${activeSource === 'rhythm-ultra' || selectedFile.type === 'application/json'
                      ? 'bg-green-100 dark:bg-green-900'
                      : 'bg-blue-100 dark:bg-blue-900'
                    }`}>
                    <FileText className={`w-5 h-5 ${activeSource === 'rhythm-ultra' || selectedFile.type === 'application/json'
                        ? 'text-green-600 dark:text-green-300'
                        : 'text-blue-600 dark:text-blue-300'
                      }`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                      {activeSource === 'rhythm-ultra'
                        ? (selectedFile.patient_name || selectedFile.name || 'Report')
                        : selectedFile.name}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {activeSource === 'rhythm-ultra'
                        ? 'JSON Report'
                        : (selectedFile.type === 'application/json' ? 'JSON' : 'PDF')}
                      {activeSource === 'cardiox' && ` • ${formatFileSize(selectedFile.size)} • ${formatTimestamp(selectedFile.lastModified)}`}
                    </p>
                  </div>
                </div>
                <motion.button
                  onClick={closePreview}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                >
                  <X size={20} />
                </motion.button>
              </div>
              <div className="p-6 bg-slate-50 overflow-hidden flex flex-col">
                {activeSource === 'rhythm-ultra' || selectedFile.type === 'application/json' ? (
                  // JSON Preview
                  loadingJson ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loader2 className="animate-spin text-blue-600" size={40} />
                      <p className="text-slate-600 dark:text-slate-300 mt-4 text-sm">Loading JSON content...</p>
                    </div>
                  ) : jsonContent ? (
                    <div className="border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 flex flex-col" style={{ maxHeight: '60vh' }}>
                      <div className="overflow-y-auto p-4 flex-1">
                        <pre className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-words font-mono">
                          {JSON.stringify(jsonContent, null, 2)}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                      <p className="text-lg font-medium">Failed to load JSON content</p>
                      <p className="text-sm mt-2">{error || 'Unable to preview this JSON file'}</p>
                    </div>
                  )
                ) : activeSource === 'cardiox' && selectedFile.type === 'application/pdf' ? (
                  // PDF Preview
                  loadingPdf ? (
                    <div className="flex flex-col items-center justify-center py-24 bg-white rounded-lg">
                      <Loader2 className="animate-spin text-blue-600" size={40} />
                      <p className="text-slate-600 mt-4 font-medium">Preparing PDF preview...</p>
                    </div>
                  ) : previewUrl ? (
                    <iframe
                      src={previewUrl}
                      className="w-full h-[600px] border-0 rounded-lg shadow-inner bg-white"
                      title={selectedFile.name}
                    />
                  ) : (
                    <div className="text-center py-12 bg-white rounded-lg">
                      <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                      <p className="text-lg font-medium text-slate-800">Failed to load PDF</p>
                      <p className="text-sm text-slate-500 mt-2">Could not generate preview for this file</p>
                    </div>
                  )
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-lg font-medium">Preview not available</p>
                    <p className="text-sm mt-2">This file cannot be previewed</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 p-6 border-t border-slate-200 bg-white">
                <motion.button
                  onClick={closePreview}
                  whileHover={{ y: -1, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-3 text-slate-600 border border-slate-300 font-medium rounded-xl hover:bg-slate-50 transition-all"
                >
                  Close
                </motion.button>
                {selectedFile.url && (
                  <motion.button
                    onClick={() => handleDownload(selectedFile)}
                    whileHover={{ y: -2, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl shadow-lg hover:from-emerald-600 hover:to-teal-700 hover:shadow-xl transition-all duration-200"
                  >
                    <Download size={18} />
                    Download Report
                  </motion.button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default S3FileBrowser;
