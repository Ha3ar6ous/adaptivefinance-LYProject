import { Link } from "react-router-dom";
import { FiArrowLeft, FiArrowUpRight, FiShield } from "react-icons/fi";
import { HealthRing } from "../../modules/landing/ProductPreview";

export default function AuthShell({
  title,
  description,
  eyebrow = "YOUR FINANCIAL FOOTING",
  children,
  onboarding = false,
}) {
  return (
    <main
      className={`af-app af-auth ${onboarding ? "af-auth-onboarding" : ""}`}
    >
      <aside className="af-auth-story" aria-label="Adaptive Finance approach">
        <span className="af-ui-eyebrow">FOR EVERY WAY YOU EARN</span>
        <h2>
          A little clarity.
          <br />
          <span>
            A stronger
            <br />
            tomorrow.
          </span>
        </h2>
        <p>
          Your income has its ups and downs.
          <br />
          Your financial plan can still have direction.
        </p>
        <div className="af-auth-visual">
          <div className="af-auth-visual-top">
            <span>Your money, in focus.</span>
            <span>EXAMPLE</span>
          </div>
          <div className="af-auth-score">
            <HealthRing small />
            <div>
              <strong>A solid foundation.</strong>
              <span>Know where you stand.</span>
            </div>
          </div>
          <div className="af-auth-next">
            <FiShield />
            <div>
              <span>YOUR NEXT BEST MOVE</span>
              <strong>Build a little breathing room.</strong>
            </div>
            <FiArrowUpRight />
          </div>
          <div className="af-auth-pattern" aria-hidden="true">
            {[35, 60, 42, 75, 50, 88, 66, 95, 78].map((height, i) => (
              <span key={i} style={{ height: `${height}%` }} />
            ))}
          </div>
        </div>
        <div className="af-auth-promise">
          <FiShield />
          <span>
            Understand today.
            <br />
            <strong>Make room for tomorrow.</strong>
          </span>
        </div>
        <span className="af-auth-side-foot">Built for independent India.</span>
      </aside>
      <div className="af-auth-form-side">
        <div className="af-auth-form-wrap">
          <Link className="af-auth-back" to="/">
            <FiArrowLeft /> Back to Adaptive
          </Link>
          <p className="af-ui-eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="af-auth-description">{description}</p>
          {children}
        </div>
        <div className="af-auth-foot">
          <span>Adaptive Finance</span>
          <span>At your pace. On your terms.</span>
        </div>
      </div>
    </main>
  );
}
