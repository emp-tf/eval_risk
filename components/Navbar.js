import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => { if (d.user) setUser(d.user); })
      .catch(() => {});
  }, [router.pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/login');
  };

  return (
    <nav className="bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <span className="text-white font-bold text-lg tracking-tight">AfriRisk</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <Link href="/dashboard" className="text-slate-300 hover:text-white text-sm font-medium transition-colors">Dashboard</Link>
                <Link href="/properties/new" className="btn-primary text-sm py-2 px-4">+ New Assessment</Link>
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center gap-2 text-slate-300 hover:text-white text-sm font-medium transition-colors"
                  >
                    <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {user.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <span>{user.name?.split(' ')[0]}</span>
                    {user.tier === 'paid' && (
                      <span className="bg-brand-600/30 text-brand-300 text-xs px-1.5 py-0.5 rounded-full font-medium">PRO</span>
                    )}
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-1 z-50">
                      <div className="px-4 py-2 border-b border-slate-700">
                        <p className="text-white text-sm font-medium">{user.name}</p>
                        <p className="text-slate-400 text-xs">{user.email}</p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="text-slate-300 hover:text-white text-sm font-medium transition-colors">Sign In</Link>
                <Link href="/signup" className="btn-primary text-sm py-2 px-4">Get Started</Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setMenuOpen(!menuOpen)}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-slate-700 py-3 space-y-1">
            {user ? (
              <>
                <Link href="/dashboard" className="block px-4 py-2 text-slate-300 hover:text-white text-sm">Dashboard</Link>
                <Link href="/properties/new" className="block px-4 py-2 text-brand-400 hover:text-brand-300 text-sm font-medium">+ New Assessment</Link>
                <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-slate-300 hover:text-white text-sm">Sign Out</button>
              </>
            ) : (
              <>
                <Link href="/login" className="block px-4 py-2 text-slate-300 hover:text-white text-sm">Sign In</Link>
                <Link href="/signup" className="block px-4 py-2 text-brand-400 hover:text-brand-300 text-sm font-medium">Get Started</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
