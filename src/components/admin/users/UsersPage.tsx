import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Filter, X, User as UserIcon, Phone, Hash, Trash2, UserPlus, Clock } from "lucide-react";
import { useDebounce } from "../../../hooks/useDebounce";
import { fetchS3Files } from "../../../api/ecgApi";

type User = {
  recordId: string; // Use recordId from S3 file, not generated serial ID
  username: string;
  fullName: string;
  phone: string;
  key?: string; // S3 key/path
  lastModified?: string; // File last modified date
};

interface FilterState {
  serialId: string;
  username: string;
  phoneNumber: string;
  deviceId: string;
}

type PaginationState = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

const PAGE_SIZE = 20;

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [phoneValidation, setPhoneValidation] = useState<{ isValid: boolean; message: string }>({ isValid: true, message: '' });
  const [deviceIdValidation, setDeviceIdValidation] = useState<{ isValid: boolean; message: string }>({ isValid: true, message: '' });
  const [filters, setFilters] = useState<FilterState>({
    serialId: '',
    username: '',
    phoneNumber: '',
    deviceId: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationState>({
    total: 0,
    page: 1,
    limit: PAGE_SIZE,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const debouncedSearch = useDebounce(search, 400);
  const debouncedFilters = {
    serialId: useDebounce(filters.serialId, 300),
    username: useDebounce(filters.username, 300),
    phoneNumber: useDebounce(filters.phoneNumber, 300),
    deviceId: useDebounce(filters.deviceId, 300),
  };

  const buildUsersFromFiles = (files: any[]): User[] => {
    console.log(`[UsersPage] buildUsersFromFiles called with ${files.length} files`);

    const filesByRecord = files.reduce((acc, file) => {
      const recordKey = String(file?.recordId ?? file?.key ?? "");
      if (!recordKey) {
        return acc;
      }

      const existingFiles = acc.get(recordKey) ?? [];
      existingFiles.push(file);
      acc.set(recordKey, existingFiles);
      return acc;
    }, new Map<string, any[]>());

    console.log(`[UsersPage] Grouped files by recordId: ${filesByRecord.size} unique records`);
    
    // Log a sample record grouping
    const sampleRecordId = Array.from(filesByRecord.keys())[0];
    if (sampleRecordId) {
      const sampleGroup = filesByRecord.get(sampleRecordId);
      console.log(`[UsersPage] Sample record ${sampleRecordId} has ${sampleGroup?.length} files:`, 
        sampleGroup?.map((f: any) => ({
          key: f?.key,
          type: String(f?.key ?? f?.name ?? "").toLowerCase().endsWith('.json') ? 'json' : 'pdf',
          hasPatient: f && 'patient' in f,
          patientName: f?.patient?.name
        }))
      );
    }

    const pageUsers = Array.from(filesByRecord.entries()).reduce<User[]>((acc, entry) => {
      const [recordId, groupedFiles] = entry as [string, any[]];
      const jsonFileWithPatient = groupedFiles.find((file: any) => {
        const key = String(file?.key ?? file?.name ?? "").toLowerCase();
        return key.endsWith(".json") && file?.patient?.name;
      });
      const anyFileWithPatient = groupedFiles.find((file: any) => file?.patient?.name);
      const preferredFile = jsonFileWithPatient ?? anyFileWithPatient ?? groupedFiles[0];
      const name = preferredFile?.patient?.name?.trim() || "";
      const phone = preferredFile?.patient?.phone?.trim() || "";

      console.log(`[UsersPage] Processing record ${recordId}:`, {
        jsonFileWithPatient: !!jsonFileWithPatient,
        anyFileWithPatient: !!anyFileWithPatient,
        preferredFileType: String(preferredFile?.key ?? preferredFile?.name ?? "").toLowerCase().endsWith('.json') ? 'json' : 'pdf',
        hasPatient: preferredFile && 'patient' in preferredFile,
        patientName: name,
        patientPhone: phone
      });

      groupedFiles.forEach((file: any) => {
        const key = String(file?.key ?? file?.name ?? "").toLowerCase();
        if (key.endsWith(".json") && !file?.patient) {
          console.warn("[UsersPage] JSON file missing patient payload", {
            key: file?.key ?? null,
            name: file?.name ?? null,
            recordId: file?.recordId ?? null,
          });
        }
      });

      // Include all records regardless of patient data presence
      // Use fallback values for missing data
      const displayName = name || "—";
      const displayPhone = phone || "—";
      const username = name ? name.replace(/\s+/g, "").toLowerCase() : recordId;

      acc.push({
        recordId,
        username: username,
        fullName: displayName,
        phone: displayPhone,
        key: preferredFile?.key,
        lastModified: preferredFile?.lastModified ?? groupedFiles[0]?.lastModified
      });

      return acc;
    }, []);

    const typedPageUsers = pageUsers as User[];
    console.log(`[UsersPage] Final user count after mapping: ${typedPageUsers.length}`);

    return typedPageUsers.sort((a: User, b: User) => {
      if (a.lastModified && b.lastModified) {
        return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
      }
      if (a.lastModified && !b.lastModified) return -1;
      if (!a.lastModified && b.lastModified) return 1;
      if (a.phone && !b.phone) return -1;
      if (!a.phone && b.phone) return 1;
      // Handle "—" in sorting - treat as lowest priority
      if (a.fullName === "—" && b.fullName !== "—") return 1;
      if (a.fullName !== "—" && b.fullName === "—") return -1;
      return a.fullName.localeCompare(b.fullName);
    });
  };

  // Fetch only the currently selected S3 page.
  useEffect(() => {
    const controller = new AbortController();

    const fetchUsers = async () => {
      try {
        setLoading(true);
        setLoadError(null);
        
        const query = debouncedSearch.trim();
        
        // Combine all filters into a single search query for backend
        const searchParts = [];
        
        if (debouncedSearch.trim()) {
          searchParts.push(debouncedSearch.trim());
        }
        if (debouncedFilters.deviceId.trim()) {
          searchParts.push(debouncedFilters.deviceId.trim());
        }
        if (debouncedFilters.serialId.trim()) {
          searchParts.push(debouncedFilters.serialId.trim());
        }
        if (debouncedFilters.username.trim()) {
          searchParts.push(debouncedFilters.username.trim());
        }
        if (debouncedFilters.phoneNumber.trim()) {
          searchParts.push(debouncedFilters.phoneNumber.trim());
        }
        
        const combinedQuery = searchParts.join(' ');
        console.log(`[UsersPage] Fetching S3 page ${currentPage} with limit ${PAGE_SIZE}, query: "${combinedQuery}"`);
        const response = await fetchS3Files(currentPage, PAGE_SIZE, combinedQuery, controller.signal);
        console.log(`[UsersPage] Response for page ${currentPage}:`, response);

        const files = response.files || [];
        const pageUsers = buildUsersFromFiles(files);
        const responsePagination = response.pagination ?? {
          total: pageUsers.length,
          page: currentPage,
          limit: PAGE_SIZE,
          totalPages: Math.max(1, Math.ceil(pageUsers.length / PAGE_SIZE)),
          hasNext: false,
          hasPrev: currentPage > 1,
        };

        console.log(`[UsersPage] ABOUT TO SET USERS - Input files: ${files.length}, Mapped users: ${pageUsers.length}`);
        console.log(`[UsersPage] First 2 raw file objects:`, files.slice(0, 2));
        console.log(`[UsersPage] First 2 mapped user objects:`, pageUsers.slice(0, 2));

        setUsers(pageUsers);
        setPagination({
          total: responsePagination.total,
          page: responsePagination.page,
          limit: responsePagination.limit,
          totalPages: responsePagination.totalPages,
          hasNext: responsePagination.hasNext,
          hasPrev: responsePagination.hasPrev,
        });

        setSelectedUser((prev) => {
          if (!pageUsers.length) return null;
          if (prev) {
            const matchingUser = pageUsers.find((user) => user.recordId === prev.recordId);
            if (matchingUser) return matchingUser;
          }
          return pageUsers[0];
        });
        
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          return;
        }
        console.error('[UsersPage] Failed to fetch users from S3:', error);
        setUsers([]);
        setSelectedUser(null);
        setLoadError('Failed to fetch users from S3.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
    return () => controller.abort();
  }, [currentPage, debouncedSearch, debouncedFilters]);

  // Pagination
  const totalPages = pagination.totalPages || 1;
  const totalUsers = pagination.total || 0;
  const currentUsers = users;
  const pageStartIndex = currentUsers.length === 0 ? 0 : ((pagination.page - 1) * pagination.limit) + 1;
  const pageEndIndex = currentUsers.length === 0 ? 0 : pageStartIndex + currentUsers.length - 1;
  const visiblePageStart = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  const visiblePageNumbers = Array.from(
    { length: Math.min(5, totalPages) },
    (_, index) => visiblePageStart + index
  );

  // Reset to page 1 when search/filter criteria change.
  useEffect(() => {
    const hasActiveFilters = debouncedSearch.trim() || debouncedFilters.serialId.trim() || debouncedFilters.username.trim() || debouncedFilters.phoneNumber.trim() || debouncedFilters.deviceId.trim();
    if (hasActiveFilters && currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [debouncedSearch, debouncedFilters.serialId, debouncedFilters.username, debouncedFilters.phoneNumber, debouncedFilters.deviceId, currentPage]);

  // Handle filter input changes
  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value.trim()
    }));
  };

  // Handle alphanumeric input for device ID
  const handleAlphanumericInput = (value: string) => {
    const alphanumericValue = value.replace(/[^a-zA-Z0-9]/g, '').trim().slice(0, 4);
    
    // Validate device ID (exactly 4 alphanumeric characters)
    let isValid = true;
    let message = '';
    
    if (alphanumericValue.length > 0 && alphanumericValue.length < 4) {
      isValid = false;
      message = 'Enter 4 characters';
    }
    
    setDeviceIdValidation({ isValid, message });
    handleFilterChange('deviceId', alphanumericValue);
  };

  // Handle alphanumeric input for username
  const handleUsernameInput = (value: string) => {
    const usernameValue = value.replace(/[^a-zA-Z0-9._-]/g, '').trim();
    handleFilterChange('username', usernameValue);
  };

  // Handle numeric-only input for phone number (Indian format)
  const handleNumericInput = (value: string) => {
    // Allow + and digits, strip everything else
    let cleanValue = value.replace(/[^0-9+]/g, '').trim();
    
    // Handle +91 or 91 prefix - strip it for storage
    let storedValue = cleanValue;
    
    if (cleanValue.startsWith('+91')) {
      storedValue = cleanValue.slice(3);
    } else if (cleanValue.startsWith('91') && cleanValue.length > 10) {
      storedValue = cleanValue.slice(2);
    }
    
    // Only show validation errors when user has typed at least 10 characters
    let isValid = true;
    let message = '';
    
    if (storedValue.length >= 10) {
      if (storedValue.length === 10) {
        const firstDigit = parseInt(storedValue[0]);
        if (firstDigit < 6 || firstDigit > 9) {
          isValid = false;
          message = 'Must start with 6, 7, 8, or 9';
        }
      } else {
        isValid = false;
        message = 'Enter exactly 10 digits';
      }
    }
    
    setPhoneValidation({ isValid, message });
    // Store the normalized value (without prefix)
    handleFilterChange('phoneNumber', storedValue);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      serialId: '',
      username: '',
      phoneNumber: '',
      deviceId: ''
    });
    setSearch('');
    setPhoneValidation({ isValid: true, message: '' });
    setDeviceIdValidation({ isValid: true, message: '' });
  };

  // Check if any filter is active
  const hasActiveFilters = filters.serialId || filters.username || filters.phoneNumber || filters.deviceId || search;

  const handleDeleteUser = () => {
    if (!selectedUser) return;

    const displayName = selectedUser.fullName !== "—" ? selectedUser.fullName : selectedUser.recordId;
    const confirmed = window.confirm(
      `Are you sure you want to delete ${displayName}?`
    );

    if (!confirmed) return;

    setUsers((prev) =>
      prev.filter((u) => u.recordId !== selectedUser.recordId)
    );

    setSelectedUser(null);
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Users Management
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage and search through all registered users
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-lg border border-emerald-200">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-emerald-700">Live S3 Data</span>
          </div>
        </div>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative bg-white rounded-2xl border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value.slice(0, 100).trim())}
              placeholder="Search by username, phone number, or name..."
              maxLength={100}
              className="w-full pl-14 pr-12 py-4 bg-transparent text-gray-900 
                       placeholder-gray-400 text-base
                       focus:outline-none focus:ring-0 border-0
                       transition-all"
            />
            {search && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={() => setSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Filter Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-orange-50 via-amber-50/50 to-orange-50 rounded-2xl border-2 border-orange-200/60 shadow-lg p-6 backdrop-blur-sm"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl shadow-md">
              <Filter className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Advanced Filters</h3>
              <p className="text-xs text-gray-600 mt-0.5">Refine your search with specific criteria</p>
            </div>
            {hasActiveFilters && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="ml-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md"
              >
                {users.length} {users.length === 1 ? 'result' : 'results'}
              </motion.span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={clearFilters}
                className="text-sm text-orange-600 hover:text-orange-700 flex items-center gap-2 transition-colors font-semibold px-4 py-2 hover:bg-orange-50 rounded-lg"
              >
                <X className="w-4 h-4" />
                Clear All
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFilters(!showFilters)}
              className={`text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md ${
                showFilters
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-orange-200'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
              }`}
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </motion.button>
          </div>
        </div>

        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2"
          >
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                <div className="p-1.5 bg-orange-100 rounded-lg">
                  <Hash className="w-4 h-4 text-orange-600" />
                </div>
                Record ID
              </label>
              <div className="relative group">
                <input
                  type="text"
                  value={filters.serialId}
                  onChange={(e) => handleFilterChange('serialId', e.target.value.slice(0, 100))}
                  placeholder="Enter record ID..."
                  maxLength={100}
                  className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all shadow-sm hover:shadow-md"
                />
                {filters.serialId && (
                  <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    onClick={() => handleFilterChange('serialId', '')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <UserIcon className="w-4 h-4 text-blue-600" />
                </div>
                Username
              </label>
              <div className="relative group">
                <input
                  type="text"
                  value={filters.username}
                  onChange={(e) => handleUsernameInput(e.target.value)}
                  placeholder="Enter username..."
                  maxLength={50}
                  className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all shadow-sm hover:shadow-md"
                />
                {filters.username && (
                  <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    onClick={() => handleFilterChange('username', '')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                <div className="p-1.5 bg-emerald-100 rounded-lg">
                  <Phone className="w-4 h-4 text-emerald-600" />
                </div>
                Phone Number
              </label>
              <div className="relative group space-y-1">
                <input
                  type="tel"
                  inputMode="tel"
                  pattern="[0-9+]*"
                  value={filters.phoneNumber}
                  onChange={(e) => handleNumericInput(e.target.value)}
                  placeholder="10-digit Indian mobile number"
                  maxLength={13}
                  className={`w-full bg-white border-2 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all shadow-sm hover:shadow-md ${
                    !phoneValidation.isValid && filters.phoneNumber.length >= 10
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-200 focus:ring-orange-500 focus:border-orange-500'
                  }`}
                  onKeyPress={(e) => {
                    // Allow digits, +, and standard editing keys
                    if (!/[0-9+]/.test(e.key) && e.key !== 'Enter' && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
                      e.preventDefault();
                    }
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    const pastedText = e.clipboardData.getData('text');
                    handleNumericInput(pastedText);
                  }}
                />
                <div className="flex justify-between items-center">
                  {!phoneValidation.isValid && filters.phoneNumber.length >= 10 && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-red-600 font-medium"
                    >
                      {phoneValidation.message}
                    </motion.div>
                  )}
                  {filters.phoneNumber && (
                    <motion.button
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      onClick={() => {
                        handleFilterChange('phoneNumber', '');
                        setPhoneValidation({ isValid: true, message: '' });
                      }}
                      className="ml-auto p-1 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                    >
                      <X className="w-4 h-4" />
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                <div className="p-1.5 bg-purple-100 rounded-lg">
                  <Hash className="w-4 h-4 text-purple-600" />
                </div>
                Device ID
              </label>
              <div className="relative group space-y-1">
                <input
                  type="text"
                  value={filters.deviceId}
                  onChange={(e) => handleAlphanumericInput(e.target.value)}
                  placeholder="4-digit device ID"
                  maxLength={4}
                  className={`w-full bg-white border-2 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all shadow-sm hover:shadow-md ${
                    !deviceIdValidation.isValid && filters.deviceId.length > 0
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-200 focus:ring-orange-500 focus:border-orange-500'
                  }`}
                />
                <div className="flex justify-between items-center">
                  {!deviceIdValidation.isValid && filters.deviceId.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-red-600 font-medium"
                    >
                      {deviceIdValidation.message}
                    </motion.div>
                  )}
                  {filters.deviceId && (
                    <motion.button
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      onClick={() => {
                        handleFilterChange('deviceId', '');
                        setDeviceIdValidation({ isValid: true, message: '' });
                      }}
                      className="ml-auto p-1 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                    >
                      <X className="w-4 h-4" />
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ y: -4, scale: 1.02 }}
          className="relative overflow-hidden bg-gradient-to-br from-red-500 via-red-400 to-pink-500 rounded-2xl border-2 border-red-300 shadow-xl hover:shadow-2xl transition-all duration-300 group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <UserIcon className="w-7 h-7 text-white" />
              </div>
              <div className="px-3 py-1 bg-white/30 backdrop-blur-sm rounded-full">
                <span className="text-xs font-bold text-white">ACTIVE</span>
              </div>
            </div>
            <p className="text-white/90 text-sm font-medium mb-2">Current Page Users</p>
            <h2 className="text-4xl font-bold text-white mb-1">{currentUsers.length}</h2>
            <p className="text-white/80 text-xs mt-2">Page {currentPage} of {totalPages} ({totalUsers} total)</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          whileHover={{ y: -4, scale: 1.02 }}
          className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl border-2 border-emerald-300 shadow-xl hover:shadow-2xl transition-all duration-300 group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <UserPlus className="w-7 h-7 text-white" />
              </div>
              <div className="px-3 py-1 bg-white/30 backdrop-blur-sm rounded-full">
                <span className="text-xs font-bold text-white">NEW</span>
              </div>
            </div>
            <p className="text-white/90 text-sm font-medium mb-2">Latest Registration</p>
            <h2 className="text-xl font-bold text-white mb-1 truncate">
              {users.length > 0 ? (users[users.length - 1].fullName !== "—" ? users[users.length - 1].fullName : users[users.length - 1].recordId) : '—'}
            </h2>
            <p className="text-white/80 text-xs mt-2">Most recent user</p>
          </div>
        </motion.div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Users Table - Takes 3/4 of space */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="xl:col-span-3 bg-white rounded-2xl border-2 border-gray-200 shadow-xl overflow-hidden"
        >
          <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 px-6 py-5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                  <UserIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Users List</h3>
                  <p className="text-xs text-white/80 mt-0.5">Page {currentPage} of {totalPages} ({totalUsers} total users)</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-lg">
                <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse shadow-lg shadow-green-300"></div>
                <span className="text-xs font-semibold text-white">Live Data</span>
              </div>
            </div>
          </div>
          
          {loading ? (
            <div className="p-16 text-center">
              <div className="relative inline-block">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-200 border-t-orange-500 mx-auto mb-4"></div>
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-amber-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
              </div>
              <p className="text-gray-700 font-medium text-lg">Fetching users from S3 bucket...</p>
              <p className="text-sm text-gray-500 mt-2">Loading page {currentPage} from S3</p>
            </div>
          ) : loadError ? (
            <div className="p-16 text-center">
              <p className="text-gray-700 font-medium text-lg">{loadError}</p>
              <p className="text-sm text-gray-500 mt-2">Try refreshing the page or checking the API response.</p>
            </div>
          ) : (
            <>
              <table className="w-full border-collapse table-fixed">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                  <tr>
                    <th className="w-[25%] px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">Record ID</th>
                    <th className="w-[20%] px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">Username</th>
                    <th className="w-[25%] px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">Full Name</th>
                    <th className="w-[15%] px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">Phone</th>
                    <th className="w-[15%] px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        Created At
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {currentUsers.map((user, index) => (
                    <motion.tr
                      key={user.recordId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 + index * 0.02 }}
                      onClick={() => setSelectedUser(user)}
                      className={`cursor-pointer transition-all duration-200 group border-b ${
                        selectedUser?.recordId === user.recordId
                          ? "bg-gradient-to-r from-orange-50 to-amber-50 border-l-4 border-orange-500 shadow-md"
                          : "hover:bg-gradient-to-r hover:from-gray-50 hover:to-orange-50/30 hover:shadow-sm"
                      }`}
                    >
                      <td className="w-[25%] px-6 py-4 border-r border-gray-100">
                        <span className="font-medium text-orange-600 font-mono text-xs bg-orange-50 px-2 py-1 rounded-md block break-all">{user.recordId || '—'}</span>
                      </td>
                      <td className="w-[20%] px-6 py-4 border-r border-gray-100">
                        <span className="text-gray-900 font-medium block break-all">{user.username}</span>
                      </td>
                      <td className="w-[25%] px-6 py-4 border-r border-gray-100">
                        <div className="flex items-center gap-3">
                          <span className={`font-semibold break-all ${user.fullName === "—" ? 'text-gray-400 italic' : 'text-gray-900'}`}>{user.fullName}</span>
                        </div>
                      </td>
                      <td className="w-[15%] px-6 py-4 border-r border-gray-100">
                        <span className={`font-medium block break-all ${user.phone === "—" ? 'text-gray-400 italic' : 'text-gray-700'}`}>{user.phone}</span>
                      </td>
                      <td className="w-[15%] px-6 py-4">
                        <span className="text-gray-700 font-medium text-xs block break-all">
                          {user.lastModified ? 
                            new Date(user.lastModified).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + 
                            new Date(user.lastModified).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                            : '—'
                          }
                        </span>
                      </td>
                    </motion.tr>
                  ))}

                  {currentUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-16 text-center">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center shadow-lg"
                        >
                          <UserIcon className="w-10 h-10 text-gray-400" />
                        </motion.div>
                        <p className="text-gray-700 font-bold text-lg mb-2">
                          {hasActiveFilters ? 'No users found matching your filters' : 'No users found'}
                        </p>
                        <p className="text-gray-500 text-sm mb-4">
                          {hasActiveFilters ? 'Try adjusting your search criteria' : 'Users will appear here once data is available'}
                        </p>
                        {hasActiveFilters && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={clearFilters}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
                          >
                            <X className="w-4 h-4" />
                            Clear filters to see all users
                          </motion.button>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {pageStartIndex} to {pageEndIndex} of {totalUsers} users
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={!pagination.hasPrev}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        !pagination.hasPrev
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 hover:shadow-md'
                      }`}
                    >
                      Previous
                    </motion.button>
                    
                    <div className="flex items-center gap-1">
                      {visiblePageNumbers.map((page) => (
                        <motion.button
                          key={page}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            currentPage === page
                              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 hover:shadow-md'
                          }`}
                        >
                          {page}
                        </motion.button>
                      ))}
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={!pagination.hasNext}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        !pagination.hasNext
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 hover:shadow-md'
                      }`}
                    >
                      Next
                    </motion.button>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>

        {/* User Details Panel - Takes 1/4 of space */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="xl:col-span-1 bg-white rounded-2xl border-2 border-gray-200 shadow-xl overflow-hidden"
        >
          {selectedUser ? (
            <>
              <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 px-6 py-5 shadow-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold text-white">User Details</h3>
                    <p className="text-xs text-white/80 mt-0.5">Complete information</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse shadow-lg shadow-green-300"></div>
                    <span className="text-xs font-semibold text-white">S3 Data</span>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex flex-col items-center text-center pb-4 border-b border-gray-200">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 via-amber-500 to-orange-600 flex items-center justify-center border-4 border-white shadow-xl mb-3">
                    <UserIcon className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="font-bold text-gray-900 text-lg mb-1">{selectedUser.fullName !== "—" ? selectedUser.fullName : selectedUser.recordId}</h4>
                  <p className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full font-medium">{selectedUser.username}</p>
                </div>

                <div className="space-y-3">
                  <div className="p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-md transition-all">
                    <p className="text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Record ID</p>
                    <p className="text-sm font-semibold text-gray-900 font-mono break-all bg-white px-2 py-1 rounded-lg border border-gray-200 overflow-hidden">{selectedUser.recordId || '—'}</p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 hover:shadow-md transition-all">
                    <p className="text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Username</p>
                    <p className="text-sm font-bold text-gray-900 break-all">{selectedUser.username}</p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 hover:shadow-md transition-all">
                    <p className="text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Full Name</p>
                    <p className={`text-sm font-bold break-all ${selectedUser.fullName === "—" ? 'text-gray-400 italic' : 'text-gray-900'}`}>{selectedUser.fullName}</p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200 hover:shadow-md transition-all">
                    <p className="text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Phone Number</p>
                    <p className={`text-sm font-bold break-all ${selectedUser.phone === "—" ? 'text-gray-400 italic' : 'text-gray-900'}`}>{selectedUser.phone}</p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl border border-indigo-200 hover:shadow-md transition-all">
                    <p className="text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Created At</p>
                    <p className="text-sm font-bold text-gray-900 break-all">
                      {selectedUser.lastModified ? 
                        new Date(selectedUser.lastModified).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + 
                        new Date(selectedUser.lastModified).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                        : '—'
                      }
                    </p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border-2 border-orange-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Data Source</p>
                    </div>
                    <p className="text-sm font-bold text-emerald-900">S3 Bucket Files</p>
                    <p className="text-xs text-emerald-700 mt-1">Extracted from uploaded files and reports</p>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDeleteUser}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete User
                </motion.button>
              </div>
            </>
          ) : (
            <div className="text-center py-16 px-6">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center shadow-lg">
                <UserIcon className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-700 font-bold text-lg mb-2">No User Selected</p>
              <p className="text-gray-500 text-sm">Click on a user from the list to view their details</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
