const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

const extractJson = (text) => {
  const trimmed = String(text || '').trim()
  const start = trimmed.indexOf('{')
  const end = trimmed.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Groq response did not contain JSON')
  }
  return JSON.parse(trimmed.slice(start, end + 1))
}

const callGroqJson = async ({ systemPrompt, userPayload }) => {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured')
  }

  const controller = new AbortController()
  const timeout = setTimeout(
    () => controller.abort(),
    Number(process.env.GROQ_TIMEOUT_MS || 12000),
  )

  try {
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: JSON.stringify(userPayload) },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      throw new Error(`Groq failed with status ${response.status}`)
    }

    const data = await response.json()
    return extractJson(data.choices?.[0]?.message?.content)
  } finally {
    clearTimeout(timeout)
  }
}

module.exports = {
  callGroqJson,
}

