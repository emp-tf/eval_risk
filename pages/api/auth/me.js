import { getSessionUser } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const user = await getSessionUser(req);
    if (!user) return res.status(200).json({ user: null });
    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        location: user.location,
        tier: user.tier,
        report_count: user.report_count,
      },
    });
  } catch (e) {
    return res.status(200).json({ user: null });
  }
}
