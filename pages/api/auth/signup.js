import { setupSchema, query } from '../../../lib/db';

let schemaReady = false;

// Next.js 15 changed how the body parser works in some configurations.
// Explicitly disable the built-in body parser and parse manually so we
// always get a plain object regardless of runtime version.
export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  if (!schemaReady) {
    try {
      await setupSchema();
    } catch (e) {
      console.warn('setupSchema warning (non-fatal):', e.message);
    }
    schemaReady = true;
  }

  // In Next 15 the body may arrive as a string if the built-in parser is
  // misconfigured; normalise it to an object here so destructuring never
  // throws "Cannot read properties of undefined".
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  if (!body || typeof body !== 'object') body = {};

  const { email, phone, name, location } = body;
  if (!email || !name) return res.status(400).json({ error: 'Email and name are required.' });

  try {
    const existing = await query(
      'SELECT id FROM app_a4367bd81985442d9dc8319de1ddc526.users WHERE email = $1',
      [email.toLowerCase()]
    );
    if (existing.data && existing.data.length > 0) {
      return res.status(400).json({ error: 'An account with this email already exists. Please sign in.' });
    }

    await query(
      `INSERT INTO app_a4367bd81985442d9dc8319de1ddc526.users (email, phone, name, location, tier, report_count)
       VALUES ($1, $2, $3, $4, 'free', 0)`,
      [email.toLowerCase(), phone || null, name, location || null]
    );

    return res.status(200).json({ success: true, message: 'Account created. Please sign in with your email.' });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to create account: ' + e.message });
  }
}
