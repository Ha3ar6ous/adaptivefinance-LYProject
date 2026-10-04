import { FiArrowUpRight } from "react-icons/fi";

export default function Brand({ compact = false }) {
  return (
    <span className={`af-brand ${compact ? "af-brand-compact" : ""}`}>
      <span className="af-brand-mark" aria-hidden="true">
        <FiArrowUpRight />
      </span>
      <span>
        adaptive<span className="af-brand-finance">finance</span>
      </span>
    </span>
  );
}
