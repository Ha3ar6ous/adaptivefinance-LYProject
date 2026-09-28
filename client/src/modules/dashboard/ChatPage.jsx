import { useState, useRef, useEffect } from 'react'
import { FiMessageSquare, FiSend, FiUser, FiCpu } from 'react-icons/fi'

const ChatPage = () => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi there! I'm your Adaptive Finance AI. Ask me anything about your income history, health score, or how much you should save." }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef(null)

  const quickPrompts = [
    "Why did my health score drop?",
    "Based on my last 30 days, how much should I save this week?",
    "What's my highest earning platform recently?",
    "Am I safe to make a large purchase right now?"
  ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (text) => {
    const messageText = text || input
    if (!messageText.trim()) return

    const newMessages = [...messages, { role: 'user', content: messageText }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ messages: newMessages })
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()
      setMessages([...newMessages, { role: 'assistant', content: data.reply }])
    } catch (err) {
      setError(err.message)
      setMessages([...newMessages, { role: 'assistant', content: 'Oops! I had trouble fetching that info. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='dashboard-stack' style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div className='page-head' style={{ marginBottom: '1rem' }}>
        <div className='title-with-icon'>
          <FiMessageSquare />
          <h3 className='page-title'>Talk to Your Data</h3>
        </div>
      </div>

      <div className='dashboard-panel' style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
        
        {/* Messages Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {messages.map((msg, idx) => (
            <div key={idx} style={{ 
              display: 'flex', 
              gap: '1rem', 
              alignItems: 'flex-start',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
            }}>
              <div style={{
                background: msg.role === 'user' ? 'var(--primary)' : 'var(--bg-body)',
                color: msg.role === 'user' ? '#fff' : 'var(--text)',
                padding: '0.8rem',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {msg.role === 'user' ? <FiUser /> : <FiCpu />}
              </div>
              
              <div style={{
                background: msg.role === 'user' ? 'var(--primary)' : 'var(--bg-body)',
                color: msg.role === 'user' ? '#fff' : 'var(--text)',
                padding: '1rem',
                borderRadius: '8px',
                maxWidth: '75%',
                boxShadow: msg.role !== 'user' ? '4px 4px 0px var(--border)' : 'none',
                border: msg.role !== 'user' ? '2px solid var(--border)' : 'none',
              }}>
                <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
               <div style={{ background: 'var(--bg-body)', padding: '0.8rem', borderRadius: '50%' }}>
                  <FiCpu />
               </div>
               <div style={{ padding: '1rem', background: 'var(--bg-body)', borderRadius: '8px', border: '2px solid var(--border)', boxShadow: '4px 4px 0px var(--border)' }}>
                 <em>Typing...</em>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{ padding: '1.5rem', borderTop: '2px solid var(--border-soft)', background: 'var(--bg-card)' }}>
          
          {/* Quick Prompts */}
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '1rem' }}>
            {quickPrompts.map((prompt, idx) => (
              <button 
                key={idx} 
                className='secondary-btn' 
                style={{ whiteSpace: 'nowrap', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                onClick={() => handleSend(prompt)}
                disabled={loading}
              >
                {prompt}
              </button>
            ))}
          </div>

          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            style={{ display: 'flex', gap: '0.5rem' }}
          >
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your finances..."
              style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: '2px solid var(--border)' }}
              disabled={loading}
            />
            <button 
              type="submit" 
              className='accent-cta'
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0 1.5rem' }}
              disabled={loading || !input.trim()}
            >
              <FiSend /> Send
            </button>
          </form>
        </div>
        
      </div>
    </div>
  )
}

export default ChatPage
