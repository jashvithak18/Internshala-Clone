import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Terminal, Shield, Laptop, Smartphone, Monitor, Clock, AlertTriangle, HelpCircle } from 'lucide-react';

const DeveloperPanel = () => {
  const {
    simulatedDevice,
    setSimulatedDevice,
    simulatedBrowser,
    setSimulatedBrowser,
    simulatedIp,
    setSimulatedIp,
    developerPanelOpen,
    setDeveloperPanelOpen,
    istTime,
    user
  } = useAppContext();

  // Rules assessment helper
  const isPaymentHour = istTime.hours === 10; // 10:00 AM - 11:00 AM IST
  const isMobileAccessHour = istTime.hours >= 10 && istTime.hours < 13; // 10:00 AM - 1:00 PM IST

  if (!developerPanelOpen) {
    return (
      <button
        onClick={() => setDeveloperPanelOpen(true)}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-3 rounded-full shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all text-xs font-semibold uppercase tracking-wider"
      >
        <Terminal size={16} />
        Open Rules Simulator
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-200 transition-all duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-800/50 p-4 border-b border-slate-700/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="text-indigo-400" size={18} />
          <h3 className="font-bold text-sm tracking-wide uppercase text-indigo-200">Sandbox Rule Simulator</h3>
        </div>
        <button
          onClick={() => setDeveloperPanelOpen(false)}
          className="text-slate-400 hover:text-white text-xs font-medium px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
        >
          Hide Panel
        </button>
      </div>

      <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
        {/* Live IST Time */}
        <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="text-indigo-400 animate-pulse" size={16} />
            <span className="text-xs text-slate-400 font-medium">Simulated IST Time:</span>
          </div>
          <span className="font-mono text-sm font-bold text-indigo-300 bg-slate-900 px-2 py-1 rounded border border-slate-800">
            {istTime.formatted || 'Calculating...'}
          </span>
        </div>

        {/* Device selector */}
        <div>
          <label className="text-xs font-semibold text-slate-400 mb-2 block uppercase tracking-wider">
            Device Type (Test Time Locks)
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'desktop', icon: Monitor, label: 'Workstation' },
              { id: 'laptop', icon: Laptop, label: 'MacBook' },
              { id: 'mobile', icon: Smartphone, label: 'iPhone' }
            ].map((d) => {
              const Icon = d.icon;
              const active = simulatedDevice === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => setSimulatedDevice(d.id)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition-all ${
                    active
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-md shadow-indigo-500/5'
                      : 'bg-slate-950/40 border-slate-800 hover:bg-slate-800 text-slate-400'
                  }`}
                >
                  <Icon size={16} className="mb-1" />
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Browser override */}
        <div>
          <label className="text-xs font-semibold text-slate-400 mb-2 block uppercase tracking-wider">
            Browser Agent (Test Chrome OTP)
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'Chrome', label: 'Google Chrome' },
              { id: 'Firefox', label: 'Mozilla Firefox' },
              { id: 'Safari', label: 'Apple Safari' }
            ].map((b) => {
              const active = simulatedBrowser === b.id;
              return (
                <button
                  key={b.id}
                  onClick={() => setSimulatedBrowser(b.id)}
                  className={`p-2 rounded-xl border text-[11px] font-medium transition-all ${
                    active
                      ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                      : 'bg-slate-950/40 border-slate-800 hover:bg-slate-800 text-slate-400'
                  }`}
                >
                  {b.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Simulated IP Address */}
        <div>
          <label className="text-xs font-semibold text-slate-400 mb-1.5 block uppercase tracking-wider">
            Mock IP (Auditing logs)
          </label>
          <input
            type="text"
            value={simulatedIp}
            onChange={(e) => setSimulatedIp(e.target.value)}
            className="w-full text-xs font-mono bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-indigo-300 focus:outline-none focus:border-indigo-500"
            placeholder="e.g. 192.168.1.50"
          />
        </div>

        <hr className="border-slate-800" />

        {/* Rules assessment logs */}
        <div className="space-y-2">
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Shield size={12} className="text-indigo-400" />
            Live Rules Checker
          </h4>

          {/* Rule 1: Chrome OTP */}
          <div className="flex items-start gap-2 bg-slate-950/50 p-2 rounded-lg border border-slate-850">
            <div className={`p-1 rounded mt-0.5 ${simulatedBrowser === 'Chrome' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-500'}`}>
              <HelpCircle size={12} />
            </div>
            <div>
              <p className="text-xs font-semibold">Chrome OTP Challenge Rule</p>
              <p className="text-[10px] text-slate-400">
                {simulatedBrowser === 'Chrome'
                  ? '⚠️ ACTIVE: Logins will require a 6-digit email verification OTP code.'
                  : 'Disabled (Chrome not simulated). Logins will complete instantly.'}
              </p>
            </div>
          </div>

          {/* Rule 2: Mobile Access hours */}
          <div className="flex items-start gap-2 bg-slate-950/50 p-2 rounded-lg border border-slate-850">
            <div className={`p-1 rounded mt-0.5 ${simulatedDevice === 'mobile' ? (isMobileAccessHour ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400') : 'bg-slate-800 text-slate-500'}`}>
              <AlertTriangle size={12} />
            </div>
            <div>
              <p className="text-xs font-semibold">Mobile Login Guard (10 AM - 1 PM)</p>
              <p className="text-[10px] text-slate-400">
                {simulatedDevice === 'mobile'
                  ? (isMobileAccessHour
                    ? `🟢 ALLOWED: Simulated time (${istTime.hours}:${istTime.minutes < 10 ? '0' + istTime.minutes : istTime.minutes} IST) falls inside allowed window.`
                    : `🔴 LOCKED: Simulated time is outside 10:00 AM - 1:00 PM. Mobile access will block!`)
                  : 'Disabled (Desktop/laptop simulated). Full access is allowed.'}
              </p>
            </div>
          </div>

          {/* Rule 3: Payment hour limits */}
          <div className="flex items-start gap-2 bg-slate-950/50 p-2 rounded-lg border border-slate-850">
            <div className={`p-1 rounded mt-0.5 ${isPaymentHour ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
              <Clock size={12} />
            </div>
            <div>
              <p className="text-xs font-semibold">Payment IST Gate (10 AM - 11 AM)</p>
              <p className="text-[10px] text-slate-400">
                {isPaymentHour
                  ? '🟢 OPEN: Payments are currently permitted! Buy premium or generator passes now.'
                  : `🔴 BLOCKED: Payments rejected. Current IST Hour (${istTime.hours}) is outside 10 AM - 11 AM IST.`}
              </p>
            </div>
          </div>

          {/* Rule 4: Posting limits */}
          <div className="flex items-start gap-2 bg-slate-950/50 p-2 rounded-lg border border-slate-850">
            <div className="p-1 rounded mt-0.5 bg-slate-800 text-slate-400">
              <Monitor size={12} />
            </div>
            <div>
              <p className="text-xs font-semibold">Posting Limit Guard (Community)</p>
              <p className="text-[10px] text-slate-400">
                {user
                  ? `Active. Current friends: ${user.friends?.length || 0}. Daily posts used: ${user.postsCountToday || 0}. Limit: ${
                      user.friends?.length === 0
                        ? '0 (cannot post)'
                        : user.friends?.length === 1
                        ? '1 post'
                        : user.friends?.length === 2
                        ? '2 posts'
                        : user.friends?.length <= 10
                        ? `${user.friends?.length} posts`
                        : 'Unlimited'
                    }`
                  : 'Login to view dynamic post caps.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeveloperPanel;
