import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, RefreshCw, Loader2, AlertCircle, Activity, Users, Smartphone, Wifi, WifiOff, Phone, ChevronDown, ChevronRight } from "lucide-react";
import { fetchDeviceAnalyticsSummary, searchDeviceBySerial } from "@/api/ecgApi";
import type { DeviceAnalyticsSummary, DeviceMatch, RhythmUltraDeviceMatch, CardioXDeviceWithUsers, RhythmUser } from "./types";

type SearchTabType = 'cardiox' | 'rhythm';
type ViewType = 'devices' | 'users';

export default function DevicesPage() {
  const [summary, setSummary] = useState<DeviceAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTab, setSearchTab] = useState<SearchTabType>('cardiox');
  const [viewType, setViewType] = useState<ViewType>('devices');
  const [filter, setFilter] = useState<'all' | 'active'>('all');
  const [searchQuery, setSearchQuery] = useState("");
  const [cardioxResults, setCardioxResults] = useState<DeviceMatch[]>([]);
  const [cardioxDevicesWithUsers, setCardioxDevicesWithUsers] = useState<CardioXDeviceWithUsers[]>([]);
  const [rhythmResults, setRhythmResults] = useState<RhythmUltraDeviceMatch[]>([]);
  const [rhythmUsers, setRhythmUsers] = useState<RhythmUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [expandedDevices, setExpandedDevices] = useState<Set<string>>(new Set());

  // Fetch summary on mount and on refresh
  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchDeviceAnalyticsSummary();
      if (response.success && response.data) {
        setSummary(response.data);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch device analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  // Handle device search
  const handleSearch = async () => {
    // Allow empty query for full device list (when clicking stat cards)
    // Clear stale results before new API call
    setCardioxResults([]);
    setCardioxDevicesWithUsers([]);
    setRhythmResults([]);
    setRhythmUsers([]);

    setSearchLoading(true);
    setSearchError(null);
    try {
      const filterParam = filter === 'active' ? 'active' : undefined;
      const listParam = viewType === 'users' ? 'users' : undefined;
      const response = await searchDeviceBySerial(searchQuery.trim(), searchTab, filterParam, listParam);

      if (response.success && response.data) {
        if (viewType === 'users') {
          // Rhythm users response
          if ('users' in response.data) {
            setRhythmUsers((response.data as any).users ?? []);
          }
        } else if (searchTab === 'cardiox') {
          // CardioX devices with users (grouped response)
          if ('matches' in response.data) {
            setCardioxDevicesWithUsers((response.data as any).matches ?? []);
          }
        } else {
          // Rhythm devices
          if ('matches' in response.data) {
            setRhythmResults((response.data as any).matches ?? []);
          }
        }
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err: any) {
      setSearchError(err.message || "Failed to search devices");
      setCardioxResults([]);
      setCardioxDevicesWithUsers([]);
      setRhythmResults([]);
      setRhythmUsers([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery("");
    setCardioxResults([]);
    setCardioxDevicesWithUsers([]);
    setRhythmResults([]);
    setRhythmUsers([]);
    setSearchError(null);
  };

  // Handle tab switch
  const handleTabSwitch = (tab: SearchTabType) => {
    setSearchTab(tab);
    setSearchQuery("");
    setViewType('devices');
    setFilter('all');
    setCardioxResults([]);
    setCardioxDevicesWithUsers([]);
    setRhythmResults([]);
    setRhythmUsers([]);
    setSearchError(null);
  };

  // Handle stat card click - switch tab, set view/filter, trigger empty search, scroll to search section
  const handleStatCardClick = (tab: SearchTabType, newViewType: ViewType = 'devices', newFilter: 'all' | 'active' = 'all') => {
    setSearchTab(tab);
    setViewType(newViewType);
    setFilter(newFilter);
    setSearchQuery("");
    setCardioxResults([]);
    setCardioxDevicesWithUsers([]);
    setRhythmResults([]);
    setRhythmUsers([]);
    setSearchError(null);

    // Small delay to allow state updates to render before scrolling
    setTimeout(() => {
      const searchSection = document.getElementById('device-search-section');
      if (searchSection) {
        searchSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      // Trigger search with empty device_id
      handleSearch();
    }, 100);
  };

  // Toggle device expansion
  const toggleDeviceExpansion = (serial: string) => {
    setExpandedDevices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(serial)) {
        newSet.delete(serial);
      } else {
        newSet.add(serial);
      }
      return newSet;
    });
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format heartbeat timestamp
  const formatHeartbeat = (heartbeat: string | null) => {
    if (!heartbeat) return 'Never';
    return formatTimestamp(heartbeat);
  };

  // Mobile Numbers List Component
  const MobileNumbersList = ({ mobileNumbers }: { mobileNumbers: string[] }) => {
    const [expanded, setExpanded] = useState(false);
    const MAX_VISIBLE = 6;

    if (!mobileNumbers || mobileNumbers.length === 0) {
      return <span className="text-slate-400 dark:text-slate-500">—</span>;
    }

    const visibleNumbers = expanded ? mobileNumbers : mobileNumbers.slice(0, MAX_VISIBLE);
    const hasMore = mobileNumbers.length > MAX_VISIBLE;

    return (
      <div className="flex flex-wrap gap-1.5">
        {visibleNumbers.map((number, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-normal bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-md"
          >
            <Phone className="w-3 h-3 text-slate-500 dark:text-slate-400" />
            {number}
          </span>
        ))}
        {hasMore && !expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-normal bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            +{mobileNumbers.length - MAX_VISIBLE} more
          </button>
        )}
        {hasMore && expanded && (
          <button
            onClick={() => setExpanded(false)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-normal bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Show less
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Refresh Button */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Device Analytics</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Monitor device registrations and activity</p>
        </div>
        <div className="flex items-center gap-4">
          {summary && (
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Last updated: {formatTimestamp(summary.generated_at)}
            </div>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchSummary}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Refresh
          </motion.button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-12 text-center">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            Loading device analytics — this can take 20-30 seconds while we scan device reports...
          </p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 shadow-sm p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
                Failed to load device analytics
              </h3>
              <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={fetchSummary}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Retry
              </motion.button>
            </div>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      {summary && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CardioX Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-gradient-to-br from-purple-50/30 to-pink-50/20 dark:from-slate-900 dark:to-slate-900 rounded-xl border border-purple-200/50 dark:border-slate-700 shadow-sm p-6 backdrop-blur-sm"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-xl">
                <Smartphone className="w-6 h-6 text-purple-600 dark:text-purple-300" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">CardioX</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleStatCardClick('cardiox')}
                className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-purple-400 dark:hover:border-purple-500 transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-purple-600 dark:text-purple-300" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">Devices Registered</span>
                </div>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                  {summary.cardiox.devices_registered}
                </p>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleStatCardClick('cardiox', 'devices', 'active')}
                className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-purple-400 dark:hover:border-purple-500 transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Wifi className="w-4 h-4 text-green-600 dark:text-green-300" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">Devices Active (30d)</span>
                </div>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                  {summary.cardiox.devices_active}
                </p>
              </motion.div>
            </div>
          </motion.div>

          {/* Rhythm Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-gradient-to-br from-emerald-50/30 to-teal-50/20 dark:from-slate-900 dark:to-slate-900 rounded-xl border border-emerald-200/50 dark:border-slate-700 shadow-sm p-6 backdrop-blur-sm"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900 rounded-xl">
                <Activity className="w-6 h-6 text-emerald-600 dark:text-emerald-300" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Rhythm</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleStatCardClick('rhythm')}
                className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-500 transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">Devices Registered</span>
                </div>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                  {summary.rhythm.devices_registered}
                </p>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleStatCardClick('rhythm', 'devices', 'active')}
                className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-500 transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Wifi className="w-4 h-4 text-green-600 dark:text-green-300" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">Devices Active (30d)</span>
                </div>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                  {summary.rhythm.devices_active}
                </p>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleStatCardClick('rhythm', 'users', 'all')}
                className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-500 transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">Users Registered</span>
                </div>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                  {summary.rhythm.users_registered}
                </p>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleStatCardClick('rhythm', 'users', 'active')}
                className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-500 transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">Users Active (30d)</span>
                </div>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                  {summary.rhythm.users_active}
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Device Search Section */}
      {summary && !loading && (
        <motion.div
          id="device-search-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6"
        >
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-4">Device Search</h2>

          {/* Pill-style Tabs */}
          <div className="flex gap-3 mb-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleTabSwitch('cardiox')}
              className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-all ${
                searchTab === 'cardiox'
                  ? 'bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 text-white shadow-md shadow-orange-500/50'
                  : 'bg-gray-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600'
              }`}
            >
              CardioX
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleTabSwitch('rhythm')}
              className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-all ${
                searchTab === 'rhythm'
                  ? 'bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 text-white shadow-md shadow-orange-500/50'
                  : 'bg-gray-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600'
              }`}
            >
              Rhythm Ultra
            </motion.button>
          </div>

          <div className="flex gap-3 mb-4">
            <input
              type="text"
              maxLength={4}
              value={searchQuery}
              onChange={(e) => {
                const value = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                setSearchQuery(value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
                if (!/[a-zA-Z0-9]/.test(e.key) && e.key !== "Enter" && e.key !== "Backspace" && e.key !== "Delete" && e.key !== "Tab" && e.key !== "ArrowLeft" && e.key !== "ArrowRight") {
                  e.preventDefault();
                }
              }}
              onPaste={(e) => {
                e.preventDefault();
                const pastedText = e.clipboardData.getData('text');
                const cleanText = pastedText.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4);
                setSearchQuery(cleanText);
              }}
              placeholder="Search by device serial (e.g. A010)"
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 placeholder:text-slate-500 dark:placeholder:text-slate-400"
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSearch}
              disabled={searchLoading || !searchQuery.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:from-blue-600 hover:to-indigo-700 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {searchLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Search
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleClearSearch}
              disabled={searchLoading}
              className="px-6 py-2.5 bg-gradient-to-r from-gray-500 to-gray-600 text-white font-semibold rounded-xl shadow-lg hover:from-gray-600 hover:to-gray-700 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear
            </motion.button>
          </div>

          {/* Search Error */}
          {searchError && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 p-3 mb-4">
              <p className="text-sm text-red-700 dark:text-red-300">{searchError}</p>
            </div>
          )}

          {/* Rhythm Ultra Loading Message */}
          {searchLoading && searchTab === 'rhythm' && viewType === 'devices' && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-4 mb-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Searching Rhythm Ultra devices — this scans all device reports and can take 20-30 seconds...
                </p>
              </div>
            </div>
          )}

          {/* Rhythm Users Loading Message */}
          {searchLoading && searchTab === 'rhythm' && viewType === 'users' && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-4 mb-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Loading Rhythm users… Please wait.
                </p>
              </div>
            </div>
          )}

          {/* CardioX Results Table (Grouped by Device) */}
          {searchTab === 'cardiox' && cardioxDevicesWithUsers?.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300 w-8"></th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Machine Serial</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Users Count</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Last Heartbeat</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Active (30d)</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Online Now</th>
                  </tr>
                </thead>
                <tbody>
                  {cardioxDevicesWithUsers.map((device) => (
                    <>
                      <tr
                        key={device.rhythmulta_serial}
                        className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        onClick={() => toggleDeviceExpansion(device.rhythmulta_serial)}
                      >
                        <td className="py-3 px-4">
                          {expandedDevices.has(device.rhythmulta_serial) ? (
                            <ChevronDown className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-900 dark:text-slate-50 font-mono">{device.rhythmulta_serial}</td>
                        <td className="py-3 px-4 text-sm text-slate-900 dark:text-slate-50">{device.users.length}</td>
                        <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">{formatHeartbeat(device.last_heartbeat)}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 text-xs rounded-full font-semibold ${
                              device.active_30d
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {device.active_30d ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {device.online_now ? (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                              <span className="text-sm text-green-600 dark:text-green-400">Yes</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-gray-400" />
                              <span className="text-sm text-gray-600 dark:text-gray-400">No</span>
                            </div>
                          )}
                        </td>
                      </tr>
                      {expandedDevices.has(device.rhythmulta_serial) && (
                        <tr className="bg-slate-50 dark:bg-slate-800/50">
                          <td colSpan={6} className="py-4 px-4">
                            <div className="ml-8">
                              <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-3">Associated Users ({device.users.length})</h4>
                              <div className="overflow-x-auto">
                                <table className="w-full">
                                  <thead>
                                    <tr className="border-b border-slate-200 dark:border-slate-700">
                                      <th className="text-left py-2 px-3 text-xs font-semibold text-slate-600 dark:text-slate-400">Doctor Name</th>
                                      <th className="text-left py-2 px-3 text-xs font-semibold text-slate-600 dark:text-slate-400">PC Name</th>
                                      <th className="text-left py-2 px-3 text-xs font-semibold text-slate-600 dark:text-slate-400">Phone</th>
                                      <th className="text-left py-2 px-3 text-xs font-semibold text-slate-600 dark:text-slate-400">License Status</th>
                                      <th className="text-left py-2 px-3 text-xs font-semibold text-slate-600 dark:text-slate-400">Last Heartbeat</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {device.users.map((user) => (
                                      <tr key={user.id} className="border-b border-slate-200 dark:border-slate-700 last:border-0">
                                        <td className="py-2 px-3 text-xs text-slate-900 dark:text-slate-50">{user.doctor_name}</td>
                                        <td className="py-2 px-3 text-xs text-slate-900 dark:text-slate-50">{user.pc_name}</td>
                                        <td className="py-2 px-3 text-xs text-slate-900 dark:text-slate-50 font-mono">{user.phone}</td>
                                        <td className="py-2 px-3">
                                          <span
                                            className={`px-2 py-0.5 text-xs rounded-full font-semibold ${
                                              user.license_status === 'active'
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                            }`}
                                          >
                                            {user.license_status}
                                          </span>
                                        </td>
                                        <td className="py-2 px-3 text-xs text-slate-600 dark:text-slate-400">{formatHeartbeat(user.last_heartbeat)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Rhythm Ultra Results Table */}
          {searchTab === 'rhythm' && viewType === 'devices' && rhythmResults?.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Machine Serial</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Associated Mobile Numbers</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Last Seen</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Active</th>
                  </tr>
                </thead>
                <tbody>
                  {rhythmResults.map((device, index) => (
                    <tr
                      key={index}
                      className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <td className="py-3 px-4 text-sm text-slate-900 dark:text-slate-50 font-mono">{device.machine_serial}</td>
                      <td className="py-3 px-4">
                        <MobileNumbersList mobileNumbers={device.mobile_numbers} />
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">{formatTimestamp(device.last_seen)}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 text-xs rounded-full font-semibold ${
                            device.active
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {device.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Rhythm Users Table */}
          {searchTab === 'rhythm' && viewType === 'users' && rhythmUsers?.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Mobile Number</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Last Login</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Active (30d)</th>
                  </tr>
                </thead>
                <tbody>
                  {rhythmUsers.map((user, index) => (
                    <tr
                      key={index}
                      className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <td className="py-3 px-4 text-sm text-slate-900 dark:text-slate-50">{user.name || '—'}</td>
                      <td className="py-3 px-4 text-sm text-slate-900 dark:text-slate-50 font-mono">{user.mobile_number}</td>
                      <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">{user.last_login ? formatTimestamp(user.last_login) : 'Never'}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 text-xs rounded-full font-semibold ${
                            user.active_30d
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {user.active_30d ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Empty State */}
          {!searchLoading && searchQuery && !searchError && (
            ((searchTab === 'cardiox' && cardioxDevicesWithUsers?.length === 0) ||
             (searchTab === 'rhythm' && viewType === 'devices' && rhythmResults?.length === 0) ||
             (searchTab === 'rhythm' && viewType === 'users' && rhythmUsers?.length === 0)) && (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400">
                {viewType === 'users' ? 'No users found' : 'No devices found'}
              </p>
            </div>
          )
          )}
        </motion.div>
      )}
    </div>
  );
}
