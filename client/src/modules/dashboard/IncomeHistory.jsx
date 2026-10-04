import { Link } from "react-router-dom";
import {
  FiArrowUpRight,
  FiBarChart2,
  FiCalendar,
  FiTrendingUp,
} from "react-icons/fi";
import {
  EmptyState,
  LoadingState,
  Metric,
  Notice,
  PageHeading,
  Panel,
  StatusBadge,
} from "../../components/ui/ProductUi";
import { dateLabel, money } from "../../components/ui/formatters";
import { useEffect, useState } from "react";
import SimpleBarChart from "../../components/charts/SimpleBarChart";
import SimpleLineChart from "../../components/charts/SimpleLineChart";
import { getChartData } from "../../services/analyticsApi";

const IncomeHistory = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getChartData()
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  const history = data?.history || [];
  const recent = history.slice(-10).reverse();

  return (
    <div>
      <PageHeading
        eyebrow="THE STORY IN YOUR EARNINGS"
        title={
          <>
            Every day.
            <br />
            <span>Part of the bigger picture.</span>
          </>
        }
        description="See the patterns, the busy days, and the quieter ones — all in one place."
        action={
          <Link
            className="af-ui-button af-ui-button-secondary"
            to="/dashboard/enter-data"
          >
            Add income <FiArrowUpRight />
          </Link>
        }
      />
      {error && <Notice tone="error">{error}</Notice>}
      {!data && !error ? (
        <LoadingState label="Gathering your recorded days…" />
      ) : history.length ? (
        <div className="af-content-stack">
          <div className="af-metrics-grid">
            <Metric
              label="Recorded earnings"
              value={money(
                history.reduce(
                  (sum, entry) => sum + Number(entry.income || 0),
                  0,
                ),
              )}
              detail="Across your recorded income history."
              icon={FiTrendingUp}
              tone="dark"
            />
            <Metric
              label="Days in the picture"
              value={history.length}
              detail="Every entry adds a little more clarity."
              icon={FiCalendar}
            />
            <Metric
              label="Average recorded day"
              value={money(
                history.reduce(
                  (sum, entry) => sum + Number(entry.income || 0),
                  0,
                ) / history.length,
              )}
              detail="Total recorded income divided by entries."
              icon={FiBarChart2}
            />
          </div>
          <Panel
            title="The rhythm of your earnings"
            description="Your daily income, with the ups and downs kept in view."
            action={<StatusBadge>Recorded income</StatusBadge>}
          >
            <SimpleLineChart data={history} />
            <div className="af-chart-date-range">
              <span>{dateLabel(history[0]?.date)}</span>
              <span>{dateLabel(history.at(-1)?.date)}</span>
            </div>
          </Panel>
          <Panel
            title="Your latest 30 entries"
            description="A closer look at the days behind your earnings."
          >
            <SimpleBarChart data={history.slice(-30)} />
          </Panel>
          <Panel
            title="Your most recent days"
            description="The latest 10 entries in your income history."
          >
            <div className="af-table-wrap">
              <table className="af-table">
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Platform</th>
                    <th scope="col">Income</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((entry) => (
                    <tr key={entry.date}>
                      <td>{dateLabel(entry.date)}</td>
                      <td>{entry.platform}</td>
                      <td className="af-table-income">{money(entry.income)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      ) : (
        <Panel>
          <EmptyState title="Bring your first day into focus.">
            Your income history will live here. Start with one day’s earnings.
          </EmptyState>
        </Panel>
      )}
    </div>
  );
};
export default IncomeHistory;
