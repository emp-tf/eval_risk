import { rapidResearch, applyPrompt } from "./apiClient";
import { calculateOverallScore, getRiskLevel } from "./risk";
import { query } from "./db";
import {
  fetchWorldBankData,
  fetchImfData,
  fetchGdeltData,
  fetchNasaPowerData,
  fetchEnvironmentalData,
  fetchFinancingData,
  fetchSecurityData,
  fetchInfrastructureData,
  getIsoCodes,
} from "./realDataFetcher";

const SCHEMA = "app_a4367bd81985442d9dc8319de1ddc526";

/**
 * Run a single risk agent: research → score
 */
async function runRiskAgent(
  agentName,
  researchGoal,
  promptName,
  extraContext = "",
) {
  let researchData = "";
  try {
    researchData = await rapidResearch(researchGoal);
  } catch (e) {
    researchData = `Unable to fetch live data for ${agentName}. Using baseline estimates.`;
  }

  let score = 50; // default fallback
  let summary = "";
  try {
    let result = await applyPrompt(
      promptName,
      {
        research_data: researchData,
        context: extraContext,
      },
      "structured",
    );

    // Log raw response for new categories (financing, security, infrastructure) to debug parsing
    const isNewCategory = [
      "Financing Risk Agent",
      "Security Risk Agent",
      "Infrastructural Risk Agent",
    ].includes(agentName);
    if (isNewCategory) {
      console.log(`[${agentName}] raw response type:`, typeof result);
      console.log(
        `[${agentName}] raw response:`,
        typeof result === "string" ? result : JSON.stringify(result),
      );
    }

    // Empromptu may return a JSON string (e.g. raw LLM output); try to parse
    if (typeof result === "string") {
      try {
        const trimmed = result.trim();
        const jsonStr = trimmed.startsWith("[")
          ? trimmed
          : (trimmed.match(/\[[\s\S]*\]/) || [])[0];
        if (jsonStr) result = JSON.parse(jsonStr);
      } catch {
        // leave result as string for fallback regex below
      }
    }

    // Parse structured result — expect [{score: N, summary: "..."}]
    if (Array.isArray(result) && result.length > 0) {
      const parsed = result[0];
      // Empromptu sometimes returns ["None"] when prompt is unregistered or research is empty
      if (
        parsed === "None" ||
        (typeof parsed === "string" && parsed.trim() === "None")
      ) {
        console.warn(
          `[${agentName}] Empromptu returned ["None"]. Re-run POST /api/migrate to register the prompt, or check that research data is not empty.`,
        );
      } else if (typeof parsed !== "object" || parsed === null) {
        console.warn(
          `[${agentName}] Empromptu returned array but first element is not an object (got ${typeof parsed}). Expected [{ score, summary }].`,
        );
      } else {
        const rawScore =
          parsed.score ?? parsed.risk_score ?? parsed.value ?? parsed.Score;
        const parsedScore =
          rawScore === undefined || rawScore === null ? NaN : Number(rawScore);
        const nextScore = Number.isFinite(parsedScore)
          ? Math.min(100, Math.max(0, Math.round(parsedScore)))
          : 50;
        score = nextScore;
        summary = parsed.summary ?? parsed.Summary ?? "";
        if (score === 50 && !Number.isFinite(parsedScore)) {
          console.warn(
            `[${agentName}] Using fallback score=50 (unparseable/missing score from Empromptu).`,
          );
        }
      }
    } else if (typeof result === "string") {
      const match = result.match(/\b(\d{1,3})\b/);
      if (match) {
        score = Math.min(100, Math.max(0, parseInt(match[1], 10)));
      } else {
        console.warn(
          `[${agentName}] Empromptu returned string without numeric score; using fallback score=50.`,
        );
      }
    } else if (typeof result === "number") {
      score = Math.min(100, Math.max(0, Math.round(result)));
    } else {
      console.warn(
        `[${agentName}] Empromptu returned unexpected type (${typeof result}); using fallback score=50.`,
      );
    }
  } catch (e) {
    console.error(
      `${agentName} scoring error (Empromptu applyPrompt failed):`,
      e.message,
    );
    score = 50;
  }

  // Do not return research — it is large and must not be persisted in raw_data (score + summary only).
  return { score, summary };
}

/**
 * Full risk assessment pipeline for a property
 */
export async function runRiskAssessment(property, onProgress, reportId) {
  const year = new Date().getFullYear();
  const country = await resolveCountry(property);
  const coordsContext =
    property.lat && property.lng
      ? `Property coordinates: lat=${property.lat}, lng=${property.lng}.`
      : "";
  const propContext = `Property: ${property.address}, ${property.property_type} - ${property.use_type}. ${coordsContext}`;

  // Pre-fetch real data in parallel (5 s timeout per call; failures return '')
  const isoCodes = getIsoCodes(country);
  const [worldBankText, imfText, gdeltText, nasaText, envText, financingText, securityText, infrastructureText] =
    await Promise.all([
      isoCodes?.iso2 ? fetchWorldBankData(isoCodes.iso2) : Promise.resolve(""),
      isoCodes?.iso3 ? fetchImfData(isoCodes.iso3) : Promise.resolve(""),
      fetchGdeltData(country),
      property.lat && property.lng
        ? fetchNasaPowerData(property.lat, property.lng)
        : Promise.resolve(""),
      fetchEnvironmentalData({
        lat: property.lat,
        lng: property.lng,
        city: property.address?.split(",").slice(-2, -1)[0]?.trim() ?? "",
      }),
      fetchFinancingData(isoCodes?.iso2),
      fetchSecurityData(country, isoCodes?.iso2),
      fetchInfrastructureData(isoCodes?.iso2),
    ]);

  const agents = [
    {
      key: "currency",
      name: "Currency Risk Agent",
      goal: `As of ${year}, what is the current USD exchange rate for ${country}'s currency, its 12-month forex volatility, any recent devaluation events, and the IMF's latest currency stability assessment for ${country}? How does this affect purchasing power for ${property.use_type} ${property.property_type} real estate buyers?`,
      prompt: "score_currency_risk",
      extraContext: [propContext, imfText].filter(Boolean).join("\n\n"),
    },
    {
      key: "climate",
      name: "Climate Risk Agent",
      goal: `As of ${year}, what are the specific flood risk levels, landslide probability, and recorded natural disaster history for ${country}${property.lat && property.lng ? ` near latitude ${property.lat}, longitude ${property.lng}` : ""}? Include climate change projections from IPCC or World Bank Climate Portal and any extreme weather events in the past 3 years relevant to ${property.use_type} ${property.property_type} properties.`,
      prompt: "score_climate_risk",
      extraContext: [propContext, nasaText].filter(Boolean).join("\n\n"),
    },
    {
      key: "geopolitical",
      name: "Geopolitical Risk Agent",
      goal: `As of ${year}, what is ${country}'s current political stability score according to ACLED, Fragile States Index, or similar sources? Are there active conflicts, recent coups, or significant civil unrest? What is the regulatory environment for foreign and domestic real estate ownership, and what country risk rating does ${country} hold from major agencies?`,
      prompt: "score_geopolitical_risk",
      extraContext: [propContext, worldBankText, gdeltText]
        .filter(Boolean)
        .join("\n\n"),
    },
    {
      key: "economic",
      name: "Economic Risk Agent",
      goal: `As of ${year}, what are ${country}'s latest GDP growth rate, inflation rate, and unemployment figures from the World Bank or IMF? Is the economic trajectory stable, improving, or deteriorating? How do these indicators affect affordability and investment viability for ${property.use_type} ${property.property_type} real estate?`,
      prompt: "score_economic_risk",
      extraContext: [propContext, worldBankText, imfText]
        .filter(Boolean)
        .join("\n\n"),
    },
    {
      key: "fraud",
      name: "Fraud & Title Risk Agent",
      goal: `As of ${year}, how prevalent are property title disputes, land fraud, and deed forgery in ${country}? What are the most reported transaction security issues for ${property.use_type} ${property.property_type} properties? Are there official land registry systems or known weaknesses in title verification processes?`,
      prompt: "score_fraud_market_risk",
      extraContext: propContext,
    },
    {
      key: "environmental",
      name: "Environmental Risk Agent",
      goal: `As of ${year}, what are the documented environmental risks near ${property.lat && property.lng ? `latitude ${property.lat}, longitude ${property.lng} in ${country}` : country}? Include air and water pollution levels, soil contamination, proximity to industrial hazards, deforestation rates, and any environmental degradation trends that would affect a ${property.use_type} ${property.property_type} property.`,
      prompt: "score_environmental_risk",
      extraContext: [propContext, envText].filter(Boolean).join("\n\n"),
    },
    {
      key: "market",
      name: "Market Risk Agent",
      goal: `As of ${year}, what are the current ${property.use_type} ${property.property_type} real estate price trends, average rental yields, and market liquidity in ${country}? Is demand outpacing supply or vice versa? What do recent transaction volumes and investor sentiment indicators suggest about short-term price volatility?`,
      prompt: "score_market_risk",
      extraContext: propContext,
    },
    {
      key: "financing",
      name: "Financing Risk Agent",
      goal: `As of ${year}, what is the availability of mortgage financing for ${property.use_type} ${property.property_type} properties in ${country}? What are current bank lending rates, typical loan-to-value ratios, and any foreign ownership financing restrictions? How accessible is capital for real estate investors in ${country}, and are there significant barriers such as high interest rates, limited mortgage products, or strict eligibility requirements?`,
      prompt: "score_financing_risk",
      extraContext: [propContext, imfText, financingText].filter(Boolean).join("\n\n"),
    },
    {
      key: "security",
      name: "Security Risk Agent",
      goal: `As of ${year}, what is the crime index and reported crime rates in ${country}${property.lat && property.lng ? ` near latitude ${property.lat}, longitude ${property.lng}` : ""}? How prevalent is violent crime, burglary, and property crime in the area? What is the availability of gated communities, private security, and police response infrastructure? How do security conditions affect tenancy rates and property values for ${property.use_type} ${property.property_type} real estate?`,
      prompt: "score_security_risk",
      extraContext: [propContext, gdeltText, securityText].filter(Boolean).join("\n\n"),
    },
    {
      key: "infrastructure",
      name: "Infrastructural Risk Agent",
      goal: `As of ${year}, what is the state of infrastructure in ${country}${property.lat && property.lng ? ` near latitude ${property.lat}, longitude ${property.lng}` : ""}? Assess road quality and access, electricity reliability and load-shedding frequency, water supply consistency, internet connectivity, and proximity to transport hubs or urban centres. How do infrastructure conditions affect development potential and livability for ${property.use_type} ${property.property_type} real estate?`,
      prompt: "score_infrastructure_risk",
      extraContext: [propContext, worldBankText, infrastructureText].filter(Boolean).join("\n\n"),
    },
  ];

  const results = {};
  const rawData = {};

  await Promise.all(
    agents.map(async (agent) => {
      if (onProgress) onProgress(agent.key, "running", 0, agents.length);

      const { score, summary } = await runRiskAgent(
        agent.name,
        agent.goal,
        agent.prompt,
        agent.extraContext,
      );

      results[`${agent.key}_score`] = score;
      // Persist score + summary only — full research text is not stored (keeps DB and API payloads small).
      rawData[agent.key] = { score, summary };

      if (onProgress) onProgress(agent.key, "complete", 0, agents.length);

      if (reportId) {
        await query(
          `UPDATE ${SCHEMA}.risk_reports
           SET ${agent.key}_score = $1
           WHERE id = $2`,
          [score, reportId],
        ).catch((e) =>
          console.error(`[Agent ${agent.key}] DB write error:`, e.message),
        );
      }
    }),
  );

  const overall = calculateOverallScore(results);
  const riskLevel = getRiskLevel(overall);

  // Write raw_data once after all agents complete to avoid concurrent overwrites
  if (reportId) {
    await query(
      `UPDATE ${SCHEMA}.risk_reports SET raw_data = $1::jsonb WHERE id = $2`,
      [JSON.stringify(rawData), reportId],
    ).catch((e) => console.error("[raw_data write error]", e.message));
  }

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
        { headers: { "User-Agent": "AfriRisk/1.0" } },
      );
      const data = await res.json();
      if (data?.address?.country) return data.address.country;
    } catch (e) {
      console.warn(
        "Reverse geocoding failed, falling back to address parsing:",
        e.message,
      );
    }
  }
  // Try forward geocoding with address string
  if (property.address) {
    try {
      const encoded = encodeURIComponent(property.address);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&addressdetails=1&limit=1`,
        { headers: { "User-Agent": "AfriRisk/1.0" } },
      );
      const data = await res.json();
      if (data?.[0]?.address?.country) return data[0].address.country;
    } catch (e) {
      console.warn(
        "Forward geocoding failed, falling back to address parsing:",
        e.message,
      );
    }
  }
  // Last resort: string parsing
  if (!property.address) return "Africa";
  const parts = property.address.split(",").map((s) => s.trim());
  if (parts.length >= 2) return parts[parts.length - 1];
  return property.address || "Africa";
}
