import { query } from '../../../lib/db';
import { getSessionUser } from '../../../lib/auth';
import { runRiskAssessment } from '../../../lib/agents';

export const config = { api: { bodyParser: true, responseLimit: false } };

export default async function handler(req, res) {
  const user = await getSessionUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized.' });

  const { propertyId } = req.query;

  // GET: check status
  if (req.method === 'GET') {
    try {
      const result = await query(
        `SELECT * FROM app_a4367bd81985442d9dc8319de1ddc526.risk_reports WHERE property_id = $1 AND user_id = $2 ORDER BY created_at DESC LIMIT 1`,
        [propertyId, user.id]
      );
      return res.status(200).json({ report: result.data?.[0] || null });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // POST: start assessment
  if (req.method === 'POST') {
    // Get property
    const propResult = await query(
      `SELECT * FROM app_a4367bd81985442d9dc8319de1ddc526.properties WHERE id = $1 AND user_id = $2`,
      [propertyId, user.id]
    );
    if (!propResult.data || propResult.data.length === 0) {
      return res.status(404).json({ error: 'Property not found.' });
    }
    const property = propResult.data[0];

    // Check for existing complete report
    const existingReport = await query(
      `SELECT id, status FROM app_a4367bd81985442d9dc8319de1ddc526.risk_reports WHERE property_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [propertyId]
    );
    if (existingReport.data?.[0]?.status === 'complete') {
      return res.status(200).json({ message: 'Report already complete.', reportId: existingReport.data[0].id });
    }

    // Create pending report
    let reportId;
    if (!existingReport.data || existingReport.data.length === 0) {
      const createResult = await query(
        `INSERT INTO app_a4367bd81985442d9dc8319de1ddc526.risk_reports (property_id, user_id, status) VALUES ($1, $2, 'pending') RETURNING id`,
        [propertyId, user.id]
      );
      reportId = createResult.data[0].id;
    } else {
      reportId = existingReport.data[0].id;
    }

    // Respond immediately, run assessment async
    res.status(202).json({ message: 'Assessment started.', reportId });

    // Run assessment in background
    runRiskAssessmentAsync(property, reportId, user.id);
    return;
  }

  return res.status(405).end();
}

async function runRiskAssessmentAsync(property, reportId, userId) {
  try {
    const results = await runRiskAssessment(property, (agentKey, status, progress, total) => {
      // Could push to SSE here in future
      console.log(`[Agent ${agentKey}] ${status} (${progress}/${total})`);
    }, reportId);

    await query(
      `UPDATE app_a4367bd81985442d9dc8319de1ddc526.risk_reports
       SET overall_score = $1, risk_level = $2,
           currency_score = $3, climate_score = $4, geopolitical_score = $5,
           economic_score = $6, fraud_score = $7, market_score = $8,
           environmental_score = $9, ai_score = $10,
           raw_data = $11, status = 'complete'
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
      `UPDATE app_a4367bd81985442d9dc8319de1ddc526.risk_reports SET status = 'error' WHERE id = $1`,
      [reportId]
    ).catch(() => {});
  }
}
