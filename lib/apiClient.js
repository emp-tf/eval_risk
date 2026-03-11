const API_BASE_URL = 'https://builder-api.staging.empromptu.ai';
const AUTH_HEADERS = {
  'Content-Type': 'application/json',
  Authorization: 'Bearer 0bae30670626dd0a19882003a9a516a5',
  'X-Generated-App-ID': 'a4367bd8-1985-442d-9dc8-319de1ddc526',
  'X-Usage-Key': 'e8e9582b3ae16d1377f03c83d7aec2c6',
};

export async function rapidResearch(goal) {
  const res = await fetch(`${API_BASE_URL}/rapid_research`, {
    method: 'POST',
    headers: AUTH_HEADERS,
    body: JSON.stringify({ goal }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`rapid_research failed: ${err}`);
  }
  const data = await res.json();
  return data.value || '';
}

export async function setupPrompt(promptName, inputVariables, promptText) {
  const res = await fetch(`${API_BASE_URL}/setup_ai_prompt`, {
    method: 'POST',
    headers: AUTH_HEADERS,
    body: JSON.stringify({
      prompt_name: promptName,
      input_variables: inputVariables,
      prompt_text: promptText,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`setup_ai_prompt failed: ${err}`);
  }
  return res.json();
}

export async function applyPrompt(promptName, inputData, returnType = 'structured') {
  const res = await fetch(`${API_BASE_URL}/apply_prompt_to_data`, {
    method: 'POST',
    headers: AUTH_HEADERS,
    body: JSON.stringify({
      prompt_name: promptName,
      input_data: { ...inputData, return_type: returnType },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`apply_prompt_to_data failed: ${err}`);
  }
  const data = await res.json();
  return data.value;
}

export { AUTH_HEADERS, API_BASE_URL };
