import {
  FiAlertCircle,
  FiHeart,
  FiShield,
  FiTarget,
  FiTrendingUp,
} from "react-icons/fi";
import { Panel, StatusBadge } from "./ui/ProductUi";

const AiInsightStrip = ({ explanation }) => {
  if (!explanation?.overview) return null;
  return (
    <Panel
      className="af-insight-summary"
      title={explanation.overview.headline}
      action={
        <StatusBadge
          tone={
            explanation.tone === "safe" || explanation.tone === "growth"
              ? "success"
              : "warning"
          }
        >
          {explanation.status === "fallback"
            ? "Basic insight"
            : "Your financial context"}
        </StatusBadge>
      }
    >
      <p>{explanation.overview.summary}</p>
      <details className="af-insight-details">
        <summary>Explore the reasoning and your next steps</summary>
        <div className="af-insight-grid">
          {[
            {
              label: "Your health",
              text: explanation.healthInsight,
              icon: FiHeart,
            },
            {
              label: "Looking ahead",
              text: explanation.forecastInsight,
              icon: FiTrendingUp,
            },
            {
              label: "Safety first",
              text: explanation.decisionInsight,
              icon: FiShield,
            },
            {
              label: "Room to grow",
              text: explanation.investmentInsight,
              icon: FiTarget,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="af-insight-item">
                <strong>
                  <Icon />
                  {item.label}
                </strong>
                <p>{item.text}</p>
              </div>
            );
          })}
        </div>
        <div className="af-insight-action-plan">
          <h3>Your next steps</h3>
          <div className="af-insight-grid">
            {(explanation.actionPlan || []).map((item) => (
              <div key={item.title} className="af-insight-item">
                <strong>{item.title}</strong>
                <p>{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </details>
      {explanation.watchOut && (
        <div className="af-watch-out">
          <FiAlertCircle />
          <p>
            <strong>Keep in mind:</strong> {explanation.watchOut}
          </p>
        </div>
      )}
    </Panel>
  );
};
export default AiInsightStrip;
