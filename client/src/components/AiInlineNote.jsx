const AiInlineNote = ({ children, label = 'What this means' }) => {
  if (!children) return null

  return (
    <div style={{ margin: '0.75rem 0', padding: '0.75rem 0.9rem', borderLeft: '3px solid #111', background: 'rgba(255,255,255,0.7)' }}>
      <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 800, color: '#333' }}>{label}</p>
      <p style={{ margin: '0.25rem 0 0', color: '#555' }}>{children}</p>
    </div>
  )
}

export default AiInlineNote
