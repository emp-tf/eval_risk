export const RISK_WEIGHTS = {
  market: 0.20,
  currency: 0.15,
  economic: 0.15,
  geopolitical: 0.15,
  environmental: 0.10,
  climate: 0.10,
  fraud: 0.10,
  ai: 0.05,
};

export function calculateOverallScore(scores) {
  const {
    market_score = 50,
    currency_score = 50,
    economic_score = 50,
    geopolitical_score = 50,
    environmental_score = 50,
    climate_score = 50,
    fraud_score = 50,
    ai_score = 50,
  } = scores;

  const weighted =
    market_score * RISK_WEIGHTS.market +
    currency_score * RISK_WEIGHTS.currency +
    economic_score * RISK_WEIGHTS.economic +
    geopolitical_score * RISK_WEIGHTS.geopolitical +
    environmental_score * RISK_WEIGHTS.environmental +
    climate_score * RISK_WEIGHTS.climate +
    fraud_score * RISK_WEIGHTS.fraud +
    ai_score * RISK_WEIGHTS.ai;

  return Math.round(weighted);
}

export function getRiskLevel(score) {
  if (score <= 30) return { level: 'Low Risk', color: 'green', bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/40', dot: 'bg-green-400' };
  if (score <= 60) return { level: 'Medium Risk', color: 'amber', bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/40', dot: 'bg-amber-400' };
  if (score <= 80) return { level: 'High Risk', color: 'orange', bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/40', dot: 'bg-orange-400' };
  return { level: 'Critical Risk', color: 'red', bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/40', dot: 'bg-red-400' };
}

export const RISK_CATEGORIES = [
  { key: 'market_score', label: 'Market Risk', weight: '20%', description: 'Market demand, liquidity, and price volatility', detail: 'Market liquidity and demand volatility' },
  { key: 'currency_score', label: 'Currency Risk', weight: '15%', description: 'Exchange rate volatility and currency devaluation risks', detail: 'Exchange rate stability and local currency strength' },
  { key: 'economic_score', label: 'Economic Risk', weight: '15%', description: 'GDP growth, inflation, and economic stability', detail: 'GDP growth, inflation, and economic indicators' },
  { key: 'geopolitical_score', label: 'Geopolitical Risk', weight: '15%', description: 'Political stability, conflict, and regulatory changes', detail: 'Political stability and regulatory environment' },
  { key: 'environmental_score', label: 'Environmental Risk', weight: '10%', description: 'Pollution, natural disasters, and environmental degradation', detail: 'Natural disasters and environmental factors' },
  { key: 'climate_score', label: 'Climate Risk', weight: '10%', description: 'Climate change impacts on property value and safety', detail: 'Long-term climate change impacts' },
  { key: 'fraud_score', label: 'Fraud Risk', weight: '10%', description: 'Property fraud, title issues, and transaction security', detail: 'Title security and transaction integrity' },
  { key: 'ai_score', label: 'AI Risk', weight: '5%', description: 'Impact of AI and automation on property valuations', detail: 'Technology disruption and market shifts' },
];

export function formatCurrency(amount, currency = 'USD') {
  if (!amount) return 'N/A';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}
