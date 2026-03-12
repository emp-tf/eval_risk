import { query } from './db';

export function parseCookies(cookieHeader) {
  if (!cookieHeader) return {};
  return Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [k, ...v] = c.trim().split('=');
      return [k, decodeURIComponent(v.join('='))];
    })
  );
}

export async function getSessionUser(req) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies['session_token'];
  if (!token) return null;

  try {
    const result = await query(
      `SELECT s.user_id, s.expires_at, u.id, u.email, u.name, u.phone, u.location, u.tier, u.report_count
       FROM app_a4367bd81985442d9dc8319de1ddc526.sessions s
       JOIN app_a4367bd81985442d9dc8319de1ddc526.users u ON u.id = s.user_id
       WHERE s.token = $1 AND s.expires_at > NOW()`,
      [token]
    );
    if (!result.data || result.data.length === 0) return null;
    return result.data[0];
  } catch {
    return null;
  }
}

export function setSessionCookie(res, token) {
  const maxAge = 60 * 60 * 24 * 7; // 7 days
  res.setHeader(
    'Set-Cookie',
    `session_token=${token}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax`
  );
}

export function clearSessionCookie(res) {
  res.setHeader(
    'Set-Cookie',
    'session_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax'
  );
}

export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
