/**
 * Strip research (and any other fat fields) from report.raw_data before API response.
 * Safe to call on already-slim objects (idempotent).
 *
 * Storage: New assessments persist only { score, summary } per agent (see lib/agents.js).
 * Old rows may still contain `research` — reads stay fast via riskReportSelectSlim
 * plus this helper. To shrink existing DB rows permanently, re-run the risk assessment
 * for that property, or one-off UPDATE each report setting raw_data to the slim
 * object (same shape this function produces).
 */
export function slimRawDataForResponse(rawData) {
  if (rawData == null) return rawData;
  let obj = rawData;
  if (typeof obj === 'string') {
    try {
      obj = JSON.parse(obj);
    } catch {
      return null;
    }
  }
  if (typeof obj !== 'object' || Array.isArray(obj)) return rawData;

  const slim = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      slim[k] = {
        score: v.score ?? null,
        summary: v.summary ?? '',
      };
    }
  }
  return slim;
}
