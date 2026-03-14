export const RISK_WEIGHTS = {
  market: 0.20,
  financing: 0.15,
  currency: 0.12,
  economic: 0.10,
  geopolitical: 0.10,
  security: 0.10,
  infrastructure: 0.10,
  fraud: 0.08,
  environmental: 0.03,
  climate: 0.02,
};

export function calculateOverallScore(scores) {
  const {
    market_score = 50,
    financing_score = 50,
    currency_score = 50,
    economic_score = 50,
    geopolitical_score = 50,
    security_score = 50,
    infrastructure_score = 50,
    fraud_score = 50,
    environmental_score = 50,
    climate_score = 50,
  } = scores;

  const weighted =
    market_score * RISK_WEIGHTS.market +
    financing_score * RISK_WEIGHTS.financing +
    currency_score * RISK_WEIGHTS.currency +
    economic_score * RISK_WEIGHTS.economic +
    geopolitical_score * RISK_WEIGHTS.geopolitical +
    security_score * RISK_WEIGHTS.security +
    infrastructure_score * RISK_WEIGHTS.infrastructure +
    fraud_score * RISK_WEIGHTS.fraud +
    environmental_score * RISK_WEIGHTS.environmental +
    climate_score * RISK_WEIGHTS.climate;

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
  { key: 'financing_score', label: 'Financing Risk', weight: '15%', description: 'Access to capital, mortgage rates, and lending restrictions', detail: 'Mortgage availability and lending conditions' },
  { key: 'currency_score', label: 'Currency Risk', weight: '12%', description: 'Exchange rate volatility and currency devaluation risks', detail: 'Exchange rate stability and local currency strength' },
  { key: 'economic_score', label: 'Economic Risk', weight: '10%', description: 'GDP growth, inflation, and economic stability', detail: 'GDP growth, inflation, and economic indicators' },
  { key: 'geopolitical_score', label: 'Geopolitical Risk', weight: '10%', description: 'Political stability, conflict, and regulatory changes', detail: 'Political stability and regulatory environment' },
  { key: 'security_score', label: 'Security Risk', weight: '10%', description: 'Crime rates, physical security, and neighbourhood safety', detail: 'Crime index and physical security infrastructure' },
  { key: 'infrastructure_score', label: 'Infrastructural Risk', weight: '10%', description: 'Road quality, electricity, water supply, and connectivity', detail: 'Infrastructure reliability and development potential' },
  { key: 'fraud_score', label: 'Fraud Risk', weight: '8%', description: 'Property fraud, title issues, and transaction security', detail: 'Title security and transaction integrity' },
  { key: 'environmental_score', label: 'Environmental Risk', weight: '3%', description: 'Pollution, natural disasters, and environmental degradation', detail: 'Natural disasters and environmental factors' },
  { key: 'climate_score', label: 'Climate Risk', weight: '2%', description: 'Climate change impacts on property value and safety', detail: 'Long-term climate change impacts' },
];

export function formatCurrency(amount, currency = 'USD') {
  if (!amount) return 'N/A';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}
