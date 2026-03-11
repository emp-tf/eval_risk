import { useState } from 'react';
import { useRouter } from 'next/router';

export default function UpgradeModal({ isOpen, onClose, reason = 'reports' }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (!isOpen) return null;

  const handleSubscribe = async (plan) => {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Unable to start checkout. Please try again.');
      }
    } catch (e) {
      alert('Checkout error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 sm:p-8 w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-brand-600/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-brand-400 text-sm font-semibold uppercase tracking-wide">Upgrade to Pro</span>
            </div>
            <h2 className="text-2xl font-bold text-white">
              {reason === 'download' ? 'PDF Download is a Pro Feature' : 'You\'ve Hit Your Free Limit'}
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              {reason === 'download'
                ? 'Upgrade to download full PDF risk reports for all your properties.'
                : 'Free tier includes 3 risk assessments. Upgrade for unlimited reports.'}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors ml-4">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Monthly */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-1">Monthly</p>
            <p className="text-2xl font-bold text-white mb-0.5">$29</p>
            <p className="text-slate-500 text-xs mb-4">per month</p>
            <ul className="space-y-1.5 mb-4">
              {['Unlimited reports', 'PDF downloads', 'All risk categories', 'Priority support'].map(f => (
                <li key={f} className="flex items-center gap-2 text-slate-300 text-xs">
                  <svg className="w-3.5 h-3.5 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleSubscribe('monthly')}
              disabled={loading}
              className="w-full btn-secondary text-sm py-2"
            >
              {loading ? 'Loading...' : 'Subscribe Monthly'}
            </button>
          </div>

          {/* Annual */}
          <div className="bg-brand-900/30 border border-brand-500/40 rounded-xl p-4 relative">
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
              <span className="bg-brand-600 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">Best Value</span>
            </div>
            <p className="text-brand-400 text-xs font-medium uppercase tracking-wide mb-1">Annual</p>
            <p className="text-2xl font-bold text-white mb-0.5">$249</p>
            <p className="text-slate-500 text-xs mb-4">per year <span className="text-green-400">save 28%</span></p>
            <ul className="space-y-1.5 mb-4">
              {['Unlimited reports', 'PDF downloads', 'All risk categories', 'Priority support'].map(f => (
                <li key={f} className="flex items-center gap-2 text-slate-300 text-xs">
                  <svg className="w-3.5 h-3.5 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleSubscribe('annual')}
              disabled={loading}
              className="w-full btn-primary text-sm py-2"
            >
              {loading ? 'Loading...' : 'Subscribe Annually'}
            </button>
          </div>
        </div>

        {/* Free tier reminder */}
        <div className="bg-slate-800/50 rounded-xl p-3 text-center">
          <p className="text-slate-500 text-xs">
            Free tier: 3 risk reports, view-only. No credit card required to start.
          </p>
        </div>
      </div>
    </div>
  );
}
