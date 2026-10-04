import { Link } from "react-router-dom";
import { FiArrowUpRight, FiPlus } from "react-icons/fi";
import {
  EmptyState,
  LoadingState,
  Metric,
  Notice,
  PageHeading,
  Panel,
  StatusBadge,
} from "../../components/ui/ProductUi";
import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  FiActivity,
  FiRefreshCw,
  FiShield,
  FiTrendingUp,
} from "react-icons/fi";
import AiInsightStrip from "../../components/AiInsightStrip";
import InvestmentSuggestions from "../../components/InvestmentSuggestions";
import ScoreGauge from "../../components/charts/ScoreGauge";
import { getAiExplanation } from "../../services/aiApi";
import {
  getAnalytics,
  getInvestmentSuggestion,
  runAnalytics,
} from "../../services/analyticsApi";

const DashboardHome = () => {
  const { user } = useOutletContext() || {};
  const [analytics, setAnalytics] = useState(null);
  const [investment, setInvestment] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [missingDates, setMissingDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadAnalytics = async () => {
    try {
      setError("");
      const [analyticsData, investmentData] = await Promise.all([
        getAnalytics(),
        getInvestmentSuggestion(),
      ]);
      const explanationData = await getAiExplanation().catch(() => null);
      setAnalytics(analyticsData);
      setInvestment(investmentData);
      setExplanation(explanationData);

      const token = localStorage.getItem("token");
      const userRes = await fetch("http://localhost:5000/api/data/user", {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => null);

      if (userRes?.ok) {
        const data = await userRes.json();
        const entries = data.entries || [];
        const recordedDates = new Set(entries.map((e) => e.date));
        const today = new Date();
        const missing = [];
        for (let i = 1; i <= 5; i++) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split("T")[0];
          if (!recordedDates.has(dateStr)) {
            missing.push(dateStr);
          }
        }
        setMissingDates(missing);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshAnalytics = async () => {
    try {
      setRefreshing(true);
      setError("");
      const analyticsData = await runAnalytics();
      const [investmentData, explanationData] = await Promise.all([
        getInvestmentSuggestion(),
        getAiExplanation().catch(() => null),
      ]);
      setAnalytics(analyticsData);
      setInvestment(investmentData);
      setExplanation(explanationData);
    } catch (err) {
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const forecastSummary = useMemo(() => {
    const points = analytics?.forecast?.points || [];
    const total = points.reduce(
      (sum, point) => sum + Number(point.income || 0),
      0,
    );
    return {
      count: points.length,
      total,
      average: points.length ? total / points.length : 0,
    };
  }, [analytics]);

  const formatMoney = (value) =>
    `₹${Math.round(Number(value || 0)).toLocaleString("en-IN")}`;

  const statusText = loading
    ? "Loading analytics"
    : analytics?.status === "error"
      ? "ML service unavailable"
      : analytics?.health
        ? analytics.router?.summary || "Latest financial health output"
        : "Run analytics after adding entries";

  return (
    <div>
      <PageHeading
        eyebrow="YOUR MONEY, IN FOCUS"
        title={
          <>Your bigger picture{user ? ", " + user.name.split(" ")[0] : ""}.</>
        }
        description={statusText}
        action={
          <button
            type="button"
            className="af-ui-button af-ui-button-secondary"
            onClick={refreshAnalytics}
            disabled={refreshing}
          >
            <FiRefreshCw />
            {refreshing ? "Refreshing…" : "Refresh insights"}
          </button>
        }
      />
      {error && (
        <Notice tone="error" title="We couldn’t load your insights.">
          {error}
        </Notice>
      )}
      {loading ? (
        <LoadingState />
      ) : (
        <>
          {missingDates.length > 0 &&
            analytics?.status !== "insufficient_data" && (
              <Notice
                tone="warning"
                title="A few days are missing from the picture."
              >
                You haven’t logged {missingDates.length} recent{" "}
                {missingDates.length === 1 ? "day" : "days"}.{" "}
                <Link to="/dashboard/enter-data">Add your missing entries</Link>{" "}
                to keep your outlook grounded in your earnings.
              </Notice>
            )}
          {analytics?.status === "insufficient_data" && (
            <Notice title="Every entry makes the picture clearer.">
              Add at least 3 days of income history to generate your health
              score and insights.{" "}
              <Link to="/dashboard/enter-data">
                Log your next day <FiArrowUpRight />
              </Link>
            </Notice>
          )}
          <div className="af-overview-grid">
            <Panel className="af-overview-health">
              <div className="af-health-header">
                <span>Your financial health</span>
                <StatusBadge tone="success">Your foundation</StatusBadge>
              </div>
              {analytics?.health &&
              analytics.health.phase !== "insufficient_data" ? (
                <>
                  <ScoreGauge
                    score={analytics?.health?.score || 0}
                    label={analytics?.health?.phase || "crisis"}
                  />
                  <div className="af-health-next">
                    {analytics?.router?.summary ||
                      "Your financial health, explained."}
                    <br />
                    <Link to="/dashboard/health" className="af-panel-link">
                      Understand my score <FiArrowUpRight />
                    </Link>
                  </div>
                </>
              ) : (
                <EmptyState title="Let’s find your footing.">
                  Your score appears once there’s enough income history to build
                  a useful picture.
                </EmptyState>
              )}
            </Panel>
            <div className="af-overview-right">
              <div className="af-metrics-grid">
                <Metric
                  tone="dark"
                  label="Estimated income"
                  value={
                    forecastSummary.count
                      ? formatMoney(forecastSummary.total)
                      : "Not ready yet"
                  }
                  detail={
                    forecastSummary.count
                      ? "Next " +
                        forecastSummary.count +
                        " days · " +
                        formatMoney(forecastSummary.average) +
                        "/day on average"
                      : "Add earnings to build your outlook."
                  }
                  icon={FiTrendingUp}
                />
                <Metric
                  label="Income volatility"
                  value={analytics?.volatility?.label || "Not available"}
                  detail="How much your daily earnings vary."
                  icon={FiShield}
                />
              </div>
              <div className="af-next-move">
                <FiActivity />
                <div>
                  <span className="af-ui-eyebrow">YOUR NEXT BEST MOVE</span>
                  <h2>
                    {analytics?.router?.actions?.find(
                      (action) => action.allowed,
                    )?.label || "Keep tracking income"}
                  </h2>
                  <p>
                    {analytics?.router?.summary ||
                      "Each daily entry helps make your financial picture clearer."}
                  </p>
                  <Link to="/dashboard/health" className="af-panel-link">
                    See the reasoning <FiArrowUpRight />
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <div className="af-content-stack">
            {analytics?.status !== "insufficient_data" && (
              <AiInsightStrip explanation={explanation} />
            )}
            <Panel
              title="Small steps, when you’re ready."
              description="Investment guidance starts with your financial footing."
              action={
                <Link to="/dashboard/investments" className="af-panel-link">
                  View suggestions <FiArrowUpRight />
                </Link>
              }
            >
              <InvestmentSuggestions investment={investment} compact />
            </Panel>
            <div className="af-overview-quick-links">
              <Link to="/dashboard/enter-data">
                <FiPlus />
                <span>
                  Bring another day into focus.
                  <small>Log your daily income</small>
                </span>
                <FiArrowUpRight />
              </Link>
              <Link to="/dashboard/chat">
                <FiActivity />
                <span>
                  Make sense of your numbers.
                  <small>Talk to your AI assistant</small>
                </span>
                <FiArrowUpRight />
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
export default DashboardHome;
