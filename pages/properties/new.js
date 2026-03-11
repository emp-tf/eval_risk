import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import Layout from '../../components/Layout';
import AgentProgress from '../../components/AgentProgress';
import UpgradeModal from '../../components/UpgradeModal';
import toast from 'react-hot-toast';

const MapPicker = dynamic(() => import('../../components/MapPicker'), { ssr: false });

const STEPS = ['Property Details', 'Location & Map', 'Financials & Image', 'Review'];

export default function NewProperty() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(0);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [assessing, setAssessing] = useState(false);
  const [agents, setAgents] = useState({});
  const [currentAgent, setCurrentAgent] = useState('');
  const [agentProgress, setAgentProgress] = useState(0);
  const [form, setForm] = useState({
    address: '',
    lat: '', lng: '',
    property_type: 'Developed',
    use_type: 'Residential',
    sub_type: '',
    bedrooms: '',
    amenities: '',
    purchase_price: '',
    financing_method: 'Cash',
    image: null,
    imagePreview: '',
  });

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!d.user) { router.push('/login'); return; }
      setUser(d.user);
    });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setForm(f => ({ ...f, image: ev.target.result, imagePreview: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const handleMapSelect = ({ lat, lng }) => {
    setForm(f => ({ ...f, lat, lng }));
  };

  const handleSubmit = async () => {
    if (!form.address && !form.lat) { toast.error('Please provide an address or drop a PIN on the map.'); return; }
    setSubmitting(true);

    try {
      // 1. Create property
      const propRes = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: form.address || `Coordinates: ${form.lat}, ${form.lng}`,
          lat: form.lat || null,
          lng: form.lng || null,
          property_type: form.property_type,
          use_type: form.use_type,
          sub_type: form.sub_type || null,
          bedrooms: form.bedrooms ? parseInt(form.bedrooms) : null,
          amenities: form.amenities || null,
          purchase_price: form.purchase_price ? parseFloat(form.purchase_price) : null,
          financing_method: form.financing_method,
          image_url: form.imagePreview || null,
        }),
      });
      const propData = await propRes.json();
      if (!propRes.ok) {
        if (propData.upgrade) { setShowUpgrade(true); setSubmitting(false); return; }
        throw new Error(propData.error || 'Failed to create property');
      }

      const propertyId = propData.property.id;
      setSubmitting(false);
      setAssessing(true);

      // 2. Trigger risk assessment with SSE-like polling
      const riskRes = await fetch(`/api/risk/${propertyId}`, { method: 'POST' });

      // Poll for status
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/risk/${propertyId}`);
          const statusData = await statusRes.json();

          if (statusData.report) {
            // Update agent progress display
            if (statusData.report.raw_data) {
              const rd = statusData.report.raw_data;
              const agentMap = {};
              Object.keys(rd).forEach(k => {
                agentMap[k] = { status: 'complete', score: rd[k].score };
              });
              setAgents(agentMap);
              setAgentProgress(Object.keys(agentMap).length);
              setCurrentAgent('');
            }

            if (statusData.report.status === 'complete') {
              clearInterval(pollInterval);
              setTimeout(() => router.push(`/properties/${propertyId}`), 1000);
            } else if (statusData.report.status === 'error') {
              clearInterval(pollInterval);
              toast.error('Risk assessment encountered an error. Partial results saved.');
              router.push(`/properties/${propertyId}`);
            }
          }
        } catch {}
      }, 3000);

      // Simulate agent progress animation while waiting
      const agentKeys = ['currency', 'climate', 'geopolitical', 'economic', 'fraud', 'environmental', 'market', 'ai'];
      let i = 0;
      const agentAnim = setInterval(() => {
        if (i < agentKeys.length) {
          setCurrentAgent(agentKeys[i]);
          setAgentProgress(i);
          setAgents(prev => ({ ...prev, [agentKeys[i]]: { status: 'running' } }));
          if (i > 0) setAgents(prev => ({ ...prev, [agentKeys[i - 1]]: { status: 'complete', score: Math.floor(30 + Math.random() * 50) } }));
          i++;
        } else {
          clearInterval(agentAnim);
        }
      }, 2500);

    } catch (e) {
      toast.error('Error: ' + e.message);
      setSubmitting(false);
      setAssessing(false);
    }
  };

  if (!user) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full"></div>
    </div>
  );

  // Assessment in progress screen
  if (assessing) {
    return (
      <Layout title="Assessing Risk — AfriRisk">
        <div className="max-w-md mx-auto text-center mt-24">
          <div className="w-16 h-16 bg-brand-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-brand-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Analysing Risk</h2>
          <p className="text-slate-400 text-sm mb-8">Our AI agents are gathering real-time data for your property. This may take 1–2 minutes.</p>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className="bg-brand-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.round((agentProgress / 8) * 100)}%` }}
            />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="New Property Assessment — AfriRisk">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">New Property Assessment</h1>
          <p className="text-slate-400 text-sm mt-1">Fill in property details to trigger an AI risk assessment</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => i < step && setStep(i)}
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                  i === step ? 'text-brand-400' : i < step ? 'text-slate-300 cursor-pointer hover:text-brand-400' : 'text-slate-600 cursor-not-allowed'
                }`}
              >
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  i < step ? 'bg-brand-600 text-white' : i === step ? 'bg-brand-900 border-2 border-brand-500 text-brand-400' : 'bg-slate-800 text-slate-600'
                }`}>
                  {i < step ? '✓' : i + 1}
                </span>
                <span className="hidden sm:inline">{s}</span>
              </button>
              {i < STEPS.length - 1 && <div className={`w-8 h-px flex-shrink-0 ${i < step ? 'bg-brand-600' : 'bg-slate-700'}`} />}
            </div>
          ))}
        </div>

        <div className="card">
          {/* Step 0: Property Details */}
          {step === 0 && (
            <div className="space-y-5">
              <h2 className="section-title">Property Details</h2>
              <div>
                <label className="label">Property Type *</label>
                <div className="grid grid-cols-2 gap-3">
                  {['Land', 'Developed'].map(t => (
                    <button key={t} type="button"
                      onClick={() => setForm(f => ({ ...f, property_type: t }))}
                      className={`py-3 rounded-xl border-2 text-sm font-semibold transition-all ${form.property_type === t ? 'border-brand-500 bg-brand-900/30 text-brand-300' : 'border-slate-700 text-slate-400 hover:border-slate-600'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Use Type *</label>
                <div className="grid grid-cols-2 gap-3">
                  {['Residential', 'Commercial'].map(t => (
                    <button key={t} type="button"
                      onClick={() => setForm(f => ({ ...f, use_type: t, sub_type: '' }))}
                      className={`py-3 rounded-xl border-2 text-sm font-semibold transition-all ${form.use_type === t ? 'border-brand-500 bg-brand-900/30 text-brand-300' : 'border-slate-700 text-slate-400 hover:border-slate-600'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              {form.use_type === 'Residential' && (
                <div>
                  <label className="label">Sub-Type</label>
                  <select name="sub_type" value={form.sub_type} onChange={handleChange} className="input-field">
                    <option value="">Select sub-type...</option>
                    {['Single Family', 'Multi-Family', 'Apartment', 'Townhouse'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="label">Number of Bedrooms</label>
                <input type="number" name="bedrooms" value={form.bedrooms} onChange={handleChange}
                  className="input-field" placeholder="e.g. 3" min="0" max="50" />
              </div>
              <div>
                <label className="label">Amenities</label>
                <input type="text" name="amenities" value={form.amenities} onChange={handleChange}
                  className="input-field" placeholder="e.g. Pool, Garden, Parking, Generator" />
              </div>
              <button onClick={() => setStep(1)} className="btn-primary w-full">Continue →</button>
            </div>
          )}

          {/* Step 1: Location */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="section-title">Property Location</h2>
              <div>
                <label className="label">Address / Location</label>
                <input type="text" name="address" value={form.address} onChange={handleChange}
                  className="input-field" placeholder="e.g. 15 Victoria Island, Lagos, Nigeria" />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label className="label">Or drop a PIN on the map</label>
                  {form.lat && form.lng && (
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, lat: '', lng: '' }))}
                      className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors mb-1"
                    >
                      Clear pin
                    </button>
                  )}
                </div>
                <MapPicker
                  lat={form.lat ? parseFloat(form.lat) : null}
                  lng={form.lng ? parseFloat(form.lng) : null}
                  onLocationSelect={handleMapSelect}
                />
                {form.lat && form.lng && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-green-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Coordinates captured: {parseFloat(form.lat).toFixed(4)}, {parseFloat(form.lng).toFixed(4)}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Latitude</label>
                  <input type="text" name="lat" value={form.lat} onChange={handleChange}
                    className="input-field" placeholder="e.g. 6.5244" />
                </div>
                <div>
                  <label className="label">Longitude</label>
                  <input type="text" name="lng" value={form.lng} onChange={handleChange}
                    className="input-field" placeholder="e.g. 3.3792" />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(0)} className="btn-secondary flex-1">← Back</button>
                <button onClick={() => {
                  if (!form.address && !form.lat) { toast.error('Please enter an address or drop a PIN.'); return; }
                  setStep(2);
                }} className="btn-primary flex-1">Continue →</button>
              </div>
            </div>
          )}

          {/* Step 2: Financials & Image */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="section-title">Financials & Image</h2>
              <div>
                <label className="label">Purchase Price (USD)</label>
                <input type="number" name="purchase_price" value={form.purchase_price} onChange={handleChange}
                  className="input-field" placeholder="e.g. 150000" min="0" />
              </div>
              <div>
                <label className="label">Financing Method</label>
                <div className="grid grid-cols-2 gap-3">
                  {['Cash', 'Bank-Financed'].map(t => (
                    <button key={t} type="button"
                      onClick={() => setForm(f => ({ ...f, financing_method: t }))}
                      className={`py-3 rounded-xl border-2 text-sm font-semibold transition-all ${form.financing_method === t ? 'border-brand-500 bg-brand-900/30 text-brand-300' : 'border-slate-700 text-slate-400 hover:border-slate-600'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Property Image (optional)</label>
                <div className="border-2 border-dashed border-slate-700 rounded-xl p-6 text-center hover:border-brand-500/50 transition-colors">
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="image-upload" />
                  {form.imagePreview ? (
                    <div className="space-y-3">
                      <img src={form.imagePreview} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
                      <button type="button" onClick={() => setForm(f => ({ ...f, image: null, imagePreview: '' }))}
                        className="text-sm text-red-400 hover:text-red-300">Remove image</button>
                    </div>
                  ) : (
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-slate-400 text-sm">Click to upload or drag & drop</p>
                      <p className="text-slate-600 text-xs mt-1">PNG, JPG, WEBP up to 5MB</p>
                    </label>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="btn-secondary flex-1">← Back</button>
                <button onClick={() => setStep(3)} className="btn-primary flex-1">Review →</button>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="section-title">Review & Submit</h2>
              <div className="space-y-3">
                {[
                  ['Address', form.address || (form.lat ? `${parseFloat(form.lat).toFixed(4)}, ${parseFloat(form.lng).toFixed(4)}` : 'Not set')],
                  ['Coordinates', form.lat && form.lng ? `${parseFloat(form.lat).toFixed(4)}, ${parseFloat(form.lng).toFixed(4)}` : 'None'],
                  ['Property Type', form.property_type],
                  ['Use Type', form.use_type],
                  ['Sub-Type', form.sub_type || 'N/A'],
                  ['Bedrooms', form.bedrooms || 'N/A'],
                  ['Amenities', form.amenities || 'N/A'],
                  ['Purchase Price', form.purchase_price ? `$${Number(form.purchase_price).toLocaleString()}` : 'N/A'],
                  ['Financing', form.financing_method],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-start justify-between py-2 border-b border-slate-800 last:border-0">
                    <span className="text-slate-400 text-sm">{k}</span>
                    <span className="text-white text-sm font-medium text-right max-w-xs truncate">{v}</span>
                  </div>
                ))}
              </div>
              {form.imagePreview && (
                <img src={form.imagePreview} alt="Preview" className="w-full h-32 object-cover rounded-xl" />
              )}
              <div className="bg-brand-900/20 border border-brand-700/30 rounded-xl p-3 text-sm text-brand-300">
                <strong>Note:</strong> After submitting, our AI agents will gather real-time risk data. This takes 1–3 minutes.
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="btn-secondary flex-1">← Back</button>
                <button onClick={handleSubmit} disabled={submitting} className="btn-primary flex-1">
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Submitting...
                    </span>
                  ) : '🚀 Run Risk Assessment'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <UpgradeModal isOpen={showUpgrade} onClose={() => { setShowUpgrade(false); router.push('/dashboard'); }} reason="reports" />
    </Layout>
  );
}
