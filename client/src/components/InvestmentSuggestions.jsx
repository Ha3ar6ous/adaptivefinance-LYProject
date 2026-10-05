import { Link } from "react-router-dom";
import { FiArrowUpRight, FiLock, FiShield, FiTrendingUp } from "react-icons/fi";
import { EmptyState, StatusBadge } from "./ui/ProductUi";
import { money } from "./ui/formatters";
import InvestmentIdentity from "./InvestmentIdentity";

const InvestmentSuggestions = ({ investment, compact = false }) => {
  if (!investment)
    return (
      <EmptyState title="Your next step needs a little context.">
        Add income and refresh your dashboard analytics to generate investment
        guidance.
      </EmptyState>
    );
  if (!investment.eligible)
    return (
      <div
        className={`af-investment-paused ${compact ? "af-investment-compact" : ""}`}
      >
        <span className="af-investment-lock">
          <FiLock />
        </span>
        <div>
          <span className="af-ui-eyebrow">YOUR SAFETY NET COMES FIRST</span>
          <h3>A stronger foundation, before growth.</h3>
          <p>{investment.blockedReason}</p>
          <Link to="/dashboard/health" className="af-panel-link">
            See your health & decisions <FiArrowUpRight />
          </Link>
        </div>
      </div>
    );
  return (
    <div>
      {!compact && (
        <div className="af-investment-summary">
          <div>
            <span className="af-ui-eyebrow">SUGGESTED MONTHLY AMOUNT</span>
            <strong>{money(investment.investableAmount)}</strong>
            <p>Based on your available surplus and financial readiness.</p>
          </div>
          <div>
            <FiShield />
            <span>
              Your risk preference<strong>{investment.riskProfile}</strong>
            </span>
          </div>
        </div>
      )}
      <div
        className={`af-investment-list ${compact ? "af-investment-list-compact" : ""}`}
      >
        {(investment.suggestions || [])
          .slice(0, compact ? 1 : 5)
          .map((suggestion, index) => (
            <article className="af-investment-card" key={suggestion.optionId}>
              <InvestmentIdentity suggestion={suggestion} />
              <div className="af-investment-card-top">
                <span className="af-investment-order">0{index + 1}</span>
                <div>
                  <h3>{suggestion.name}</h3>
                  <p>{suggestion.type}</p>
                </div>
                <StatusBadge tone="success">
                  Match score {suggestion.score}
                </StatusBadge>
              </div>
              <div className="af-investment-allocation">
                <span>
                  {money(suggestion.allocationAmount)}
                  <small>monthly allocation</small>
                </span>
                {suggestion.allocationPct != null && (
                  <span className="af-allocation-share">
                    {suggestion.allocationPct}% of suggested amount
                  </span>
                )}
              </div>
              {!compact && (
                <>
                  <div className="af-investment-facts">
                    <div>
                      <span>Risk level</span>
                      <strong>{suggestion.riskLevel || "—"}</strong>
                    </div>
                    <div>
                      <span>Liquidity</span>
                      <strong>{suggestion.liquidity || "—"}</strong>
                    </div>
                    <div>
                      <span>Lock-in period</span>
                      <strong>{suggestion.lockInPeriod || "—"}</strong>
                    </div>
                  </div>
                  <div className="af-investment-projection">
                    <FiTrendingUp />
                    <div>
                      <span>Estimated 12-month projection</span>
                      <strong>
                        {suggestion.projection?.median
                          ? money(suggestion.projection.low) +
                            " – " +
                            money(suggestion.projection.high)
                          : suggestion.projection?.note}
                      </strong>
                      <small>
                        Illustrative projection. Actual returns may vary.
                      </small>
                    </div>
                  </div>
                  <div className="af-investment-tags">
                    {(suggestion.reasonTags || []).map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                </>
              )}
            </article>
          ))}
      </div>
    </div>
  );
};
export default InvestmentSuggestions;
