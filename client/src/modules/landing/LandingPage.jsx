import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiAlertCircle,
  FiArrowDown,
  FiArrowUpRight,
  FiCheck,
  FiChevronRight,
  FiDatabase,
  FiFileText,
  FiLock,
  FiPlus,
  FiShield,
  FiTrendingUp,
} from "react-icons/fi";
import Brand from "./Brand";
import { ForecastPreview, HealthRing, ProductPreview } from "./ProductPreview";
import { faqs, healthFactors } from "./previewData";
import useLandingMotion from "./useLandingMotion";
import RupeeMotif from "./RupeeMotif";
import FinancialJourney from "./FinancialJourney";
import "./scroll-story.css";
import "./landing.css";

function StartLink({ children = "Find my financial footing", light = false }) {
  const destination = localStorage.getItem("token") ? "/dashboard" : "/signup";
  return (
    <Link
      className={`af-button ${light ? "af-button-light" : ""}`}
      to={destination}
    >
      {children}
      <FiArrowUpRight aria-hidden="true" />
    </Link>
  );
}

function SafetyPreview() {
  const [ready, setReady] = useState(false);
  return (
    <div className="af-safety-preview">
      <div className="af-preview-heading">
        <span>
          <span className="af-small-icon">
            <FiShield />
          </span>{" "}
          Your next best move
        </span>
        <span className="af-demo-tag">Example</span>
      </div>
      <div
        className="af-scenario-switch"
        role="group"
        aria-label="Explore example financial situations"
      >
        <button
          type="button"
          aria-pressed={!ready}
          onClick={() => setReady(false)}
        >
          Building my buffer
        </button>
        <button
          type="button"
          aria-pressed={ready}
          onClick={() => setReady(true)}
        >
          Ready to grow
        </button>
      </div>
      <div className="af-safety-result" aria-live="polite">
        <span className={`af-decision-icon ${ready ? "af-ready" : ""}`}>
          {ready ? <FiTrendingUp /> : <FiShield />}
        </span>
        <span className="af-kicker">
          {ready ? "ROOM TO TAKE THE NEXT STEP" : "YOUR SAFETY NET COMES FIRST"}
        </span>
        <h3>
          {ready
            ? "Small steps. In your comfort zone."
            : "A stronger cushion. A calmer you."}
        </h3>
        <p>
          {ready
            ? "With a buffer in place, manageable debt, and steady earnings, explore guidance that fits your available surplus."
            : "Before taking investment risk, set aside money for quieter days. Your cash cushion needs a little more room."}
        </p>
        <div className="af-safety-checks">
          <span className={ready ? undefined : "af-check-watch"}>
            {ready ? <FiCheck /> : <FiAlertCircle />} {ready ? "3.2" : "0.8"}{" "}
            months of expense cover
          </span>
          <span>
            <FiCheck /> Manageable debt
          </span>
          <span>
            <FiCheck /> {ready ? "Low" : "Medium"} income volatility
          </span>
        </div>
        <div className="af-recommendation">
          <span>
            {ready ? "Illustrative monthly amount" : "Investment guidance"}
            <strong>
              {ready
                ? "₹200 to explore conservatively"
                : "Paused. Build your buffer first."}
            </strong>
          </span>
          {ready ? <FiArrowUpRight /> : <FiLock />}
        </div>
      </div>
      <p className="af-preview-footnote">
        Illustrative scenarios. Actual guidance depends on your profile, score,
        and available surplus.
      </p>
    </div>
  );
}

export default function LandingPage() {
  const root = useRef(null);
  const [factor, setFactor] = useState(0);
  useLandingMotion(root);
  return (
    <main className="af-landing" id="af-main" ref={root}>
      <section className="af-hero af-container">
        <div className="af-hero-copy">
          <span className="af-eyebrow">
            <span /> BUILT FOR THE WAY INDIA EARNS
          </span>
          <h1>
            Your income
            <br />
            has its ups
            <br />
            and downs.
            <br />
            <span>
              Your future
              <br />
              doesn’t have to.
            </span>
          </h1>
          <p>
            Some days are busy. Some days aren’t.
            <br className="af-desktop-break" /> Get a clearer view of your
            earnings, build your safety net, and grow at your own pace.
          </p>
          <div className="af-hero-actions">
            <StartLink />
            <a className="af-text-link" href="#how-it-works">
              See how it works <FiArrowDown aria-hidden="true" />
            </a>
          </div>
          <div className="af-hero-assurance">
            <FiCheck /> Start with your earnings. Stay in control.
          </div>
        </div>
        <div className="af-hero-visual">
          <RupeeMotif />
          <ProductPreview />
        </div>
      </section>

      <section
        className="af-audience af-container"
        aria-label="Built for independent earners"
      >
        <p>
          Different gigs.
          <br />
          <strong>One shared ambition.</strong>
        </p>
        <div>
          <span>Delivery partners</span>
          <span className="af-audience-star" aria-hidden="true">
            ✳
          </span>
          <span>Drivers & riders</span>
          <span className="af-audience-star" aria-hidden="true">
            ✳
          </span>
          <span>Freelancers</span>
          <span className="af-audience-star" aria-hidden="true">
            ✳
          </span>
          <span>Independent earners</span>
        </div>
      </section>

      <section className="af-problem" id="how-it-works">
        <div className="af-container">
          <div className="af-section-meta">
            <span className="af-kicker">A DIFFERENT KIND OF PAYDAY</span>
            <span className="af-section-number">01 — THE REALITY</span>
          </div>
          <div className="af-problem-heading">
            <h2>
              Life doesn’t wait
              <br />
              for a <span>steady salary.</span>
            </h2>
            <p>
              Rent arrives on time. Your earnings don’t always.
              <br />
              You deserve a financial plan that understands the difference.
            </p>
          </div>
          <div className="af-earnings-strip">
            <div className="af-earnings-label">
              <span>ONE WEEK. MANY PAYDAYS.</span>
              <strong>A familiar kind of week.</strong>
              <span>Illustrative daily earnings</span>
            </div>
            <div className="af-week-bars">
              {[920, 1340, 480, 1050, 0, 1520, 1180].map((value, index) => (
                <div
                  className={`af-earning-day ${index === 4 ? "af-rest-day" : ""}`}
                  key={index}
                >
                  <strong>₹{value.toLocaleString("en-IN")}</strong>
                  <div className="af-bar-space">
                    <span
                      style={{ "--bar-height": `${Math.max(4, value / 16)}%` }}
                    />
                  </div>
                  <span>
                    {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"][index]}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="af-problem-bottom">
            <span>
              <FiArrowUpRight /> Your income can be irregular.
              <br />
              <strong>Your plan can still be intentional.</strong>
            </span>
            <p>
              Adaptive connects your daily earnings to the decisions that
              matter: what to set aside, when to be cautious, and when there’s
              room to grow.
            </p>
          </div>
        </div>
      </section>

      <FinancialJourney />

      <section className="af-intelligence af-container" id="your-money">
        <div className="af-section-meta">
          <span className="af-kicker">
            LESS GUESSWORK. MORE GROUND UNDER YOUR FEET.
          </span>
          <span className="af-section-number">02 — THE CLARITY</span>
        </div>
        <div className="af-section-intro">
          <h2>
            Your numbers.
            <br />
            <span>A clearer next move.</span>
          </h2>
          <p>
            Now bring that picture into your day.
            <br />
            Explore the outlook, the score, and the reasoning.
          </p>
        </div>
        <div className="af-story-row">
          <div className="af-story-copy">
            <span className="af-chapter">
              01 <span /> KNOW WHAT’S AHEAD
            </span>
            <h3>
              Meet next week.
              <br />
              Before it meets you.
            </h3>
            <p>
              Your earning history becomes an income outlook. Spot quieter days,
              understand the pattern, and plan your spending with a little more
              breathing room.
            </p>
            <div className="af-story-detail">
              <span>
                <FiTrendingUp /> History → patterns → forecast
              </span>
              <p>
                Estimates based on your earnings.
                <br />
                Always a guide, never a guarantee.
              </p>
            </div>
            <a className="af-text-link" href="#af-forecast-demo">
              Explore the forecast <FiArrowUpRight />
            </a>
          </div>
          <div className="af-forecast-scene" id="af-forecast-demo">
            <div className="af-scene-label">
              <span className="af-live-dot" /> THE WEEK AHEAD{" "}
              <span>TRY THE CHART ↓</span>
            </div>
            <ForecastPreview large />
            <div className="af-scene-caption">
              <FiShield />
              <span>
                A quieter day is easier to handle
                <br />
                <strong>when you can see it coming.</strong>
              </span>
            </div>
          </div>
        </div>
        <div className="af-story-row af-story-reverse">
          <div className="af-story-copy">
            <span className="af-chapter">
              02 <span /> UNDERSTAND WHERE YOU STAND
            </span>
            <h3>
              A score with
              <br />a story behind it.
            </h3>
            <p>
              Financial health is more than your bank balance. See how your cash
              cushion, debt, earning patterns, and outlook fit together.
            </p>
            <div className="af-story-detail">
              <span>
                <FiDatabase /> Five factors. One useful picture.
              </span>
              <p>
                Tap a factor to see what it means.
                <br />
                Know what’s working and what needs attention.
              </p>
            </div>
          </div>
          <div className="af-health-preview">
            <div className="af-preview-heading">
              <span>Financial health, explained.</span>
              <span className="af-demo-tag">Example</span>
            </div>
            <div className="af-health-overview">
              <HealthRing />
              <div>
                <span className="af-health-phase">STABILITY</span>
                <h4>A solid foundation.</h4>
                <p>
                  Keep building your cash cushion.
                  <br />
                  Progress over perfection.
                </p>
              </div>
            </div>
            <div
              className="af-factor-list"
              role="group"
              aria-label="Explore financial health factors"
            >
              {healthFactors.map((item, index) => (
                <button
                  type="button"
                  className="af-factor"
                  key={item.label}
                  aria-pressed={factor === index}
                  onClick={() => setFactor(index)}
                >
                  <span>
                    {item.label}
                    <small>{item.weight}% weight</small>
                  </span>
                  <span className="af-factor-track">
                    <span style={{ width: `${item.value}%` }} />
                  </span>
                  <strong>{item.value}</strong>
                  <FiChevronRight />
                </button>
              ))}
            </div>
            <p className="af-factor-explanation" aria-live="polite">
              <FiPlus /> {healthFactors[factor].detail}
            </p>
          </div>
        </div>
      </section>

      <section className="af-safety-section" id="safety-first">
        <div className="af-container">
          <div className="af-section-meta">
            <span className="af-kicker">
              PROTECT TODAY. MAKE ROOM FOR TOMORROW.
            </span>
            <span className="af-section-number">03 — THE CONFIDENCE</span>
          </div>
          <div className="af-safety-layout">
            <div className="af-safety-copy">
              <span className="af-outline-icon">
                <FiShield />
              </span>
              <h2>
                Sometimes, the
                <br />
                smartest investment
                <br />
                is <span>waiting.</span>
              </h2>
              <p>We don’t start with “buy this.” We start with you.</p>
              <p>
                Your emergency buffer, debt, and income stability come first.
                When there’s room, explore small investment steps matched to
                your situation and comfort with risk.
              </p>
              <div className="af-safety-principle">
                <FiCheck />
                <span>
                  Protect your essentials.
                  <br />
                  <strong>Grow with what you can spare.</strong>
                </span>
              </div>
            </div>
            <div className="af-safety-composition">
              <div className="af-safety-frame" aria-hidden="true">
                <FiShield />
                <span>YOUR ESSENTIALS, PROTECTED</span>
              </div>
              <SafetyPreview />
            </div>
          </div>
        </div>
      </section>

      <section className="af-steps-section af-container" id="get-started">
        <div className="af-section-meta">
          <span className="af-kicker">
            A LITTLE INPUT. A LOT MORE PERSPECTIVE.
          </span>
          <span className="af-section-number">04 — YOUR FIRST STEP</span>
        </div>
        <div className="af-section-intro">
          <h2>
            Less overthinking.
            <br />
            <span>More getting started.</span>
          </h2>
          <StartLink>Make my next move</StartLink>
        </div>
        <div className="af-steps">
          {[
            {
              icon: FiFileText,
              title: "Tell us a little about you.",
              text: "Your expenses, savings, debt, and the way you earn. A financial picture that starts with your reality.",
            },
            {
              icon: FiPlus,
              title: "Bring your earnings along.",
              text: "Log your daily income or upload a CSV. Every entry helps make the bigger picture clearer.",
            },
            {
              icon: FiTrendingUp,
              title: "Find your next step.",
              text: "An income outlook, an explained health score, and guidance that puts your financial footing first.",
            },
          ].map((step, index) => {
            const Icon = step.icon;
            return (
              <article key={step.title}>
                <span className="af-step-progress" aria-hidden="true" />
                <div className="af-step-top">
                  <span>0{index + 1}</span>
                  <Icon />
                </div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="af-faq-section af-container" id="questions">
        <div>
          <span className="af-kicker">GOOD QUESTIONS. CLEAR ANSWERS.</span>
          <h2>
            A little more
            <br />
            <span>clarity.</span>
          </h2>
        </div>
        <div className="af-faq-list">
          {faqs.map((item) => (
            <details key={item.question}>
              <summary>
                {item.question}
                <FiPlus aria-hidden="true" />
              </summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="af-final-section">
        <div className="af-container">
          <span className="af-eyebrow">
            <span /> FOR EVERY WAY YOU EARN
          </span>
          <h2>
            You do the hustle.
            <br />
            <span>Let’s make it add up.</span>
          </h2>
          <p>A clearer tomorrow starts with understanding today.</p>
          <StartLink light>Start my financial journey</StartLink>
          <div className="af-final-line" aria-hidden="true">
            <svg viewBox="0 0 1000 130">
              <path
                pathLength="1"
                d="M0 115 L100 95 L190 109 L300 66 L390 78 L500 42 L590 65 L710 24 L790 44 L890 8 L1000 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </div>
        </div>
      </section>

      <footer className="af-footer af-container">
        <div className="af-footer-top">
          <Link to="/" aria-label="Adaptive Finance home">
            <Brand />
          </Link>
          <p>Financial footing for independent India.</p>
          <nav aria-label="Footer navigation">
            <a href="#how-it-works">How it works</a>
            <a href="#safety-first">Our approach</a>
            <a href="#questions">Questions</a>
            <Link to="/login">
              Log in <FiArrowUpRight />
            </Link>
          </nav>
        </div>
        <div className="af-footer-bottom">
          <span>© {new Date().getFullYear()} Adaptive Finance</span>
          <p>
            Forecasts are estimates. Product previews use illustrative data.
            Investment guidance is informational; market returns are not
            guaranteed.
          </p>
          <span>
            Made for India. <span className="af-india-dot" aria-hidden="true" />
          </span>
        </div>
      </footer>
    </main>
  );
}
