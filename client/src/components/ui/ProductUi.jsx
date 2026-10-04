import {
  FiAlertCircle,
  FiArrowUpRight,
  FiCheckCircle,
  FiEye,
  FiEyeOff,
  FiInfo,
  FiPlus,
  FiShield,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import { useState } from "react";

export function PageHeading({ eyebrow, title, description, action }) {
  return (
    <header className="af-page-heading">
      <div>
        {eyebrow && <p className="af-ui-eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="af-page-description">{description}</p>}
      </div>
      {action && <div className="af-heading-action">{action}</div>}
    </header>
  );
}
export function Panel({
  title,
  description,
  action,
  children,
  className = "",
}) {
  return (
    <section className={`af-panel ${className}`}>
      {(title || action) && (
        <div className="af-panel-header">
          <div>
            {title && <h2>{title}</h2>}
            {description && <p>{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
export function Notice({ tone = "info", title, children }) {
  const Icon =
    tone === "error" || tone === "warning"
      ? FiAlertCircle
      : tone === "success"
        ? FiCheckCircle
        : FiInfo;
  return (
    <div
      className={`af-notice af-notice-${tone}`}
      role={tone === "error" ? "alert" : "status"}
    >
      <Icon aria-hidden="true" />
      <div>
        {title && <strong>{title}</strong>}
        <div>{children}</div>
      </div>
    </div>
  );
}
export function StatusBadge({ children, tone = "neutral" }) {
  return <span className={`af-status af-status-${tone}`}>{children}</span>;
}
export function EmptyState({
  title = "Your picture starts here.",
  children,
  action = true,
  icon = FiPlus,
}) {
  const Icon = icon;
  return (
    <div className="af-empty-state">
      <span className="af-empty-icon">
        <Icon aria-hidden="true" />
      </span>
      <h3>{title}</h3>
      <p>
        {children ||
          "Add your income entries to start seeing the patterns behind your earnings."}
      </p>
      {action && (
        <Link
          className="af-ui-button af-ui-button-secondary"
          to="/dashboard/enter-data"
        >
          Add income <FiArrowUpRight aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
export function LoadingState({
  label = "Bringing your financial picture together…",
}) {
  return (
    <div className="af-loading-state" role="status" aria-busy="true">
      <span>{label}</span>
      <div className="af-skeleton-grid">
        {[0, 1, 2].map((item) => (
          <div className="af-skeleton" key={item} />
        ))}
      </div>
    </div>
  );
}
export function Metric({
  label,
  value,
  detail,
  icon = FiShield,
  tone = "",
  className = "",
}) {
  const Icon = icon;
  return (
    <div
      className={`af-metric ${tone ? `af-metric-${tone}` : ""} ${className}`}
    >
      <div className="af-metric-top">
        <span>{label}</span>
        <Icon aria-hidden="true" />
      </div>
      <strong>{value}</strong>
      {detail && <p>{detail}</p>}
    </div>
  );
}
export function PasswordField({
  value,
  onChange,
  autoComplete = "current-password",
  disabled = false,
}) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="af-field">
      <span>Password</span>
      <span className="af-password-field">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          required
          disabled={disabled}
          placeholder="Enter your password"
        />
        <button
          type="button"
          className="af-password-toggle"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          onClick={() => setVisible(!visible)}
        >
          {visible ? <FiEyeOff /> : <FiEye />}
        </button>
      </span>
    </label>
  );
}
