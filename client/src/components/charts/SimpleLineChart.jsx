const SimpleLineChart = ({ data = [], xKey = 'date', yKey = 'income', color = '#111', height = 220 }) => {
  const values = data.map((item) => Number(item[yKey] || 0))
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const range = max - min || 1
  const width = 640
  const pad = 28
  const points = data.map((item, index) => {
    const x = pad + (index / Math.max(data.length - 1, 1)) * (width - pad * 2)
    const y = height - pad - ((Number(item[yKey] || 0) - min) / range) * (height - pad * 2)
    return `${x},${y}`
  })

  if (!data.length) {
    return <p style={{ color: '#666' }}>No chart data yet.</p>
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', minWidth: 420, height }}>
        <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke='#ddd' />
        <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke='#ddd' />
        <polyline fill='none' stroke={color} strokeWidth='3' points={points.join(' ')} />
        {data.map((item, index) => {
          const [x, y] = points[index].split(',').map(Number)
          return <circle key={`${item[xKey]}-${index}`} cx={x} cy={y} r='4' fill={color} />
        })}
      </svg>
    </div>
  )
}

export default SimpleLineChart

