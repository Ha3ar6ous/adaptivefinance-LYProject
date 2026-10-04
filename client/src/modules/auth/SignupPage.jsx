import AuthShell from "../../components/ui/AuthShell";
import { Notice, PasswordField } from "../../components/ui/ProductUi";
import { FiArrowUpRight } from "react-icons/fi";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const SignupPage = () => {
  const [name, setName] = useState("");
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
      const res = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Signup failed");
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
          Your next chapter.
          <br />
          <span>On firmer ground.</span>
        </>
      }
      description="A financial picture that understands how you earn. Start by making it yours."
      eyebrow="START WITH YOU"
    >
      <form className="af-form" onSubmit={handleSubmit} aria-busy={loading}>
        <label className="af-field">
          <span>Full name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="What should we call you?"
            autoComplete="name"
            required
          />
        </label>
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
          autoComplete="new-password"
        />
        {error && <Notice tone="error">{error}</Notice>}
        <button
          type="submit"
          className="af-ui-button af-form-submit"
          disabled={loading}
        >
          {loading ? "Creating your account…" : "Create my account"}
          <FiArrowUpRight aria-hidden="true" />
        </button>
      </form>
      <p className="af-auth-switch">
        Already have an account?{" "}
        <Link to="/login">
          Log in <FiArrowUpRight />
        </Link>
      </p>
    </AuthShell>
  );
};

export default SignupPage;
