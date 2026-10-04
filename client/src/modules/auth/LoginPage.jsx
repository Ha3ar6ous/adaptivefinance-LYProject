import AuthShell from "../../components/ui/AuthShell";
import { Notice, PasswordField } from "../../components/ui/ProductUi";
import { FiArrowUpRight } from "react-icons/fi";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Login failed");
        setLoading(false);
        return;
      }
      localStorage.setItem("token", data.token);
      if (data.user.hasCompletedOnboarding) {
        navigate("/dashboard");
      } else {
        navigate("/onboarding");
      }
    } catch {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={
        <>
          Back to your
          <br />
          <span>bigger picture.</span>
        </>
      }
      description="Your earnings, your outlook, your next move. Pick up where you left off."
      eyebrow="WELCOME BACK"
    >
      <form className="af-form" onSubmit={handleSubmit} aria-busy={loading}>
        <label className="af-field">
          <span>Email address</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </label>
        <PasswordField
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <Notice tone="error">{error}</Notice>}
        <button
          type="submit"
          className="af-ui-button af-form-submit"
          disabled={loading}
        >
          {loading ? "Logging in…" : "Log in to Adaptive"}
          <FiArrowUpRight aria-hidden="true" />
        </button>
      </form>
      <p className="af-auth-switch">
        New to Adaptive?{" "}
        <Link to="/signup">
          Create an account <FiArrowUpRight />
        </Link>
      </p>
    </AuthShell>
  );
};

export default LoginPage;
