import { useId, useState } from "react";
import {
  FiArrowUpRight,
  FiCheck,
  FiChevronDown,
  FiShield,
  FiTrendingUp,
} from "react-icons/fi";
import { previewWeeks, rupees } from "./previewData";

export function ForecastPreview({ large = false }) {
  const [period, setPeriod] = useState("next");
  const [activeDay, setActiveDay] = useState(null);
  const gradientId = useId();
  const week = previewWeeks[period];
  const points = week.values.map((value, index) => [
    48 + index * 62,
    166 - value / 10,
  ]);
  const path = points
    .map(([x, y], index) => `${index ? "L" : "M"} ${x} ${y}`)
    .join(" ");
  const total = week.values.reduce((sum, value) => sum + value, 0);
  const selectPeriod = (event) => {
    setPeriod(event.target.value);
    setActiveDay(null);
  };
  return (
    <div className={`af-forecast ${large ? "af-forecast-large" : ""}`}>
      <div className="af-preview-heading">
        <span>
          <span className="af-small-icon">
            <FiTrendingUp />
          </span>{" "}
          Your income outlook
        </span>
        <label className="af-period">
          <span className="af-sr-only">Income outlook period</span>
          <select value={period} onChange={selectPeriod}>
            <option value="next">Next 7 days</option>
            <option value="previous">Last 7 days</option>
          </select>
          <FiChevronDown aria-hidden="true" />
        </label>
      </div>
      <div className="af-forecast-total">
        <strong>{rupees(total)}</strong>
        <span>
          {period === "next" ? "estimated earnings" : "recorded earnings"}
        </span>
        <span className="af-forecast-status">
          <span /> {period === "next" ? "Forecast" : "History"}
        </span>
      </div>
      <div className="af-income-chart">
        <svg
          viewBox="0 0 460 205"
          role="img"
          aria-label={`${week.label}: ${week.days.map((day, i) => `${day} ${rupees(week.values[i])}`).join(", ")}. Illustrative data.`}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8acda8" stopOpacity=".36" />
              <stop offset="100%" stopColor="#8acda8" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[46, 96, 146].map((y, index) => (
            <g key={y}>
              <line
                x1="42"
                x2="432"
                y1={y}
                y2={y}
                stroke="#e5eae3"
                strokeDasharray="3 5"
              />
              <text x="0" y={y + 4} fill="#87938b" fontSize="10">
                {["1.2k", "700", "200"][index]}
              </text>
            </g>
          ))}
          <path
            d={`${path} L 420 176 L 48 176 Z`}
            fill={`url(#${gradientId})`}
          />
          <path
            className="af-chart-line"
            d={path}
            fill="none"
            stroke="#236546"
            strokeWidth="2.8"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {points.map(([x, y], index) => (
            <g key={week.days[index]}>
              <circle
                cx={x}
                cy={y}
                r={activeDay === index ? 7 : 4}
                fill={index === week.lowDay ? "#d9a956" : "#fff"}
                stroke={index === week.lowDay ? "#d9a956" : "#236546"}
                strokeWidth="2"
              />
              <text
                x={x}
                y="199"
                textAnchor="middle"
                fill="#7f8982"
                fontSize="11"
              >
                {week.days[index]}
              </text>
            </g>
          ))}
          {activeDay !== null && (
            <g>
              <line
                x1={points[activeDay][0]}
                x2={points[activeDay][0]}
                y1="22"
                y2="176"
                stroke="#236546"
                strokeOpacity=".25"
                strokeDasharray="3 3"
              />
              <rect
                x={Math.max(35, Math.min(358, points[activeDay][0] - 32))}
                y="4"
                width="68"
                height="24"
                rx="6"
                fill="#174b35"
              />
              <text
                x={Math.max(69, Math.min(392, points[activeDay][0] + 2))}
                y="20"
                fill="white"
                textAnchor="middle"
                fontSize="11"
              >
                {rupees(week.values[activeDay])}
              </text>
            </g>
          )}
        </svg>
        <div className="af-chart-targets" aria-label="Explore daily earnings">
          {week.days.map((day, index) => (
            <button
              key={day}
              type="button"
              aria-label={`${day}: ${rupees(week.values[index])}`}
              aria-pressed={activeDay === index}
              onMouseEnter={() => setActiveDay(index)}
              onFocus={() => setActiveDay(index)}
              onClick={() => setActiveDay(index)}
            >
              <span className="af-sr-only">{day}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="af-chart-insight" aria-live="polite">
        <span className="af-insight-dot" />
        <span>
          {activeDay !== null
            ? `${week.days[activeDay]}: ${rupees(week.values[activeDay])} ${period === "next" ? "estimated" : "recorded"}. ${activeDay === week.lowDay ? "Your quietest day this week." : ""}`
            : week.note}
        </span>
      </div>
    </div>
  );
}

export function HealthRing({ score = 76, small = false }) {
  return (
    <div className={`af-health-ring ${small ? "af-health-ring-small" : ""}`}>
      <svg
        viewBox="0 0 160 160"
        role="img"
        aria-label={`Illustrative financial health score: ${score} out of 100`}
      >
        <circle
          cx="80"
          cy="80"
          r="65"
          fill="none"
          stroke="currentColor"
          strokeOpacity=".12"
          strokeWidth="9"
        />
        <circle
          className="af-ring-progress"
          cx="80"
          cy="80"
          r="65"
          fill="none"
          stroke="currentColor"
          strokeWidth="9"
          strokeLinecap="round"
          pathLength="100"
          strokeDasharray={`${score} 100`}
          transform="rotate(-90 80 80)"
        />
      </svg>
      <div>
        <strong>
          {score}
          <span>/100</span>
        </strong>
        <span>Financial health</span>
      </div>
    </div>
  );
}

export function ProductPreview() {
  return (
    <div
      className="af-product-stage"
      aria-label="Interactive product preview with illustrative data"
    >
      <div className="af-stage-orbit af-orbit-one" aria-hidden="true" />
      <div className="af-stage-orbit af-orbit-two" aria-hidden="true" />
      <div className="af-stage-orbit af-orbit-three" aria-hidden="true" />
      <div className="af-stage-top">
        <span>
          <span className="af-live-dot" /> THE BIGGER PICTURE
        </span>
        <span>01 / 03</span>
      </div>
      <div className="af-mini-greeting">
        <span>Every rupee. A little more clarity.</span>
        <strong>Your money, in focus.</strong>
      </div>
      <ForecastPreview />
      <div className="af-stage-bottom">
        <div className="af-stage-health">
          <HealthRing small />
          <span>
            <strong>Looking steady.</strong>
            <span>Let’s build your buffer next.</span>
          </span>
        </div>
        <FiArrowUpRight aria-hidden="true" />
      </div>
      <div className="af-floating-note">
        <span className="af-note-icon">
          <FiShield />
        </span>
        <span>
          <strong>Safety before growth.</strong>
          <span>Your next move: build a cash cushion</span>
        </span>
        <FiCheck />
      </div>
      <span className="af-example-label">
        Interactive preview · illustrative data
      </span>
    </div>
  );
}
