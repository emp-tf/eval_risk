import { query } from '../../../lib/db';
import { getSessionUser } from '../../../lib/auth';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  const user = await getSessionUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized. Please sign in.' });

  if (req.method === 'GET') {
    try {
      const result = await query(
        `SELECT
           p.*,
           r.overall_score,
           r.risk_level,
           r.status,
           r.id as report_id
         FROM app_a4367bd81985442d9dc8319de1ddc526.properties p
         LEFT JOIN LATERAL (
           SELECT overall_score, risk_level, status, id
           FROM app_a4367bd81985442d9dc8319de1ddc526.risk_reports
           WHERE property_id = p.id
           ORDER BY created_at DESC
           LIMIT 1
         ) r ON true
         WHERE p.user_id = $1
         ORDER BY p.created_at DESC`,
        [user.id]
      );
      return res.status(200).json({ properties: result.data || [] });
    } catch (e) {
      return res.status(500).json({ error: 'Failed to load properties: ' + e.message });
    }
  }

  if (req.method === 'POST') {
    const {
      address, lat, lng, property_type, use_type, sub_type,
      bedrooms, amenities, purchase_price, financing_method, image_url,
    } = req.body;

    if (!address && !lat) return res.status(400).json({ error: 'Address or coordinates are required.' });

    try {
      const result = await query(
        `INSERT INTO app_a4367bd81985442d9dc8319de1ddc526.properties
         (user_id, address, lat, lng, property_type, use_type, sub_type, bedrooms, amenities, purchase_price, financing_method, image_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`,
        [user.id, address, lat || null, lng || null, property_type, use_type, sub_type || null,
         bedrooms || null, amenities || null, purchase_price || null, financing_method || null, image_url || null]
      );

      const property = result.data[0];

      return res.status(201).json({ property });
    } catch (e) {
      return res.status(500).json({ error: 'Failed to create property: ' + e.message });
    }
  }

  return res.status(405).end();
}
