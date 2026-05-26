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
    istTime
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
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-600 gap-4 font-sans">
        <Loader2 className="animate-spin text-brand-500" size={48} />
        <p className="text-xs uppercase tracking-widest font-semibold text-slate-500">
          Loading Elevance MERN Systems...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="bg-slate-100 min-h-screen flex flex-col justify-center selection:bg-brand-500 selection:text-white font-sans text-slate-700">
        <Auth />
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
  const isMobileDevice = /Mobi|Android|iPhone/i.test(navigator.userAgent);
  const isMobileBlocked = isMobileDevice && !isMobileAccessHour;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex overflow-hidden">
      
      {/* 1. SIDEBAR NAVIGATION */}
      <aside className={`shrink-0 bg-white border-r border-slate-200 transition-all duration-300 flex flex-col justify-between z-40 ${
        sidebarOpen ? 'w-64' : 'w-20'
      }`}>
        <div className="space-y-6 py-6 px-4">
          {/* Sidebar Brand header */}
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-500 flex items-center justify-center font-bold">
                  🎓
                </div>
                <span className="font-extrabold Outfit text-sm uppercase tracking-wider text-slate-800">
                  Internshala
                </span>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-900 mx-auto transition-colors"
            >
              <Menu size={16} />
            </button>
          </div>

          <hr className="border-slate-100" />

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
                      ? 'bg-brand-500 text-white shadow-md shadow-brand-500/10'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  title={tab.label}
                >
                  <Icon size={16} className={active ? 'text-white' : 'text-slate-400'} />
                  {sidebarOpen && <span className="truncate">{tab.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User logout footer */}
        <div className="p-4 space-y-4">
          {sidebarOpen && (
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 text-brand-500 font-extrabold flex items-center justify-center text-xs shadow">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">{user?.name}</p>
                <p className="text-[9px] text-slate-400 font-mono truncate">{user?.role === 'employer' ? 'Recruiter' : 'Candidate'}</p>
              </div>
            </div>
          )}

          <button
            onClick={logout}
            className="w-full flex items-center gap-3.5 px-4 py-3 text-slate-500 hover:bg-rose-50 hover:text-rose-600 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
          >
            <LogOut size={16} className="text-slate-450" />
            {sidebarOpen && <span>{t('logout')}</span>}
          </button>
        </div>
      </aside>

      {/* 2. MAIN HEADER & ROUTE DRAWER VIEWPORTS */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Unified Header */}
        <header className="shrink-0 bg-white border-b border-slate-200 h-16 px-6 flex items-center justify-between z-30 shadow-sm">
          <div className="flex items-center gap-2">
            <Shield className="text-brand-500" size={16} />
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest hidden md:inline">
              Secure Internship Platform
            </span>
          </div>

          <div className="flex items-center gap-4">
            
            {/* A. Language preference selector */}
            <div className="relative">
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="bg-slate-50 border border-slate-200 hover:bg-slate-100 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <Globe size={13} className="text-brand-500" />
                <span>{langNames[i18n.language] || 'Language'}</span>
              </button>

              <AnimatePresence>
                {langDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-44 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden py-1 z-50 text-xs"
                  >
                    {Object.keys(langNames).map((langCode) => (
                      <button
                        key={langCode}
                        onClick={() => handleLangChange(langCode)}
                        className={`w-full text-left px-4 py-2 hover:bg-slate-50 transition-colors flex items-center justify-between ${
                          i18n.language === langCode ? 'text-brand-500 font-bold' : 'text-slate-700'
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
                className="relative p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-900 transition-all"
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
                    className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-50 text-xs"
                  >
                    <div className="bg-slate-55 p-3 border-b border-slate-200 flex justify-between items-center">
                      <span className="font-bold Outfit text-brand-500 uppercase tracking-wider">Activity Notifications</span>
                      {unreadNotifCount > 0 && (
                        <button
                          onClick={markAllNotificationsAsRead}
                          className="text-[10px] text-brand-500 hover:underline font-semibold"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <p className="text-center text-slate-500 py-6 italic">No activity updates.</p>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n._id}
                            onClick={() => markNotificationAsRead(n._id)}
                            className={`p-3 cursor-pointer transition-colors ${
                              n.isRead ? 'bg-white text-slate-400 hover:bg-slate-50' : 'bg-brand-50/30 text-slate-800 border-l-2 border-brand-500 font-medium hover:bg-brand-50/50'
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
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50">
          {isMobileBlocked ? (
            /* EMERGENCY ACCESS BLOCK FOR MOBILE OUTSIDE ALLOWED IST SLOT */
            <div className="min-h-[70vh] flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-10 text-center border border-rose-200 shadow-lg max-w-lg space-y-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-rose-50 border border-rose-100 text-rose-500 mb-1">
                  <Shield size={32} />
                </div>
                <h2 className="text-2xl font-bold Outfit text-rose-500 uppercase tracking-wide">Mobile Access Intercepted</h2>
                <p className="text-sm text-slate-650 leading-relaxed">
                  As per platform guidelines, mobile device client access is permitted strictly between **10:00 AM and 1:00 PM IST**.
                </p>
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-xs space-y-2 text-left max-w-sm mx-auto font-mono text-slate-700">
                  <p className="flex justify-between"><span>Current Simulated Time:</span> <span className="font-bold text-slate-900">{istTime.hours} IST</span></p>
                  <p className="flex justify-between"><span>Permitted Slot:</span> <span className="font-bold text-brand-500">10:00 AM - 1:00 PM IST</span></p>
                </div>
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
              className="bg-white border border-slate-200 p-6 rounded-3xl max-w-md w-full shadow-2xl space-y-6 text-slate-800"
            >
              <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                <h3 className="font-bold Outfit text-base uppercase tracking-wider text-brand-500 flex items-center gap-1.5">
                  <Globe size={18} />
                  Sécurité - French Language Switch
                </h3>
                <button
                  onClick={() => setFrenchModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {frenchError && (
                <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl text-xs text-rose-600">
                  {frenchError}
                </div>
              )}

              {frenchSuccess && (
                <div className="bg-emerald-550 border border-emerald-100 p-3 rounded-xl text-xs text-emerald-600">
                  {frenchSuccess}
                </div>
              )}

              {frenchEmailPreview && (
                <div className="bg-brand-50/50 border border-brand-100 p-3 rounded-xl text-center">
                  <p className="text-[11px] text-slate-600 mb-1.5 font-medium">
                    📬 SMTP Ethereal Local Sandbox Alert: French OTP security email dispatched!
                  </p>
                  <a
                    href={frenchEmailPreview}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-brand-500 hover:text-brand-600 font-bold hover:underline"
                  >
                    Open Mock Mailroom Box
                    <ExternalLink size={11} />
                  </a>
                </div>
              )}

              <form onSubmit={handleVerifyFrenchOtp} className="space-y-4">
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold mb-1 block uppercase tracking-wider">
                    Enter the 6-Digit French Switch OTP
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={frenchOtp}
                    onChange={(e) => setFrenchOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center tracking-[1em] text-sm font-mono bg-white border border-slate-200 focus:border-brand-500 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none"
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

    </div>
  );
};

export default App;
