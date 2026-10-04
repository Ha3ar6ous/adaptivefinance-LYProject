import { FiActivity, FiShield, FiTrendingUp } from "react-icons/fi";
import {
  EmptyState,
  LoadingState,
  Metric,
  Notice,
  PageHeading,
  Panel,
  StatusBadge,
} from "../../components/ui/ProductUi";
import { money, dateLabel } from "../../components/ui/formatters";
import { useEffect, useMemo, useState } from "react";
import AiInlineNote from "../../components/AiInlineNote";
import SimpleBarChart from "../../components/charts/SimpleBarChart";
import SimpleLineChart from "../../components/charts/SimpleLineChart";
import { getAiExplanation } from "../../services/aiApi";
import { getChartData } from "../../services/analyticsApi";

const Forecasts = () => {
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

  const comparison = useMemo(() => {
    const history = data?.history?.slice(-15) || [];
    const forecast = data?.forecast || [];
    return [
      ...history.map((point) => ({ ...point, type: "actual" })),
      ...forecast.map((point) => ({ ...point, type: "forecast" })),
    ];
  }, [data]);

  const forecastTotal = (data?.forecast || []).reduce(
    (sum, point) => sum + Number(point.income || 0),
    0,
  );

  return (
    <div>
      <PageHeading
        eyebrow="A LITTLE VISIBILITY. A LITTLE BREATHING ROOM."
        title={
          <>
            Meet what’s next.
            <br />
            <span>With a clearer outlook.</span>
          </>
        }
        description="An income estimate grounded in your earning history. Plan ahead while keeping room for change."
      />
      {error && <Notice tone="error">{error}</Notice>}
      {!data && !error ? (
        <LoadingState label="Bringing your income outlook into view…" />
      ) : (
        <div className="af-content-stack">
          <div className="af-metrics-grid">
            <Metric
              label="Estimated upcoming earnings"
              value={
                (data?.forecast || []).length
                  ? money(forecastTotal)
                  : "Not ready yet"
              }
              detail={
                "Over " +
                (data?.forecast || []).length +
                " forecast days. Estimates, not guarantees."
              }
              icon={FiTrendingUp}
              tone="dark"
            />
            <Metric
              label="Income volatility"
              value={data?.volatility?.label || "Not available"}
              detail="How much your daily earnings vary."
              icon={FiActivity}
            />
            <Metric
              label="Volatility score"
              value={data?.volatility?.score ?? "—"}
              detail={
                "Earnings variation (CV): " +
                (data?.volatility?.features?.coefficientOfVariation ??
                  "Not available")
              }
              icon={FiShield}
            />
          </div>
          <Panel
            title="Your earning outlook"
            description="The days ahead, based on your recent activity."
            action={<StatusBadge>Estimated income</StatusBadge>}
          >
            <AiInlineNote label="THE PATTERN BEHIND THE OUTLOOK">
              {explanation?.forecastInsight}
            </AiInlineNote>
            {data?.forecast?.length ? (
              <>
                <SimpleLineChart data={data.forecast} />
                <div className="af-chart-date-range">
                  <span>{dateLabel(data.forecast[0]?.date)}</span>
                  <span>{dateLabel(data.forecast.at(-1)?.date)}</span>
                </div>
              </>
            ) : (
              <EmptyState title="A little more history will help.">
                Add income entries, then refresh your dashboard analytics to
                generate your outlook.
              </EmptyState>
            )}
          </Panel>
          <Panel
            title="Where you’ve been. What may be ahead."
            description="Your latest 15 recorded days alongside the forecast."
          >
            {comparison.length ? (
              <>
                <div className="af-chart-legend">
                  <span>
                    <i /> Recorded
                  </span>
                  <span>
                    <i /> Forecast
                  </span>
                </div>
                <SimpleBarChart data={comparison} />
              </>
            ) : (
              <EmptyState title="The bigger picture is still forming.">
                Your recorded income and forecast will come together here.
              </EmptyState>
            )}
          </Panel>
          <Panel
            title="Keep stability in the picture"
            description="Changing earnings are part of gig work. Your next step should account for that."
          >
            <AiInlineNote label="YOUR RISK CONTEXT">
              {explanation?.decisionInsight}
            </AiInlineNote>
            <p className="af-panel-body-copy">
              Forecasts are estimates and can change. Use your actual income,
              cash cushion, and financial health alongside this outlook when
              planning your spending.
            </p>
          </Panel>
        </div>
      )}
    </div>
  );
};
export default Forecasts;
