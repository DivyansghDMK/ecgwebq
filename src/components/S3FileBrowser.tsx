/**
 * S3 File Browser Component
 * Displays all files from S3 bucket with search, pagination, and PDF preview
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { fetchS3Files, downloadPDF, formatFileSize, formatTimestamp, handleApiError } from '../api/ecgApi';
import { S3File, S3FilesResponse } from '../../api/types/ecg';
import { Download, Eye, Search, X, FileText, Loader2 } from 'lucide-react';

const S3FileBrowser: React.FC = () => {
  const [files, setFiles] = useState<S3File[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pagination, setPagination] = useState<S3FilesResponse['pagination'] | null>(null);
  const [selectedFile, setSelectedFile] = useState<S3File | null>(null);
  const [showPreview, setShowPreview] = useState<boolean>(false);

  // Load files from S3
  const loadFiles = async (page: number = 1, searchQuery: string = '') => {
    setLoading(true);
    setError('');
    
    try {
      const data = await fetchS3Files(page, 20, searchQuery);
      setFiles(data.files);
      setPagination(data.pagination);
      setCurrentPage(page);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadFiles();
  }, []);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadFiles(1, search);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    loadFiles(page, search);
  };

  // Handle file preview
  const handlePreview = (file: S3File) => {
    if (file.type === 'application/pdf' && file.url) {
      setSelectedFile(file);
      setShowPreview(true);
    }
  };

  // Handle file download
  const handleDownload = async (file: S3File) => {
    if (file.url) {
      try {
        // Create a temporary link and trigger download
        const link = document.createElement('a');
        link.href = file.url;
        link.download = file.name;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        setError(handleApiError(err));
      }
    }
  };

  // Close preview
  const closePreview = () => {
    setShowPreview(false);
    setSelectedFile(null);
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-50 mb-2">S3 File Browser</h1>
          <p className="text-gray-600 dark:text-slate-300">Browse and download files from AWS S3 bucket</p>
        </div>

        {/* Search Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500" size={20} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search files by name..."
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
                setSearch('');
                loadFiles(1, '');
              }}
              whileHover={{ y: -1, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white font-semibold rounded-xl shadow-lg hover:from-gray-600 hover:to-gray-700 hover:shadow-xl transition-all duration-200"
            >
              Clear
            </motion.button>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Files Table */}
        {!loading && files.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                <thead className="bg-gray-50 dark:bg-slate-800">
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
                </thead>
                <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-800">
                  {files.map((file) => (
                    <tr key={file.key} className="hover:bg-gray-50 dark:hover:bg-slate-800/80">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-slate-50">
                        {file.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {formatFileSize(file.size)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          file.type === 'application/pdf' 
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
                        {file.type === 'application/pdf' && file.url && (
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
                        {file.url && (
                          <motion.button
                            onClick={() => handleDownload(file)}
                            whileHover={{ y: -2, scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-lg shadow-md hover:from-emerald-600 hover:to-teal-700 hover:shadow-lg transition-all duration-200"
                          >
                            <Download size={16} />
                            Download
                          </motion.button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="bg-gray-50 dark:bg-slate-800 px-6 py-3 flex items-center justify-between border-t border-gray-200 dark:border-slate-700">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!pagination.hasPrev}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-slate-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!pagination.hasNext}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-slate-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Showing <span className="font-medium">{((currentPage - 1) * pagination.limit) + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * pagination.limit, pagination.total)}
                      </span>{' '}
                      of <span className="font-medium">{pagination.total}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={!pagination.hasPrev}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            page === currentPage
                              ? 'z-10 bg-blue-50 dark:bg-blue-900/40 border-blue-500 text-blue-600 dark:text-blue-300'
                              : 'bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={!pagination.hasNext}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* No Files State */}
        {!loading && files.length === 0 && !error && (
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center">
            <div className="text-gray-400 dark:text-gray-500 text-lg mb-2">No files found</div>
            <p className="text-gray-500 dark:text-gray-300">
              {search ? 'Try adjusting your search terms' : 'No files available in the S3 bucket'}
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
              <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{selectedFile.name}</h3>
                    <p className="text-sm text-slate-600">{formatFileSize(selectedFile.size)} • {formatTimestamp(selectedFile.lastModified)}</p>
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
              <div className="p-6 bg-slate-50">
                {selectedFile.url ? (
                  <iframe
                    src={`https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(selectedFile.url)}`}
                    className="w-full h-[600px] border-0 rounded-lg shadow-inner bg-white"
                    title={selectedFile.name}
                  />
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
