import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import RiskBadge, { RiskScoreCircle } from '../../components/RiskBadge';
import UpgradeModal from '../../components/UpgradeModal';
import { RISK_CATEGORIES, getRiskLevel, formatCurrency } from '../../lib/risk';
import toast from 'react-hot-toast';

export default function PropertyDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [property, setProperty] = useState(null);
  const [report, setReport] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!d.user) { router.push('/login'); return; }
      setUser(d.user);
    });
  }, []);

  useEffect(() => {
    if (!id) return;
    loadData();
    const interval = setInterval(() => {
      if (report?.status === 'pending') loadData();
    }, 5000);
    return () => clearInterval(interval);
  }, [id, report?.status]);

  const loadData = async () => {
    try {
      const res = await fetch(`/api/properties/${id}`);
      const data = await res.json();
      if (!res.ok) { router.push('/dashboard'); return; }
      setProperty(data.property);
      setReport(data.report);
    } catch (e) {
      toast.error('Failed to load property: ' + e.message);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm('Delete this property and all its risk data? This cannot be undone.')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/properties/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Property deleted.');
        router.push('/dashboard');
      } else {
        const d = await res.json();
        toast.error(d.error || 'Failed to delete.');
      }
    } catch (e) {
      toast.error('Error: ' + e.message);
    }
    setDeleting(false);
  };

  const handleDownloadPDF = async () => {
    if (!user) return;
    if (!report || report.status !== 'complete') { toast.error('Risk assessment must be complete before downloading.'); return; }

    setGeneratingPdf(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 18;

      // Header
      doc.setFillColor(79, 70, 229);
      doc.rect(0, 0, pageWidth, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('AfriRisk — Property Risk Report', margin, 20);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin, 30);

      let y = 52;

      // Property info
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Property Information', margin, y);
      y += 8;

      const propRows = [
        ['Address', property.address || 'N/A'],
        ['Coordinates', property.lat ? `${property.lat}, ${property.lng}` : 'N/A'],
        ['Property Type', property.property_type],
        ['Use Type', property.use_type],
        ['Sub-Type', property.sub_type || 'N/A'],
        ['Bedrooms', property.bedrooms?.toString() || 'N/A'],
        ['Amenities', property.amenities || 'N/A'],
        ['Purchase Price', property.purchase_price ? formatCurrency(property.purchase_price) : 'N/A'],
        ['Financing Method', property.financing_method || 'N/A'],
      ];

      autoTable(doc, {
        startY: y,
        head: [['Field', 'Value']],
        body: propRows,
        margin: { left: margin, right: margin },
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 10 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
      });

      y = doc.lastAutoTable.finalY + 12;

      // Overall Score
      const risk = getRiskLevel(report.overall_score);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Overall Risk Score', margin, y);
      y += 8;

      const colorMap = { green: [34, 197, 94], amber: [245, 158, 11], orange: [249, 115, 22], red: [239, 68, 68] };
      const col = colorMap[risk.color] || [99, 102, 241];
      doc.setFillColor(...col);
      doc.roundedRect(margin, y, 80, 24, 4, 4, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(`${report.overall_score}/100 — ${risk.level}`, margin + 8, y + 15);

      y += 34;
      doc.setTextColor(0, 0, 0);

      // Category scores
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Risk Category Scores', margin, y);
      y += 8;

      const categoryRows = RISK_CATEGORIES.map(cat => [
        cat.label,
        cat.weight,
        `${report[cat.key] ?? 'N/A'}/100`,
        cat.description,
      ]);

      autoTable(doc, {
        startY: y,
        head: [['Category', 'Weight', 'Score', 'Description']],
        body: categoryRows,
        margin: { left: margin, right: margin },
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 38 }, 1: { cellWidth: 18 }, 2: { cellWidth: 18 } },
      });

      y = doc.lastAutoTable.finalY + 12;

      // Methodology
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Risk Scoring Methodology', margin, y);
      y += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      const methodText = 'The overall risk score is calculated as a weighted average of 8 risk categories. Scores range from 0 (safest) to 100 (highest risk). Low Risk (0-30, Green), Medium Risk (31-60, Amber), High Risk (61-80, Orange), Critical Risk (81-100, Red).';
      const lines = doc.splitTextToSize(methodText, pageWidth - 2 * margin);
      doc.text(lines, margin, y);

      // Footer
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('AfriRisk — Confidential Risk Assessment Report', margin, 290);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 20, 290);
      }

      doc.save(`AfriRisk_Report_${property.address?.replace(/[^a-z0-9]/gi, '_') || id}.pdf`);
      toast.success('PDF report downloaded!');
    } catch (e) {
      toast.error('PDF generation failed: ' + e.message);
    }
    setGeneratingPdf(false);
  };

  if (loading) {
    return (
      <Layout><div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full"></div>
      </div></Layout>
    );
  }

  if (!property) return <Layout><p className="text-slate-400">Property not found.</p></Layout>;

  const isPending = !report || report.status === 'pending';

  return (
    <Layout title={`${property.address} — AfriRisk`}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back + Actions */}
        <div className="flex items-center justify-between">
          <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadPDF}
              disabled={generatingPdf || isPending}
              className="flex items-center gap-2 text-sm font-semibold py-2 px-4 rounded-xl transition-all bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {generatingPdf ? 'Generating...' : 'Download PDF'}
            </button>
            <button onClick={handleDelete} disabled={deleting} className="btn-danger flex items-center gap-2 text-sm py-2 px-4">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>

        {/* Property Header */}
        <div className="card">
          <div className="flex flex-col sm:flex-row gap-6">
            {property.image_url ? (
              <img src={property.image_url} alt={property.address} className="w-full sm:w-48 h-40 sm:h-36 object-cover rounded-xl flex-shrink-0" />
            ) : (
              <div className="w-full sm:w-48 h-40 sm:h-36 bg-slate-800 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-12 h-12 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
            )}
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                <div>
                  <h1 className="text-xl font-bold text-white mb-1">{property.address}</h1>
                  {property.lat && property.lng && (
                    <p className="text-slate-500 text-xs flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      {parseFloat(property.lat).toFixed(4)}, {parseFloat(property.lng).toFixed(4)}
                    </p>
                  )}
                </div>
                {report && !isPending && <RiskBadge score={report.overall_score} size="lg" />}
                {isPending && (
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-900/30 border border-brand-700/40 text-brand-300 text-sm">
                    <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse"></span>
                    Assessing...
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  ['Type', property.property_type],
                  ['Use', property.use_type],
                  ['Sub-Type', property.sub_type || '—'],
                  ['Bedrooms', property.bedrooms ?? '—'],
                  ['Amenities', property.amenities || '—'],
                  ['Financing', property.financing_method || '—'],
                ].map(([k, v]) => (
                  <div key={k} className="bg-slate-800/60 rounded-lg p-2.5">
                    <p className="text-slate-500 text-xs mb-0.5">{k}</p>
                    <p className="text-white text-sm font-medium truncate">{v}</p>
                  </div>
                ))}
              </div>
              {property.purchase_price && (
                <p className="text-brand-400 font-bold text-lg mt-3">{formatCurrency(property.purchase_price)}</p>
              )}
            </div>
          </div>
        </div>

        {/* Risk Assessment pending */}
        {isPending && (
          <div className="card text-center py-10">
            <div className="animate-spin w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <h3 className="text-white font-semibold mb-2">AI Risk Assessment in Progress</h3>
            <p className="text-slate-400 text-sm">Our agents are gathering real-time data. This page will update automatically.</p>
          </div>
        )}

        {/* Risk Report */}
        {report && report.status === 'complete' && (
          <>
            {/* Overall Score */}
            <div className="card">
              <h2 className="section-title">Overall Risk Score</h2>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <RiskScoreCircle score={report.overall_score} />
                <div className="flex-1 text-center sm:text-left">
                  <p className="text-4xl font-extrabold text-white mb-1">{report.overall_score}<span className="text-slate-500 text-2xl">/100</span></p>
                  <RiskBadge score={report.overall_score} size="lg" />
                  <p className="text-slate-400 text-sm mt-3">Weighted average across 8 risk categories based on live AI agent data collection.</p>
                </div>
              </div>
            </div>

            {/* Category Scores */}
            <div className="card">
              <h2 className="section-title">Detailed Risk Assessment</h2>
              <div className="space-y-4">
                {RISK_CATEGORIES.map(cat => {
                  const score = report[cat.key];
                  const risk = score !== null && score !== undefined ? getRiskLevel(score) : null;
                  const pct = score !== null && score !== undefined ? score : 0;
                  return (
                    <div key={cat.key} className="p-4 bg-slate-800/50 rounded-xl">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-white font-semibold text-sm">{cat.label}</span>
                            <span className="text-slate-600 text-xs font-medium">{cat.weight}</span>
                          </div>
                          <p className="text-slate-500 text-xs">{cat.description}</p>
                        </div>
                        {risk && (
                          <div className={`ml-4 flex-shrink-0 text-right`}>
                            <span className={`text-2xl font-bold ${risk.text}`}>{score}</span>
                            <span className="text-slate-500 text-sm">/100</span>
                          </div>
                        )}
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2 mt-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full ${
                            pct <= 30 ? 'bg-green-500' : pct <= 60 ? 'bg-amber-500' : pct <= 80 ? 'bg-orange-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(pct, 100)}%`, maxWidth: '100%' }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Methodology Box */}
            <div className="card border-brand-700/30">
              <h2 className="section-title">Risk Scoring Methodology</h2>
              <p className="text-slate-400 text-sm mb-5">
                The overall risk score is calculated as a weighted average of 8 risk categories, each powered by a dedicated AI agent that gathers real-time and historical data. Scores range from 0 (lowest risk) to 100 (highest risk).
              </p>
              <div className="space-y-2">
                {RISK_CATEGORIES.map(cat => (
                  <div key={cat.key} className="flex items-center gap-3 py-2.5 border-b border-slate-800 last:border-0">
                    <div className="w-12 text-center">
                      <span className="text-brand-400 font-bold text-sm">{cat.weight}</span>
                    </div>
                    <div className="flex-1">
                      <span className="text-white text-sm font-medium">{cat.label}</span>
                      <span className="text-slate-500 text-xs ml-2">— {cat.detail}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Low Risk', range: '0–30', bg: 'bg-green-500/20', text: 'text-green-400' },
                  { label: 'Medium Risk', range: '31–60', bg: 'bg-amber-500/20', text: 'text-amber-400' },
                  { label: 'High Risk', range: '61–80', bg: 'bg-orange-500/20', text: 'text-orange-400' },
                  { label: 'Critical Risk', range: '81–100', bg: 'bg-red-500/20', text: 'text-red-400' },
                ].map(r => (
                  <div key={r.label} className={`${r.bg} rounded-xl p-3 text-center`}>
                    <p className={`${r.text} font-bold text-sm`}>{r.label}</p>
                    <p className="text-slate-400 text-xs mt-0.5">Score: {r.range}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Error state */}
        {report?.status === 'error' && (
          <div className="card border-red-700/30 bg-red-900/10">
            <p className="text-red-400 font-semibold">Risk assessment encountered an error. Partial results may be available above.</p>
          </div>
        )}
      </div>

      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} reason="download" />
    </Layout>
  );
}
