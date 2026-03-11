import { query } from '../../../lib/db';
import { getSessionUser } from '../../../lib/auth';

export default async function handler(req, res) {
  const user = await getSessionUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized.' });

  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const propResult = await query(
        `SELECT * FROM app_a4367bd81985442d9dc8319de1ddc526.properties WHERE id = $1 AND user_id = $2`,
        [id, user.id]
      );
      if (!propResult.data || propResult.data.length === 0) {
        return res.status(404).json({ error: 'Property not found.' });
      }

      const reportResult = await query(
        `SELECT * FROM app_a4367bd81985442d9dc8319de1ddc526.risk_reports WHERE property_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [id]
      );

      return res.status(200).json({
        property: propResult.data[0],
        report: reportResult.data?.[0] || null,
      });
    } catch (e) {
      return res.status(500).json({ error: 'Failed to load property: ' + e.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      // Delete reports first (FK constraint)
      await query(
        `DELETE FROM app_a4367bd81985442d9dc8319de1ddc526.risk_reports WHERE property_id = $1`,
        [id]
      );
      await query(
        `DELETE FROM app_a4367bd81985442d9dc8319de1ddc526.properties WHERE id = $1 AND user_id = $2`,
        [id, user.id]
      );
      return res.status(200).json({ success: true });
    } catch (e) {
      return res.status(500).json({ error: 'Failed to delete: ' + e.message });
    }
  }

  return res.status(405).end();
}
