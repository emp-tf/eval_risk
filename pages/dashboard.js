import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../components/Layout';
import PropertyCard from '../components/PropertyCard';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (!d.user) { router.push('/login'); return; }
        setUser(d.user);
      });
  }, []);

  useEffect(() => {
    if (!user) return;
    loadProperties();
    // Poll for pending assessments
    const interval = setInterval(loadProperties, 8000);
    return () => clearInterval(interval);
  }, [user]);

  const loadProperties = async () => {
    try {
      const res = await fetch('/api/properties');
      const data = await res.json();
      if (data.properties) setProperties(data.properties);
    } catch {}
    setLoading(false);
  };

  const handleDelete = async (id, address) => {
    if (!confirm(`Delete "${address}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/properties/${id}`, { method: 'DELETE' });
      if (res.ok) setProperties(prev => prev.filter(p => p.id !== id));
    } catch {}
    setDeleting(null);
  };

  const filtered = properties.filter(p =>
    p.address?.toLowerCase().includes(search.toLowerCase()) ||
    p.property_type?.toLowerCase().includes(search.toLowerCase()) ||
    p.use_type?.toLowerCase().includes(search.toLowerCase())
  );

  const lowRisk = properties.filter(p => p.overall_score !== null && p.overall_score <= 30).length;
  const highRisk = properties.filter(p => p.overall_score !== null && p.overall_score > 60).length;

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <Layout title="Dashboard — AfriRisk">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Welcome back, {user.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-400 text-sm mt-1">Your property risk assessments dashboard</p>
        </div>
        <Link href="/properties/new" className="btn-primary flex items-center gap-2 self-start sm:self-auto">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Assessment
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Total Properties</p>
            <p className="text-3xl font-bold text-white">{properties.length}</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Low Risk</p>
            <p className="text-3xl font-bold text-green-400">{lowRisk}</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className="text-slate-400 text-sm">High Risk</p>
            <p className="text-3xl font-bold text-red-400">{highRisk}</p>
          </div>
        </div>
      </div>

      {/* Tier Banner */}
      {user.tier === 'free' && (
        <div className="bg-brand-900/30 border border-brand-700/40 rounded-xl p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-brand-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-brand-300 text-sm">
              Free tier: <span className="font-semibold">{user.report_count}/3</span> reports used. Upgrade for unlimited reports and PDF downloads.
            </p>
          </div>
          <Link href="/properties/new" className="text-brand-400 hover:text-brand-300 text-sm font-semibold whitespace-nowrap">Upgrade →</Link>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-6">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field pl-10"
          placeholder="Search properties by address, type..."
          aria-label="Search properties"
        />
      </div>

      {/* Properties List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
            </svg>
          </div>
          <h3 className="text-white font-semibold text-lg mb-2">
            {search ? 'No properties found' : 'No properties yet'}
          </h3>
          <p className="text-slate-400 text-sm mb-6">
            {search ? 'Try a different search term.' : 'Create your first property assessment to get started.'}
          </p>
          {!search && (
            <Link href="/properties/new" className="btn-primary">Start First Assessment</Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(p => (
            <div key={p.id} className={deleting === p.id ? 'opacity-50 pointer-events-none' : ''}>
              <PropertyCard property={p} onDelete={handleDelete} />
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
