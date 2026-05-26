import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  User,
  GraduationCap,
  Briefcase,
  Wrench,
  Download,
  ShieldCheck,
  CreditCard,
  Mail,
  Loader2,
  ExternalLink,
  Plus,
  Trash2,
  Lock,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

const ResumeBuilder = () => {
  const { user, apiCall, istTime, refreshProfile } = useAppContext();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Core resume state
  const [resumeData, setResumeData] = useState({
    name: '',
    personalDetails: {
      email: '',
      phone: '',
      address: '',
      summary: ''
    },
    qualifications: [],
    experience: [],
    skills: [],
    profilePhoto: ''
  });

  // Dynamic input support
  const [qualificationInput, setQualificationInput] = useState({ school: '', degree: '', year: '' });
  const [experienceInput, setExperienceInput] = useState({ company: '', role: '', duration: '', description: '' });
  const [skillInput, setSkillInput] = useState('');

  // Payment flow states
  const [hasPaid, setHasPaid] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [emailPreviewUrl, setEmailPreviewUrl] = useState('');

  // Load existing resume and check payment logs on boot
  useEffect(() => {
    loadSavedResume();
    checkPriorPayment();
  }, []);

  const loadSavedResume = async () => {
    try {
      const res = await apiCall('GET', '/api/resume/my-resume');
      if (res.data) {
        setResumeData({
          name: res.data.name || '',
          personalDetails: res.data.personalDetails || { email: '', phone: '', address: '', summary: '' },
          qualifications: res.data.qualifications || [],
          experience: res.data.experience || [],
          skills: res.data.skills || [],
          profilePhoto: res.data.profilePhoto || ''
        });
      }
    } catch (err) {
      console.log('No prior resume created yet');
    }
  };

  const checkPriorPayment = async () => {
    try {
      // Fetch user payments history to see if they've paid ₹50
      const res = await apiCall('GET', '/api/payments/history');
      const paid = res.data.some(p => p.planName === 'Premium Resume Builder' && p.status === 'success');
      setHasPaid(paid);
    } catch (err) {
      console.error(err.message);
    }
  };

  // OTP Verification steps before payment
  const handleRequestOtp = async () => {
    setError('');
    setLoading(true);
    setEmailPreviewUrl('');
    try {
      const res = await apiCall('POST', '/api/resume/send-otp');
      setOtpSent(true);
      if (res.data.previewUrl) {
        setEmailPreviewUrl(res.data.previewUrl);
      }
      setSuccess('Security OTP code sent to your registered email!');
      confetti({ particleCount: 30, colors: ['#a78bfa', '#818cf8'] });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to request OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await apiCall('POST', '/api/resume/verify-otp', { otp: otpValue });
      setOtpVerified(true);
      setSuccess('Security OTP verified successfully! You may now complete the ₹50 checkout.');
      confetti({ particleCount: 40, colors: ['#34d399', '#10b981'] });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // Perform ₹50 Payment (locked between 10-11 AM IST)
  const handlePayment = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    setEmailPreviewUrl('');

    try {
      const res = await apiCall('POST', '/api/resume/pay');
      setHasPaid(true);
      if (res.data.previewUrl) {
        setEmailPreviewUrl(res.data.previewUrl);
      }
      setSuccess('Premium Resume Builder unlocked! Payment of ₹50 successfully verified.');
      refreshProfile();
      confetti({ particleCount: 100, spread: 80, colors: ['#10b981', '#3b82f6', '#f59e0b'] });
    } catch (err) {
      setError(err.response?.data?.message || 'Payment processing failed.');
    } finally {
      setLoading(false);
    }
  };

  // Submit and save resume
  const handleSaveResume = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await apiCall('POST', '/api/resume/generate', resumeData);
      setSuccess('Resume successfully saved to your profile and activated!');
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save resume profile.');
    } finally {
      setLoading(false);
    }
  };

  // Qualifications manager
  const addQualification = () => {
    if (!qualificationInput.school || !qualificationInput.degree) return;
    setResumeData(prev => ({
      ...prev,
      qualifications: [...prev.qualifications, qualificationInput]
    }));
    setQualificationInput({ school: '', degree: '', year: '' });
  };

  const removeQualification = (idx) => {
    setResumeData(prev => ({
      ...prev,
      qualifications: prev.qualifications.filter((_, i) => i !== idx)
    }));
  };

  // Experiences manager
  const addExperience = () => {
    if (!experienceInput.company || !experienceInput.role) return;
    setResumeData(prev => ({
      ...prev,
      experience: [...prev.experience, experienceInput]
    }));
    setExperienceInput({ company: '', role: '', duration: '', description: '' });
  };

  const removeExperience = (idx) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== idx)
    }));
  };

  // Skills tags manager
  const addSkill = (e) => {
    e.preventDefault();
    if (!skillInput.trim()) return;
    setResumeData(prev => ({
      ...prev,
      skills: [...new Set([...prev.skills, skillInput.trim()])]
    }));
    setSkillInput('');
  };

  const removeSkill = (sk) => {
    setResumeData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== sk)
    }));
  };

  // Print PDF Trigger
  const triggerPrint = () => {
    const printContent = document.getElementById('printable-resume').innerHTML;
    const originalContent = document.body.innerHTML;
    
    // Set standard white resume document style for print popup
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Resume - ${resumeData.name || 'Student'}</title>
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Inter', sans-serif; background: #ffffff; color: #1e293b; padding: 40px; margin: 0; line-height: 1.6; }
            h1, h2, h3 { font-family: 'Outfit', sans-serif; color: #0f172a; margin: 0; }
            .header-layout { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #6366f1; padding-bottom: 20px; margin-bottom: 30px; }
            .skills-wrap { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
            .skill-badge { background: #f1f5f9; border: 1px solid #e2e8f0; color: #475569; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 500; }
            .section-title { font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #4f46e5; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 15px; margin-top: 25px; }
            .grid-qual { margin-bottom: 12px; }
            .qual-header { display: flex; justify-content: space-between; font-weight: 600; font-size: 14px; }
            .qual-meta { font-size: 12px; color: #64748b; }
            .photo-wrap { width: 90px; height: 90px; border-radius: 12px; overflow: hidden; background: #f1f5f9; }
            .photo-wrap img { width: 100%; height: 100%; object-cover: cover; }
            @media print {
              body { padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          ${printContent}
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Rule verification
  const isPremiumUser = user?.isPremium || false;
  const isPaymentWindow = istTime.hours === 10;

  return (
    <div className="space-y-6 page-transition">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold Outfit text-slate-100 uppercase tracking-widest flex items-center gap-2">
            <FileText size={26} className="text-indigo-400" />
            {t('resume_builder')}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Build a professional PDF document optimized for recruiter application systems.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl text-xs text-rose-400">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl text-xs text-emerald-400">
          {success}
        </div>
      )}

      {emailPreviewUrl && (
        <div className="bg-indigo-950/40 border border-indigo-900 p-4 rounded-2xl text-center">
          <p className="text-xs text-slate-350 mb-2 font-medium">
            📬 SMTP Ethereal Local Sandbox Alert: Secure transaction invoice / OTP email has been generated!
          </p>
          <a
            href={emailPreviewUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-lg transition-colors shadow"
          >
            Check Mock Ethereal Mail
            <ExternalLink size={12} />
          </a>
        </div>
      )}

      {/* VERIFY / UNLOCKED CAP CHECK */}
      {!isPremiumUser ? (
        /* LOCK SCREEN FOR NON-PREMIUM USERS */
        <div className="glass-premium rounded-3xl p-12 text-center border border-indigo-500/10 max-w-xl mx-auto space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-2">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-bold Outfit text-slate-100">Premium Feature Locked</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            The professional Resume Builder is reserved exclusively for premium subscribers. Please buy our Bronze, Silver, or Gold internship plans to unlock premium tools!
          </p>
          <div className="pt-2">
            <a
              href="#billing"
              className="inline-flex items-center gap-2 btn-premium text-white px-8 py-3.5 text-xs font-semibold uppercase tracking-wider rounded-xl"
            >
              Go to Subscription Plans
            </a>
          </div>
        </div>
      ) : !hasPaid ? (
        /* OTP & ₹50 CHECKOUT FOR PREMIUM USERS */
        <div className="glass-premium rounded-3xl p-10 text-center border border-indigo-500/15 max-w-2xl mx-auto space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-2">
            <Sparkles size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-bold Outfit text-slate-100">Unlock Resume Builder Workspace</h2>
            <p className="text-xs text-indigo-300 font-semibold uppercase tracking-wider mt-1.5">
              Premium Rate: ₹50 per generation
            </p>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
            To generate and reuse the professional PDF template, please complete our security OTP check and the subsequent ₹50 payment.
          </p>

          <hr className="border-slate-800 max-w-md mx-auto" />

          {/* Verification / Checkout Workflow */}
          <div className="max-w-md mx-auto">
            {!otpSent ? (
              <button
                onClick={handleRequestOtp}
                disabled={loading}
                className="w-full btn-premium py-3.5 text-xs font-semibold uppercase tracking-wider text-white flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : 'Request Security OTP code'}
              </button>
            ) : !otpVerified ? (
              <form onSubmit={handleVerifyOtp} className="space-y-4 text-left">
                <div>
                  <label className="text-[10px] text-slate-400 font-semibold mb-1 block uppercase tracking-wider">
                    Enter OTP sent to registered email
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpValue}
                    onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center tracking-[1em] text-sm font-mono bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-indigo-300 focus:outline-none"
                    placeholder="000000"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || otpValue.length < 6}
                  className="w-full btn-premium py-3 text-xs font-semibold uppercase tracking-wider text-white flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={14} /> : 'Verify Code'}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl text-xs text-emerald-400 flex items-start gap-2">
                  <ShieldCheck className="shrink-0 mt-0.5" size={16} />
                  <span>Security OTP Code verified. You may proceed to payment gateway.</span>
                </div>

                {!isPaymentWindow ? (
                  <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl text-xs text-rose-400 text-left">
                    <span className="font-bold uppercase block mb-1">Payment gateway is closed</span>
                    As per safety protocols, billing checkouts are strictly allowed only between <strong>10:00 AM and 11:00 AM IST</strong>. Current IST time hour is {istTime.hours}. Please try during the allowed hour or update the time in your Simulator.
                  </div>
                ) : null}

                <button
                  onClick={handlePayment}
                  disabled={loading || !isPaymentWindow}
                  className={`w-full py-3.5 text-xs font-semibold uppercase tracking-wider text-white flex items-center justify-center gap-2 ${
                    !isPaymentWindow
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700 shadow-none'
                      : 'btn-premium'
                  }`}
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : <span className="flex items-center gap-1.5"><CreditCard size={14} /> Complete ₹50 Payment</span>}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* FULL RESUME BUILDER WORKSPACE CONTENT */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT: Editor Forms */}
          <div className="glass-card rounded-3xl p-6 space-y-6">
            <h3 className="text-base font-bold Outfit text-indigo-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={18} />
              Resume Editor Panel
            </h3>

            <form onSubmit={handleSaveResume} className="space-y-6">
              {/* Profile details */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <User size={14} />
                  {t('personal_details')}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-slate-400 font-semibold mb-1 block uppercase tracking-wider">Candidate Name</label>
                    <input
                      type="text"
                      required
                      value={resumeData.name}
                      onChange={(e) => setResumeData({ ...resumeData, name: e.target.value })}
                      className="w-full text-xs bg-slate-950/40 border border-slate-800 rounded-xl px-3 py-2.5 focus:border-indigo-500 focus:outline-none"
                      placeholder="Your Name"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-semibold mb-1 block uppercase tracking-wider">Avatar Photo link</label>
                    <input
                      type="text"
                      value={resumeData.profilePhoto}
                      onChange={(e) => setResumeData({ ...resumeData, profilePhoto: e.target.value })}
                      className="w-full text-xs bg-slate-950/40 border border-slate-800 rounded-xl px-3 py-2.5 focus:border-indigo-500 focus:outline-none"
                      placeholder="https://images.unsplash.com/... or base64"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-semibold mb-1 block uppercase tracking-wider">Contact Email</label>
                    <input
                      type="email"
                      required
                      value={resumeData.personalDetails.email}
                      onChange={(e) => setResumeData({
                        ...resumeData,
                        personalDetails: { ...resumeData.personalDetails, email: e.target.value }
                      })}
                      className="w-full text-xs bg-slate-950/40 border border-slate-800 rounded-xl px-3 py-2.5 focus:border-indigo-500 focus:outline-none"
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-semibold mb-1 block uppercase tracking-wider">Contact Phone</label>
                    <input
                      type="text"
                      required
                      value={resumeData.personalDetails.phone}
                      onChange={(e) => setResumeData({
                        ...resumeData,
                        personalDetails: { ...resumeData.personalDetails, phone: e.target.value }
                      })}
                      className="w-full text-xs bg-slate-950/40 border border-slate-800 rounded-xl px-3 py-2.5 focus:border-indigo-500 focus:outline-none"
                      placeholder="+91..."
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-semibold mb-1 block uppercase tracking-wider">Residential Address</label>
                  <input
                    type="text"
                    value={resumeData.personalDetails.address}
                    onChange={(e) => setResumeData({
                      ...resumeData,
                      personalDetails: { ...resumeData.personalDetails, address: e.target.value }
                    })}
                    className="w-full text-xs bg-slate-950/40 border border-slate-800 rounded-xl px-3 py-2.5 focus:border-indigo-500 focus:outline-none"
                    placeholder="City, State, Country"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-semibold mb-1 block uppercase tracking-wider">Professional Summary</label>
                  <textarea
                    rows={2}
                    value={resumeData.personalDetails.summary}
                    onChange={(e) => setResumeData({
                      ...resumeData,
                      personalDetails: { ...resumeData.personalDetails, summary: e.target.value }
                    })}
                    className="w-full text-xs bg-slate-950/40 border border-slate-800 rounded-xl px-3 py-2 focus:border-indigo-500 focus:outline-none resize-none"
                    placeholder="Ambitious student seeking premium internship positions..."
                  />
                </div>
              </div>

              {/* Qualifications manager */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <GraduationCap size={14} />
                  {t('qualifications')}
                </h4>
                
                <div className="grid grid-cols-3 gap-2 bg-slate-950/30 p-3 rounded-2xl border border-slate-850">
                  <input
                    type="text"
                    value={qualificationInput.school}
                    onChange={(e) => setQualificationInput({ ...qualificationInput, school: e.target.value })}
                    className="bg-slate-950/50 border border-slate-800 rounded-lg p-2 text-xs focus:outline-none"
                    placeholder="School / College"
                  />
                  <input
                    type="text"
                    value={qualificationInput.degree}
                    onChange={(e) => setQualificationInput({ ...qualificationInput, degree: e.target.value })}
                    className="bg-slate-950/50 border border-slate-800 rounded-lg p-2 text-xs focus:outline-none"
                    placeholder="Degree / Stream"
                  />
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={qualificationInput.year}
                      onChange={(e) => setQualificationInput({ ...qualificationInput, year: e.target.value })}
                      className="bg-slate-950/50 border border-slate-800 rounded-lg p-2 text-xs focus:outline-none w-full"
                      placeholder="Year"
                    />
                    <button
                      type="button"
                      onClick={addQualification}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg p-2.5 transition-colors shrink-0"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {resumeData.qualifications.map((q, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-950/20 px-3 py-2 rounded-xl border border-slate-850 text-xs">
                      <div>
                        <span className="font-semibold text-slate-200">{q.degree}</span> - <span>{q.school}</span> ({q.year})
                      </div>
                      <button
                        type="button"
                        onClick={() => removeQualification(idx)}
                        className="text-rose-400 hover:text-rose-300 p-1"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Experiences manager */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Briefcase size={14} />
                  {t('experience')}
                </h4>
                
                <div className="bg-slate-950/30 p-3 rounded-2xl border border-slate-850 space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={experienceInput.company}
                      onChange={(e) => setExperienceInput({ ...experienceInput, company: e.target.value })}
                      className="bg-slate-950/50 border border-slate-800 rounded-lg p-2 text-xs focus:outline-none"
                      placeholder="Company Name"
                    />
                    <input
                      type="text"
                      value={experienceInput.role}
                      onChange={(e) => setExperienceInput({ ...experienceInput, role: e.target.value })}
                      className="bg-slate-950/50 border border-slate-800 rounded-lg p-2 text-xs focus:outline-none"
                      placeholder="Your Job Role"
                    />
                    <input
                      type="text"
                      value={experienceInput.duration}
                      onChange={(e) => setExperienceInput({ ...experienceInput, duration: e.target.value })}
                      className="bg-slate-950/50 border border-slate-800 rounded-lg p-2 text-xs focus:outline-none"
                      placeholder="Duration (e.g. 6 Mos)"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={experienceInput.description}
                      onChange={(e) => setExperienceInput({ ...experienceInput, description: e.target.value })}
                      className="bg-slate-950/50 border border-slate-800 rounded-lg p-2 text-xs focus:outline-none w-full"
                      placeholder="Job description summary"
                    />
                    <button
                      type="button"
                      onClick={addExperience}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg p-2.5 transition-colors shrink-0"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {resumeData.experience.map((exp, idx) => (
                    <div key={idx} className="flex justify-between items-start bg-slate-950/20 px-3 py-2.5 rounded-xl border border-slate-850 text-xs">
                      <div>
                        <div className="font-semibold text-slate-200">{exp.role} at {exp.company} ({exp.duration})</div>
                        <p className="text-[10px] text-slate-400 mt-0.5">{exp.description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeExperience(idx)}
                        className="text-rose-400 hover:text-rose-300 p-1 shrink-0 ml-2"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skills tag manager */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Wrench size={14} />
                  {t('skills')}
                </h4>

                <div className="flex gap-2 bg-slate-950/30 p-3 rounded-2xl border border-slate-850">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    className="bg-slate-950/50 border border-slate-800 rounded-lg p-2 text-xs focus:outline-none w-full"
                    placeholder="Skill Tag (e.g. React.js)"
                  />
                  <button
                    type="button"
                    onClick={addSkill}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg p-2.5 transition-colors shrink-0 font-bold text-xs"
                  >
                    Add Tag
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {resumeData.skills.map((sk, idx) => (
                    <span
                      key={idx}
                      className="bg-slate-950/40 border border-slate-800 text-indigo-300 text-[10px] font-semibold py-1 pl-2.5 pr-1.5 rounded-lg flex items-center gap-1 hover:border-rose-500/40 hover:text-rose-300 transition-all cursor-pointer"
                      onClick={() => removeSkill(sk)}
                    >
                      {sk}
                      <X size={10} />
                    </span>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-4 border-t border-slate-800/80 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-premium py-3 text-xs font-semibold uppercase tracking-wider text-white flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : 'Save Resume Template'}
                </button>
                
                <button
                  type="button"
                  onClick={triggerPrint}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                >
                  <Download size={14} />
                  {t('download_pdf')}
                </button>
              </div>
            </form>
          </div>

          {/* RIGHT: Live print view Preview */}
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-3xl">
              <h3 className="text-xs font-bold Outfit text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles size={14} className="text-indigo-400" />
                {t('resume_preview')}
              </h3>
              <button
                onClick={triggerPrint}
                className="bg-slate-850 hover:bg-slate-800 text-slate-300 p-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors border border-slate-700"
              >
                <Download size={14} />
                <span>Export Print View</span>
              </button>
            </div>

            {/* Printable Frame */}
            <div className="bg-slate-950 p-1 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
              <div
                id="printable-resume"
                className="bg-white text-slate-850 p-8 min-h-[600px] text-xs space-y-6 select-none leading-relaxed shadow-inner"
              >
                {/* Header block */}
                <div className="header-layout">
                  <div className="space-y-1 max-w-[70%]">
                    <h1 className="text-2xl font-extrabold Outfit text-slate-900 tracking-tight leading-none">
                      {resumeData.name || 'Candidate Name'}
                    </h1>
                    <p className="text-[10px] text-indigo-600 font-bold tracking-wide uppercase">
                      Premium Internship Candidate
                    </p>
                    <div className="text-[10px] text-slate-500 font-mono space-y-0.5 pt-1.5">
                      <p>📧 {resumeData.personalDetails.email || 'email@example.com'}</p>
                      <p>📞 {resumeData.personalDetails.phone || '+91 99999 99999'}</p>
                      {resumeData.personalDetails.address && <p>📍 {resumeData.personalDetails.address}</p>}
                    </div>
                  </div>

                  {resumeData.profilePhoto && (
                    <div className="photo-wrap border border-slate-200">
                      <img src={resumeData.profilePhoto} alt="Candidate Avatar" />
                    </div>
                  )}
                </div>

                {/* Professional summary */}
                {resumeData.personalDetails.summary && (
                  <div className="space-y-1">
                    <div className="section-title">Professional Summary</div>
                    <p className="text-slate-650 font-sans italic">
                      {resumeData.personalDetails.summary}
                    </p>
                  </div>
                )}

                {/* Qualifications Section */}
                {resumeData.qualifications.length > 0 && (
                  <div>
                    <div className="section-title">Educational Qualifications</div>
                    <div className="space-y-3">
                      {resumeData.qualifications.map((q, idx) => (
                        <div key={idx} className="grid-qual">
                          <div className="qual-header">
                            <span className="text-slate-900">{q.degree}</span>
                            <span className="text-indigo-600 font-bold">{q.year}</span>
                          </div>
                          <div className="qual-meta">{q.school}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Experience Section */}
                {resumeData.experience.length > 0 && (
                  <div>
                    <div className="section-title">Professional Experience</div>
                    <div className="space-y-4">
                      {resumeData.experience.map((exp, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="qual-header">
                            <span className="text-slate-900">{exp.role}</span>
                            <span className="text-slate-500 font-mono text-[10px]">{exp.duration}</span>
                          </div>
                          <div className="qual-meta font-semibold text-indigo-600">{exp.company}</div>
                          <p className="text-slate-600 text-[11px] font-sans">{exp.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills Section */}
                {resumeData.skills.length > 0 && (
                  <div>
                    <div className="section-title">Technical Skills</div>
                    <div className="skills-wrap">
                      {resumeData.skills.map((sk, idx) => (
                        <span key={idx} className="skill-badge">
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeBuilder;
