const toneColor = {
  safe: 'var(--success)',
  caution: 'var(--warning)',
  growth: 'var(--primary)',
}

const AiInsightStrip = ({ explanation }) => {
  if (!explanation?.overview) return null

  const color = toneColor[explanation.tone] || toneColor.caution

  return (
    <div className='dashboard-panel ai-insight-strip'>
      <div className='panel-header'>
        <div>
          <p className='eyebrow-label' style={{ color }}>In plain words</p>
          <h3>{explanation.overview.headline}</h3>
        </div>
        {explanation.status === 'fallback' && <span className='status-pill'>basic insight</span>}
      </div>
      <p className='muted-copy'>{explanation.overview.summary}</p>
      <div className='action-grid'>
        {(explanation.actionPlan || []).map((item) => (
          <div key={item.title} className='soft-row'>
            <strong>{item.title}</strong>
            <p>{item.detail}</p>
          </div>
        ))}
      </div>
      <p className='next-action'>{explanation.overview.nextAction}</p>
      {!!explanation.reasons?.length && (
        <div className='tag-row'>
          {explanation.reasons.map((reason) => (
            <span key={reason}>{reason}</span>
          ))}
        </div>
      )}
      {explanation.watchOut && (
        <p className='muted-copy watch-out'>Watch out: {explanation.watchOut}</p>
      )}
    </div>
  )
}

export default AiInsightStrip
