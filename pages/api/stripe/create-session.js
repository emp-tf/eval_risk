import { getSessionUser } from '../../../lib/auth';

// Placeholder Stripe integration
// Replace STRIPE_SECRET_KEY and price IDs with real values when ready
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';
const PRICE_MONTHLY = process.env.STRIPE_PRICE_MONTHLY || 'price_monthly_placeholder';
const PRICE_ANNUAL = process.env.STRIPE_PRICE_ANNUAL || 'price_annual_placeholder';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const user = await getSessionUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized.' });

  const { plan } = req.body;
  const priceId = plan === 'annual' ? PRICE_ANNUAL : PRICE_MONTHLY;

  // If no real Stripe key, return mock response
  if (STRIPE_SECRET_KEY === 'sk_test_placeholder') {
    return res.status(200).json({
      error: 'Stripe is not yet configured. Please add STRIPE_SECRET_KEY, STRIPE_PRICE_MONTHLY, and STRIPE_PRICE_ANNUAL to your environment variables.',
    });
  }

  try {
    const stripe = require('stripe')(STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:2052'}/dashboard?upgraded=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:2052'}/dashboard`,
      metadata: { userId: user.id },
    });
    return res.status(200).json({ url: session.url });
  } catch (e) {
    return res.status(500).json({ error: 'Stripe error: ' + e.message });
  }
}
