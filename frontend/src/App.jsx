import React, { useState } from 'react';
import { useAppContext } from './context/AppContext';
import { useTranslation } from 'react-i18next';
import {
  Users,
  FileText,
  CreditCard,
  Fingerprint,
  LogOut,
  Bell,
  Globe,
  Loader2,
  Check,
  X,
  Menu,
  Shield,
  Clock,
  Sparkles,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Page Components
import Auth from './pages/Auth';
import Community from './pages/Community';
import ResumeBuilder from './pages/ResumeBuilder';
import Billing from './pages/Billing';
import SecurityLogs from './pages/SecurityLogs';
import DeveloperPanel from './components/DeveloperPanel';
import confetti from 'canvas-confetti';

const App = () => {
  const {
    user,
    isAuthenticated,
    authLoading,
    logout,
    apiCall,
    refreshProfile,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    istTime,
    simulatedDevice
  } = useAppContext();

  const { t, i18n } = useTranslation();

  const [activeTab, setActiveTab] = useState('feed'); // feed, resume, billing, logs
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  // French language OTP switch modal states
  const [frenchModalOpen, setFrenchModalOpen] = useState(false);
  const [frenchOtp, setFrenchOtp] = useState('');
  const [frenchLoading, setFrenchLoading] = useState(false);
  const [frenchError, setFrenchError] = useState('');
  const [frenchSuccess, setFrenchSuccess] = useState('');
  const [frenchEmailPreview, setFrenchEmailPreview] = useState('');

  // Handle standard language click
  const handleLangChange = async (langCode) => {
    setLangDropdownOpen(false);
    setFrenchError('');
    setFrenchSuccess('');
    setFrenchEmailPreview('');

    if (langCode === 'fr') {
      // FRENCH LANGUAGE SECURITY RULE
      // Trigger French OTP modal
      setFrenchModalOpen(true);
      setFrenchOtp('');
      
      try {
        setFrenchLoading(true);
        // Call backend language switch without OTP to trigger sending OTP
        const res = await apiCall('POST', '/api/language/switch', { language: 'fr' });
        if (res.data.status === 'OTP_PENDING') {
          setFrenchSuccess('Security OTP code sent to your registered email!');
          if (res.data.previewUrl) {
            setFrenchEmailPreview(res.data.previewUrl);
          }
          confetti({ particleCount: 30, colors: ['#3b82f6', '#ffffff', '#ef4444'] }); // French colors!
        }
      } catch (err) {
        setFrenchError(err.response?.data?.message || 'Failed to dispatch French OTP code.');
      } finally {
        setFrenchLoading(false);
      }
      return;
    }

    // Standard switch (English, Spanish, Hindi, etc.)
    try {
      const res = await apiCall('POST', '/api/language/switch', { language: langCode });
      i18n.changeLanguage(langCode);
      refreshProfile();
      alert(`Language updated to ${langCode.toUpperCase()}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating language settings');
    }
  };

  // Verify French Switch OTP
  const handleVerifyFrenchOtp = async (e) => {
    e.preventDefault();
    setFrenchError('');
    setFrenchSuccess('');
    setFrenchLoading(true);

    try {
      const res = await apiCall('POST', '/api/language/switch', {
        language: 'fr',
        otp: frenchOtp
      });

      i18n.changeLanguage('fr');
      refreshProfile();
      setFrenchModalOpen(false);
      confetti({
        particleCount: 150,
        spread: 80,
        colors: ['#3b82f6', '#ffffff', '#ef4444'] // French flag colors confetti!
      });
      alert('Bonjour! Language preference successfully updated to French.');
    } catch (err) {
      setFrenchError(err.response?.data?.message || 'Invalid or expired French verification code.');
    } finally {
      setFrenchLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-4 font-sans">
        <Loader2 className="animate-spin text-indigo-500" size={48} />
        <p className="text-xs uppercase tracking-widest font-semibold text-slate-500">
          Loading Elevance MERN Systems...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="bg-slate-950 min-h-screen flex flex-col justify-between selection:bg-indigo-500 selection:text-white font-sans text-slate-100">
        <Auth />
        <DeveloperPanel />
      </div>
    );
  }

  // Active tab viewer mapper
  const renderTabContent = () => {
    switch (activeTab) {
      case 'feed':
        return <Community />;
      case 'resume':
        return <ResumeBuilder />;
      case 'billing':
        return <Billing />;
      case 'logs':
        return <SecurityLogs />;
      default:
        return <Community />;
    }
  };

  // Language display mapping helper
  const langNames = {
    en: '🇺🇸 English',
    es: '🇪🇸 Español',
    hi: '🇮🇳 हिन्दी',
    pt: '🇵🇹 Português',
    zh: '🇨🇳 中文',
    fr: '🇫🇷 Français'
  };

  const unreadNotifCount = notifications.filter((n) => !n.isRead).length;
  const isMobileAccessHour = istTime.hours >= 10 && istTime.hours < 13;
  const isMobileBlocked = simulatedDevice === 'mobile' && !isMobileAccessHour;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex overflow-hidden">
      
      {/* 1. SIDEBAR NAVIGATION */}
      <aside className={`shrink-0 bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col justify-between z-40 ${
        sidebarOpen ? 'w-64' : 'w-20'
      }`}>
        <div className="space-y-6 py-6 px-4">
          {/* Sidebar Brand header */}
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                  🎓
                </div>
                <span className="font-extrabold Outfit text-sm uppercase tracking-wider text-slate-100">
                  Internshala
                </span>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg bg-slate-950/40 border border-slate-800 text-slate-400 hover:text-white mx-auto transition-colors"
            >
              <Menu size={16} />
            </button>
          </div>

          <hr className="border-slate-800" />

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {[
              { id: 'feed', icon: Users, label: t('public_space') },
              { id: 'resume', icon: FileText, label: t('resume_builder') },
              { id: 'billing', icon: CreditCard, label: t('subscription_plans') },
              { id: 'logs', icon: Fingerprint, label: t('login_history') }
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                    active
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10'
                      : 'text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                  }`}
                  title={tab.label}
                >
                  <Icon size={16} className={active ? 'text-white' : 'text-slate-500'} />
                  {sidebarOpen && <span className="truncate">{tab.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User logout footer */}
        <div className="p-4 space-y-4">
          {sidebarOpen && (
            <div className="bg-slate-950/40 p-3.5 rounded-2xl border border-slate-850 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 text-indigo-400 font-extrabold flex items-center justify-center text-xs shadow">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-200 truncate">{user?.name}</p>
                <p className="text-[9px] text-slate-500 font-mono truncate">{user?.role === 'employer' ? 'Recruiter' : 'Candidate'}</p>
              </div>
            </div>
          )}

          <button
            onClick={logout}
            className="w-full flex items-center gap-3.5 px-4 py-3 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
          >
            <LogOut size={16} className="text-slate-500" />
            {sidebarOpen && <span>{t('logout')}</span>}
          </button>
        </div>
      </aside>

      {/* 2. MAIN HEADER & ROUTE DRAWER VIEWPORTS */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Unified Header */}
        <header className="shrink-0 bg-slate-900 border-b border-slate-800 h-16 px-6 flex items-center justify-between z-30">
          <div className="flex items-center gap-2">
            <Shield className="text-indigo-500" size={16} />
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest hidden md:inline">
              Secure Sandbox System Gateways
            </span>
          </div>

          <div className="flex items-center gap-4">
            
            {/* A. Language preference selector */}
            <div className="relative">
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="bg-slate-950/60 border border-slate-800 hover:bg-slate-850 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 flex items-center gap-1.5 transition-colors"
              >
                <Globe size={13} className="text-indigo-400" />
                <span>{langNames[i18n.language] || 'Language'}</span>
              </button>

              <AnimatePresence>
                {langDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-44 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-xl overflow-hidden py-1 z-50 text-xs"
                  >
                    {Object.keys(langNames).map((langCode) => (
                      <button
                        key={langCode}
                        onClick={() => handleLangChange(langCode)}
                        className={`w-full text-left px-4 py-2 hover:bg-slate-800 transition-colors flex items-center justify-between ${
                          i18n.language === langCode ? 'text-indigo-400 font-bold' : 'text-slate-300'
                        }`}
                      >
                        <span>{langNames[langCode]}</span>
                        {i18n.language === langCode && <Check size={12} />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* B. Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="relative p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-white transition-all"
              >
                <Bell size={15} />
                {unreadNotifCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                )}
              </button>

              <AnimatePresence>
                {notifDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-750 rounded-2xl shadow-2xl overflow-hidden z-50 text-xs"
                  >
                    <div className="bg-slate-850 p-3 border-b border-slate-750 flex justify-between items-center">
                      <span className="font-bold Outfit text-indigo-300 uppercase tracking-wider">Activity Notifications</span>
                      {unreadNotifCount > 0 && (
                        <button
                          onClick={markAllNotificationsAsRead}
                          className="text-[10px] text-indigo-400 hover:underline font-semibold"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-850">
                      {notifications.length === 0 ? (
                        <p className="text-center text-slate-500 py-6 italic">No activity updates.</p>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n._id}
                            onClick={() => markNotificationAsRead(n._id)}
                            className={`p-3 cursor-pointer transition-colors ${
                              n.isRead ? 'bg-slate-900/40 text-slate-400' : 'bg-indigo-950/10 text-slate-200 border-l-2 border-indigo-500'
                            }`}
                          >
                            <p className="text-[11px] leading-relaxed">{n.message}</p>
                            <span className="text-[9px] text-slate-500 block mt-1">
                              {new Date(n.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Dynamic Route viewport container */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-950">
          {isMobileBlocked ? (
            /* EMERGENCY ACCESS BLOCK FOR MOBILE OUTSIDE ALLOWED IST SLOT */
            <div className="min-h-[70vh] flex items-center justify-center p-4">
              <div className="glass-premium rounded-3xl p-10 text-center border border-rose-500/15 max-w-lg space-y-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mb-1">
                  <Shield size={32} />
                </div>
                <h2 className="text-2xl font-bold Outfit text-rose-400 uppercase tracking-wide">Mobile Access Intercepted</h2>
                <p className="text-sm text-slate-400 leading-relaxed">
                  As per search focus safety rules, mobile device client access is permitted strictly between **10:00 AM and 1:00 PM IST**.
                </p>
                <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl text-xs space-y-2 text-left max-w-sm mx-auto font-mono text-indigo-300">
                  <p className="flex justify-between"><span>Simulated Device:</span> <span className="font-bold text-pink-400">Mobile</span></p>
                  <p className="flex justify-between"><span>Simulated IST hour:</span> <span className="font-bold text-slate-100">{istTime.hours} IST</span></p>
                  <p className="flex justify-between"><span>Permitted slot:</span> <span className="font-bold text-emerald-400">10 AM - 1 PM IST</span></p>
                </div>
                <p className="text-xs text-slate-500 italic">
                  💡 Tip: Swap simulated device back to "Workstation" or "MacBook" inside the Rules Simulator panel to bypass this guard!
                </p>
              </div>
            </div>
          ) : (
            /* RENDER ACTIVE PAGE */
            renderTabContent()
          )}
        </main>
      </div>

      {/* 3. VERIFICATION MODAL FOR FRENCH LANGUAGE CHANGE */}
      <AnimatePresence>
        {frenchModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-700/80 p-6 rounded-3xl max-w-md w-full shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="font-bold Outfit text-base uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                  <Globe size={18} />
                  Sécurité - French Language Switch
                </h3>
                <button
                  onClick={() => setFrenchModalOpen(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {frenchError && (
                <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl text-xs text-rose-400">
                  {frenchError}
                </div>
              )}

              {frenchSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl text-xs text-emerald-400">
                  {frenchSuccess}
                </div>
              )}

              {frenchEmailPreview && (
                <div className="bg-indigo-950/40 border border-indigo-900 p-3 rounded-xl text-center">
                  <p className="text-[11px] text-slate-400 mb-1.5 font-medium">
                    📬 SMTP Ethereal Local Sandbox Alert: French OTP security email dispatched!
                  </p>
                  <a
                    href={frenchEmailPreview}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-bold hover:underline"
                  >
                    Open Mock Mailroom Box
                    <ExternalLink size={11} />
                  </a>
                </div>
              )}

              <form onSubmit={handleVerifyFrenchOtp} className="space-y-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-semibold mb-1 block uppercase tracking-wider">
                    Enter the 6-Digit French Switch OTP
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={frenchOtp}
                    onChange={(e) => setFrenchOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center tracking-[1em] text-sm font-mono bg-slate-950/60 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-indigo-300 focus:outline-none"
                    placeholder="000000"
                  />
                </div>

                <button
                  type="submit"
                  disabled={frenchLoading || frenchOtp.length < 6}
                  className="w-full btn-premium py-3 text-xs font-semibold uppercase tracking-wider text-white flex items-center justify-center gap-2"
                >
                  {frenchLoading ? <Loader2 className="animate-spin" size={14} /> : 'Verify Code & Apply French'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. FLOATING DEV SIMULATOR PANEL */}
      <DeveloperPanel />

    </div>
  );
};

export default App;
