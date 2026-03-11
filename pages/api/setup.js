import { setupSchema } from '../../lib/db';

export default async function handler(req, res) {
  try {
    const result = await setupSchema();
    return res.status(200).json({ success: true, result });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
