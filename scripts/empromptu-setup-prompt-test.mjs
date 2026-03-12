#!/usr/bin/env node
/**
 * One-off test: register a single Empromptu prompt via setup_ai_prompt, then
 * call apply_prompt_to_data to verify it works.
 *
 * Usage (from repo root):
 *   node scripts/empromptu-setup-prompt-test.mjs
 *
 * Requires env (same as the app):
 *   EMPROMPTU_API_BASE_URL
 *   EMPROMPTU_API_KEY
 *   EMPROMPTU_APP_ID
 *   EMPROMPTU_USAGE_KEY
 *
 * Optional: put them in .env.local — the script tries to load it if present.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function loadEnvLocal() {
  const envPath = path.join(root, '.env.local');
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, 'utf8');
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
      val = val.slice(1, -1);
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadEnvLocal();

const API_BASE_URL = process.env.EMPROMPTU_API_BASE_URL;
const AUTH_HEADERS = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${process.env.EMPROMPTU_API_KEY}`,
  'X-Generated-App-ID': process.env.EMPROMPTU_APP_ID,
  'X-Usage-Key': process.env.EMPROMPTU_USAGE_KEY,
};

const PROMPT_NAME = 'afririsk_prompt_test';

// Must match what lib/agents.js passes into applyPrompt: research_data + context
const INPUT_VARIABLES = ['research_data', 'context'];

// Prompt text: ask for structured output compatible with lib/agents.js parser
// (array with first element { score, summary })
const PROMPT_TEXT = `You are a test scorer. Read research_data and context (property/country context).

Return ONLY valid JSON (no markdown): a single-element array like:
[{"score": <integer 0-100>, "summary": "<one short sentence>"}]

If information is missing, still output score 50 and a short summary saying data was limited.`;

async function setupPrompt() {
  const res = await fetch(`${API_BASE_URL}/setup_ai_prompt`, {
    method: 'POST',
    headers: AUTH_HEADERS,
    body: JSON.stringify({
      prompt_name: PROMPT_NAME,
      input_variables: INPUT_VARIABLES,
      prompt_text: PROMPT_TEXT,
    }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`setup_ai_prompt ${res.status}: ${text}`);
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function applyPrompt() {
  const res = await fetch(`${API_BASE_URL}/apply_prompt_to_data`, {
    method: 'POST',
    headers: AUTH_HEADERS,
    body: JSON.stringify({
      prompt_name: PROMPT_NAME,
      input_data: {
        research_data: 'Test research: Country X has moderate inflation and stable currency.',
        context: 'Property: test address, Residential - Developed.',
        return_type: 'structured',
      },
    }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`apply_prompt_to_data ${res.status}: ${text}`);
  const data = JSON.parse(text);
  return data.value;
}

function main() {
  if (!API_BASE_URL || !process.env.EMPROMPTU_API_KEY) {
    console.error('Missing EMPROMPTU_API_BASE_URL or EMPROMPTU_API_KEY. Set env or add .env.local.');
    process.exit(1);
  }
}

main();

console.log('API_BASE_URL:', API_BASE_URL);
console.log('Registering prompt:', PROMPT_NAME);

setupPrompt()
  .then((out) => {
    console.log('setup_ai_prompt OK:', typeof out === 'string' ? out : JSON.stringify(out, null, 2));
    console.log('\nCalling apply_prompt_to_data...');
    return applyPrompt();
  })
  .then((value) => {
    console.log('apply_prompt_to_data value:', JSON.stringify(value, null, 2));
    console.log('\nDone. If you see score + summary, Empromptu prompt pipeline works.');
  })
  .catch((e) => {
    console.error(e.message || e);
    process.exit(1);
  });
