const ScoreGauge = ({ score = 0, label = '' }) => {
  const safeScore = Math.max(0, Math.min(100, Number(score || 0)))
  const circumference = 2 * Math.PI * 44
  const offset = circumference - (safeScore / 100) * circumference

  return (
    <div className='score-gauge'>
      <svg viewBox='0 0 120 120' className='score-gauge-svg'>
        <circle cx='60' cy='60' r='44' fill='none' stroke='var(--border-soft)' strokeWidth='12' />
        <circle
          cx='60'
          cy='60'
          r='44'
          fill='none'
          stroke='var(--success)'
          strokeLinecap='round'
          strokeWidth='12'
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform='rotate(-90 60 60)'
        />
        <text x='60' y='66' textAnchor='middle' fontSize='24' fontWeight='800' fill='var(--text)'>
          {Math.round(safeScore)}
        </text>
      </svg>
      <div>
        <h3 className='metric-title'>{label || 'Health'}</h3>
        <p className='muted-copy'>Financial health score</p>
      </div>
    </div>
  )
}

export default ScoreGauge
