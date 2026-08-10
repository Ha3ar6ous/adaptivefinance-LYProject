const formatMoney = (value) => `Rs ${Math.round(Number(value || 0)).toLocaleString('en-IN')}`

const InvestmentSuggestions = ({ investment, compact = false }) => {
  if (!investment) {
    return <p className='muted-copy'>Run analytics to generate investment suggestions.</p>
  }

  if (!investment.eligible) {
    return (
      <div className={compact ? 'investment-block compact' : 'investment-block'}>
        <strong>Investing blocked for now</strong>
        <p>{investment.blockedReason}</p>
      </div>
    )
  }

  return (
    <div className='investment-list'>
      {!compact && (
        <p className='muted-copy'>
          Suggested monthly amount: {formatMoney(investment.investableAmount)} | Risk: {investment.riskProfile}
        </p>
      )}
      {(investment.suggestions || []).slice(0, compact ? 1 : 5).map((suggestion) => (
        <div key={suggestion.optionId} className='investment-item'>
          <div className='split-row'>
            <div>
              <strong>{suggestion.name}</strong>
              <p>{suggestion.type}</p>
            </div>
            <div className='amount-block'>
              <strong>{formatMoney(suggestion.allocationAmount)}</strong>
              <p>Score {suggestion.score}</p>
            </div>
          </div>
          {!compact && (
            <>
              <p className='projection-copy'>
                Projection: {suggestion.projection?.median ? `${formatMoney(suggestion.projection.low)} - ${formatMoney(suggestion.projection.high)}` : suggestion.projection?.note}
              </p>
              <div className='tag-row'>
                {(suggestion.reasonTags || []).map((tag) => (
                  <span key={tag}>{tag}</span>
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
