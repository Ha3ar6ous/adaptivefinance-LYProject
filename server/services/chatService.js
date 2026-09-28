const { callGroqText } = require('./groqService')
const { buildSnapshot } = require('./aiExplanationService')
const DailyIncomeEntry = require('../models/DailyIncomeEntry')

const chatSystemPrompt = `You are Adaptive Finance AI, a helpful, deeply knowledgeable, and empathetic financial assistant specifically designed for gig workers in India (like delivery riders, freelancers, and drivers).
Your goal is to answer the user's questions about their financial situation, give actionable advice, and explain their data clearly without being overly strict or using complex financial jargon.
You will be provided with a JSON "snapshot" of the user's current financial profile, health score, income forecasts, and their last 14 days of logged income entries.

Guidelines:
1. Always base your answers on the provided snapshot data.
2. If they ask about saving, check their 'cash buffer' (liquidity) and 'debt' before recommending investments.
3. Keep responses concise (under 4 paragraphs), friendly, and direct. Use markdown for readability (bullet points, bold text).
4. If they ask something unrelated to finance, gently steer them back to their dashboard data.
5. Do not hallucinate numbers not present in the data. If data is missing, recommend they log more income days.
`

const getChatReply = async (userId, messages = []) => {
  // 1. Fetch Snapshot (Aggregated Stats)
  const snapshot = await buildSnapshot(userId).catch(() => ({}))
  
  // 2. Fetch last 14 days of raw income to give context to queries like "Why was last week bad?"
  const recentEntries = await DailyIncomeEntry.find({ userId })
    .sort({ date: -1 })
    .limit(14)
    .select('date platform hours_worked orders_completed income -_id')
    .lean()
    .catch(() => [])

  // 3. Construct Context Payload
  const contextPayload = {
    financialProfileSnapshot: snapshot,
    recentIncomeEntries: recentEntries.reverse()
  }

  // 4. Inject context as a system prompt (or first system message)
  const fullSystemPrompt = `${chatSystemPrompt}\n\nUSER'S CURRENT DATA CONTEXT:\n${JSON.stringify(contextPayload)}`

  // 5. Call Groq
  const reply = await callGroqText({
    systemPrompt: fullSystemPrompt,
    messages: messages.slice(-8) // keep only last 8 messages for token optimization
  })

  return reply
}

module.exports = {
  getChatReply
}
