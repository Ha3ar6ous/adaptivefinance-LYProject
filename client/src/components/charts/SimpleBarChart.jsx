import { memo, useMemo } from 'react'

const SimpleBarChart = ({ data = [], xKey = 'date', yKey = 'income', color = 'var(--chart-bar)', height = 220 }) => {
  const width = 640
  const pad = 28
  const bars = useMemo(() => {
    const values = data.map((item) => Number(item[yKey] || 0))
    const max = Math.max(...values, 1)
    const barWidth = (width - pad * 2) / Math.max(data.length, 1)

    return data.map((item, index) => {
      const barHeight = (Number(item[yKey] || 0) / max) * (height - pad * 2)
      return {
        key: `${item[xKey]}-${index}`,
        x: pad + index * barWidth + 2,
        y: height - pad - barHeight,
        width: Math.max(barWidth - 4, 2),
        height: barHeight,
      }
    })
  }, [data, height, xKey, yKey])

  if (!data.length) {
    return <p style={{ color: '#666' }}>No chart data yet.</p>
  }

  return (
    <div className='chart-shell'>
      <svg viewBox={`0 0 ${width} ${height}`} className='chart-svg' style={{ height }}>
        <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke='var(--border-soft)' />
        {bars.map((bar, index) => (
          <rect key={bar.key} x={bar.x} y={bar.y} width={bar.width} height={bar.height} fill={color} rx='3'>
            <title>{`${data[index][xKey]}: ${data[index][yKey]}`}</title>
          </rect>
        ))}
      </svg>
    </div>
  )
}

export default memo(SimpleBarChart)
