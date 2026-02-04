import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Filter, X, User as UserIcon, Phone, Hash, Trash2, UserPlus } from "lucide-react";
import { useDebounce } from "../../../hooks/useDebounce";
import { fetchReports } from "../../../services/reportsApi";
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
}

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    serialId: '',
    username: '',
    phoneNumber: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch ALL files from S3 by paginating through all pages
  const fetchAllS3Files = async (): Promise<any[]> => {
    const allFiles: any[] = [];
    let currentPage = 1;
    let hasMore = true;
    const limit = 20; // Reduced to avoid Lambda timeout

    while (hasMore) {
      try {
        const response = await fetchS3Files(currentPage, limit, '');
        allFiles.push(...response.files);
        
        hasMore = response.pagination.hasNext;
        currentPage++;
        
        // Safety limit to prevent infinite loops
        if (currentPage > 100) {
          console.warn('[UsersPage] Reached safety limit of 100 pages');
          break;
        }
      } catch (error) {
        console.error(`[UsersPage] Error fetching page ${currentPage}:`, error);
        hasMore = false;
      }
    }

    return allFiles;
  };

  // Extract user data from filename
  const extractUserFromFilename = (filename: string): { name: string | null; phone: string | null } => {
    let extractedName: string | null = null;
    let extractedPhone: string | null = null;

    // Pattern 1: user_signup_<Name>_<Date>_<Time>.json
    // Example: user_signup_Divyaansh_20260123_141001.json
    if (filename.toLowerCase().includes('user_signup_')) {
      // Try multiple patterns to extract name
      const patterns = [
        /user_signup_([^_]+(?:_[^_]+)*?)_\d{8}_\d{6}\.json/i,
        /user_signup_([a-zA-Z0-9]+(?:_[a-zA-Z0-9]+)*)_\d{8}_\d{6}\.json/i,
        /user_signup_([a-zA-Z]+(?:_[a-zA-Z]+)*)/i,
        /user_signup_([a-zA-Z0-9]+)/i
      ];

      for (const pattern of patterns) {
        const match = filename.match(pattern);
        if (match && match[1]) {
          extractedName = match[1].replace(/[-_]/g, ' ').trim();
          break;
        }
      }
    }

    // Pattern 2: Extract phone number (10 digits)
    const phoneMatch = filename.match(/(\d{10})/);
    if (phoneMatch) {
      extractedPhone = phoneMatch[1];
    }

    // Pattern 3: Extract name from other patterns if not found yet
    if (!extractedName) {
      // Try to extract name before phone number
      if (phoneMatch && phoneMatch.index) {
        const nameBeforePhone = filename.substring(0, phoneMatch.index);
        const nameParts = nameBeforePhone.split(/[-_]/).filter(part => 
          part && 
          !part.match(/^\d+$/) && 
          !part.toLowerCase().includes('user') && 
          !part.toLowerCase().includes('signup')
        );
        if (nameParts.length > 0) {
          extractedName = nameParts.join(' ').trim();
        }
      }

      // Generic name extraction (fallback)
      if (!extractedName) {
        const nameMatch = filename.match(/([A-Za-z][A-Za-z0-9]+(?:_[A-Za-z0-9]+)*)/);
        if (nameMatch && nameMatch[1]) {
          const potentialName = nameMatch[1].replace(/[-_]/g, ' ').trim();
          if (potentialName.length > 2 && 
              !potentialName.toLowerCase().includes('user') && 
              !potentialName.toLowerCase().includes('signup') &&
              !potentialName.toLowerCase().includes('json')) {
            extractedName = potentialName;
          }
        }
      }
    }

    return { name: extractedName, phone: extractedPhone };
  };

  // Fetch real users from S3 bucket data
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        
        console.log('[UsersPage] Starting to fetch all S3 files...');
        
        // Fetch ALL files from S3 bucket (paginate through all pages)
        const allS3Files = await fetchAllS3Files();
        console.log(`[UsersPage] Fetched ${allS3Files.length} total S3 files`);
        
        // Also fetch reports data
        let reportsData;
        try {
          reportsData = await fetchReports();
          console.log(`[UsersPage] Fetched ${reportsData.reports.length} reports`);
        } catch (error) {
          console.warn('[UsersPage] Failed to fetch reports:', error);
          reportsData = { reports: [] };
        }
        
        // Extract users from S3 files - ONLY use data from files, no generation
        const s3Users = allS3Files.reduce((acc: User[], file) => {
          const { name, phone } = extractUserFromFilename(file.name);
          
          if (name) {
            const fullName = name;
            const username = name.replace(/\s+/g, '').toLowerCase();
            const phoneNumber = phone || '';
            
            // Use recordId from file, not generated serial ID
            const recordId = file.recordId || file.key || '';
            
            // Check if user already exists (by recordId first, then by phone if available, otherwise by username)
            const existingUser = recordId
              ? acc.find(u => u.recordId === recordId)
              : phoneNumber 
                ? acc.find(u => u.phone === phoneNumber && u.phone !== '')
                : acc.find(u => u.username === username);
            
            if (!existingUser) {
              acc.push({
                recordId: recordId, // Use actual recordId from file
                username: username,
                fullName: fullName,
                phone: phoneNumber,
                key: file.key,
                lastModified: file.lastModified
              });
            }
          }
          
          return acc;
        }, []);
        
        console.log(`[UsersPage] Extracted ${s3Users.length} users from S3 files`);
        if (s3Users.length > 0) {
          console.log('[UsersPage] Sample S3 users:', s3Users.slice(0, 3));
        }
        
        // Extract users from reports data - ONLY use data from reports, no generation
        const reportUsers = reportsData.reports.reduce((acc: User[], report) => {
          const phone = (report as any).patient?.phone || (report as any).phoneNumber || '';
          const name = (report as any).patient?.name || (report as any).name || (report as any).patientName || '';
          const recordId = (report as any).recordId || (report as any).id || '';
          
          if (name && name.trim() !== '' && name !== 'Unknown User') {
            const username = name.replace(/\s+/g, '').toLowerCase();
            const phoneNumber = phone || '';
            
            // Check if user exists by recordId first, then by phone (if available) or by username
            const existingUser = recordId
              ? acc.find(u => u.recordId === recordId)
              : phoneNumber 
                ? acc.find(u => u.phone === phoneNumber && u.phone !== '')
                : acc.find(u => u.username === username);
            
            if (!existingUser) {
              acc.push({
                recordId: recordId, // Use actual recordId from report
                username: username,
                fullName: name.trim(),
                phone: phoneNumber
              });
            }
          }
          return acc;
        }, s3Users); // Start with S3 users
        
        console.log(`[UsersPage] Total users after merging: ${reportUsers.length}`);
        
        // Remove duplicates - use recordId as primary identifier, then phone, then username
        const uniqueUsers = reportUsers
          .filter((user, index, arr) => {
            // Prioritize recordId for deduplication
            if (user.recordId && user.recordId !== '') {
              return arr.findIndex(u => u.recordId === user.recordId && u.recordId !== '') === index;
            }
            // Then check by phone if available
            if (user.phone && user.phone !== '') {
              return arr.findIndex(u => u.phone === user.phone && u.phone !== '') === index;
            }
            // Finally check by username
            return arr.findIndex(u => u.username === user.username) === index;
          })
          .sort((a, b) => {
            // Sort by lastModified if available (newest first), then by name
            if (a.lastModified && b.lastModified) {
              return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
            }
            if (a.lastModified && !b.lastModified) return -1;
            if (!a.lastModified && b.lastModified) return 1;
            // Sort by name, but prioritize users with phone numbers
            if (a.phone && !b.phone) return -1;
            if (!a.phone && b.phone) return 1;
            return a.fullName.localeCompare(b.fullName);
          });
        
        console.log(`[UsersPage] Final unique users: ${uniqueUsers.length}`);
        if (uniqueUsers.length > 0) {
          console.log('[UsersPage] Sample users:', uniqueUsers.slice(0, 5));
          // Log users with "divyaansh" in username for debugging
          const divyaanshUsers = uniqueUsers.filter(u => 
            u.username.includes('divyaansh') || u.fullName.toLowerCase().includes('divyaansh')
          );
          if (divyaanshUsers.length > 0) {
            console.log('[UsersPage] Found Divyaansh users:', divyaanshUsers);
          }
        }
        
        setUsers(uniqueUsers);
        if (uniqueUsers.length > 0) {
          setSelectedUser(uniqueUsers[0]);
        }
        
      } catch (error) {
        console.error('[UsersPage] Failed to fetch users from S3:', error);
        // No fallback data - only use actual S3 data
        setUsers([]);
        setSelectedUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // debounced value
  const debouncedSearch = useDebounce(search, 400);
  const debouncedFilters = {
    serialId: useDebounce(filters.serialId, 300),
    username: useDebounce(filters.username, 300),
    phoneNumber: useDebounce(filters.phoneNumber, 300),
  };

  // filtered users - search through ALL fields including filename patterns
  const filteredUsers = useMemo(() => {
    let result = users;

    // Apply search filter (searches across all fields)
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase().trim();
      result = result.filter((u) => {
        const searchFields = [
          u.username,
          u.fullName,
          u.phone,
          u.recordId,
          u.key || '',
          // Also search in variations
          u.fullName.replace(/\s+/g, ''),
          u.fullName.replace(/\s+/g, '_'),
        ];
        return searchFields.some(field => field && field.toLowerCase().includes(q));
      });
    }

    // Apply specific filters
    if (debouncedFilters.serialId) {
      const filterValue = debouncedFilters.serialId.toLowerCase().trim();
      result = result.filter(u => 
        u.recordId.toLowerCase().includes(filterValue) ||
        (u.key && u.key.toLowerCase().includes(filterValue))
      );
    }

    if (debouncedFilters.username) {
      const filterValue = debouncedFilters.username.toLowerCase().trim();
      result = result.filter(u => 
        u.username.toLowerCase().includes(filterValue) ||
        u.fullName.replace(/\s+/g, '').toLowerCase().includes(filterValue)
      );
    }

    if (debouncedFilters.phoneNumber) {
      const filterValue = debouncedFilters.phoneNumber.trim();
      result = result.filter(u => 
        u.phone.includes(filterValue)
      );
    }

    return result;
  }, [debouncedSearch, debouncedFilters, users]);

  // Handle filter input changes
  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle numeric-only input for phone number
  const handleNumericInput = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    handleFilterChange('phoneNumber', numericValue);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      serialId: '',
      username: '',
      phoneNumber: ''
    });
    setSearch('');
  };

  // Check if any filter is active
  const hasActiveFilters = filters.serialId || filters.username || filters.phoneNumber || search;

  const handleDeleteUser = () => {
    if (!selectedUser) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedUser.fullName}?`
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Users Management</h1>
          <p className="text-gray-600">Manage and search through all registered users</p>
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
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by username, phone number, or name..."
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
                {filteredUsers.length} {filteredUsers.length === 1 ? 'result' : 'results'}
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
                  onChange={(e) => handleFilterChange('serialId', e.target.value)}
                  placeholder="Enter record ID..."
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
                  onChange={(e) => handleFilterChange('username', e.target.value)}
                  placeholder="Enter username..."
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
              <div className="relative group">
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={filters.phoneNumber}
                  onChange={(e) => handleNumericInput(e.target.value)}
                  placeholder="Enter phone number..."
                  className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all shadow-sm hover:shadow-md"
                  onKeyPress={(e) => {
                    if (!/[0-9]/.test(e.key) && e.key !== 'Enter' && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
                      e.preventDefault();
                    }
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    const pastedText = e.clipboardData.getData('text');
                    handleNumericInput(pastedText);
                  }}
                />
                {filters.phoneNumber && (
                  <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    onClick={() => handleFilterChange('phoneNumber', '')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                )}
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
            <p className="text-white/90 text-sm font-medium mb-2">Total Users</p>
            <h2 className="text-4xl font-bold text-white mb-1">{filteredUsers.length}</h2>
            <p className="text-white/80 text-xs mt-2">Currently displayed</p>
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
              {users.length > 0 ? users[users.length - 1].fullName : '—'}
            </h2>
            <p className="text-white/80 text-xs mt-2">Most recent user</p>
          </div>
        </motion.div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-white rounded-2xl border-2 border-gray-200 shadow-xl overflow-hidden"
        >
          <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 px-6 py-5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                  <UserIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Users List</h3>
                  <p className="text-xs text-white/80 mt-0.5">All registered users from S3</p>
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
              <p className="text-sm text-gray-500 mt-2">Extracting user data from files and reports</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Record ID</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Username</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Full Name</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Phone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filteredUsers.map((user, index) => (
                    <motion.tr
                      key={user.recordId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 + index * 0.02 }}
                      onClick={() => setSelectedUser(user)}
                      className={`cursor-pointer transition-all duration-200 group ${
                        selectedUser?.recordId === user.recordId
                          ? "bg-gradient-to-r from-orange-50 to-amber-50 border-l-4 border-orange-500 shadow-md"
                          : "hover:bg-gradient-to-r hover:from-gray-50 hover:to-orange-50/30 hover:shadow-sm"
                      }`}
                    >
                      <td className="px-6 py-4">
                        <span className="font-medium text-orange-600 font-mono text-xs bg-orange-50 px-2 py-1 rounded-md">{user.recordId ? user.recordId.substring(0, 20) + '...' : '—'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-900 font-medium">{user.username}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center border-2 border-white shadow-md group-hover:scale-110 transition-transform ${selectedUser?.recordId === user.recordId ? 'ring-2 ring-orange-500' : ''}`}>
                            <UserIcon className="w-5 h-5 text-white" />
                          </div>
                          <span className="font-semibold text-gray-900">{user.fullName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-700 font-medium">{user.phone || '—'}</span>
                      </td>
                    </motion.tr>
                  ))}

                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-16 text-center">
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
            </div>
          )}
        </motion.div>

        {/* User Details Panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl overflow-hidden"
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

              <div className="p-6 space-y-5">
                <div className="flex flex-col items-center text-center pb-5 border-b border-gray-200">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 via-amber-500 to-orange-600 flex items-center justify-center border-4 border-white shadow-xl mb-4">
                    <UserIcon className="w-10 h-10 text-white" />
                  </div>
                  <h4 className="font-bold text-gray-900 text-xl mb-1">{selectedUser.fullName}</h4>
                  <p className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full font-medium">{selectedUser.username}</p>
                </div>

                <div className="space-y-3">
                  <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-md transition-all">
                    <p className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">Record ID</p>
                    <p className="text-sm font-semibold text-gray-900 font-mono break-all bg-white px-3 py-2 rounded-lg border border-gray-200">{selectedUser.recordId || '—'}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 hover:shadow-md transition-all">
                    <p className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">Username</p>
                    <p className="text-base font-bold text-gray-900">{selectedUser.username}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 hover:shadow-md transition-all">
                    <p className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">Full Name</p>
                    <p className="text-base font-bold text-gray-900">{selectedUser.fullName}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200 hover:shadow-md transition-all">
                    <p className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">Phone Number</p>
                    <p className="text-base font-bold text-gray-900">{selectedUser.phone || '—'}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border-2 border-orange-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Data Source</p>
                    </div>
                    <p className="text-sm font-bold text-emerald-900">S3 Bucket Files</p>
                    <p className="text-xs text-emerald-700 mt-2">Extracted from uploaded files and reports</p>
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
