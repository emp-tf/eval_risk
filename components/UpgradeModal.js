/**
 * Shown when free-tier limits are hit (report count or PDF download).
 * Stripe/checkout removed — paid plans can be wired back later.
 */
export default function UpgradeModal({ isOpen, onClose, reason = 'reports' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 sm:p-8 w-full max-w-lg shadow-2xl">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-brand-600/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-brand-400 text-sm font-semibold uppercase tracking-wide">Limit reached</span>
            </div>
            <h2 className="text-2xl font-bold text-white">
              {reason === 'download' ? 'PDF download limit' : 'Free tier limit'}
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              {reason === 'download'
                ? 'PDF export is not available on the free tier for this demo.'
                : 'Free tier includes a limited number of risk assessments. Contact us to unlock more.'}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors ml-4">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-4 text-center mb-4">
          <p className="text-slate-400 text-sm">
            Paid upgrades are not configured in this build. Use the dashboard to manage existing properties.
          </p>
        </div>

        <button type="button" onClick={onClose} className="w-full btn-primary py-3">
          Back
        </button>
      </div>
    </div>
  );
}
