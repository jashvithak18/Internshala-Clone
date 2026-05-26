import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useTranslation } from 'react-i18next';
import {
  CreditCard,
  ShieldCheck,
  CheckCircle,
  FileText,
  Clock,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Award
} from 'lucide-react';
import confetti from 'canvas-confetti';

const Billing = () => {
  const { user, apiCall, refreshProfile, istTime } = useAppContext();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [invoiceHistory, setInvoiceHistory] = useState([]);
  const [emailPreviewUrl, setEmailPreviewUrl] = useState('');

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  const fetchPaymentHistory = async () => {
    try {
      const res = await apiCall('GET', '/api/payments/history');
      setInvoiceHistory(res.data);
    } catch (err) {
      console.error('Fetch payment history error:', err.message);
    }
  };

  const handleSubscribe = async (planName) => {
    setError('');
    setSuccess('');
    setLoading(true);
    setEmailPreviewUrl('');

    try {
      const res = await apiCall('POST', '/api/payments/subscribe', { planName });
      setSuccess(`Congratulations! You have successfully upgraded to the ${planName}.`);
      if (res.data.previewUrl) {
        setEmailPreviewUrl(res.data.previewUrl);
      }
      refreshProfile();
      fetchPaymentHistory();
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#008BDC', '#10b981', '#f59e0b']
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Transaction processing failed.');
    } finally {
      setLoading(false);
    }
  };

  // Pricing plans definition
  const plans = [
    {
      name: 'Free Plan',
      price: '₹0',
      duration: 'month',
      applications: '1 internship / month',
      features: [
        'Standard dashboard access',
        'Basic resume templates',
        'Standard support'
      ],
      color: 'border-slate-200 bg-white hover:border-slate-350 shadow-sm'
    },
    {
      name: 'Bronze Plan',
      price: '₹100',
      duration: 'month',
      applications: '3 internships / month',
      features: [
        'Expanded applications quota',
        'Access to community post space',
        'Save professional resume templates',
        'Priority screening notifications'
      ],
      color: 'border-brand-200 bg-brand-50/20 hover:border-brand-500/50 shadow-sm shadow-brand-500/5'
    },
    {
      name: 'Silver Plan',
      price: '₹300',
      duration: 'month',
      applications: '5 internships / month',
      features: [
        '5 premium applications quota',
        'Access to community post space',
        'Save & edit premium resume templates',
        'Priority screening notifications',
        'Recruiter analytics'
      ],
      color: 'border-purple-200 bg-purple-50/20 hover:border-purple-500/50 shadow-sm shadow-purple-500/5'
    },
    {
      name: 'Gold Plan',
      price: '₹1000',
      duration: 'month',
      applications: 'Unlimited applications',
      features: [
        'Unlimited internships quota',
        'Full premium resume generation suite',
        'Full community posting access',
        'Direct connection to employers',
        'Featured student banner listing'
      ],
      color: 'border-amber-200 bg-amber-50/20 hover:border-amber-500/50 shadow-sm shadow-amber-500/5'
    }
  ];

  // Payments hour assessment: strictly between 10:00 AM and 11:00 AM IST
  const isPaymentHour = istTime.hours === 10;

  return (
    <div className="space-y-8 page-transition" id="billing">
      <div>
        <h1 className="text-3xl font-extrabold Outfit text-slate-800 uppercase tracking-widest flex items-center gap-2">
          <CreditCard size={26} className="text-brand-500" />
          {t('subscription_plans')}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Select a multi-tier internship plan that fits your career search acceleration goals.
        </p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl text-xs text-rose-600">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl text-xs text-emerald-600">
          {success}
        </div>
      )}

      {emailPreviewUrl && (
        <div className="bg-brand-50 border border-brand-200 p-4 rounded-2xl text-center">
          <p className="text-xs text-slate-600 mb-2 font-medium">
            📬 SMTP Ethereal Local Sandbox Alert: Invoice email generated successfully!
          </p>
          <a
            href={emailPreviewUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs bg-brand-500 hover:bg-brand-600 text-white font-bold px-4 py-2 rounded-lg transition-colors shadow"
          >
            Open Mock Ethereal Invoice
            <ExternalLink size={12} />
          </a>
        </div>
      )}

      {/* Current plan banner */}
      <div className="glass-premium rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 text-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-500 shadow-sm">
            <Award size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">{t('current_plan')}</p>
            <h3 className="text-xl font-bold text-slate-800 mt-0.5">{user?.activePlan?.planName || 'Free Plan'}</h3>
            <p className="text-[10px] text-brand-500 mt-1 font-semibold">
              Applications: {user?.activePlan?.applicationsUsedThisMonth || 0} / {user?.activePlan?.maxApplications === 9999 ? 'Unlimited' : user?.activePlan?.maxApplications || 1} used
            </p>
          </div>
        </div>

        <div className="text-left md:text-right">
          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Account Premium Status</p>
          <span className={`inline-flex items-center gap-1 text-xs font-bold mt-1 px-3 py-1 rounded-full ${
            user?.isPremium
              ? 'bg-emerald-550 border border-emerald-100 text-emerald-600'
              : 'bg-slate-100 text-slate-400 border border-slate-200'
          }`}>
            <ShieldCheck size={14} />
            {user?.isPremium ? 'PRO UNLOCKED' : 'FREE BASIC'}
          </span>
        </div>
      </div>

      {/* Strict payment IST hours check warnings */}
      {!isPaymentHour && (
        <div className="bg-rose-50 border border-rose-100 p-5 rounded-3xl flex items-start gap-3.5 text-rose-650">
          <AlertTriangle className="shrink-0 mt-0.5 text-rose-500" size={20} />
          <div className="text-xs space-y-1">
            <span className="font-bold uppercase tracking-wider block">Payments Gate is Closed</span>
            <p>
              To maintain system compliance, all payment processes are locked except between **10:00 AM and 11:00 AM IST**.
            </p>
            <p className="text-rose-600/90 font-mono mt-1 text-[11px] flex items-center gap-1">
              <Clock size={12} />
              Current IST Simulated Time Hour: {istTime.hours} (Allowed hours: 10 AM - 11 AM IST).
            </p>
          </div>
        </div>
      )}

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((p, idx) => {
          const isCurrent = user?.activePlan?.planName === p.name;
          const isFree = p.name === 'Free Plan';
          return (
            <div
              key={idx}
              className={`glass-card rounded-3xl p-6 flex flex-col justify-between border transition-all duration-300 ${p.color}`}
            >
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-bold Outfit text-slate-800">{p.name}</h4>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-3xl font-extrabold Outfit text-slate-900">{p.price}</span>
                    <span className="text-xs text-slate-450">/ {p.duration}</span>
                  </div>
                  <p className="text-[11px] text-brand-500 font-semibold mt-2.5 bg-brand-50 px-2 py-0.5 rounded border border-brand-200 inline-block">
                    {p.applications}
                  </p>
                </div>

                <hr className="border-slate-200" />

                <ul className="space-y-2.5 text-xs text-slate-600">
                  {p.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle size={14} className="text-brand-500 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 pt-4">
                {isCurrent ? (
                  <div className="w-full text-center bg-brand-50 text-brand-500 border border-brand-200 py-3 rounded-xl text-xs font-bold uppercase tracking-wider">
                    Your Active Plan
                  </div>
                ) : isFree ? (
                  <div className="w-full text-center bg-slate-100 text-slate-400 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider">
                    Included by Default
                  </div>
                ) : (
                  <button
                    onClick={() => handleSubscribe(p.name)}
                    disabled={loading || !isPaymentHour}
                    className={`w-full py-3 text-xs font-bold uppercase tracking-wider text-white flex items-center justify-center gap-1.5 ${
                      !isPaymentHour
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none'
                        : 'btn-premium'
                    }`}
                  >
                    {loading ? <Loader2 className="animate-spin" size={14} /> : <span>{t('buy_now')}</span>}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Invoice payment history log lists */}
      <div className="glass-card rounded-3xl p-6">
        <h3 className="text-base font-bold Outfit text-brand-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <FileText size={18} />
          Receipts & Transaction History
        </h3>

        {invoiceHistory.length === 0 ? (
          <div className="text-center text-slate-500 text-xs py-8">
            No transactions found on this account.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Invoice No</th>
                  <th className="py-3 px-4">Selected Plan</th>
                  <th className="py-3 px-4">Transaction ID</th>
                  <th className="py-3 px-4">Price Paid</th>
                  <th className="py-3 px-4">Receipt Date</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {invoiceHistory.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50 transition-colors text-slate-600">
                    <td className="py-3.5 px-4 font-bold text-slate-800">{inv.invoiceNumber}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">{inv.planName}</td>
                    <td className="py-3.5 px-4 font-mono text-[10px] text-brand-500">{inv.paymentId}</td>
                    <td className="py-3.5 px-4 font-bold">₹{inv.amount}</td>
                    <td className="py-3.5 px-4">{new Date(inv.createdAt).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4">
                      <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase">
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Billing;
