import { getRiskLevel } from '../lib/risk';

export default function RiskBadge({ score, size = 'md' }) {
  if (score === null || score === undefined) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-700 text-slate-400">
        <span className="w-2 h-2 rounded-full bg-slate-500"></span>
        Pending
      </span>
    );
  }

  const risk = getRiskLevel(score);
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 leading-none',
    md: 'text-sm px-2.5 py-1 leading-none',
    lg: 'text-base px-3 py-1.5 leading-none',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-semibold ${risk.bg} ${risk.text} border ${risk.border} ${sizeClasses[size]}`}
    >
      <span className={`w-2 h-2 rounded-full ${risk.dot} flex-shrink-0`}></span>
      <span className="whitespace-nowrap">{score}</span>
      <span className="font-normal opacity-80 whitespace-nowrap">— {risk.level}</span>
    </span>
  );
}

export function RiskScoreCircle({ score }) {
  if (score === null || score === undefined) return null;
  const risk = getRiskLevel(score);

  const colorMap = {
    green: '#22c55e',
    amber: '#f59e0b',
    orange: '#f97316',
    red: '#ef4444',
  };
  const color = colorMap[risk.color] || '#6366f1';
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="36" fill="none" stroke="#1e293b" strokeWidth="7" />
        <circle
          cx="40" cy="40" r="36" fill="none"
          stroke={color} strokeWidth="7"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold text-white">{score}</span>
        <span className="text-xs text-slate-400">/100</span>
      </div>
    </div>
  );
}
