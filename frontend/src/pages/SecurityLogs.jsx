import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useTranslation } from 'react-i18next';
import {
  ShieldAlert,
  History,
  Monitor,
  Laptop,
  Smartphone,
  Globe,
  Chrome,
  AlertTriangle,
  Clock,
  Fingerprint
} from 'lucide-react';

const SecurityLogs = () => {
  const { apiCall, istTime, simulatedDevice } = useAppContext();
  const { t } = useTranslation();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await apiCall('GET', '/api/auth/login-history');
      setHistory(res.data);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper to get device icons
  const getDeviceIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'mobile':
        return <Smartphone size={16} className="text-pink-400" />;
      case 'laptop':
        return <Laptop size={16} className="text-indigo-400" />;
      default:
        return <Monitor size={16} className="text-indigo-400" />;
    }
  };

  // Check mobile lock status
  const isMobileAccessHour = istTime.hours >= 10 && istTime.hours < 13;
  const isMobileRestricted = simulatedDevice === 'mobile' && !isMobileAccessHour;

  return (
    <div className="space-y-8 page-transition">
      <div>
        <h1 className="text-3xl font-extrabold Outfit text-slate-100 uppercase tracking-widest flex items-center gap-2">
          <Fingerprint size={26} className="text-indigo-400 animate-pulse" />
          {t('security_dashboard')}
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Monitor your active login sessions, parsed browser engines, operating systems, and time-gated locks.
        </p>
      </div>

      {/* Security Warnings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Warning 1: Chrome OTP */}
        <div className="glass-premium rounded-3xl p-5 border border-indigo-500/10 flex items-start gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-2xl shrink-0">
            <Chrome size={22} className="animate-spin-slow" />
          </div>
          <div className="text-xs space-y-1">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider">{t('chrome_warning')}</h4>
            <p className="text-slate-400">
              When Google Chrome is detected during registration or authorization, the session is gated and dispatches a secondary 6-digit OTP verification code to verify the candidate identity.
            </p>
          </div>
        </div>

        {/* Warning 2: Mobile Time blocks */}
        <div className="glass-premium rounded-3xl p-5 border border-indigo-500/10 flex items-start gap-4">
          <div className={`p-3 border rounded-2xl shrink-0 ${isMobileRestricted ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'}`}>
            <Clock size={22} className={isMobileRestricted ? 'animate-bounce-slow' : ''} />
          </div>
          <div className="text-xs space-y-1">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider">{t('mobile_warning')}</h4>
            <p className="text-slate-400">
              To support focus routines, mobile client access is restricted strictly between **10:00 AM and 1:00 PM IST**. Logging in outside these slots is automatically intercepted and rejected.
            </p>
            {isMobileRestricted && (
              <span className="text-[10px] text-rose-400 font-bold block mt-2 animate-pulse-slow">
                ⚠️ Current simulated time hour ({istTime.hours}) is outside the mobile active hours. Mobile requests will be locked out!
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Login History catalog */}
      <div className="glass-card rounded-3xl p-6">
        <h3 className="text-base font-bold Outfit text-indigo-300 uppercase tracking-wider mb-4 flex items-center gap-2">
          <History size={18} />
          {t('login_history')}
        </h3>

        {loading ? (
          <p className="text-center text-slate-500 text-xs py-8">Auditing logs database...</p>
        ) : history.length === 0 ? (
          <div className="text-center text-slate-500 text-xs py-8">
            No login logs found for your account.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">{t('timestamp')}</th>
                  <th className="py-3 px-4">{t('device')}</th>
                  <th className="py-3 px-4">{t('browser')}</th>
                  <th className="py-3 px-4">{t('os')}</th>
                  <th className="py-3 px-4">{t('ip')}</th>
                  <th className="py-3 px-4">Verification Check</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {history.map((h) => {
                  const isChrome = h.browser?.toLowerCase().includes('chrome');
                  return (
                    <tr key={h._id} className="hover:bg-slate-800/10 transition-colors text-slate-300">
                      <td className="py-3.5 px-4 font-medium text-slate-200">
                        {new Date(h.timestamp).toLocaleDateString()} at {new Date(h.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-3.5 px-4 capitalize font-semibold">
                        <span className="flex items-center gap-1.5">
                          {getDeviceIcon(h.deviceType)}
                          {h.deviceType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">{h.browser}</td>
                      <td className="py-3.5 px-4 font-medium">{h.os}</td>
                      <td className="py-3.5 px-4 font-mono text-indigo-400 text-[10px]">{h.ipAddress}</td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          isChrome
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {isChrome ? 'Chrome OTP Verified' : 'Standard Authorized'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecurityLogs;
