const SimpleBarChart = ({ data = [], xKey = 'date', yKey = 'income', color = '#222', height = 220 }) => {
  const values = data.map((item) => Number(item[yKey] || 0))
  const max = Math.max(...values, 1)
  const width = 640
  const pad = 28
  const barWidth = (width - pad * 2) / Math.max(data.length, 1)

  if (!data.length) {
    return <p style={{ color: '#666' }}>No chart data yet.</p>
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', minWidth: 420, height }}>
        <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke='#ddd' />
        {data.map((item, index) => {
          const barHeight = (Number(item[yKey] || 0) / max) * (height - pad * 2)
          return (
            <rect
              key={`${item[xKey]}-${index}`}
              x={pad + index * barWidth + 2}
              y={height - pad - barHeight}
              width={Math.max(barWidth - 4, 2)}
              height={barHeight}
              fill={color}
              rx='3'
            />
          )
        })}
      </svg>
    </div>
  )
}

export default SimpleBarChart

