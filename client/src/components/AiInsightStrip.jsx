const toneColor = {
  safe: '#14532d',
  caution: '#78350f',
  growth: '#0f172a',
}

const AiInsightStrip = ({ explanation }) => {
  if (!explanation?.overview) return null

  const color = toneColor[explanation.tone] || toneColor.caution

  return (
    <div className='bento-item' style={{ padding: '1.25rem', border: '1px solid #d8d8d8', background: 'rgba(255,255,255,0.82)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <p style={{ margin: 0, color, fontSize: '0.8rem', fontWeight: 800 }}>In plain words</p>
          <h3 style={{ margin: '0.3rem 0', color: '#111' }}>{explanation.overview.headline}</h3>
        </div>
        {explanation.status === 'fallback' && <span style={{ color: '#666', fontSize: '0.8rem' }}>basic insight</span>}
      </div>
      <p style={{ margin: '0.25rem 0 0', color: '#444' }}>{explanation.overview.summary}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginTop: '0.9rem' }}>
        {(explanation.actionPlan || []).map((item) => (
          <div key={item.title} style={{ padding: '0.75rem', border: '1px solid #e0e0e0', borderRadius: 8 }}>
            <strong style={{ color: '#111' }}>{item.title}</strong>
            <p style={{ margin: '0.25rem 0 0', color: '#555' }}>{item.detail}</p>
          </div>
        ))}
      </div>
      <p style={{ margin: '0.75rem 0 0', color: '#111', fontWeight: 700 }}>{explanation.overview.nextAction}</p>
      {!!explanation.reasons?.length && (
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
          {explanation.reasons.map((reason) => (
            <span key={reason} style={{ padding: '0.25rem 0.5rem', border: '1px solid #d6d6d6', borderRadius: 999, fontSize: '0.8rem', color: '#444' }}>
              {reason}
            </span>
          ))}
        </div>
      )}
      {explanation.watchOut && (
        <p style={{ margin: '0.75rem 0 0', color: '#666' }}>Watch out: {explanation.watchOut}</p>
      )}
    </div>
  )
}

export default AiInsightStrip
