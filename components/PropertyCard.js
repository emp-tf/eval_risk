import Link from 'next/link';
import RiskBadge from './RiskBadge';
import { formatCurrency } from '../lib/risk';

export default function PropertyCard({ property, onDelete }) {
  const {
    id,
    address,
    lat,
    lng,
    property_type,
    use_type,
    sub_type,
    bedrooms,
    amenities,
    purchase_price,
    financing_method,
    image_url,
    overall_score,
    status,
  } = property;

  return (
    <Link href={`/properties/${id}`}>
      <div className="card hover:border-brand-500/40 transition-all duration-200 cursor-pointer group flex flex-col sm:flex-row gap-4 items-start">
        {/* Image */}
        <div className="w-full sm:w-32 h-40 sm:h-28 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0">
          {image_url ? (
            <img src={image_url} alt={address} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-10 h-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
            <h3 className="text-white font-semibold text-base truncate leading-snug">{address}</h3>
            <RiskBadge score={overall_score} size="sm" />
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
              {property_type}
            </span>
            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
              {use_type}
            </span>
            {sub_type && (
              <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
                {sub_type}
              </span>
            )}
            {status === 'pending' && (
              <span className="text-xs bg-brand-900/40 text-brand-300 px-2 py-0.5 rounded-full border border-brand-700/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse"></span>
                Assessing
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
            {purchase_price ? (
              <div className="min-w-0">
                <p className="text-slate-500 text-xs">Purchase price</p>
                <p className="text-brand-400 font-semibold truncate">{formatCurrency(purchase_price)}</p>
              </div>
            ) : (
              <div className="min-w-0">
                <p className="text-slate-500 text-xs">Purchase price</p>
                <p className="text-slate-300 font-medium">—</p>
              </div>
            )}

            <div className="min-w-0">
              <p className="text-slate-500 text-xs">Financing</p>
              <p className="text-slate-300 font-medium truncate">{financing_method || '—'}</p>
            </div>

            <div className="min-w-0">
              <p className="text-slate-500 text-xs">Bedrooms</p>
              <p className="text-slate-300 font-medium truncate">
                {bedrooms === null || bedrooms === undefined || bedrooms === '' ? '—' : bedrooms}
              </p>
            </div>

            <div className="min-w-0">
              <p className="text-slate-500 text-xs">Location</p>
              <p className="text-slate-300 font-medium truncate">
                {lat && lng ? `${parseFloat(lat).toFixed(3)}, ${parseFloat(lng).toFixed(3)}` : '—'}
              </p>
            </div>
          </div>

          {amenities && (
            <p className="text-slate-500 text-xs mt-3 line-clamp-1">
              <span className="text-slate-400 font-semibold">Amenities:</span> {amenities}
            </p>
          )}
        </div>

        {onDelete && (
          <button
            onClick={e => { e.preventDefault(); e.stopPropagation(); onDelete(id, address); }}
            className="flex-shrink-0 p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-colors"
            title="Delete property"
            aria-label="Delete property"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </Link>
  );
}
