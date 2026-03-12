/**
 * Strip research (and any other fat fields) from report.raw_data before API response.
 * Safe to call on already-slim objects (idempotent).
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
