import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import toast, { Toaster } from 'react-hot-toast';

export default function Signup() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', phone: '', name: '', location: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.name) return toast.error('Email and name are required.');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || 'Signup failed.');
      toast.success('Account created! Check your email for the OTP code.');
      router.push(`/login?email=${encodeURIComponent(form.email)}&new=1`);
    } catch (e) {
      toast.error('Network error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head><title>Sign Up — AfriRisk</title></Head>
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
            <h1 className="text-3xl font-bold text-white">Create your account</h1>
            <p className="text-slate-400 mt-2">Join investors assessing African real estate risk</p>
          </div>

          <div className="card">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label" htmlFor="name">Full Name *</label>
                <input id="name" name="name" type="text" required value={form.name} onChange={handleChange}
                  className="input-field" placeholder="Amara Diallo" autoComplete="name" />
              </div>
              <div>
                <label className="label" htmlFor="email">Email Address *</label>
                <input id="email" name="email" type="email" required value={form.email} onChange={handleChange}
                  className="input-field" placeholder="amara@example.com" autoComplete="email" />
              </div>
              <div>
                <label className="label" htmlFor="phone">Phone Number</label>
                <input id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange}
                  className="input-field" placeholder="+234 800 000 0000" autoComplete="tel" />
              </div>
              <div>
                <label className="label" htmlFor="location">Geographic Location</label>
                <input id="location" name="location" type="text" value={form.location} onChange={handleChange}
                  className="input-field" placeholder="Lagos, Nigeria" />
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Creating account...
                  </span>
                ) : 'Create Account'}
              </button>
            </form>
          </div>

          <p className="text-center text-slate-500 text-sm mt-4">
            Already have an account?{' '}
            <Link href="/login" className="text-brand-400 hover:text-brand-300 font-medium">Sign In</Link>
          </p>
        </div>
      </div>
      <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155' } }} />
    </>
  );
}
