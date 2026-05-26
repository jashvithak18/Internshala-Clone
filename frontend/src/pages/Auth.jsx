import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useTranslation } from 'react-i18next';
import { Mail, Phone, Lock, User, Briefcase, GraduationCap, ShieldAlert, Key, Loader2, ExternalLink, HelpCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

const Auth = () => {
  const { login, apiCall, istTime } = useAppContext();
  const { t } = useTranslation();

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form values
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'student'
  });

  // Chrome OTP flow state
  const [otpPending, setOtpPending] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpEmail, setOtpEmail] = useState('');

  // Forgot password flow state
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetSuccessMsg, setResetSuccessMsg] = useState('');
  const [resetEtherealLink, setResetEtherealLink] = useState('');

  // Local helper alerts
  const [authSuccessPreviewUrl, setAuthSuccessPreviewUrl] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Submit Register or Login
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setAuthSuccessPreviewUrl('');

    try {
      if (isLogin) {
        // Run API Login
        const res = await apiCall('POST', '/api/auth/login', {
          email: formData.email,
          password: formData.password
        });

        if (res.data.status === 'OTP_PENDING') {
          // Chrome Browser OTP requested!
          setOtpPending(true);
          setOtpEmail(res.data.email);
          setError('');
          if (res.data.previewUrl) {
            setAuthSuccessPreviewUrl(res.data.previewUrl);
          }
          confetti({ particleCount: 40, spread: 60, colors: ['#f59e0b', '#d97706'] });
        } else {
          // Standard login successful
          login(res.data);
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
      } else {
        // Run API Register
        const res = await apiCall('POST', '/api/auth/register', formData);
        login(res.data);
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Verify Chrome OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiCall('POST', '/api/auth/verify-chrome-otp', {
        email: otpEmail,
        otp: otpValue
      });

      login(res.data);
      setOtpPending(false);
      confetti({ particleCount: 150, spread: 80, colors: ['#6366f1', '#4f46e5', '#34d399'] });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid verification OTP code');
    } finally {
      setLoading(false);
    }
  };

  // Trigger Forgot Password Reset
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setResetSuccessMsg('');
    setResetEtherealLink('');
    setLoading(true);

    try {
      const res = await apiCall('POST', '/api/auth/forgot-password', {
        identifier: resetIdentifier
      });

      setResetSuccessMsg(res.data.message);
      if (res.data.previewUrl) {
        setResetEtherealLink(res.data.previewUrl);
      }
      setResetIdentifier('');
      confetti({ particleCount: 50, spread: 60, colors: ['#34d399', '#059669'] });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit password reset request.');
    } finally {
      setLoading(false);
    }
  };

  // Quick reset helper back to login state
  const resetAllFlows = () => {
    setOtpPending(false);
    setForgotOpen(false);
    setResetSuccessMsg('');
    setResetEtherealLink('');
    setAuthSuccessPreviewUrl('');
    setError('');
  };

  // Rules assessment helpers for the dashboard UI alerts (Authentic User-Agent check!)
  const isMobileDevice = /Mobi|Android|iPhone/i.test(navigator.userAgent);
  const isMobileLocked = isMobileDevice && (istTime.hours < 10 || istTime.hours >= 13);

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 page-transition">
      <div className="w-full max-w-lg">
        {/* Brand Banner */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 mb-4 shadow-lg shadow-indigo-500/5">
            <GraduationCap size={36} />
          </div>
          <h1 className="text-4xl font-extrabold Outfit text-slate-100 tracking-tight leading-none mb-2">
            Elevance <span className="text-indigo-400 font-medium">Internshala</span>
          </h1>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">
            {t('tagline')}
          </p>
        </div>

        {/* Device Locked Warning */}
        {isMobileLocked && (
          <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl mb-6 flex items-start gap-3 text-rose-300">
            <ShieldAlert className="shrink-0 mt-0.5" size={18} />
            <div className="text-xs">
              <span className="font-bold uppercase tracking-wider block mb-1">Mobile Access Locked</span>
              Mobile device access is allowed only between 10:00 AM and 1:00 PM IST. Please switch to Desktop or adjust your simulated time in the Sandbox.
            </div>
          </div>
        )}

        {/* Main Card */}
        <div className="glass-card rounded-3xl p-8 relative overflow-hidden">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl mb-6 text-xs text-rose-400 flex items-center gap-2">
              <ShieldAlert size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* CHROME OTP VERIFICATION WINDOW */}
          {otpPending ? (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-3">
                  <Key size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-100 mb-1">{t('verification')}</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  {t('enter_otp')} (<strong className="text-indigo-300">{otpEmail}</strong>)
                </p>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold mb-2 block uppercase tracking-wider">
                  6-Digit OTP Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpValue}
                  onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center tracking-[1em] text-lg font-mono bg-slate-950/50 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-indigo-300 focus:outline-none"
                  placeholder="000000"
                />
              </div>

              {authSuccessPreviewUrl && (
                <div className="bg-indigo-950/40 border border-indigo-900 p-3 rounded-xl text-center">
                  <p className="text-[11px] text-slate-400 mb-2 flex items-center justify-center gap-1">
                    <HelpCircle size={12} className="text-indigo-400" />
                    SMTP Ethereal Sandbox Mode
                  </p>
                  <a
                    href={authSuccessPreviewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-bold hover:underline"
                  >
                    View Mock Email Inbox
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || otpValue.length < 6}
                className="w-full btn-premium py-3.5 text-sm font-semibold flex items-center justify-center gap-2 text-white"
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : t('verify')}
              </button>

              <button
                type="button"
                onClick={resetAllFlows}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Back to Credentials Login
              </button>
            </form>
          ) : forgotOpen ? (
            /* FORGOT PASSWORD AUDITS WINDOW */
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-3">
                  <Key size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-100 mb-1">{t('forgot_password')}</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Provide your registered email address or phone number to securely generate an alphabetical-only password.
                </p>
              </div>

              {resetSuccessMsg ? (
                <div className="space-y-4">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-xs text-emerald-400">
                    {resetSuccessMsg}
                  </div>
                  {resetEtherealLink && (
                    <div className="bg-indigo-950/50 border border-indigo-900 p-4 rounded-xl text-center">
                      <p className="text-[11px] text-slate-400 mb-2 font-medium">
                        🔑 Local Test Sandbox: Click below to view the secure alphabetical password in your mock email inbox!
                      </p>
                      <a
                        href={resetEtherealLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-lg shadow transition-colors"
                      >
                        Open Mock Mailbox
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={resetAllFlows}
                    className="w-full btn-premium py-3 text-xs text-white"
                  >
                    Return to Login
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-500 font-semibold mb-2 block uppercase tracking-wider">
                      Email or Phone Number
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="text"
                        required
                        value={resetIdentifier}
                        onChange={(e) => setResetIdentifier(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-brand-500 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none text-slate-800"
                        placeholder="email@domain.com or +91999..."
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !resetIdentifier}
                    className="w-full btn-premium py-3.5 text-sm font-semibold flex items-center justify-center gap-2 text-white"
                  >
                    {loading ? <Loader2 className="animate-spin" size={16} /> : t('submit')}
                  </button>

                  <button
                    type="button"
                    onClick={resetAllFlows}
                    className="w-full text-center text-xs text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    Back to Login
                  </button>
                </div>
              )}
            </form>
          ) : (
            /* STANDARD CREDENTIALS FORM */
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Tab Selector */}
              <div className="flex bg-slate-950/60 p-1.5 rounded-2xl border border-slate-800 mb-2">
                <button
                  type="button"
                  onClick={() => { setIsLogin(true); setError(''); }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                    isLogin ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t('login')}
                </button>
                <button
                  type="button"
                  onClick={() => { setIsLogin(false); setError(''); }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                    !isLogin ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t('register')}
                </button>
              </div>

              {!isLogin && (
                <div>
                  <label className="text-xs text-slate-400 font-semibold mb-1.5 block uppercase tracking-wider">
                    {t('full_name')}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full bg-slate-950/50 border border-slate-800 focus:border-indigo-500 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none"
                      placeholder="John Doe"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1.5 block uppercase tracking-wider">
                  {t('email')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-slate-950/50 border border-slate-800 focus:border-indigo-500 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none"
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              {!isLogin && (
                <div>
                  <label className="text-xs text-slate-400 font-semibold mb-1.5 block uppercase tracking-wider">
                    {t('phone')}
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                      type="text"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full bg-slate-950/50 border border-slate-800 focus:border-indigo-500 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none"
                      placeholder="+919999999999"
                    />
                  </div>
                </div>
              )}

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs text-slate-400 font-semibold block uppercase tracking-wider">
                    {t('password')}
                  </label>
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => setForgotOpen(true)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                    >
                      {t('forgot_password')}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full bg-slate-950/50 border border-slate-800 focus:border-indigo-500 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {!isLogin && (
                <div>
                  <label className="text-xs text-slate-400 font-semibold mb-1.5 block uppercase tracking-wider">
                    {t('role')}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'student', icon: GraduationCap, label: t('student') },
                      { id: 'employer', icon: Briefcase, label: t('employer') }
                    ].map((r) => {
                      const Icon = r.icon;
                      const active = formData.role === r.id;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, role: r.id })}
                          className={`flex items-center gap-2 justify-center p-3 rounded-xl border text-xs font-semibold uppercase tracking-wider transition-all ${
                            active
                              ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                              : 'bg-slate-950/40 border-slate-850 hover:bg-slate-800 text-slate-400'
                          }`}
                        >
                          <Icon size={16} />
                          {r.id === 'student' ? 'Student' : 'Employer'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || isMobileLocked}
                className={`w-full py-3.5 text-sm font-semibold flex items-center justify-center gap-2 text-white ${
                  isMobileLocked
                    ? 'bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed shadow-none'
                    : 'btn-premium'
                }`}
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : isLogin ? t('login') : t('register')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
