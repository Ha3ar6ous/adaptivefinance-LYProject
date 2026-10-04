import {
  FiActivity,
  FiArrowDown,
  FiCheck,
  FiShield,
  FiTrendingUp,
} from "react-icons/fi";

const chapters = [
  {
    label: "INCOME",
    title: "Start with what came in.",
    copy: "A busy Monday. A quieter Wednesday. Record each day, including the days you earn nothing.",
    value: "₹6,490",
    detail: "A week of recorded earnings",
    icon: FiTrendingUp,
  },
  {
    label: "VOLATILITY",
    title: "See the space between paydays.",
    copy: "The total is only part of the story. Changing daily earnings help explain how much breathing room your plan needs.",
    value: "₹0 → ₹1,520",
    detail: "The range matters as much as the total",
    icon: FiActivity,
  },
  {
    label: "HEALTH",
    title: "Put your earnings in context.",
    copy: "Cash cushion, debt, income stability, outlook, and tracking consistency come together. A useful score has a reason behind it.",
    value: "76 / 100",
    detail: "Five factors. One explained score",
    icon: FiActivity,
  },
  {
    label: "SAFETY",
    title: "Protect the life you’re building.",
    copy: "Check your essentials and emergency buffer before taking investment risk. Sometimes the right next move is to wait.",
    value: "Buffer first.",
    detail: "Readiness before recommendations",
    icon: FiShield,
  },
  {
    label: "INVESTMENT",
    title: "Grow with what you can spare.",
    copy: "When your financial footing supports it, explore small investment steps matched to your available surplus and comfort with risk.",
    value: "At your pace.",
    detail: "Guidance that starts with your situation",
    icon: FiTrendingUp,
  },
];
const incomes = [920, 1340, 480, 1050, 0, 1520, 1180];

export default function FinancialJourney() {
  return (
    <section
      className="af-journey af-container"
      aria-labelledby="af-journey-title"
    >
      <div className="af-section-meta">
        <span className="af-kicker">FOLLOW THE MONEY. FIND YOUR FOOTING.</span>
        <span className="af-section-number">THE CONNECTED PICTURE</span>
      </div>
      <div className="af-section-intro">
        <h2 id="af-journey-title">
          Every rupee.
          <br />
          <span>A reason behind the next move.</span>
        </h2>
        <p>
          One financial picture, connected.
          <br />
          <span className="af-journey-scroll-hint">
            Scroll to see it take shape <FiArrowDown />
          </span>
        </p>
      </div>
      <div className="af-journey-track">
        <div className="af-journey-chapters">
          {chapters.map((chapter, index) => {
            const Icon = chapter.icon;
            return (
              <article
                className="af-journey-chapter"
                key={chapter.label}
                data-journey-step={index}
              >
                <span className="af-chapter">
                  0{index + 1} <span /> {chapter.label}
                </span>
                <h3>{chapter.title}</h3>
                <p>{chapter.copy}</p>
                <div className="af-journey-takeaway">
                  <Icon />
                  <span>
                    <strong>{chapter.value}</strong>
                    <small>{chapter.detail}</small>
                  </span>
                </div>
              </article>
            );
          })}
        </div>
        <div className="af-journey-sticky" aria-hidden="true">
          <div className="af-journey-board">
            <div className="af-journey-board-top">
              <span>
                <i /> YOUR MONEY, CONNECTED
              </span>
              <span>ILLUSTRATIVE EXAMPLE</span>
            </div>
            <div className="af-journey-visual">
              <div className="af-journey-halo" />
              <span className="af-journey-currency">₹</span>
              <div className="af-journey-income af-journey-layer">
                <div className="af-journey-card-label">
                  YOUR RECORDED WEEK <span>01</span>
                </div>
                <strong className="af-journey-amount">₹6,490</strong>
                <div className="af-journey-bars">
                  {incomes.map((value, index) => (
                    <div key={index}>
                      <span style={{ height: Math.max(3, value / 16) + "%" }} />
                      <small>
                        {["M", "T", "W", "T", "F", "S", "S"][index]}
                      </small>
                    </div>
                  ))}
                </div>
              </div>
              <div className="af-journey-volatility af-journey-layer">
                <div className="af-journey-card-label">
                  THE PATTERN BETWEEN PAYDAYS <span>02</span>
                </div>
                <svg viewBox="0 0 330 140">
                  <path d="M0 70H330" stroke="#8ea572" strokeDasharray="4 6" />
                  <path
                    className="af-journey-volatility-line"
                    pathLength="1"
                    d="M10 60L61 22L112 100L163 51L214 131L265 8L320 39"
                    fill="none"
                    stroke="#1b4b35"
                    strokeWidth="3"
                    strokeLinejoin="round"
                  />
                  <circle cx="214" cy="131" r="6" fill="#c69b50" />
                </svg>
                <div className="af-journey-range">
                  <span>
                    Quietest day<strong>₹0</strong>
                  </span>
                  <span>
                    Busiest day<strong>₹1,520</strong>
                  </span>
                </div>
              </div>
              <div className="af-journey-health af-journey-layer">
                <div className="af-journey-card-label">
                  FIVE FACTORS. ONE PICTURE. <span>03</span>
                </div>
                <div className="af-journey-score">
                  <svg viewBox="0 0 160 160">
                    <circle
                      cx="80"
                      cy="80"
                      r="65"
                      fill="none"
                      stroke="#dfe8d2"
                      strokeWidth="9"
                    />
                    <circle
                      className="af-journey-score-arc"
                      cx="80"
                      cy="80"
                      r="65"
                      fill="none"
                      stroke="#597646"
                      strokeWidth="9"
                      strokeLinecap="round"
                      pathLength="100"
                      strokeDasharray="76 100"
                      transform="rotate(-90 80 80)"
                    />
                  </svg>
                  <span>
                    <strong>76</strong>
                    <small>OUT OF 100</small>
                  </span>
                </div>
                <div className="af-journey-factor-chips">
                  {[
                    "Cash cushion",
                    "Debt safety",
                    "Income stability",
                    "Outlook",
                    "Consistency",
                  ].map((label) => (
                    <span key={label}>{label}</span>
                  ))}
                </div>
              </div>
              <div className="af-journey-safety af-journey-layer">
                <div className="af-journey-card-label">
                  YOUR ESSENTIALS COME FIRST <span>04</span>
                </div>
                <span className="af-journey-shield">
                  <FiShield />
                </span>
                <h4>A little breathing room.</h4>
                <p>
                  Protect your cash cushion.
                  <br />
                  Keep investment risk in perspective.
                </p>
                <div className="af-journey-check">
                  <FiCheck /> Safety before growth
                </div>
              </div>
              <div className="af-journey-investment af-journey-layer">
                <div className="af-journey-card-label">
                  WHEN THERE’S ROOM TO GROW <span>05</span>
                </div>
                <span className="af-journey-growth">
                  <FiTrendingUp />
                </span>
                <h4>
                  Small steps.
                  <br />
                  On firmer ground.
                </h4>
                <p>Available surplus → suitable guidance</p>
                <div className="af-journey-allocation">
                  <span>Essentials + buffer</span>
                  <span>Room to grow</span>
                  <div>
                    <i />
                    <i />
                  </div>
                </div>
              </div>
            </div>
            <div className="af-journey-progress">
              {chapters.map((chapter, index) => (
                <span key={chapter.label} data-journey-marker={index}>
                  <i />
                  {chapter.label}
                </span>
              ))}
            </div>
            <p className="af-journey-footnote">
              Illustrative data. Your guidance depends on your complete
              financial profile.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
