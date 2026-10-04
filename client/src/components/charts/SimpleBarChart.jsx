import { memo, useMemo, useState } from "react";
import useChartLayout from "./useChartLayout";
import { dateLabel, money } from "../ui/formatters";

const pad = { left: 48, right: 16, top: 22, bottom: 22 };

const SimpleBarChart = ({
  data = [],
  xKey = "date",
  yKey = "income",
  color = "var(--chart-bar)",
  height = 220,
}) => {
  const { ref, width } = useChartLayout(data.length > 0);
  const [active, setActive] = useState(null);
  const chart = useMemo(() => {
    const values = data.map((item) => Number(item[yKey] || 0)),
      max = Math.max(...values, 1);
    const barWidth = (width - pad.left - pad.right) / Math.max(data.length, 1);
    const bars = data.map((item, index) => {
      const barHeight =
        (Number(item[yKey] || 0) / max) * (height - pad.top - pad.bottom);
      return {
        key: `${item[xKey]}-${index}`,
        x: pad.left + index * barWidth + 2,
        y: height - pad.bottom - barHeight,
        width: Math.max(barWidth - 4, 2),
        height: barHeight,
      };
    });
    return { bars, max };
  }, [data, height, width, xKey, yKey]);
  if (!data.length)
    return (
      <p className="af-chart-empty">
        Your chart will appear when income data is available.
      </p>
    );
  const selected = active !== null ? data[active] : null;
  return (
    <div ref={ref} className="chart-shell af-interactive-chart">
      <div className="af-chart-readout" aria-live="polite">
        {selected ? (
          <>
            <span>
              {dateLabel(selected[xKey])}
              {selected.type ? " · " + selected.type : ""}
            </span>
            <strong>{money(selected[yKey])}</strong>
          </>
        ) : (
          <>
            <span>Income by day</span>
            <span>Tap a bar to explore</span>
          </>
        )}
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="chart-svg"
        role="group"
        aria-label="Income by day. Select or focus a bar to read its value."
      >
        {[0, 1, 2, 3].map((index) => {
          const y = pad.top + (index * (height - pad.top - pad.bottom)) / 3,
            value = (chart.max * (3 - index)) / 3;
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
        {chart.bars.map((bar, index) => (
          <g
            key={bar.key}
            role="button"
            tabIndex="0"
            aria-label={`${dateLabel(data[index][xKey])}: ${money(data[index][yKey])}${data[index].type ? ", " + data[index].type : ""}`}
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
            <rect
              x={bar.x}
              y={pad.top}
              width={bar.width}
              height={height - pad.top - pad.bottom}
              fill="transparent"
              className="af-chart-hit-target"
            />
            <rect
              x={bar.x}
              y={bar.y}
              width={bar.width}
              height={bar.height}
              fill={data[index].type === "forecast" ? "#a9be88" : color}
              rx="3"
              opacity={active !== null && active !== index ? 0.6 : 1}
            >
              <title>{`${data[index][xKey]}: ${data[index][yKey]}`}</title>
            </rect>
          </g>
        ))}
      </svg>
    </div>
  );
};
export default memo(SimpleBarChart);
