import { FiHeart, FiTrendingUp, FiShield, FiTarget } from 'react-icons/fi'

const toneColor = {
  safe: 'var(--success)',
  caution: 'var(--warning)',
  growth: 'var(--primary)',
}

const AiInsightStrip = ({ explanation }) => {
  if (!explanation?.overview) return null

  const color = toneColor[explanation.tone] || toneColor.caution

  return (
    <div className='dashboard-panel ai-insight-strip' style={{ padding: '2rem', background: 'var(--bg-card)' }}>
      <div className='panel-header' style={{ marginBottom: '1rem' }}>
        <div>
          <p className='eyebrow-label' style={{ color, fontSize: '0.9rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Your AI Assistant Says:</p>
          <h2 style={{ marginTop: '0.5rem', marginBottom: '0.5rem', fontSize: '1.4rem' }}>{explanation.overview.headline}</h2>
        </div>
        {explanation.status === 'fallback' && <span className='status-pill'>basic insight</span>}
      </div>
      
      <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: 'var(--text-soft)', marginBottom: '2rem' }}>
        {explanation.overview.summary}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className='soft-row' style={{ padding: '1rem', background: 'var(--bg-body)', borderRadius: '8px' }}>
          <strong style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem', color: 'var(--primary)' }}><FiHeart /> Health Check</strong>
          <p style={{ margin: 0, fontSize: '0.95rem' }}>{explanation.healthInsight}</p>
        </div>
        <div className='soft-row' style={{ padding: '1rem', background: 'var(--bg-body)', borderRadius: '8px' }}>
          <strong style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem', color: 'var(--success)' }}><FiTrendingUp /> Looking Ahead</strong>
          <p style={{ margin: 0, fontSize: '0.95rem' }}>{explanation.forecastInsight}</p>
        </div>
        <div className='soft-row' style={{ padding: '1rem', background: 'var(--bg-body)', borderRadius: '8px' }}>
          <strong style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem', color: 'var(--warning)' }}><FiShield /> Safety Decision</strong>
          <p style={{ margin: 0, fontSize: '0.95rem' }}>{explanation.decisionInsight}</p>
        </div>
        <div className='soft-row' style={{ padding: '1rem', background: 'var(--bg-body)', borderRadius: '8px' }}>
          <strong style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem', color: 'var(--accent)' }}><FiTarget /> Investment Path</strong>
          <p style={{ margin: 0, fontSize: '0.95rem' }}>{explanation.investmentInsight}</p>
        </div>
      </div>

      <div style={{ borderTop: '2px dashed var(--border-soft)', paddingTop: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Your Next Steps</h3>
        <div className='action-grid'>
          {(explanation.actionPlan || []).map((item) => (
            <div key={item.title} className='soft-row'>
              <strong>{item.title}</strong>
              <p>{item.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {explanation.watchOut && (
        <p className='muted-copy watch-out' style={{ marginTop: '1.5rem', padding: '1rem', background: '#fffbeb', color: '#b45309', borderLeft: '4px solid #f59e0b' }}>
          <strong>Keep in mind:</strong> {explanation.watchOut}
        </p>
      )}
    </div>
  )
}

export default AiInsightStrip
