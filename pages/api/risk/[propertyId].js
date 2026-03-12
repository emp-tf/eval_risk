import { query } from '../../../lib/db';
import { getSessionUser } from '../../../lib/auth';
import { riskReportSelectSlim } from '../../../lib/riskReportSelect';
import { slimRawDataForResponse } from '../../../lib/slimRawDataForResponse';
import { runRiskAssessment } from '../../../lib/agents';

export const config = { api: { bodyParser: true, responseLimit: false } };

const SCHEMA = 'app_a4367bd81985442d9dc8319de1ddc526';

export default async function handler(req, res) {
  const user = await getSessionUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized.' });

  const { propertyId } = req.query;

  // GET: check status — never return raw_data.research (slim SQL + always slim in JS)
  if (req.method === 'GET') {
    try {
      let report = null;
      try {
        const result = await query(
          riskReportSelectSlim(
            'r.property_id = $1 AND r.user_id = $2',
            'ORDER BY r.created_at DESC LIMIT 1'
          ),
          [propertyId, user.id]
        );
        report = result.data?.[0] || null;
      } catch {
        const fallback = await query(
          `SELECT * FROM ${SCHEMA}.risk_reports WHERE property_id = $1 AND user_id = $2 ORDER BY created_at DESC LIMIT 1`,
          [propertyId, user.id]
        );
        report = fallback.data?.[0] || null;
      }

      if (report?.raw_data != null) {
        report.raw_data = slimRawDataForResponse(report.raw_data);
      }
      return res.status(200).json({ report });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // POST: start assessment
  if (req.method === 'POST') {
    const propResult = await query(
      `SELECT * FROM ${SCHEMA}.properties WHERE id = $1 AND user_id = $2`,
      [propertyId, user.id]
    );
    if (!propResult.data || propResult.data.length === 0) {
      return res.status(404).json({ error: 'Property not found.' });
    }
    const property = propResult.data[0];

    const existingReport = await query(
      `SELECT id, status FROM ${SCHEMA}.risk_reports WHERE property_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [propertyId]
    );
    if (existingReport.data?.[0]?.status === 'complete') {
      return res.status(200).json({ message: 'Report already complete.', reportId: existingReport.data[0].id });
    }

    let reportId;
    if (!existingReport.data || existingReport.data.length === 0) {
      const createResult = await query(
        `INSERT INTO ${SCHEMA}.risk_reports (property_id, user_id, status) VALUES ($1, $2, 'pending') RETURNING id`,
        [propertyId, user.id]
      );
      reportId = createResult.data[0].id;
    } else {
      reportId = existingReport.data[0].id;
    }

    res.status(202).json({ message: 'Assessment started.', reportId });
    runRiskAssessmentAsync(property, reportId, user.id);
    return;
  }

  return res.status(405).end();
}

async function runRiskAssessmentAsync(property, reportId, userId) {
  try {
    const results = await runRiskAssessment(property, (agentKey, status, progress, total) => {
      console.log(`[Agent ${agentKey}] ${status} (${progress}/${total})`);
    }, reportId);

    await query(
      `UPDATE ${SCHEMA}.risk_reports
       SET overall_score = $1, risk_level = $2,
           currency_score = $3, climate_score = $4, geopolitical_score = $5,
           economic_score = $6, fraud_score = $7, market_score = $8,
           environmental_score = $9, ai_score = $10,
           raw_data = $11::jsonb, status = 'complete'
       WHERE id = $12`,
      [
        results.overall_score,
        results.risk_level,
        results.currency_score,
        results.climate_score,
        results.geopolitical_score,
        results.economic_score,
        results.fraud_score,
        results.market_score,
        results.environmental_score,
        results.ai_score,
        JSON.stringify(results.raw_data),
        reportId,
      ]
    );
    console.log(`[Risk] Report ${reportId} complete. Score: ${results.overall_score}`);
  } catch (e) {
    console.error('[Risk] Assessment error:', e.message);
    await query(
      `UPDATE ${SCHEMA}.risk_reports SET status = 'error' WHERE id = $1`,
      [reportId]
    ).catch(() => {});
  }
}
