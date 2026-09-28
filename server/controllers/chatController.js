const { getChatReply } = require('../services/chatService')

const handleChat = async (req, res) => {
  try {
    const { messages } = req.body
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ message: 'Messages array is required.' })
    }

    const reply = await getChatReply(req.user.id, messages)
    
    res.json({ reply })
  } catch (err) {
    console.error('Chat error:', err)
    res.status(500).json({ message: 'AI chat service failed.', error: err.message })
  }
}

module.exports = {
  handleChat
}
