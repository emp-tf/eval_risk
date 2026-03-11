const DB_BASE = process.env.EMPROMPTU_API_BASE_URL;
const SCHEMA = 'app_a4367bd81985442d9dc8319de1ddc526';

const AUTH_HEADERS = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${process.env.EMPROMPTU_API_KEY}`,
  'X-Generated-App-ID': process.env.EMPROMPTU_APP_ID,
  'X-Usage-Key': process.env.EMPROMPTU_USAGE_KEY,
};

export async function setupSchema() {
  const res = await fetch(`${DB_BASE}/database/schema`, {
    method: 'POST',
    headers: AUTH_HEADERS,
    body: JSON.stringify({
      tables: [
        {
          name: 'users',
          columns: [
            { name: 'id', type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
            { name: 'email', type: 'text', nullable: false },
            { name: 'phone', type: 'text', nullable: true },
            { name: 'name', type: 'text', nullable: false },
            { name: 'location', type: 'text', nullable: true },
            { name: 'tier', type: 'text', nullable: false, default: "'free'" },
            { name: 'report_count', type: 'integer', nullable: false, default: '0' },
            { name: 'stripe_customer_id', type: 'text', nullable: true },
            { name: 'stripe_subscription_id', type: 'text', nullable: true },
            { name: 'created_at', type: 'timestamptz', default: 'now()' },
          ],
        },
        {
          name: 'otp_codes',
          columns: [
            { name: 'id', type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
            { name: 'email', type: 'text', nullable: false },
            { name: 'code', type: 'text', nullable: false },
            { name: 'expires_at', type: 'timestamptz', nullable: false },
            { name: 'used', type: 'boolean', default: 'false' },
            { name: 'created_at', type: 'timestamptz', default: 'now()' },
          ],
        },
        {
          name: 'sessions',
          columns: [
            { name: 'id', type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
            { name: 'user_id', type: 'uuid', nullable: false },
            { name: 'token', type: 'text', nullable: false },
            { name: 'expires_at', type: 'timestamptz', nullable: false },
            { name: 'created_at', type: 'timestamptz', default: 'now()' },
          ],
        },
        {
          name: 'properties',
          columns: [
            { name: 'id', type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
            { name: 'user_id', type: 'uuid', nullable: false },
            { name: 'address', type: 'text', nullable: false },
            { name: 'lat', type: 'numeric', nullable: true },
            { name: 'lng', type: 'numeric', nullable: true },
            { name: 'property_type', type: 'text', nullable: false },
            { name: 'use_type', type: 'text', nullable: false },
            { name: 'sub_type', type: 'text', nullable: true },
            { name: 'bedrooms', type: 'integer', nullable: true },
            { name: 'amenities', type: 'text', nullable: true },
            { name: 'purchase_price', type: 'numeric', nullable: true },
            { name: 'financing_method', type: 'text', nullable: true },
            { name: 'image_url', type: 'text', nullable: true },
            { name: 'created_at', type: 'timestamptz', default: 'now()' },
          ],
        },
        {
          name: 'risk_reports',
          columns: [
            { name: 'id', type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
            { name: 'property_id', type: 'uuid', nullable: false },
            { name: 'user_id', type: 'uuid', nullable: false },
            { name: 'overall_score', type: 'integer', nullable: true },
            { name: 'risk_level', type: 'text', nullable: true },
            { name: 'currency_score', type: 'integer', nullable: true },
            { name: 'climate_score', type: 'integer', nullable: true },
            { name: 'geopolitical_score', type: 'integer', nullable: true },
            { name: 'economic_score', type: 'integer', nullable: true },
            { name: 'fraud_score', type: 'integer', nullable: true },
            { name: 'market_score', type: 'integer', nullable: true },
            { name: 'environmental_score', type: 'integer', nullable: true },
            { name: 'ai_score', type: 'integer', nullable: true },
            { name: 'raw_data', type: 'jsonb', nullable: true },
            { name: 'status', type: 'text', nullable: false, default: "'pending'" },
            { name: 'created_at', type: 'timestamptz', default: 'now()' },
          ],
        },
      ],
      indexes: [
        { table: 'users', columns: ['email'], name: 'users_email_uq', unique: true },
        { table: 'sessions', columns: ['token'], name: 'sessions_token_uq', unique: true },
        { table: 'properties', columns: ['user_id'], name: 'properties_user_id_idx' },
        { table: 'risk_reports', columns: ['property_id'], name: 'risk_reports_property_id_idx' },
      ],
    }),
  });
  // Safely parse — the schema endpoint may return a non-JSON body (e.g. an HTML
  // error page or an empty 304-equivalent) when the schema already exists.
  // Swallowing a parse error here is intentional: 200 and "already exists" are
  // both acceptable outcomes and must not crash the calling API handler.
  try {
    return await res.json();
  } catch {
    return { ok: res.ok, status: res.status };
  }
}

export async function query(sql, params = []) {
  const res = await fetch(`${DB_BASE}/database/query`, {
    method: 'POST',
    headers: AUTH_HEADERS,
    body: JSON.stringify({ query: sql, params }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DB query failed: ${err}`);
  }
  return res.json();
}

export { SCHEMA, AUTH_HEADERS, DB_BASE };
