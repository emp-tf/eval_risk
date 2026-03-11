import { query } from '../../../lib/db';
import { parseCookies, clearSessionCookie } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const cookies = parseCookies(req.headers.cookie);
  const token = cookies['session_token'];

  if (token) {
    try {
      await query(
        `DELETE FROM app_a4367bd81985442d9dc8319de1ddc526.sessions WHERE token = $1`,
        [token]
      );
    } catch {}
  }

  clearSessionCookie(res);
  return res.status(200).json({ success: true });
}
