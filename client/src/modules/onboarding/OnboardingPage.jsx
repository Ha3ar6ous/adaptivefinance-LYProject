import AuthShell from "../../components/ui/AuthShell";
import { Notice } from "../../components/ui/ProductUi";
import { money } from "../../components/ui/formatters";
import { FiArrowLeft, FiArrowUpRight, FiCheck } from "react-icons/fi";
const steps = [
  {
    key: "bankBalance",
    label: "Current bank balance",
    title: "Start with your cash cushion.",
    copy: "The money available to you today. This helps put your everyday expenses in perspective.",
    hint: "Enter the total available across your bank accounts.",
    placeholder: "50,000",
  },
  {
    key: "monthlyExpenses",
    label: "Estimated monthly expenses",
    title: "What does a month cost?",
    copy: "Rent, groceries, travel, bills — the essentials that keep life moving.",
    hint: "A realistic estimate is a useful place to start.",
    placeholder: "20,000",
  },
  {
    key: "debts",
    label: "Total debts",
    title: "Make room for the full picture.",
    copy: "Knowing what you owe helps keep the next step grounded in your reality.",
    hint: "Include outstanding loans or other debts. Enter 0 if none.",
    placeholder: "10,000",
  },
  {
    key: "investments",
    label: "Total investments",
    title: "What have you set in motion?",
    copy: "Bring your existing investments into the picture, so your plan starts where you are.",
    hint: "Enter the current total value of your investments, or 0 if none.",
    placeholder: "1,50,000",
  },
];
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const OnboardingPage = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    bankBalance: "",
    monthlyExpenses: "",
    debts: "",
    investments: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = (e) => {
    e.preventDefault();
    setStep(step + 1);
  };

  const handlePrev = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const token = localStorage.getItem("token");

    try {
      const res = await fetch("http://localhost:5000/api/auth/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to save onboarding data");
        setLoading(false);
        return;
      }

      // Successfully onboarded, go to dashboard
      navigate("/dashboard");
    } catch {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  const current = steps[step - 1];
  return (
    <AuthShell
      onboarding
      title={
        <>
          A plan that starts
          <br />
          <span>with your reality.</span>
        </>
      }
      description="Four quick steps to understand where you stand. No perfect numbers needed."
      eyebrow="LET’S GET TO KNOW YOUR FINANCES"
    >
      <ol className="af-onboarding-steps" aria-label="Financial profile setup">
        {steps.map((item, index) => (
          <li
            key={item.key}
            className={
              step > index + 1
                ? "complete"
                : step === index + 1
                  ? "current"
                  : ""
            }
            aria-current={step === index + 1 ? "step" : undefined}
          >
            <span>{step > index + 1 ? <FiCheck /> : index + 1}</span>
            <span>
              {["Cash cushion", "Expenses", "Debt", "Investments"][index]}
            </span>
          </li>
        ))}
      </ol>
      <div
        className="af-onboarding-progress"
        role="progressbar"
        aria-label="Setup progress"
        aria-valuemin={0}
        aria-valuemax={4}
        aria-valuenow={step}
      >
        <span style={{ width: step * 25 + "%" }} />
      </div>
      <div className="af-onboarding-step-copy" key={step}>
        <span className="af-ui-eyebrow">STEP 0{step} OF 04</span>
        <h2>{current.title}</h2>
        <p>{current.copy}</p>
      </div>
      <form
        className="af-form"
        onSubmit={step === 4 ? handleSubmit : handleNext}
        aria-busy={loading}
      >
        <label className="af-field">
          <span>{current.label}</span>
          <span className="af-currency-field">
            <span aria-hidden="true">₹</span>
            <input
              key={step}
              type="number"
              name={current.key}
              value={formData[current.key]}
              onChange={handleChange}
              placeholder={current.placeholder.replaceAll(",", "")}
              required
              aria-describedby="af-onboarding-hint"
            />
          </span>
          <small id="af-onboarding-hint">{current.hint}</small>
        </label>
        {step === 4 && (
          <div className="af-onboarding-review">
            <span className="af-ui-eyebrow">YOUR PICTURE SO FAR</span>
            <dl>
              {steps.map((item) => (
                <div key={item.key}>
                  <dt>{item.label}</dt>
                  <dd>{money(formData[item.key])}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
        {error && <Notice tone="error">{error}</Notice>}
        <div className="af-form-actions">
          {step > 1 ? (
            <button
              type="button"
              className="af-ui-button af-ui-button-secondary"
              onClick={handlePrev}
            >
              <FiArrowLeft /> Back
            </button>
          ) : (
            <span />
          )}
          <button type="submit" className="af-ui-button" disabled={loading}>
            {step === 4
              ? loading
                ? "Saving…"
                : "Go to my dashboard"
              : "Continue"}
            <FiArrowUpRight aria-hidden="true" />
          </button>
        </div>
      </form>
    </AuthShell>
  );
};
export default OnboardingPage;
