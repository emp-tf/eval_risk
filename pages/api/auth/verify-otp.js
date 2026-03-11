import { query } from '../../../lib/db';
import { setSessionCookie } from '../../../lib/auth';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: 'Email and code are required.' });

  try {
    // Find valid OTP
    const otpResult = await query(
      `SELECT id FROM app_a4367bd81985442d9dc8319de1ddc526.otp_codes
       WHERE email = $1 AND code = $2 AND used = false AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [email.toLowerCase(), code.trim()]
    );

    if (!otpResult.data || otpResult.data.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired OTP code. Please request a new one.' });
    }

    // Mark OTP as used
    await query(
      `UPDATE app_a4367bd81985442d9dc8319de1ddc526.otp_codes SET used = true WHERE id = $1`,
      [otpResult.data[0].id]
    );

    // Get user
    const userResult = await query(
      'SELECT * FROM app_a4367bd81985442d9dc8319de1ddc526.users WHERE email = $1',
      [email.toLowerCase()]
    );
    if (!userResult.data || userResult.data.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    const user = userResult.data[0];

    // Create session
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await query(
      `INSERT INTO app_a4367bd81985442d9dc8319de1ddc526.sessions (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, token, expiresAt]
    );

    setSessionCookie(res, token);
    return res.status(200).json({ success: true, user: { id: user.id, email: user.email, name: user.name, tier: user.tier } });
  } catch (e) {
    return res.status(500).json({ error: 'Verification failed: ' + e.message });
  }
}
