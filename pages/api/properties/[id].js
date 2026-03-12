import { query } from '../../../lib/db';
import { getSessionUser } from '../../../lib/auth';
import { riskReportSelectSlim } from '../../../lib/riskReportSelect';
import { slimRawDataForResponse } from '../../../lib/slimRawDataForResponse';

export const config = { api: { responseLimit: false } };

const SCHEMA = 'app_a4367bd81985442d9dc8319de1ddc526';

export default async function handler(req, res) {
  const user = await getSessionUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized.' });

  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const propResult = await query(
        `SELECT * FROM ${SCHEMA}.properties WHERE id = $1 AND user_id = $2`,
        [id, user.id]
      );
      if (!propResult.data || propResult.data.length === 0) {
        return res.status(404).json({ error: 'Property not found.' });
      }

      let report = null;
      try {
        const reportResult = await query(
          riskReportSelectSlim('r.property_id = $1', 'ORDER BY r.created_at DESC LIMIT 1'),
          [id]
        );
        report = reportResult.data?.[0] || null;
      } catch {
        // DB may not support jsonb_each / val - 'research'; fetch row then slim in JS so response stays small.
        const fallback = await query(
          `SELECT * FROM ${SCHEMA}.risk_reports WHERE property_id = $1 ORDER BY created_at DESC LIMIT 1`,
          [id]
        );
        report = fallback.data?.[0] || null;
      }

      // Never send research over the wire — always project to score + summary only.
      if (report?.raw_data != null) {
        report.raw_data = slimRawDataForResponse(report.raw_data);
      }

      return res.status(200).json({
        property: propResult.data[0],
        report,
      });
    } catch (e) {
      return res.status(500).json({ error: 'Failed to load property: ' + e.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await query(
        `DELETE FROM ${SCHEMA}.risk_reports WHERE property_id = $1`,
        [id]
      );
      await query(
        `DELETE FROM ${SCHEMA}.properties WHERE id = $1 AND user_id = $2`,
        [id, user.id]
      );
      return res.status(200).json({ success: true });
    } catch (e) {
      return res.status(500).json({ error: 'Failed to delete: ' + e.message });
    }
  }

  return res.status(405).end();
}
