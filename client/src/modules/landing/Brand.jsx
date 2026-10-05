import { FiArrowUpRight } from "react-icons/fi";

export default function Brand({ compact = false }) {
  return (
    <span
      className={`af-brand ${compact ? "af-brand-compact" : ""}`}
      role="img"
      aria-label="Finspire"
    >
      <span className="af-brand-mark" aria-hidden="true">
        <FiArrowUpRight />
      </span>
      <span className="af-brand-wordmark" aria-hidden="true" translate="no">
        FINSPI<span className="af-brand-rupee">₹</span>E
      </span>
    </span>
  );
}
