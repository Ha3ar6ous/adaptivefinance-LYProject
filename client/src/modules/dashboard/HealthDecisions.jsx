import { FiArrowUpRight, FiShield } from "react-icons/fi";
import { Link } from "react-router-dom";
import {
  EmptyState,
  LoadingState,
  Notice,
  PageHeading,
  Panel,
  StatusBadge,
} from "../../components/ui/ProductUi";
const factorLabels = {
  liquidity: { label: "Cash cushion", weight: 30 },
  debtSafety: { label: "Debt safety", weight: 25 },
  incomeStability: { label: "Income stability", weight: 20 },
  forecastTrend: { label: "Earnings outlook", weight: 15 },
  dataConsistency: { label: "Tracking consistency", weight: 10 },
};
import { useEffect, useState } from "react";
import { FiCheckCircle, FiXCircle } from "react-icons/fi";
import AiInlineNote from "../../components/AiInlineNote";
import ScoreGauge from "../../components/charts/ScoreGauge";
import { getAiExplanation } from "../../services/aiApi";
import { getChartData } from "../../services/analyticsApi";

const HealthDecisions = () => {
  const [data, setData] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getChartData(), getAiExplanation().catch(() => null)])
      .then(([chartData, aiData]) => {
        setData(chartData);
        setExplanation(aiData);
      })
      .catch((err) => setError(err.message));
  }, []);

  const factors = data?.health?.factors || {};
  const actions = data?.router?.actions || [];

  return (
    <div>
      <PageHeading
        eyebrow="KNOW WHERE YOU STAND"
        title={
          <>
            A score with
            <br />
            <span>a story behind it.</span>
          </>
        }
        description="Your cash cushion, debt, and earning patterns — brought together into an explained view of your financial health."
      />
      {error && <Notice tone="error">{error}</Notice>}
      {!data && !error ? (
        <LoadingState label="Putting your health factors into perspective…" />
      ) : (
        <div className="af-content-stack">
          <div className="af-health-layout">
            <Panel
              className="af-health-score-panel"
              title="Your financial foundation"
            >
              {data?.health && data.health.phase !== "insufficient_data" ? (
                <>
                  <ScoreGauge
                    score={data?.health?.score || 0}
                    label={data?.health?.phase || "crisis"}
                  />
                  <p className="af-health-summary">
                    {data?.router?.summary ||
                      "Run analytics to generate decisions."}
                  </p>
                  <AiInlineNote label="WHAT YOUR SCORE MEANS">
                    {explanation?.healthInsight}
                  </AiInlineNote>
                </>
              ) : (
                <EmptyState title="Let’s build a useful picture.">
                  Record at least 3 days of income, then refresh your dashboard
                  analytics to generate your score.
                </EmptyState>
              )}
            </Panel>
            <Panel
              title="Five factors. One useful picture."
              description="Each factor contributes to your overall score."
            >
              {Object.entries(factors).length ? (
                Object.entries(factors).map(([key, factor]) => {
                  const meta = factorLabels[key] || {
                    label: key.replace(/([A-Z])/g, " $1"),
                    weight: null,
                  };
                  return (
                    <div className="af-health-factor" key={key}>
                      <div>
                        <span>
                          {meta.label}
                          <small>
                            {meta.weight !== null
                              ? meta.weight + "% of your score"
                              : "Health factor"}
                          </small>
                        </span>
                        <strong>
                          {Math.round(factor.value || 0)}
                          <span>/100</span>
                        </strong>
                      </div>
                      <div className="af-health-factor-track">
                        <span
                          style={{
                            width:
                              Math.max(0, Math.min(100, factor.value || 0)) +
                              "%",
                          }}
                        />
                      </div>
                      <p>{factor.detail}</p>
                    </div>
                  );
                })
              ) : (
                <EmptyState
                  action={false}
                  title="Your factors will appear here."
                >
                  Your profile and income entries help build each part of the
                  score.
                </EmptyState>
              )}
            </Panel>
          </div>
          <Panel
            title="Your next moves, with the reasoning."
            description="What your financial picture supports today — and what may need more time."
          >
            <AiInlineNote label="YOUR DECISION CONTEXT">
              {explanation?.decisionInsight}
            </AiInlineNote>
            {actions.length ? (
              <div className="af-decision-grid">
                {actions.map((action) => (
                  <article
                    key={action.key}
                    className={
                      "af-decision-card " +
                      (action.allowed
                        ? "af-decision-allowed"
                        : "af-decision-paused")
                    }
                  >
                    <div>
                      <span className="af-decision-symbol">
                        {action.allowed ? <FiCheckCircle /> : <FiXCircle />}
                      </span>
                      <StatusBadge
                        tone={action.allowed ? "success" : "warning"}
                      >
                        {action.allowed
                          ? "Available step"
                          : "Not recommended yet"}
                      </StatusBadge>
                    </div>
                    <h3>{action.label}</h3>
                    <p>{action.reason}</p>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState title="Your next move starts with your history.">
                Add earnings and refresh your dashboard to see the available
                actions.
              </EmptyState>
            )}
          </Panel>
          <div className="af-safety-footer">
            <FiShield />
            <span>
              Your essentials come first. Investment eligibility depends on your
              full financial picture.
            </span>
            <Link className="af-panel-link" to="/dashboard/investments">
              View investment guidance <FiArrowUpRight />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
export default HealthDecisions;
