import { rapidResearch, applyPrompt } from './apiClient';
import { calculateOverallScore, getRiskLevel } from './risk';
import { query } from './db';
import {
  fetchWorldBankData, fetchImfData, fetchGdeltData,
  fetchNasaPowerData, fetchEnvironmentalData,
  getIsoCodes,
} from './realDataFetcher';


const SCHEMA = 'app_a4367bd81985442d9dc8319de1ddc526';

/**
 * Run a single risk agent: research → score
 */
async function runRiskAgent(agentName, researchGoal, promptName, extraContext = '') {
  let researchData = '';
  try {
    researchData = await rapidResearch(researchGoal);
  } catch (e) {
    researchData = `Unable to fetch live data for ${agentName}. Using baseline estimates.`;
  }

  let score = 50; // default fallback
  try {
    const result = await applyPrompt(promptName, {
      research_data: researchData,
      context: extraContext,
    }, 'structured');

    // Parse structured result — expect [{score: N, summary: "..."}]
    if (Array.isArray(result) && result.length > 0) {
      const parsed = result[0];
      const rawScore = parsed.score ?? parsed.risk_score ?? parsed.value ?? 50;
      score = Math.min(100, Math.max(0, parseInt(rawScore, 10) || 50));
    } else if (typeof result === 'string') {
      const match = result.match(/\b(\d{1,3})\b/);
      if (match) score = Math.min(100, Math.max(0, parseInt(match[1], 10)));
    } else if (typeof result === 'number') {
      score = Math.min(100, Math.max(0, Math.round(result)));
    }
  } catch (e) {
    console.error(`${agentName} scoring error:`, e.message);
    score = 50;
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`[${agentName}] Research (${researchData.length} chars):`);
  console.log(researchData);
  console.log('='.repeat(60));

  return { score, research: researchData };
}

/**
 * Full risk assessment pipeline for a property
 */
export async function runRiskAssessment(property, onProgress, reportId) {
  const year = new Date().getFullYear();
  const country = await resolveCountry(property);
  const coordsContext = property.lat && property.lng
    ? `Property coordinates: lat=${property.lat}, lng=${property.lng}.`
    : '';
  const propContext = `Property: ${property.address}, ${property.property_type} - ${property.use_type}. ${coordsContext}`;

  // Pre-fetch real data in parallel (5 s timeout per call; failures return '')
  const isoCodes = getIsoCodes(country);
  const [worldBankText, imfText, gdeltText, nasaText, envText] = await Promise.all([
    isoCodes?.iso2 ? fetchWorldBankData(isoCodes.iso2) : Promise.resolve(''),
    isoCodes?.iso3 ? fetchImfData(isoCodes.iso3) : Promise.resolve(''),
    fetchGdeltData(country),
    (property.lat && property.lng) ? fetchNasaPowerData(property.lat, property.lng) : Promise.resolve(''),
    fetchEnvironmentalData({
      lat: property.lat,
      lng: property.lng,
      city: property.address?.split(',').slice(-2, -1)[0]?.trim() ?? '',
    }),
  ]);

  const agents = [
    {
      key: 'currency',
      name: 'Currency Risk Agent',
      goal: `As of ${year}, what is the current USD exchange rate for ${country}'s currency, its 12-month forex volatility, any recent devaluation events, and the IMF's latest currency stability assessment for ${country}? How does this affect purchasing power for ${property.use_type} ${property.property_type} real estate buyers?`,
      prompt: 'score_currency_risk',
      extraContext: [propContext, imfText].filter(Boolean).join('\n\n'),
    },
    {
      key: 'climate',
      name: 'Climate Risk Agent',
      goal: `As of ${year}, what are the specific flood risk levels, landslide probability, and recorded natural disaster history for ${country}${property.lat && property.lng ? ` near latitude ${property.lat}, longitude ${property.lng}` : ''}? Include climate change projections from IPCC or World Bank Climate Portal and any extreme weather events in the past 3 years relevant to ${property.use_type} ${property.property_type} properties.`,
      prompt: 'score_climate_risk',
      extraContext: [propContext, nasaText].filter(Boolean).join('\n\n'),
    },
    {
      key: 'geopolitical',
      name: 'Geopolitical Risk Agent',
      goal: `As of ${year}, what is ${country}'s current political stability score according to ACLED, Fragile States Index, or similar sources? Are there active conflicts, recent coups, or significant civil unrest? What is the regulatory environment for foreign and domestic real estate ownership, and what country risk rating does ${country} hold from major agencies?`,
      prompt: 'score_geopolitical_risk',
      extraContext: [propContext, worldBankText, gdeltText].filter(Boolean).join('\n\n'),
    },
    {
      key: 'economic',
      name: 'Economic Risk Agent',
      goal: `As of ${year}, what are ${country}'s latest GDP growth rate, inflation rate, and unemployment figures from the World Bank or IMF? Is the economic trajectory stable, improving, or deteriorating? How do these indicators affect affordability and investment viability for ${property.use_type} ${property.property_type} real estate?`,
      prompt: 'score_economic_risk',
      extraContext: [propContext, worldBankText, imfText].filter(Boolean).join('\n\n'),
    },
    {
      key: 'fraud',
      name: 'Fraud & Title Risk Agent',
      goal: `As of ${year}, how prevalent are property title disputes, land fraud, and deed forgery in ${country}? What are the most reported transaction security issues for ${property.use_type} ${property.property_type} properties? Are there official land registry systems or known weaknesses in title verification processes?`,
      prompt: 'score_fraud_market_risk',
      extraContext: propContext,
    },
    {
      key: 'environmental',
      name: 'Environmental Risk Agent',
      goal: `As of ${year}, what are the documented environmental risks near ${property.lat && property.lng ? `latitude ${property.lat}, longitude ${property.lng} in ${country}` : country}? Include air and water pollution levels, soil contamination, proximity to industrial hazards, deforestation rates, and any environmental degradation trends that would affect a ${property.use_type} ${property.property_type} property.`,
      prompt: 'score_environmental_risk',
      extraContext: [propContext, envText].filter(Boolean).join('\n\n'),
    },
    {
      key: 'market',
      name: 'Market Risk Agent',
      goal: `As of ${year}, what are the current ${property.use_type} ${property.property_type} real estate price trends, average rental yields, and market liquidity in ${country}? Is demand outpacing supply or vice versa? What do recent transaction volumes and investor sentiment indicators suggest about short-term price volatility?`,
      prompt: 'score_market_risk',
      extraContext: propContext,
    },
    {
      key: 'ai',
      name: 'AI Risk Agent',
      goal: `As of ${year}, how is AI, automation, and proptech adoption affecting the ${property.use_type} ${property.property_type} real estate market in ${country}? Are AI-driven valuation tools or platforms being adopted? How might automation and remote work trends shift demand for this property type in ${country} over the next 3–5 years?`,
      prompt: 'score_ai_risk',
      extraContext: propContext,
    },
  ];

  const results = {};
  const rawData = {};

  await Promise.all(
    agents.map(async (agent) => {
      if (onProgress) onProgress(agent.key, 'running', 0, agents.length);

      const { score, research } = await runRiskAgent(
        agent.name,
        agent.goal,
        agent.prompt,
        agent.extraContext
      );

      results[`${agent.key}_score`] = score;
      rawData[agent.key] = { score, research };

      if (onProgress) onProgress(agent.key, 'complete', 0, agents.length);

      if (reportId) {
        await query(
          `UPDATE ${SCHEMA}.risk_reports
           SET ${agent.key}_score = $1,
               raw_data = COALESCE(raw_data, '{}'::jsonb) || $2::jsonb
           WHERE id = $3`,
          [score, JSON.stringify({ [agent.key]: { score, research } }), reportId]
        ).catch((e) => console.error(`[Agent ${agent.key}] DB write error:`, e.message));
      }
    })
  );

  const overall = calculateOverallScore(results);
  const riskLevel = getRiskLevel(overall);

  return {
    ...results,
    overall_score: overall,
    risk_level: riskLevel.level,
    raw_data: rawData,
  };
}

async function resolveCountry(property) {
  // Try reverse geocoding with coordinates first
  if (property.lat && property.lng) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${property.lat}&lon=${property.lng}&format=json`,
        { headers: { 'User-Agent': 'AfriRisk/1.0' } }
      );
      const data = await res.json();
      if (data?.address?.country) return data.address.country;
    } catch (e) {
      console.warn('Reverse geocoding failed, falling back to address parsing:', e.message);
    }
  }
  // Try forward geocoding with address string
  if (property.address) {
    try {
      const encoded = encodeURIComponent(property.address);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&addressdetails=1&limit=1`,
        { headers: { 'User-Agent': 'AfriRisk/1.0' } }
      );
      const data = await res.json();
      if (data?.[0]?.address?.country) return data[0].address.country;
    } catch (e) {
      console.warn('Forward geocoding failed, falling back to address parsing:', e.message);
    }
  }
  // Last resort: string parsing
  if (!property.address) return 'Africa';
  const parts = property.address.split(',').map(s => s.trim());
  if (parts.length >= 2) return parts[parts.length - 1];
  return property.address || 'Africa';
}
