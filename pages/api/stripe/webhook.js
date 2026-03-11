import { query } from '../../../lib/db';

export const config = { api: { bodyParser: false } };

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) return res.status(400).json({ error: 'Webhook secret not configured.' });

  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const rawBody = await getRawBody(req);
    const sig = req.headers['stripe-signature'];

    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (e) {
      return res.status(400).json({ error: `Webhook signature error: ${e.message}` });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.metadata?.userId;
      if (userId) {
        await query(
          `UPDATE app_a4367bd81985442d9dc8319de1ddc526.users
           SET tier = 'paid', stripe_customer_id = $1, stripe_subscription_id = $2
           WHERE id = $3`,
          [session.customer, session.subscription, userId]
        );
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      await query(
        `UPDATE app_a4367bd81985442d9dc8319de1ddc526.users
         SET tier = 'free'
         WHERE stripe_subscription_id = $1`,
        [subscription.id]
      );
    }

    return res.status(200).json({ received: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
