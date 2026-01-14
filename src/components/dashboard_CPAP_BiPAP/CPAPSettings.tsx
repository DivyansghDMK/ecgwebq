import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { Settings, SlidersHorizontal, Palette, Eye, EyeOff, Bell, LayoutDashboard, Wind, Activity, Calendar, LogOut, ChevronUp, ChevronDown, User, ShieldCheck, Info, Wifi, Bluetooth, Gauge, Copy } from 'lucide-react';
const deckmountLogo = new URL('../../assets/DeckMount Photo.png', import.meta.url).href;

function getLS(key: string, fallback: string) {
  try {
    const v = localStorage.getItem(key);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

function setLS(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

export default function CPAPSettings() {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const [theme, setTheme] = useState(getLS('theme', 'light'));
  const [logoToggleEnabled, setLogoToggleEnabled] = useState(getLS('logoToggleEnabled', 'true') === 'true');
  const [showMiniStatsActiveUsers, setShowMiniStatsActiveUsers] = useState(getLS('showMiniStatsActiveUsers', 'true') === 'true');
  const [donutThickness, setDonutThickness] = useState(Number(getLS('userDistributionDonutThickness', '20')));
  const [invertPalette, setInvertPalette] = useState(getLS('userDistributionInvertPalette', 'true') === 'true');
  const [lowPressureThreshold, setLowPressureThreshold] = useState(Number(getLS('alertLowPressureThreshold', '4')));
  const [imode, setImode] = useState(getLS('device_imode', 'OFF'));
  const [sleepMode, setSleepMode] = useState(getLS('device_sleepMode', 'OFF'));
  const [humidifier, setHumidifier] = useState(Number(getLS('device_humidifier', '2')));
  const [leakAlert, setLeakAlert] = useState(getLS('device_leakAlert', 'ON'));
  const maskTypes = ['Pillow', 'Nasal', 'Full Face'];
  const [maskType, setMaskType] = useState(getLS('device_maskType', 'Pillow'));
  const [flex, setFlex] = useState(getLS('device_flex', 'ON'));
  const [gender, setGender] = useState(getLS('device_gender', 'Female'));
  const [rampTime, setRampTime] = useState(Number(getLS('device_rampTime', '5')));
  const [flexLevel, setFlexLevel] = useState(Number(getLS('device_flexLevel', '1')));
  const isDarkMode = theme === 'dark';
  const [activeTab, setActiveTab] = useState<'profile' | 'machine' | 'admin' | 'administration'>('profile');
  const [firstName, setFirstName] = useState(getLS('profile_firstName', ''));
  const [lastName, setLastName] = useState(getLS('profile_lastName', ''));
  const [email, setEmail] = useState(getLS('profile_email', ''));
  const [address, setAddress] = useState(getLS('profile_address', ''));
  const [phone, setPhone] = useState(getLS('profile_phone', ''));
  const [dob, setDob] = useState(getLS('profile_dob', ''));
  const [profileLocation, setProfileLocation] = useState(getLS('profile_location', ''));
  const [postalCode, setPostalCode] = useState(getLS('profile_postalCode', ''));
  const [profileGender, setProfileGender] = useState(getLS('profile_gender', 'Female'));
  const [queueCount, setQueueCount] = useState<number>(JSON.parse(getLS('integrationQueue', '[]')).length || 0);
  const [userTag, setUserTag] = useState(getLS('admin_userTag', ''));
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [serverIP, setServerIP] = useState(getLS('server_ip', ''));
  const [serverPort, setServerPort] = useState(getLS('server_port', '443'));
  const [serverProtocol, setServerProtocol] = useState(getLS('server_protocol', 'https'));
  const [apiUrl, setApiUrl] = useState(getLS('integration_apiUrl', ''));
  const [apiKey, setApiKey] = useState(getLS('integration_apiKey', ''));
  const [secondaryUsername, setSecondaryUsername] = useState('');
  const [secondaryPassword, setSecondaryPassword] = useState('');
  const [ssid24, setSsid24] = useState(getLS('wifi_ssid24', ''));
  const [ssid5, setSsid5] = useState(getLS('wifi_ssid5', ''));
  const [wifiPwd24, setWifiPwd24] = useState(getLS('wifi_pwd24', ''));
  const [wifiPwd5, setWifiPwd5] = useState(getLS('wifi_pwd5', ''));
  const [activeDevicesCount, setActiveDevicesCount] = useState(Number(getLS('activeDevicesCount', '0')));
  const [activeDevicesWifi, setActiveDevicesWifi] = useState(Number(getLS('activeDevicesWifi', '0')));
  const [activeDevicesBt, setActiveDevicesBt] = useState(Number(getLS('activeDevicesBt', '0')));
  const [enable24, setEnable24] = useState(getLS('wifi_enable24', 'true') === 'true');
  const [enable5, setEnable5] = useState(getLS('wifi_enable5', 'true') === 'true');
  const [hideSsid24, setHideSsid24] = useState(getLS('wifi_hide24', 'false') === 'true');
  const [hideSsid5, setHideSsid5] = useState(getLS('wifi_hide5', 'false') === 'true');
  const [security24, setSecurity24] = useState(getLS('wifi_sec24', 'WPA2-PSK[AES]+WPA-PSK[TK]'));
  const [security5, setSecurity5] = useState(getLS('wifi_sec5', 'WPA2-PSK[AES]+WPA-PSK[TK]'));
  const [showPwd24, setShowPwd24] = useState(false);
  const [showPwd5, setShowPwd5] = useState(false);
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [channel, setChannel] = useState(getLS('net_channel', '11 (11ng)'));
  const [signalDbm, setSignalDbm] = useState(getLS('net_signal', '-43 dBm'));
  const [rxRate, setRxRate] = useState(getLS('net_rx', '6.00 Mbps'));
  const [txRate, setTxRate] = useState(getLS('net_tx', '72.22 Mbps'));
  const [powerSave, setPowerSave] = useState(getLS('net_ps', 'Enabled'));
  const [activityDown, setActivityDown] = useState(getLS('net_activity_down', '0 /s'));
  const [downPkts, setDownPkts] = useState(getLS('net_down_pkts', '35'));
  const [downBytes, setDownBytes] = useState(getLS('net_down_bytes', '4.13 KB'));
  const [upPkts, setUpPkts] = useState(getLS('net_up_pkts', '90'));
  const [upBytes, setUpBytes] = useState(getLS('net_up_bytes', '12.18 KB'));

  useEffect(() => {
    setLS('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    setLS('logoToggleEnabled', logoToggleEnabled ? 'true' : 'false');
  }, [logoToggleEnabled]);

  useEffect(() => {
    setLS('showMiniStatsActiveUsers', showMiniStatsActiveUsers ? 'true' : 'false');
  }, [showMiniStatsActiveUsers]);

  useEffect(() => {
    setLS('userDistributionDonutThickness', String(donutThickness));
  }, [donutThickness]);

  useEffect(() => {
    setLS('userDistributionInvertPalette', invertPalette ? 'true' : 'false');
  }, [invertPalette]);

  useEffect(() => {
    setLS('alertLowPressureThreshold', String(lowPressureThreshold));
  }, [lowPressureThreshold]);

  useEffect(() => { setLS('device_imode', imode); }, [imode]);
  useEffect(() => { setLS('device_sleepMode', sleepMode); }, [sleepMode]);
  useEffect(() => { setLS('device_humidifier', String(humidifier)); }, [humidifier]);
  useEffect(() => { setLS('device_leakAlert', leakAlert); }, [leakAlert]);
  useEffect(() => { setLS('device_maskType', maskType); }, [maskType]);
  useEffect(() => { setLS('device_flex', flex); }, [flex]);
  useEffect(() => { setLS('device_gender', gender); }, [gender]);
  useEffect(() => { setLS('device_rampTime', String(rampTime)); }, [rampTime]);
  useEffect(() => { setLS('device_flexLevel', String(flexLevel)); }, [flexLevel]);
  useEffect(() => { setLS('profile_firstName', firstName); }, [firstName]);
  useEffect(() => { setLS('profile_lastName', lastName); }, [lastName]);
  useEffect(() => { setLS('profile_email', email); }, [email]);
  useEffect(() => { setLS('profile_address', address); }, [address]);
  useEffect(() => { setLS('profile_phone', phone); }, [phone]);
  useEffect(() => { setLS('profile_dob', dob); }, [dob]);
  useEffect(() => { setLS('profile_location', profileLocation); }, [profileLocation]);
  useEffect(() => { setLS('profile_postalCode', postalCode); }, [postalCode]);
  useEffect(() => { setLS('profile_gender', profileGender); }, [profileGender]);
  useEffect(() => { setLS('admin_userTag', userTag); }, [userTag]);
  useEffect(() => { setLS('server_ip', serverIP); }, [serverIP]);
  useEffect(() => { setLS('server_port', serverPort); }, [serverPort]);
  useEffect(() => { setLS('server_protocol', serverProtocol); }, [serverProtocol]);
  useEffect(() => { setLS('integration_apiUrl', apiUrl); }, [apiUrl]);
  useEffect(() => { setLS('integration_apiKey', apiKey); }, [apiKey]);
  useEffect(() => { setLS('wifi_ssid24', ssid24); }, [ssid24]);
  useEffect(() => { setLS('wifi_ssid5', ssid5); }, [ssid5]);
  useEffect(() => { setLS('wifi_pwd24', wifiPwd24); }, [wifiPwd24]);
  useEffect(() => { setLS('wifi_pwd5', wifiPwd5); }, [wifiPwd5]);
  useEffect(() => { setLS('activeDevicesCount', String(activeDevicesCount)); }, [activeDevicesCount]);
  useEffect(() => { setLS('activeDevicesWifi', String(activeDevicesWifi)); }, [activeDevicesWifi]);
  useEffect(() => { setLS('activeDevicesBt', String(activeDevicesBt)); }, [activeDevicesBt]);
  useEffect(() => { setLS('wifi_enable24', enable24 ? 'true' : 'false'); }, [enable24]);
  useEffect(() => { setLS('wifi_enable5', enable5 ? 'true' : 'false'); }, [enable5]);
  useEffect(() => { setLS('wifi_hide24', hideSsid24 ? 'true' : 'false'); }, [hideSsid24]);
  useEffect(() => { setLS('wifi_hide5', hideSsid5 ? 'true' : 'false'); }, [hideSsid5]);
  useEffect(() => { setLS('wifi_sec24', security24); }, [security24]);
  useEffect(() => { setLS('wifi_sec5', security5); }, [security5]);
  useEffect(() => { setLS('net_channel', channel); }, [channel]);
  useEffect(() => { setLS('net_signal', signalDbm); }, [signalDbm]);
  useEffect(() => { setLS('net_rx', rxRate); }, [rxRate]);
  useEffect(() => { setLS('net_tx', txRate); }, [txRate]);
  useEffect(() => { setLS('net_ps', powerSave); }, [powerSave]);
  useEffect(() => { setLS('net_activity_down', activityDown); }, [activityDown]);
  useEffect(() => { setLS('net_down_pkts', downPkts); }, [downPkts]);
  useEffect(() => { setLS('net_down_bytes', downBytes); }, [downBytes]);
  useEffect(() => { setLS('net_up_pkts', upPkts); }, [upPkts]);
  useEffect(() => { setLS('net_up_bytes', upBytes); }, [upBytes]);

  useEffect(() => {
    const p = routerLocation.pathname.toLowerCase();
    if (p.endsWith('/machine') || p === '/settings/cpap_machine') setActiveTab('machine');
    else if (p.endsWith('/admin') || p === '/settings/admin') setActiveTab('admin');
    else setActiveTab('profile');
  }, [routerLocation.pathname]);

  return (
    <div className={`min-h-screen transition-colors ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <aside className={`fixed inset-y-0 left-0 w-64 border-r transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} hidden md:block`}>
        <div className="p-6">
          <div className={`flex items-center gap-3 font-bold text-xl ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
            <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
              <Wind size={20} />
            </div>
            <span>CPAP/BiPAP</span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (logoToggleEnabled) {
                const next = theme === 'dark' ? 'light' : 'dark';
                setTheme(next);
              }
            }}
            className={`mt-3 inline-flex items-center justify-center rounded-lg ${isDarkMode ? 'bg-white/10 ring-1 ring-white/15' : ''} p-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500/40`}
            aria-label="Toggle theme"
          >
            <img src={deckmountLogo} alt="DeckMount" className="h-8 w-auto" />
          </button>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-1">
          {[
            { name: 'Dashboard', icon: LayoutDashboard, to: '/cpap/dashboard' },
            { name: 'CPAP Mode', icon: Wind, to: '/cpap/cpap_mode' },
            { name: 'AutoCPAP Mode', icon: Activity, to: '/cpap/auto_cpap_mode' },
            { name: 'S Mode', icon: Activity },
            { name: 'T Mode', icon: Activity },
            { name: 'VAPS Mode', icon: Activity },
            { name: 'ST Mode', icon: Activity },
            { name: 'Reports', icon: Calendar, to: '/cpap/reports' },
            { name: 'Machine Settings', icon: ShieldCheck, to: '/settings/cpap_machine' },
            { name: 'Admin Settings', icon: Settings, to: '/settings/admin' },
          ].map((item) => (
            <button
              key={item.name}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isDarkMode 
                  ? 'text-slate-100 hover:bg-slate-800 hover:text-white'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }`}
              onClick={() => item.to ? navigate(item.to) : null}
            >
              <item.icon size={18} />
              {item.name}
            </button>
          ))}
        </nav>
        <div className={`p-4 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
          <button onClick={() => navigate('/cpap/login')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
            isDarkMode 
              ? 'text-red-400 hover:bg-red-900/20' 
              : 'text-red-500 hover:bg-red-50'
          }`}>
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 md:ml-64 p-8 transition-colors duration-300">
        <div className="flex items-center gap-2 mb-6">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-teal-900/30 text-teal-400' : 'bg-teal-50 text-teal-600'}`}>
            <Settings size={16} />
          </div>
          <h1 className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Settings</h1>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {routerLocation.pathname.toLowerCase() === '/settings/cpap_machine' ? (
            <>
              <button
                onClick={() => { setActiveTab('machine'); navigate('/settings/cpap_machine'); }}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'machine'
                    ? 'bg-teal-600 text-white shadow'
                    : isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-700 border border-slate-200'
                }`}
              >
                <ShieldCheck size={16} />
                Machine Settings
              </button>
            </>
          ) : routerLocation.pathname.toLowerCase() === '/settings/admin' ? (
            <>
              <button
                onClick={() => { setActiveTab('profile'); navigate('/settings/admin'); }}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'profile'
                    ? 'bg-orange-500 text-white shadow'
                    : isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-700 border border-slate-200'
                }`}
              >
                <User size={16} />
                Personal Info
              </button>
              <button
                onClick={() => { setActiveTab('admin'); navigate('/settings/admin'); }}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'admin'
                    ? 'bg-indigo-600 text-white shadow'
                    : isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-700 border border-slate-200'
                }`}
              >
                <Info size={16} />
                Admin Controls
              </button>
              <button
                onClick={() => { setActiveTab('administration'); navigate('/settings/admin'); }}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'administration'
                    ? 'bg-purple-600 text-white shadow'
                    : isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-700 border border-slate-200'
                }`}
              >
                <Settings size={16} />
                Administration
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => { setActiveTab('profile'); navigate('/cpap/settings/profile'); }}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'profile'
                    ? 'bg-orange-500 text-white shadow'
                    : isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-700 border border-slate-200'
                }`}
              >
                <User size={16} />
                Personal Info
              </button>
              <button
                onClick={() => { setActiveTab('machine'); navigate('/cpap/settings/machine'); }}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'machine'
                    ? 'bg-teal-600 text-white shadow'
                    : isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-700 border border-slate-200'
                }`}
              >
                <ShieldCheck size={16} />
                Machine Settings
              </button>
              <button
                onClick={() => { setActiveTab('admin'); navigate('/cpap/settings/admin'); }}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'admin'
                    ? 'bg-indigo-600 text-white shadow'
                    : isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-700 border border-slate-200'
                }`}
              >
                <Info size={16} />
                Admin Controls
              </button>
            </>
          )}
        </div>

        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 gap-6">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-4">
                <User size={16} className="text-orange-500" />
                <div className="font-semibold text-slate-700 dark:text-white">Personal Information</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-300">First Name</label>
                  <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={`w-full rounded-xl px-4 py-2 border ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-300">Last Name</label>
                  <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={`w-full rounded-xl px-4 py-2 border ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-300">Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`w-full rounded-xl px-4 py-2 border ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-300">Address</label>
                  <input value={address} onChange={(e) => setAddress(e.target.value)} className={`w-full rounded-xl px-4 py-2 border ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-300">Phone Number</label>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} className={`w-full rounded-xl px-4 py-2 border ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-300">Date of Birth</label>
                  <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className={`w-full rounded-xl px-4 py-2 border ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-300">Location</label>
                  <input value={profileLocation} onChange={(e) => setProfileLocation(e.target.value)} className={`w-full rounded-xl px-4 py-2 border ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-300">Postal Code</label>
                  <input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className={`w-full rounded-xl px-4 py-2 border ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`} />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-4">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-300">Gender</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setProfileGender('Male')} className={`px-3 py-1.5 rounded-lg text-sm ${profileGender==='Male' ? 'bg-orange-500 text-white' : isDarkMode ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700'}`}>Male</button>
                  <button onClick={() => setProfileGender('Female')} className={`px-3 py-1.5 rounded-lg text-sm ${profileGender==='Female' ? 'bg-orange-500 text-white' : isDarkMode ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700'}`}>Female</button>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setFirstName(''); setLastName(''); setEmail(''); setAddress(''); setPhone(''); setDob(''); setProfileLocation(''); setPostalCode('');
                  }}
                  className={`px-4 py-2 rounded-xl border font-semibold ${isDarkMode ? 'border-slate-600 text-slate-300' : 'border-slate-300 text-slate-700'}`}
                >
                  Discard Changes
                </button>
                <button
                  onClick={() => {}}
                  className="px-4 py-2 rounded-xl bg-orange-500 text-white font-semibold"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {activeTab === 'machine' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 rounded-2xl p-0 overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="px-6 py-3 bg-gradient-to-r from-sky-500 to-teal-500 text-white text-center font-semibold tracking-wider">
                CPAP/BiPAP
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <div className={`text-xs font-semibold ml-1 uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>IMODE</div>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col gap-1">
                        <button onClick={() => setImode('ON')} className="p-2 rounded-lg bg-blue-500 text-white"><ChevronUp size={14} /></button>
                        <button onClick={() => setImode('OFF')} className="p-2 rounded-lg bg-blue-500 text-white"><ChevronDown size={14} /></button>
                      </div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium border ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>{imode}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className={`text-xs font-semibold ml-1 uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>Leak Alert</div>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col gap-1">
                        <button onClick={() => setLeakAlert('ON')} className="p-2 rounded-lg bg-blue-500 text-white"><ChevronUp size={14} /></button>
                        <button onClick={() => setLeakAlert('OFF')} className="p-2 rounded-lg bg-blue-500 text-white"><ChevronDown size={14} /></button>
                      </div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium border ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>{leakAlert}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className={`text-xs font-semibold ml-1 uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>Gender</div>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col gap-1">
                        <button onClick={() => setGender('Female')} className="p-2 rounded-lg bg-blue-500 text-white"><ChevronUp size={14} /></button>
                        <button onClick={() => setGender('Male')} className="p-2 rounded-lg bg-blue-500 text-white"><ChevronDown size={14} /></button>
                      </div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium border ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>{gender}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className={`text-xs font-semibold ml-1 uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>Sleep Mode</div>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col gap-1">
                        <button onClick={() => setSleepMode('ON')} className="p-2 rounded-lg bg-blue-500 text-white"><ChevronUp size={14} /></button>
                        <button onClick={() => setSleepMode('OFF')} className="p-2 rounded-lg bg-blue-500 text-white"><ChevronDown size={14} /></button>
                      </div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium border ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>{sleepMode}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className={`text-xs font-semibold ml-1 uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>Mask Type</div>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => {
                            const i = maskTypes.indexOf(maskType);
                            const next = i <= 0 ? maskTypes.length - 1 : i - 1;
                            setMaskType(maskTypes[next]);
                          }}
                          className="p-2 rounded-lg bg-blue-500 text-white"
                        ><ChevronUp size={14} /></button>
                        <button
                          onClick={() => {
                            const i = maskTypes.indexOf(maskType);
                            const next = i >= maskTypes.length - 1 ? 0 : i + 1;
                            setMaskType(maskTypes[next]);
                          }}
                          className="p-2 rounded-lg bg-blue-500 text-white"
                        ><ChevronDown size={14} /></button>
                      </div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium border ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>{maskType}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className={`text-xs font-semibold ml-1 uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>Ramp Time</div>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => setRampTime((v) => Math.min(v + 0.5, 45))}
                          className="p-2 rounded-lg bg-blue-500 text-white"
                        ><ChevronUp size={14} /></button>
                        <button
                          onClick={() => setRampTime((v) => Math.max(v - 0.5, 0))}
                          className="p-2 rounded-lg bg-blue-500 text-white"
                        ><ChevronDown size={14} /></button>
                      </div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium border ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>{rampTime.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className={`text-xs font-semibold ml-1 uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>Humidifier</div>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => setHumidifier((v) => Math.min(Number((v + 0.5).toFixed(1)), 5))}
                          className="p-2 rounded-lg bg-blue-500 text-white"
                        ><ChevronUp size={14} /></button>
                        <button
                          onClick={() => setHumidifier((v) => Math.max(Number((v - 0.5).toFixed(1)), 0))}
                          className="p-2 rounded-lg bg-blue-500 text-white"
                        ><ChevronDown size={14} /></button>
                      </div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium border ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>{humidifier.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className={`text-xs font-semibold ml-1 uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>Flex</div>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col gap-1">
                        <button onClick={() => setFlex('ON')} className="p-2 rounded-lg bg-blue-500 text-white"><ChevronUp size={14} /></button>
                        <button onClick={() => setFlex('OFF')} className="p-2 rounded-lg bg-blue-500 text-white"><ChevronDown size={14} /></button>
                      </div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium border ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>{flex}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className={`text-xs font-semibold ml-1 uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>Flex Level</div>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => setFlexLevel((v) => Math.min(Number((v + 0.5).toFixed(1)), 5))}
                          className="p-2 rounded-lg bg-blue-500 text-white"
                        ><ChevronUp size={14} /></button>
                        <button
                          onClick={() => setFlexLevel((v) => Math.max(Number((v - 0.5).toFixed(1)), 0))}
                          className="p-2 rounded-lg bg-blue-500 text-white"
                        ><ChevronDown size={14} /></button>
                      </div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium border ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>{flexLevel.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {activeTab === 'admin' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-4">
                <Palette size={16} className="text-teal-500" />
                <div className="font-semibold text-slate-700 dark:text-white">Appearance</div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-300">Theme</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setTheme('light')} className={`px-3 py-1.5 rounded-lg text-sm ${theme==='light' ? 'bg-teal-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white'}`}>Light</button>
                    <button onClick={() => setTheme('dark')} className={`px-3 py-1.5 rounded-lg text-sm ${theme==='dark' ? 'bg-teal-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white'}`}>Dark</button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-300">Toggle theme by logo click</span>
                  <button onClick={() => setLogoToggleEnabled(v => !v)} className={`px-3 py-1.5 rounded-lg text-sm ${logoToggleEnabled ? 'bg-teal-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white'}`}>{logoToggleEnabled ? 'Enabled' : 'Disabled'}</button>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-4">
                <SlidersHorizontal size={16} className="text-blue-500" />
                <div className="font-semibold text-slate-700 dark:text-white">Charts</div>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-300">User Distribution donut thickness</span>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{donutThickness}</span>
                  </div>
                  <input type="range" min={14} max={28} value={donutThickness} onChange={(e) => setDonutThickness(Number(e.target.value))} className="w-full mt-2" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-300">Invert palette by theme</span>
                  <button onClick={() => setInvertPalette(v => !v)} className={`px-3 py-1.5 rounded-lg text-sm ${invertPalette ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white'}`}>{invertPalette ? 'On' : 'Off'}</button>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-4">
                <Eye size={16} className="text-emerald-500" />
                <div className="font-semibold text-slate-700 dark:text-white">Dashboard</div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-300">Show mini stats in Active Users</span>
                  <button onClick={() => setShowMiniStatsActiveUsers(v => !v)} className={`px-3 py-1.5 rounded-lg text-sm ${showMiniStatsActiveUsers ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white'}`}>{showMiniStatsActiveUsers ? 'Shown' : 'Hidden'}</button>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-4">
                <Bell size={16} className="text-red-500" />
                <div className="font-semibold text-slate-700 dark:text-white">Alerts</div>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-300">Low pressure threshold</span>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{lowPressureThreshold} cmH₂O</span>
                  </div>
                  <input type="range" min={2} max={10} value={lowPressureThreshold} onChange={(e) => setLowPressureThreshold(Number(e.target.value))} className="w-full mt-2" />
                </div>
              </div>
            </motion.div>

            {/* Administration moved to own tab */}
          </div>
        )}
        {activeTab === 'administration' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 rounded-2xl p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="font-semibold text-slate-700 dark:text-white mb-4">Administration</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-300">Queue</span>
                    <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">{queueCount} items</span>
                  </div>
                  <button
                    onClick={() => {
                      const stored = JSON.parse(getLS('integrationQueue', '[]'));
                      stored.push({ ts: Date.now(), type: 'export', payload: { device: 'CPAP/BiPAP' } });
                      setLS('integrationQueue', JSON.stringify(stored));
                      setQueueCount(stored.length);
                    }}
                    className="w-full px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold"
                  >
                    Add Latest Data to Queue
                  </button>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">User-defined Tag</label>
                  <input value={userTag} onChange={(e) => setUserTag(e.target.value)} className={`w-full rounded-xl px-4 py-2 border ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Change Password</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="relative">
                      <input type={showCurrentPwd ? 'text' : 'password'} placeholder="Current" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={`w-full rounded-xl px-3 py-2 pr-10 border ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`} />
                      <button type="button" onClick={() => setShowCurrentPwd(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white">
                        {showCurrentPwd ? '🙈' : '👁️'}
                      </button>
                    </div>
                    <div className="relative">
                      <input type={showNewPwd ? 'text' : 'password'} placeholder="New" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={`w-full rounded-xl px-3 py-2 pr-10 border ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`} />
                      <button type="button" onClick={() => setShowNewPwd(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white">
                        {showNewPwd ? '🙈' : '👁️'}
                      </button>
                    </div>
                    <div className="relative">
                      <input type={showConfirmPwd ? 'text' : 'password'} placeholder="Confirm" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={`w-full rounded-xl px-3 py-2 pr-10 border ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`} />
                      <button type="button" onClick={() => setShowConfirmPwd(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white">
                        {showConfirmPwd ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (newPassword && newPassword === confirmPassword) {
                        setLS('admin_password', newPassword);
                        setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-orange-500 text-white font-semibold"
                  >
                    Apply
                  </button>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Migrate Server (IP / Net)</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input placeholder="IP" value={serverIP} onChange={(e) => setServerIP(e.target.value)} className={`rounded-xl px-3 py-2 border ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`} />
                    <input placeholder="Port" value={serverPort} onChange={(e) => setServerPort(e.target.value)} className={`rounded-xl px-3 py-2 border ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`} />
                    <select value={serverProtocol} onChange={(e) => setServerProtocol(e.target.value)} className={`rounded-xl px-3 py-2 border ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                      <option value="http">http</option>
                      <option value="https">https</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Send to 3rd-party App</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input placeholder="API URL" value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} className={`rounded-xl px-3 py-2 border ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`} />
                    <input placeholder="API Key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className={`rounded-xl px-3 py-2 border ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`} />
                    <button
                      onClick={async () => {
                        const stored = JSON.parse(getLS('integrationQueue', '[]'));
                        stored.push({ ts: Date.now(), type: 'outbound', url: apiUrl });
                        setLS('integrationQueue', JSON.stringify(stored));
                        setQueueCount(stored.length);
                      }}
                      className="rounded-xl px-3 py-2 bg-indigo-600 text-white font-semibold"
                    >
                      Queue Export
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Secondary User</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input placeholder="Username" value={secondaryUsername} onChange={(e) => setSecondaryUsername(e.target.value)} className={`rounded-xl px-3 py-2 border ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`} />
                    <input type="password" placeholder="Password" value={secondaryPassword} onChange={(e) => setSecondaryPassword(e.target.value)} className={`rounded-xl px-3 py-2 border ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`} />
                    <button
                      onClick={() => {
                        const list = JSON.parse(getLS('secondary_users', '[]'));
                        if (secondaryUsername && secondaryPassword) {
                          list.push({ u: secondaryUsername, p: secondaryPassword });
                          setLS('secondary_users', JSON.stringify(list));
                          setSecondaryUsername(''); setSecondaryPassword('');
                        }
                      }}
                      className="rounded-xl px-3 py-2 bg-emerald-600 text-white font-semibold"
                    >
                      Create
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">IoT Network</label>
                  <div className="space-y-4">
                    <div className="rounded-2xl border p-4 grid grid-cols-1 md:grid-cols-3 gap-3 dark:border-slate-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">2.4GHz</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">WiFi</span>
                        </div>
                        <button onClick={() => setEnable24(v=>!v)} className={`px-3 py-1.5 rounded-lg text-sm ${enable24 ? 'bg-emerald-500 text-white' : isDarkMode ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700'}`}>{enable24 ? 'Enable' : 'Disabled'}</button>
                      </div>
                      <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div className="relative">
                          <input placeholder="Network Name (SSID)" value={ssid24} onChange={(e) => setSsid24(e.target.value)} className={`w-full rounded-xl px-3 py-2 pr-24 border ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`} />
                          <button type="button" onClick={() => navigator.clipboard && navigator.clipboard.writeText(ssid24)} className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-indigo-600 text-white"><Copy size={12}/>Share</button>
                        </div>
                        <select value={security24} onChange={(e)=>setSecurity24(e.target.value)} className={`rounded-xl px-3 py-2 border ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                          <option>WPA2-PSK[AES]+WPA-PSK[TK]</option>
                          <option>WPA2-PSK[AES]</option>
                          <option>WPA3-Personal</option>
                        </select>
                        <div className="relative">
                          <input type={showPwd24 ? 'text' : 'password'} placeholder="Password" value={wifiPwd24} onChange={(e) => setWifiPwd24(e.target.value)} className={`w-full rounded-xl px-3 py-2 pr-20 border ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`} />
                          <button type="button" onClick={() => setShowPwd24(v=>!v)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg">{showPwd24 ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
                        </div>
                        <button onClick={()=>setHideSsid24(v=>!v)} className={`px-3 py-2 rounded-xl text-sm ${hideSsid24 ? 'bg-slate-200 dark:bg-slate-700' : 'bg-slate-100 dark:bg-slate-800'} ${isDarkMode ? 'text-white' : 'text-slate-700'}`}>{hideSsid24 ? 'Hidden SSID' : 'Hide SSID'}</button>
                      </div>
                    </div>

                    <div className="rounded-2xl border p-4 grid grid-cols-1 md:grid-cols-3 gap-3 dark:border-slate-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">5GHz</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">WiFi</span>
                        </div>
                        <button onClick={() => setEnable5(v=>!v)} className={`px-3 py-1.5 rounded-lg text-sm ${enable5 ? 'bg-emerald-500 text-white' : isDarkMode ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700'}`}>{enable5 ? 'Enable' : 'Disabled'}</button>
                      </div>
                      <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div className="relative">
                          <input placeholder="Network Name (SSID)" value={ssid5} onChange={(e) => setSsid5(e.target.value)} className={`w-full rounded-xl px-3 py-2 pr-24 border ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`} />
                          <button type="button" onClick={() => navigator.clipboard && navigator.clipboard.writeText(ssid5)} className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-indigo-600 text-white"><Copy size={12}/>Share</button>
                        </div>
                        <select value={security5} onChange={(e)=>setSecurity5(e.target.value)} className={`rounded-xl px-3 py-2 border ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                          <option>WPA2-PSK[AES]+WPA-PSK[TK]</option>
                          <option>WPA2-PSK[AES]</option>
                          <option>WPA3-Personal</option>
                        </select>
                        <div className="relative">
                          <input type={showPwd5 ? 'text' : 'password'} placeholder="Password" value={wifiPwd5} onChange={(e) => setWifiPwd5(e.target.value)} className={`w-full rounded-xl px-3 py-2 pr-20 border ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`} />
                          <button type="button" onClick={() => setShowPwd5(v=>!v)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg">{showPwd5 ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
                        </div>
                        <button onClick={()=>setHideSsid5(v=>!v)} className={`px-3 py-2 rounded-xl text-sm ${hideSsid5 ? 'bg-slate-200 dark:bg-slate-700' : 'bg-slate-100 dark:bg-slate-800'} ${isDarkMode ? 'text-white' : 'text-slate-700'}`}>{hideSsid5 ? 'Hidden SSID' : 'Hide SSID'}</button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Active Devices Connected</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className={`rounded-2xl p-4 border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Wifi size={16} className="text-sky-500" />
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Internet</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="number" min={0} value={activeDevicesWifi} onChange={(e) => setActiveDevicesWifi(Number(e.target.value))} className={`rounded-xl px-3 py-2 border w-24 ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`} />
                        <span className="inline-flex items-center px-2 py-1 rounded-lg text-[11px] font-semibold bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">devices</span>
                      </div>
                    </div>
                    <div className={`rounded-2xl p-4 border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Bluetooth size={16} className="text-indigo-500" />
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Bluetooth</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="number" min={0} value={activeDevicesBt} onChange={(e) => setActiveDevicesBt(Number(e.target.value))} className={`rounded-xl px-3 py-2 border w-24 ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`} />
                        <span className="inline-flex items-center px-2 py-1 rounded-lg text-[11px] font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">devices</span>
                      </div>
                    </div>
                    <div className={`rounded-2xl p-4 border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                      <div className="flex items-center gap-2">
                        <Gauge size={16} className="text-emerald-500" />
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Total</span>
                        <span className="ml-auto inline-flex items-center px-2 py-1 rounded-lg text-[11px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">{activeDevicesWifi + activeDevicesBt}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Internet Statistics</label>
                  <div className={`rounded-2xl p-4 border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center justify-between text-sm"><span className="text-slate-700 dark:text-slate-300">Channel</span><span className="text-slate-700 dark:text-white">{channel}</span></div>
                      <div className="flex items-center justify-between text-sm"><span className="text-slate-700 dark:text-slate-300">Signal</span><span className="text-slate-700 dark:text-white">{signalDbm}</span></div>
                      <div className="flex items-center justify-between text-sm"><span className="text-slate-700 dark:text-slate-300">Rx Rate</span><span className="text-slate-700 dark:text-white">{rxRate}</span></div>
                      <div className="flex items-center justify-between text-sm"><span className="text-slate-700 dark:text-slate-300">Tx Rate</span><span className="text-slate-700 dark:text-white">{txRate}</span></div>
                      <div className="flex items-center justify-between text-sm"><span className="text-slate-700 dark:text-slate-300">Power Save</span><span className="text-slate-700 dark:text-white">{powerSave}</span></div>
                      <div className="flex items-center justify-between text-sm"><span className="text-slate-700 dark:text-slate-300">Activity Download Speed</span><span className="text-slate-700 dark:text-white">{activityDown}</span></div>
                      <div className="flex items-center justify-between text-sm"><span className="text-slate-700 dark:text-slate-300">Down Pkts/Bytes</span><span className="text-slate-700 dark:text-white">{downPkts} / {downBytes}</span></div>
                      <div className="flex items-center justify-between text-sm"><span className="text-slate-700 dark:text-slate-300">Up Pkts/Bytes</span><span className="text-slate-700 dark:text-white">{upPkts} / {upBytes}</span></div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => {
                          const r = (min: number, max: number) => Math.floor(Math.random()*(max-min+1))+min;
                          setSignalDbm(`-${r(35,65)} dBm`);
                          setRxRate(`${r(6,120)} Mbps`);
                          setTxRate(`${r(20,240)} Mbps`);
                          setActivityDown(`${r(0,10)} /s`);
                          setDownPkts(String(r(20,150)));
                          setUpPkts(String(r(20,150)));
                          setDownBytes(`${r(1,512)} KB`);
                          setUpBytes(`${r(1,512)} KB`);
                        }}
                        className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold"
                      >
                        Refresh Stats
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}
