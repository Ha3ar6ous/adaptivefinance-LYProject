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

  // Simple bold markdown parser
  const renderMessageContent = (content) => {
    return content.split(/(\*\*.*?\*\*)/g).map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>
      }
      return <span key={index}>{part}</span>
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 180px)', minHeight: '600px' }}>
      <div className='title-with-icon' style={{ marginBottom: '1rem', flexShrink: 0 }}>
        <FiMessageSquare size={24} />
        <h3 className='page-title' style={{ margin: 0 }}>Talk to Your Data</h3>
      </div>

      <div className='dashboard-panel' style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        padding: 0, 
        margin: 0, 
        overflow: 'hidden',
        border: '2px solid var(--border)',
        boxShadow: '4px 4px 0px var(--border)'
      }}>
        
        {/* Messages Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-body)' }}>
          {messages.map((msg, idx) => (
            <div key={idx} style={{ 
              display: 'flex', 
              gap: '1rem', 
              alignItems: 'flex-start',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
            }}>
              <div style={{
                background: msg.role === 'user' ? 'var(--primary)' : 'var(--panel)',
                color: msg.role === 'user' ? '#fff' : 'var(--text)',
                padding: '0.8rem',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: msg.role !== 'user' ? '2px solid var(--border)' : 'none'
              }}>
                {msg.role === 'user' ? <FiUser /> : <FiCpu />}
              </div>
              
              <div style={{
                background: msg.role === 'user' ? 'var(--primary)' : 'var(--panel)',
                color: msg.role === 'user' ? '#fff' : 'var(--text)',
                padding: '1rem',
                borderRadius: '12px',
                maxWidth: '85%',
                boxShadow: msg.role !== 'user' ? '4px 4px 0px var(--border)' : 'none',
                border: msg.role !== 'user' ? '2px solid var(--border)' : 'none',
              }}>
                <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                  {renderMessageContent(msg.content)}
                </p>
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
               <div style={{ background: 'var(--panel)', padding: '0.8rem', borderRadius: '50%', border: '2px solid var(--border)' }}>
                  <FiCpu />
               </div>
               <div style={{ padding: '1rem', background: 'var(--panel)', borderRadius: '12px', border: '2px solid var(--border)', boxShadow: '4px 4px 0px var(--border)' }}>
                 <em>Typing...</em>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{ padding: '1rem', borderTop: '2px solid var(--border)', background: 'var(--panel)' }}>
          
          {/* Quick Prompts */}
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.8rem', flexShrink: 0 }}>
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
            style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}
          >
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your finances..."
              style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: '2px solid var(--border)', background: 'var(--bg-body)' }}
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
