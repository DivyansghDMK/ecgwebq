import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, 
  FileText, 
  TrendingUp, 
  Calendar, 
  Clock, 
  DollarSign,
  Activity,
  Award,
  ChevronRight,
  Star,
  CheckCircle,
  AlertCircle,
  Heart,
  Stethoscope,
  LayoutDashboard,
  Users,
  Bell,
  Settings,
  LogOut,
  Sparkles,
  Zap,
  BarChart3,
  Search,
  Filter,
  X
} from 'lucide-react';
import doctorImage from '../../assets/doctor.jpg';

interface DoctorProfile {
  name: string;
  specialization: string;
  experience: string;
  rating: number;
  totalReviews: number;
  avatar: string;
}

interface EarningsData {
  perReport: number;
  total: number;
  today: number;
  weekly: number;
  monthly: number;
  todayReports: number;
  weeklyReports: number;
  monthlyReports: number;
}

interface RecentReport {
  id: string;
  serialId: string;
  username: string;
  patientName: string;
  phoneNumber: string;
  reportType: string;
  reviewedAt: string;
  earnings: number;
  status: 'completed' | 'pending';
}

interface FilterState {
  serialId: string;
  username: string;
  phoneNumber: string;
}

const DoctorDashboardPresentation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'weekly' | 'monthly'>('today');
  const [earningsGrowth, setEarningsGrowth] = useState(12.5);
  const [activeNav, setActiveNav] = useState('dashboard');

  // Sync activeNav with current route
  useEffect(() => {
    if (location.pathname === '/doctor/reports') {
      setActiveNav('reports');
    } else if (location.pathname === '/doctor') {
      setActiveNav('dashboard');
    }
  }, [location.pathname]);
  const [filters, setFilters] = useState<FilterState>({
    serialId: '',
    username: '',
    phoneNumber: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Get current date
  const currentDate = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const formattedDate = `${dayNames[currentDate.getDay()]}, ${currentDate.getDate()} ${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  
  // Mock alerts
  const alerts = [
    { id: 1, type: 'appointment', message: 'New appointment request from John Doe', time: '30 minutes ago', avatar: '👤' },
    { id: 2, type: 'review', message: 'New review from Sarah Wilson', time: '1 hour ago', avatar: '👤' },
    { id: 3, type: 'cancelled', message: 'Appointment cancelled by Michael Brown', time: '2 hours ago', avatar: '👤' },
  ];

  // Mock doctor profile data
  const doctorProfile: DoctorProfile = {
    name: "Dr. Sarah Johnson",
    specialization: "Cardiologist",
    experience: "15+ Years",
    rating: 4.8,
    totalReviews: 124,
    avatar: "👩‍⚕️"
  };

  // Mock earnings data
  const earningsData: EarningsData = {
    perReport: 50,
    total: 6200,
    today: 400,
    weekly: 2100,
    monthly: 6200,
    todayReports: 8,
    weeklyReports: 42,
    monthlyReports: 124
  };

  // Mock recent reports with more data
  const allReports: RecentReport[] = [
    {
      id: "RPT-001",
      serialId: "SR-2024-001",
      username: "johndoe",
      patientName: "John Doe",
      phoneNumber: "9876543210",
      reportType: "ECG Report",
      reviewedAt: "2024-01-24 10:30 AM",
      earnings: 50,
      status: 'completed'
    },
    {
      id: "RPT-002", 
      serialId: "SR-2024-002",
      username: "janesmith",
      patientName: "Jane Smith",
      phoneNumber: "9876543211",
      reportType: "Cardiac MRI",
      reviewedAt: "2024-01-24 09:45 AM",
      earnings: 50,
      status: 'completed'
    },
    {
      id: "RPT-003",
      serialId: "SR-2024-003",
      username: "robertbrown",
      patientName: "Robert Brown",
      phoneNumber: "9876543212",
      reportType: "ECG Report",
      reviewedAt: "2024-01-24 09:15 AM",
      earnings: 50,
      status: 'completed'
    },
    {
      id: "RPT-004",
      serialId: "SR-2024-004",
      username: "emilydavis",
      patientName: "Emily Davis",
      phoneNumber: "9876543213",
      reportType: "Stress Test",
      reviewedAt: "2024-01-24 08:30 AM",
      earnings: 50,
      status: 'completed'
    },
    {
      id: "RPT-005",
      serialId: "SR-2024-005",
      username: "michaelwilson",
      patientName: "Michael Wilson",
      phoneNumber: "9876543214",
      reportType: "ECG Report", 
      reviewedAt: "2024-01-24 08:00 AM",
      earnings: 50,
      status: 'completed'
    },
    {
      id: "RPT-006",
      serialId: "SR-2024-006",
      username: "sarahjones",
      patientName: "Sarah Jones",
      phoneNumber: "9876543215",
      reportType: "ECG Report",
      reviewedAt: "2024-01-23 05:30 PM",
      earnings: 50,
      status: 'completed'
    },
    {
      id: "RPT-007",
      serialId: "SR-2024-007",
      username: "davidlee",
      patientName: "David Lee",
      phoneNumber: "9876543216",
      reportType: "Cardiac MRI",
      reviewedAt: "2024-01-23 04:15 PM",
      earnings: 50,
      status: 'pending'
    },
    {
      id: "RPT-008",
      serialId: "SR-2024-008",
      username: "lisawang",
      patientName: "Lisa Wang",
      phoneNumber: "9876543217",
      reportType: "ECG Report",
      reviewedAt: "2024-01-23 03:00 PM",
      earnings: 50,
      status: 'completed'
    }
  ];

  // Filter reports based on filter state
  const filteredReports = useMemo(() => {
    return allReports.filter(report => {
      const matchesSerialId = !filters.serialId || 
        report.serialId.toLowerCase().includes(filters.serialId.toLowerCase());
      const matchesUsername = !filters.username || 
        report.username.toLowerCase().includes(filters.username.toLowerCase());
      const matchesPhone = !filters.phoneNumber || 
        report.phoneNumber.includes(filters.phoneNumber);
      
      return matchesSerialId && matchesUsername && matchesPhone;
    });
  }, [filters]);

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
  };

  // Check if any filter is active
  const hasActiveFilters = filters.serialId || filters.username || filters.phoneNumber;

  const getEarningsForPeriod = () => {
    switch (selectedPeriod) {
      case 'today':
        return { amount: earningsData.today, reports: earningsData.todayReports };
      case 'weekly':
        return { amount: earningsData.weekly, reports: earningsData.weeklyReports };
      case 'monthly':
        return { amount: earningsData.monthly, reports: earningsData.monthlyReports };
      default:
        return { amount: 0, reports: 0 };
    }
  };

  const currentPeriod = getEarningsForPeriod();

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="flex">
        {/* Left Sidebar Navigation */}
        <motion.aside
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="hidden lg:block w-64 bg-slate-900/90 backdrop-blur-sm border-r border-white/10 min-h-screen"
        >
          <div className="p-6 border-b border-white/10 sticky top-0 bg-slate-900/90 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-brand-orange via-brand-electric to-brand-focus rounded-xl flex items-center justify-center shadow-lg shadow-brand-orange/20">
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
                onClick={() => {
                  setActiveNav(item.id);
                  navigate(item.path);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  (item.id === 'reports' && location.pathname === '/doctor/reports') || 
                  (item.id === 'dashboard' && location.pathname === '/doctor')
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

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          <div className="p-4 lg:p-6 space-y-6">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-3xl font-bold text-white mb-1">Dashboard</h1>
              <p className="text-white/60">{formattedDate}</p>
            </motion.div>

            {/* Welcome Section with Profile Box */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="glass-panel rounded-xl p-6"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-brand-orange mb-2">Welcome {doctorProfile.name.split(' ')[1]}!</h2>
                  <p className="text-white/80">
                    You have <span className="font-bold text-brand-electric">{earningsData.todayReports} reports</span> remaining today! 
                    Remember to check documentation before review.
                  </p>
                </div>
                {/* Profile Box - Replacing Stethoscope Icon */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm min-w-[200px]">
                  <div className="flex flex-col items-center">
                    <div className="relative mb-3">
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-brand-orange/50 shadow-lg">
                        <img 
                          src={doctorImage} 
                          alt={doctorProfile.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            if (target.parentElement) {
                              target.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center text-2xl bg-gradient-to-br from-brand-orange/20 to-brand-electric/20">${doctorProfile.avatar}</div>`;
                            }
                          }}
                        />
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-brand-orange rounded-full p-1 shadow-lg border-2 border-slate-950">
                        <CheckCircle className="w-3 h-3 text-white" />
                      </div>
                    </div>
                    <h4 className="text-sm font-bold text-white mb-1">{doctorProfile.name}</h4>
                    <p className="text-xs text-white/60 mb-3">{doctorProfile.specialization}</p>
                    <div className="w-full space-y-2">
                      <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/10">
                        <span className="text-xs text-white/70">Rating</span>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-brand-orange fill-current" />
                          <span className="text-xs font-bold text-white">{doctorProfile.rating}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/10">
                        <span className="text-xs text-white/70">Patients</span>
                        <span className="text-xs font-bold text-white">{doctorProfile.totalReviews}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Earnings Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="glass-panel rounded-xl p-6 hover:shadow-glow transition-all duration-200 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-brand-orange/10 rounded-full -mr-10 -mt-10"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-brand-orange to-brand-electric rounded-xl shadow-md">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-brand-orange flex items-center bg-brand-orange/10 px-3 py-1.5 rounded-full border border-brand-orange/20">
                      <TrendingUp className="w-3.5 h-3.5 mr-1" />
                      +{earningsGrowth}%
                    </span>
                  </div>
                  <p className="text-sm font-medium text-white/70 mb-2">Per Report</p>
                  <h2 className="text-3xl font-bold text-white">₹{earningsData.perReport}</h2>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.15 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="glass-panel rounded-xl p-6 hover:shadow-glow transition-all duration-200 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-brand-electric/10 rounded-full -mr-10 -mt-10"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-brand-electric to-brand-focus rounded-xl shadow-md">
                      <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-brand-electric bg-brand-electric/10 px-3 py-1.5 rounded-full border border-brand-electric/20">Total</span>
                  </div>
                  <p className="text-sm font-medium text-white/70 mb-2">Total Earnings</p>
                  <h2 className="text-3xl font-bold text-white">₹{earningsData.total.toLocaleString()}</h2>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="glass-panel rounded-xl p-6 hover:shadow-glow transition-all duration-200 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-brand-orange/10 rounded-full -mr-10 -mt-10"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-brand-orange to-brand-electric rounded-xl shadow-md">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-brand-orange bg-brand-orange/10 px-3 py-1.5 rounded-full border border-brand-orange/20">Today</span>
                  </div>
                  <p className="text-sm font-medium text-white/70 mb-2">Today's Earnings</p>
                  <h2 className="text-3xl font-bold text-white">₹{earningsData.today}</h2>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.25 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="glass-panel rounded-xl p-6 hover:shadow-glow transition-all duration-200 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-brand-focus/10 rounded-full -mr-10 -mt-10"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-brand-focus to-brand-orange rounded-xl shadow-md">
                      <Activity className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-brand-focus bg-brand-focus/10 px-3 py-1.5 rounded-full border border-brand-focus/20">This Week</span>
                  </div>
                  <p className="text-sm font-medium text-white/70 mb-2">Weekly Earnings</p>
                  <h2 className="text-3xl font-bold text-white">₹{earningsData.weekly}</h2>
                </div>
              </motion.div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Left Column - Earnings Overview & Reports */}
              <div className="xl:col-span-2 space-y-6">
                {/* Earnings Overview */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  className="glass-panel rounded-xl p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-brand-orange/20 rounded-lg border border-brand-orange/30">
                        <DollarSign className="w-5 h-5 text-brand-orange" />
                      </div>
                      <h2 className="text-xl font-bold text-white">Earnings Overview</h2>
                    </div>
                    <div className="flex bg-white/5 rounded-lg p-1 border border-white/10 backdrop-blur-sm">
                      {(['today', 'weekly', 'monthly'] as const).map((period) => (
                        <button
                          key={period}
                          onClick={() => setSelectedPeriod(period)}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                            selectedPeriod === period
                              ? 'bg-gradient-to-r from-brand-orange via-brand-electric to-brand-focus text-white shadow-glow'
                              : 'text-white/70 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          {period.charAt(0).toUpperCase() + period.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="bg-gradient-to-br from-brand-orange via-brand-electric to-brand-focus rounded-xl p-6 text-white shadow-glow"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <DollarSign className="w-8 h-8" />
                      </div>
                      <div className="text-3xl font-bold mb-1">₹{currentPeriod.amount.toLocaleString()}</div>
                      <div className="text-white/80 text-sm mb-2">Earnings this {selectedPeriod}</div>
                      <div className="text-xs text-white/70 bg-white/10 px-3 py-1.5 rounded-full inline-block">
                        {currentPeriod.reports} reports reviewed
                      </div>
                    </motion.div>
                    
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="bg-gradient-to-br from-brand-electric via-brand-focus to-brand-orange rounded-xl p-6 text-white shadow-glow"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <FileText className="w-8 h-8" />
                      </div>
                      <div className="text-3xl font-bold mb-1">{currentPeriod.reports}</div>
                      <div className="text-white/80 text-sm mb-2">Reports Reviewed</div>
                      <div className="text-xs text-white/70 bg-white/10 px-3 py-1.5 rounded-full inline-block">
                        ₹{earningsData.perReport} per report
                      </div>
                    </motion.div>
                  </div>
                </motion.div>

                {/* Recent Reports Table with Filters */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                  className="glass-panel rounded-xl p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-brand-orange/20 rounded-lg border border-brand-orange/30">
                        <FileText className="w-5 h-5 text-brand-orange" />
                      </div>
                      <h2 className="text-xl font-bold text-white">Recently Reviewed Reports</h2>
                      {hasActiveFilters && (
                        <span className="ml-2 bg-brand-orange/20 text-brand-orange text-xs font-semibold px-2.5 py-1 rounded-full border border-brand-orange/30">
                          {filteredReports.length} found
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          showFilters || hasActiveFilters
                            ? 'bg-brand-orange/20 text-brand-orange border border-brand-orange/30'
                            : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <Filter className="w-4 h-4" />
                        Filters
                      </motion.button>
                      <button className="text-sm font-medium text-brand-orange hover:text-brand-electric flex items-center gap-1 transition-colors">
                        View All
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Filter Section */}
                  {showFilters && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-6 bg-white/5 rounded-lg border border-white/10 p-4"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Search className="w-4 h-4 text-brand-orange" />
                          <h3 className="text-sm font-semibold text-white">Filter Reports</h3>
                        </div>
                        {hasActiveFilters && (
                          <button
                            onClick={clearFilters}
                            className="text-xs text-brand-orange hover:text-brand-electric flex items-center gap-1 transition-colors"
                          >
                            <X className="w-3 h-3" />
                            Clear All
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-white/70 mb-2">Serial ID</label>
                          <div className="relative">
                            <input
                              type="text"
                              value={filters.serialId}
                              onChange={(e) => handleFilterChange('serialId', e.target.value)}
                              placeholder="Enter serial ID"
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-brand-orange/50 focus:border-brand-orange/50 transition-all"
                            />
                            {filters.serialId && (
                              <button
                                onClick={() => handleFilterChange('serialId', '')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-white/70 mb-2">Username</label>
                          <div className="relative">
                            <input
                              type="text"
                              value={filters.username}
                              onChange={(e) => handleFilterChange('username', e.target.value)}
                              placeholder="Enter username"
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-brand-orange/50 focus:border-brand-orange/50 transition-all"
                            />
                            {filters.username && (
                              <button
                                onClick={() => handleFilterChange('username', '')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-white/70 mb-2">Phone Number</label>
                          <div className="relative">
                            <input
                              type="tel"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={filters.phoneNumber}
                              onChange={(e) => handleNumericInput(e.target.value)}
                              placeholder="Enter phone number"
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-brand-orange/50 focus:border-brand-orange/50 transition-all"
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
                              <button
                                onClick={() => handleFilterChange('phoneNumber', '')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  <div className="overflow-x-auto">
                    <div className="bg-white/5 rounded-lg border border-white/10 overflow-hidden backdrop-blur-sm">
                      {filteredReports.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                            <FileText className="w-8 h-8 text-white/30" />
                          </div>
                          <p className="text-white/60 font-medium">
                            {hasActiveFilters ? 'No reports found matching your filters' : 'No reports available'}
                          </p>
                          {hasActiveFilters && (
                            <button
                              onClick={clearFilters}
                              className="mt-4 text-brand-orange hover:text-brand-electric text-sm font-medium transition-colors"
                            >
                              Clear filters to see all reports
                            </button>
                          )}
                        </div>
                      ) : (
                        <table className="w-full">
                          <thead>
                            <tr className="bg-white/5 border-b border-white/10">
                              <th className="text-left py-3 px-4 text-xs font-semibold text-white/70 uppercase tracking-wider">Serial ID</th>
                              <th className="text-left py-3 px-4 text-xs font-semibold text-white/70 uppercase tracking-wider">Username</th>
                              <th className="text-left py-3 px-4 text-xs font-semibold text-white/70 uppercase tracking-wider">Patient Name</th>
                              <th className="text-left py-3 px-4 text-xs font-semibold text-white/70 uppercase tracking-wider">Phone</th>
                              <th className="text-left py-3 px-4 text-xs font-semibold text-white/70 uppercase tracking-wider">Report Type</th>
                              <th className="text-left py-3 px-4 text-xs font-semibold text-white/70 uppercase tracking-wider">Reviewed At</th>
                              <th className="text-left py-3 px-4 text-xs font-semibold text-white/70 uppercase tracking-wider">Earnings</th>
                              <th className="text-left py-3 px-4 text-xs font-semibold text-white/70 uppercase tracking-wider">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/10">
                            {filteredReports.map((report, index) => (
                              <motion.tr
                                key={report.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: 0.45 + index * 0.05 }}
                                whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                                className="border-b border-white/10 hover:bg-white/5 transition-colors cursor-pointer"
                              >
                                <td className="py-4 px-4">
                                  <span className="text-sm font-medium text-brand-orange">{report.serialId}</span>
                                </td>
                                <td className="py-4 px-4">
                                  <span className="text-sm font-medium text-white/90">{report.username}</span>
                                </td>
                                <td className="py-4 px-4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-orange/20 to-brand-electric/20 flex items-center justify-center border border-brand-orange/30">
                                      <User className="w-4 h-4 text-brand-orange" />
                                    </div>
                                    <span className="text-sm font-medium text-white">{report.patientName}</span>
                                  </div>
                                </td>
                                <td className="py-4 px-4">
                                  <span className="text-sm text-white/70">{report.phoneNumber}</span>
                                </td>
                                <td className="py-4 px-4">
                                  <span className="text-sm text-white/70">{report.reportType}</span>
                                </td>
                                <td className="py-4 px-4">
                                  <span className="text-sm text-white/70">{report.reviewedAt}</span>
                                </td>
                                <td className="py-4 px-4">
                                  <span className="text-sm font-semibold text-brand-orange flex items-center gap-1">
                                    <DollarSign className="w-4 h-4" />
                                    {report.earnings}
                                  </span>
                                </td>
                                <td className="py-4 px-4">
                                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${
                                    report.status === 'completed' 
                                      ? 'bg-brand-orange/20 text-brand-orange border border-brand-orange/30' 
                                      : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                  }`}>
                                    {report.status === 'completed' ? (
                                      <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                                    ) : (
                                      <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
                                    )}
                                    {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                                  </span>
                                </td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Right Column - Alerts & Performance (Profile moved to welcome section) */}
              <div className="space-y-6">
                {/* Alerts Card - Below Profile */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="glass-panel rounded-xl p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-brand-orange/20 rounded-lg border border-brand-orange/30">
                        <Bell className="w-5 h-5 text-brand-orange" />
                      </div>
                      <h3 className="text-lg font-bold text-white">Alerts</h3>
                    </div>
                    <span className="bg-red-500/20 text-red-400 text-xs font-semibold px-2.5 py-1 rounded-full border border-red-500/30">
                      {alerts.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {alerts.map((alert, index) => (
                      <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                        whileHover={{ x: 4 }}
                        className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-orange/20 to-brand-electric/20 flex items-center justify-center text-lg flex-shrink-0 border border-brand-orange/30">
                          {alert.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{alert.message}</p>
                          <p className="text-xs text-white/50 mt-1">{alert.time}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Performance Stats - Below Alerts */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.35 }}
                  className="glass-panel rounded-xl p-6"
                >
                  <div className="flex items-center gap-2 mb-6">
                    <div className="p-2 bg-brand-electric/20 rounded-lg border border-brand-electric/30">
                      <Activity className="w-5 h-5 text-brand-electric" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Performance</h2>
                  </div>
                  <div className="space-y-4">
                    <motion.div
                      whileHover={{ x: 4 }}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                    >
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-brand-orange" />
                        <span className="text-sm font-medium text-white/80">Avg. Reports/Day</span>
                      </div>
                      <span className="font-bold text-white">8.2</span>
                    </motion.div>
                    <motion.div
                      whileHover={{ x: 4 }}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-brand-electric" />
                        <span className="text-sm font-medium text-white/80">Avg. Review Time</span>
                      </div>
                      <span className="font-bold text-white">12 min</span>
                    </motion.div>
                    <motion.div
                      whileHover={{ x: 4 }}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                    >
                      <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-brand-focus" />
                        <span className="text-sm font-medium text-white/80">Success Rate</span>
                      </div>
                      <span className="font-bold text-white">98.5%</span>
                    </motion.div>
                    <motion.div
                      whileHover={{ x: 4 }}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                    >
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-brand-orange" />
                        <span className="text-sm font-medium text-white/80">Monthly Growth</span>
                      </div>
                      <span className="font-bold text-brand-orange flex items-center">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        +15%
                      </span>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboardPresentation;
