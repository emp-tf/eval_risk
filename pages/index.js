import Link from 'next/link';
import Head from 'next/head';
import { Toaster } from 'react-hot-toast';

const FEATURES = [
  { icon: '🤖', title: 'AI-Powered Agents', desc: 'Live agents gather real-time data across 8 risk dimensions for each property.' },
  { icon: '🌍', title: 'Pan-African Coverage', desc: 'Assess properties across all African markets, urban and remote.' },
  { icon: '📍', title: 'Coordinate Precision', desc: 'Drop a PIN on OpenStreetMap when no standard address exists.' },
  { icon: '📊', title: 'Weighted Scoring', desc: 'A transparent 0–100 score built from eight weighted risk categories.' },
  { icon: '📄', title: 'PDF Reports', desc: 'Download comprehensive risk reports for due diligence and investor review.' },
  { icon: '⚡', title: 'Real-Time Data', desc: 'Agents pull from World Bank, IMF, ACLED, and live forex and news feeds.' },
];

const RISK_LEVELS = [
  { range: '0–30', label: 'Low Risk', color: 'bg-green-500', text: 'text-green-400' },
  { range: '31–60', label: 'Medium Risk', color: 'bg-amber-500', text: 'text-amber-400' },
  { range: '61–80', label: 'High Risk', color: 'bg-orange-500', text: 'text-orange-400' },
  { range: '81–100', label: 'Critical Risk', color: 'bg-red-500', text: 'text-red-400' },
];

export default function Home() {
  return (
    <>
      <Head>
        <title>AfriRisk — AI Real Estate Risk Assessment for African Markets</title>
        <meta name="description" content="AI-powered real estate risk assessment platform for African diaspora investors." />
      </Head>
      <div className="min-h-screen bg-slate-950">
        {/* Nav */}
        <nav className="border-b border-slate-800 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <span className="text-white font-bold text-lg">AfriRisk</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-slate-300 hover:text-white text-sm font-medium transition-colors">Sign In</Link>
            <Link href="/signup" className="btn-primary text-sm py-2 px-4">Get Started Free</Link>
          </div>
        </nav>

        {/* Hero */}
        <section className="max-w-7xl mx-auto px-6 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 bg-brand-900/40 border border-brand-700/40 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse"></span>
            <span className="text-brand-300 text-xs font-medium">Live AI Agents • Real-Time Data</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-tight">
            Real Estate Risk Assessment<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-brand-600">
              for African Markets
            </span>
          </h1>
          <p className="text-slate-400 text-lg sm:text-xl max-w-3xl mx-auto mb-10">
            AI agents aggregate real-time data across 8 risk dimensions — currency, climate, geopolitical, economic, fraud, market, environmental, and AI — to produce a comprehensive risk score for any property across Africa.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup" className="btn-primary px-8 py-3 text-base">Start Free Assessment</Link>
            <Link href="/login" className="btn-secondary px-8 py-3 text-base">Sign In</Link>
          </div>

          {/* Risk Level Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-10">
            {RISK_LEVELS.map(r => (
              <div key={r.label} className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${r.color}`}></span>
                <span className={`text-sm font-medium ${r.text}`}>{r.label}</span>
                <span className="text-slate-600 text-xs">({r.range})</span>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="max-w-7xl mx-auto px-6 pb-20">
          <h2 className="text-2xl font-bold text-white text-center mb-10">Everything you need for property due diligence</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(f => (
              <div key={f.title} className="card-sm hover:border-brand-500/30 transition-colors">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="text-white font-semibold mb-1.5">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-800 py-8 text-center text-slate-500 text-sm">
          <p>© 2024 AfriRisk. AI-powered real estate risk assessment for African markets.</p>
        </footer>
      </div>
      <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155' } }} />
    </>
  );
}
