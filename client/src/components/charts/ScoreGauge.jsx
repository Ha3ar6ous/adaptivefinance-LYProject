const phaseLabels = {
  crisis: "Needs attention",
  survival: "Building stability",
  stability: "A solid foundation",
  growth: "Room to grow",
  insufficient_data: "More history needed",
};
const ScoreGauge = ({ score = 0, label = "" }) => {
  const safeScore = Math.max(0, Math.min(100, Number(score || 0)));
  const circumference = 2 * Math.PI * 44;
  const offset = circumference - (safeScore / 100) * circumference;
  const color =
    safeScore < 40 ? "#ad7860" : safeScore < 60 ? "#aa985d" : "#77975d";
  return (
    <div className="score-gauge">
      <svg
        viewBox="0 0 120 120"
        className="score-gauge-svg"
        role="img"
        aria-label={`Financial health score: ${Math.round(safeScore)} out of 100`}
      >
        <circle
          cx="60"
          cy="60"
          r="44"
          fill="none"
          stroke="#dce5ce"
          strokeWidth="7"
        />
        <circle
          cx="60"
          cy="60"
          r="44"
          fill="none"
          stroke={color}
          strokeLinecap="round"
          strokeWidth="7"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 60 60)"
        />
        <text
          x="60"
          y="64"
          textAnchor="middle"
          fontSize="28"
          fontWeight="500"
          fill="var(--text)"
        >
          {Math.round(safeScore)}
        </text>
        <text x="60" y="77" textAnchor="middle" fontSize="7" fill="#a0ad8e">
          OUT OF 100
        </text>
      </svg>
      <div>
        <h3 className="metric-title">
          {phaseLabels[label] || label || "Health"}
        </h3>
        <p className="muted-copy">Financial health score</p>
      </div>
    </div>
  );
};
export default ScoreGauge;
