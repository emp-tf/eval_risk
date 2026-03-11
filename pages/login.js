import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import toast, { Toaster } from 'react-hot-toast';

export default function Login() {
  const router = useRouter();
  const [step, setStep] = useState('email'); // 'email' | 'otp'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState(''); // shown in UI for demo

  useEffect(() => {
    if (router.query.email) setEmail(router.query.email);
  }, [router.query.email]);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter your email.');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || 'Failed to send OTP.');
      toast.success('OTP sent! Check your email.');
      if (data.devOtp) setDevOtp(data.devOtp); // Demo mode: show OTP
      setStep('otp');
    } catch (e) {
      toast.error('Network error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) return toast.error('Please enter the 6-digit code.');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otp }),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || 'Invalid or expired code.');
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (e) {
      toast.error('Network error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head><title>Sign In — AfriRisk</title></Head>
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <span className="text-white font-bold text-xl">AfriRisk</span>
            </Link>
            <h1 className="text-3xl font-bold text-white">
              {step === 'email' ? 'Sign In' : 'Enter OTP Code'}
            </h1>
            <p className="text-slate-400 mt-2">
              {step === 'email'
                ? 'Enter your email to receive a one-time code'
                : `We sent a 6-digit code to ${email}`}
            </p>
          </div>

          <div className="card">
            {step === 'email' ? (
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div>
                  <label className="label" htmlFor="email">Email Address</label>
                  <input
                    id="email" type="email" required value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="input-field" placeholder="amara@example.com"
                    autoComplete="email" autoFocus
                  />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Sending code...
                    </span>
                  ) : 'Send One-Time Code'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                {devOtp && (
                  <div className="bg-amber-900/30 border border-amber-600/40 rounded-xl p-3">
                    <p className="text-amber-300 text-xs font-medium mb-1">🔑 Demo Mode — Your OTP Code:</p>
                    <p className="text-amber-400 text-2xl font-bold tracking-[0.3em] text-center">{devOtp}</p>
                    <p className="text-amber-600 text-xs text-center mt-1">Configure email service for production</p>
                  </div>
                )}
                <div>
                  <label className="label" htmlFor="otp">6-Digit OTP Code</label>
                  <input
                    id="otp" type="text" inputMode="numeric" pattern="\d{6}"
                    maxLength={6} required value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="input-field text-center text-2xl tracking-[0.4em] font-bold"
                    placeholder="000000" autoFocus
                  />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Verifying...
                    </span>
                  ) : 'Verify & Sign In'}
                </button>
                <button type="button" onClick={() => { setStep('email'); setOtp(''); setDevOtp(''); }}
                  className="w-full text-slate-400 hover:text-slate-300 text-sm text-center transition-colors">
                  ← Use a different email
                </button>
              </form>
            )}
          </div>

          <p className="text-center text-slate-500 text-sm mt-4">
            Don't have an account?{' '}
            <Link href="/signup" className="text-brand-400 hover:text-brand-300 font-medium">Sign Up Free</Link>
          </p>
        </div>
      </div>
      <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155' } }} />
    </>
  );
}
