const formatMoney = (value) => `Rs ${Math.round(Number(value || 0)).toLocaleString('en-IN')}`

const InvestmentSuggestions = ({ investment, compact = false }) => {
  if (!investment) {
    return <p style={{ color: '#666' }}>Run analytics to generate investment suggestions.</p>
  }

  if (!investment.eligible) {
    return (
      <div style={{ padding: compact ? 0 : '1rem', border: compact ? 'none' : '1px solid #ddd', borderRadius: 8 }}>
        <strong>Investing blocked for now</strong>
        <p style={{ margin: '0.4rem 0 0', color: '#666' }}>{investment.blockedReason}</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {!compact && (
        <p style={{ margin: 0, color: '#666' }}>
          Suggested monthly amount: {formatMoney(investment.investableAmount)} | Risk: {investment.riskProfile}
        </p>
      )}
      {(investment.suggestions || []).slice(0, compact ? 1 : 5).map((suggestion) => (
        <div key={suggestion.optionId} style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: 8, background: 'rgba(255,255,255,0.55)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <strong>{suggestion.name}</strong>
              <p style={{ margin: '0.25rem 0 0', color: '#666' }}>{suggestion.type}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <strong>{formatMoney(suggestion.allocationAmount)}</strong>
              <p style={{ margin: '0.25rem 0 0', color: '#666' }}>Score {suggestion.score}</p>
            </div>
          </div>
          {!compact && (
            <>
              <p style={{ margin: '0.75rem 0 0', color: '#444' }}>
                Projection: {suggestion.projection?.median ? `${formatMoney(suggestion.projection.low)} - ${formatMoney(suggestion.projection.high)}` : suggestion.projection?.note}
              </p>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                {(suggestion.reasonTags || []).map((tag) => (
                  <span key={tag} style={{ padding: '0.25rem 0.5rem', border: '1px solid #ccc', borderRadius: 999, fontSize: '0.8rem' }}>
                    {tag}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  )
}

export default InvestmentSuggestions
