import { memo, useId, useMemo, useState } from "react";
import useChartLayout from "./useChartLayout";
import { dateLabel, money } from "../ui/formatters";

const pad = { left: 48, right: 16, top: 22, bottom: 22 };

const SimpleLineChart = ({
  data = [],
  xKey = "date",
  yKey = "income",
  color = "var(--chart-line)",
  height = 220,
}) => {
  const { ref, width } = useChartLayout(data.length > 0);
  const [active, setActive] = useState(null);
  const gradientId = useId();
  const chart = useMemo(() => {
    const values = data.map((item) => Number(item[yKey] || 0));
    const max = Math.max(...values, 1),
      min = Math.min(...values, 0),
      range = max - min || 1;
    const points = data.map((item, index) => ({
      x:
        pad.left +
        (index / Math.max(data.length - 1, 1)) * (width - pad.left - pad.right),
      y:
        height -
        pad.bottom -
        ((Number(item[yKey] || 0) - min) / range) *
          (height - pad.top - pad.bottom),
    }));
    return { points, max, min, range };
  }, [data, height, width, yKey]);
  if (!data.length)
    return (
      <p className="af-chart-empty">
        Your chart will appear when income data is available.
      </p>
    );
  const selected = active !== null ? data[active] : null;
  const path = chart.points
    .map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.y}`)
    .join(" ");
  return (
    <div ref={ref} className="chart-shell af-interactive-chart">
      <div className="af-chart-readout" aria-live="polite">
        {selected ? (
          <>
            <span>{dateLabel(selected[xKey])}</span>
            <strong>{money(selected[yKey])}</strong>
          </>
        ) : (
          <>
            <span>Daily income</span>
            <span>Tap a point to explore</span>
          </>
        )}
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="chart-svg"
        role="group"
        aria-label="Daily income trend. Each point can be focused or selected to read its earnings."
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8da977" stopOpacity=".22" />
            <stop offset="100%" stopColor="#8da977" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((index) => {
          const value = chart.min + (chart.range * (3 - index)) / 3,
            y = pad.top + (index * (height - pad.top - pad.bottom)) / 3;
          return (
            <g key={index}>
              <line
                x1={pad.left}
                x2={width - pad.right}
                y1={y}
                y2={y}
                stroke="#e7edde"
                strokeDasharray="3 5"
              />
              <text x="0" y={y + 3} fontSize="9" fill="#94a782">
                {value >= 1000
                  ? "₹" + (value / 1000).toFixed(1) + "k"
                  : "₹" + Math.round(value)}
              </text>
            </g>
          );
        })}
        <path
          d={`${path} L ${chart.points.at(-1).x} ${height - pad.bottom} L ${pad.left} ${height - pad.bottom} Z`}
          fill={`url(#${gradientId})`}
        />
        <path
          d={path}
          stroke={color}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          fill="none"
        />
        {chart.points.map((point, index) => (
          <g
            key={`${data[index][xKey]}-${index}`}
            role="button"
            tabIndex="0"
            aria-label={`${dateLabel(data[index][xKey])}: ${money(data[index][yKey])}`}
            onMouseEnter={() => setActive(index)}
            onFocus={() => setActive(index)}
            onClick={() => setActive(index)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setActive(index);
              }
            }}
          >
            <circle
              cx={point.x}
              cy={point.y}
              r="9"
              fill="transparent"
              className="af-chart-hit-target"
            />
            <circle
              cx={point.x}
              cy={point.y}
              r={active === index ? 5 : data.length > 30 ? 2 : 3}
              fill={active === index ? "#a1bc80" : "#52764b"}
            />
            <title>{`${data[index][xKey]}: ${data[index][yKey]}`}</title>
          </g>
        ))}
      </svg>
    </div>
  );
};
export default memo(SimpleLineChart);
