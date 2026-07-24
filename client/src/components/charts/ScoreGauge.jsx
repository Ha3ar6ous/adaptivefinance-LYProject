const ScoreGauge = ({ score = 0, label = '' }) => {
  const safeScore = Math.max(0, Math.min(100, Number(score || 0)))
  const circumference = 2 * Math.PI * 44
  const offset = circumference - (safeScore / 100) * circumference

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <svg viewBox='0 0 120 120' style={{ width: 120, height: 120 }}>
        <circle cx='60' cy='60' r='44' fill='none' stroke='#e5e7eb' strokeWidth='12' />
        <circle
          cx='60'
          cy='60'
          r='44'
          fill='none'
          stroke='#111'
          strokeLinecap='round'
          strokeWidth='12'
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform='rotate(-90 60 60)'
        />
        <text x='60' y='66' textAnchor='middle' fontSize='24' fontWeight='800' fill='#111'>
          {Math.round(safeScore)}
        </text>
      </svg>
      <div>
        <h3 style={{ margin: 0, textTransform: 'capitalize' }}>{label || 'Health'}</h3>
        <p style={{ margin: '0.25rem 0 0', color: '#666' }}>Financial health score</p>
      </div>
    </div>
  )
}

export default ScoreGauge

