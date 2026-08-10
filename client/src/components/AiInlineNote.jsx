const AiInlineNote = ({ children, label = 'What this means' }) => {
  if (!children) return null

  return (
    <div className='ai-inline-note'>
      <p className='eyebrow-label'>{label}</p>
      <p>{children}</p>
    </div>
  )
}

export default AiInlineNote
