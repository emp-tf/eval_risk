import { setupSchema, query } from "../../../lib/db";
import { generateOTP } from "../../../lib/auth";

let schemaReady = false;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  // Wrap setupSchema in its own try/catch so schema errors don't break the response:
  // a non-JSON or error response from the schema endpoint would otherwise
  // propagate as an unhandled throw, causing Next.js to return an HTML page
  // instead of JSON, which the client sees as "Unexpected token '<'".
  if (!schemaReady) {
    try {
      await setupSchema();
    } catch (e) {
      console.warn("setupSchema warning (non-fatal):", e.message);
    }
    schemaReady = true;
  }

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required." });

  try {
    // Check user exists
    const userResult = await query(
      "SELECT id FROM app_a4367bd81985442d9dc8319de1ddc526.users WHERE email = $1",
      [email.toLowerCase()],
    );
    if (!userResult.data || userResult.data.length === 0) {
      return res.status(404).json({
        error: "No account found with this email. Please sign up first.",
      });
    }

    // Generate OTP
    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 30 * 1000).toISOString(); // 30 seconds

    // Invalidate old OTPs for this email
    await query(
      `UPDATE app_a4367bd81985442d9dc8319de1ddc526.otp_codes SET used = true WHERE email = $1 AND used = false`,
      [email.toLowerCase()],
    );

    // Store new OTP
    await query(
      `INSERT INTO app_a4367bd81985442d9dc8319de1ddc526.otp_codes (email, code, expires_at, used)
       VALUES ($1, $2, $3, false)`,
      [email.toLowerCase(), code, expiresAt],
    );

    return res.status(200).json({
      success: true,
      message: "OTP sent to your email.",
      devOtp: code, // Remove in production — for demo only
    });
  } catch (e) {
    return res.status(500).json({ error: "Failed to send OTP: " + e.message });
  }
}
