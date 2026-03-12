/**
 * SELECT for risk_reports without hauling raw_data.research over the wire.
 * Strips `research` from each agent object in raw_data at the DB (jsonb) level
 * so GET property/detail and polling stay fast.
 */
const SCHEMA = 'app_a4367bd81985442d9dc8319de1ddc526';

/** Slim raw_data: same keys, only score + summary (research key removed). */
const RAW_DATA_SLIM = `
  CASE WHEN r.raw_data IS NULL THEN NULL ELSE (
    SELECT COALESCE(
      jsonb_object_agg(
        e.key,
        CASE
          WHEN jsonb_typeof(e.val) = 'object' THEN e.val - 'research'
          ELSE e.val
        END
      ),
      '{}'::jsonb
    )
    FROM jsonb_each(r.raw_data) AS e(key, val)
  ) END`;

/**
 * Latest report for a property — raw_data already slim (no research blobs).
 * @param {string} whereClause e.g. "r.property_id = $1" or "r.property_id = $1 AND r.user_id = $2"
 * @param {string} orderAndLimit e.g. "ORDER BY r.created_at DESC LIMIT 1"
 */
export function riskReportSelectSlim(whereClause, orderAndLimit) {
  return `
    SELECT
      r.id, r.property_id, r.user_id,
      r.overall_score, r.risk_level,
      r.currency_score, r.climate_score, r.geopolitical_score, r.economic_score,
      r.fraud_score, r.market_score, r.environmental_score, r.ai_score,
      r.status, r.created_at,
      ${RAW_DATA_SLIM} AS raw_data
    FROM ${SCHEMA}.risk_reports r
    WHERE ${whereClause}
    ${orderAndLimit}
  `.trim();
}
