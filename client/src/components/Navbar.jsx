import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FiMenu, FiX, FiArrowUpRight } from "react-icons/fi";
import Brand from "../modules/landing/Brand";
import LanguageSelector from "./ui/LanguageSelector";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const onEscape = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, []);

  if (location.pathname === "/")
    return (
      <header className="af-header">
        <a className="af-skip-link" href="#af-main">
          Skip to content
        </a>
        <div className="af-header-inner">
          <Link
            className="af-home-link"
            to="/"
            aria-label="Adaptive Finance home"
            onClick={() => setMenuOpen(false)}
          >
            <Brand />
          </Link>
          <nav className="af-desktop-nav" aria-label="Main navigation">
            <a href="#how-it-works">How it works</a>
            <a href="#your-money">Your money, clearer</a>
            <a href="#safety-first">Safety first</a>
          </nav>
          <div className="af-header-actions">
            <LanguageSelector />
            {token ? (
              <button
                className="af-login-link"
                onClick={() => {
                  localStorage.removeItem("token");
                  navigate("/");
                }}
              >
                Log out
              </button>
            ) : (
              <Link className="af-login-link" to="/login">
                Log in
              </Link>
            )}
            <Link
              className="af-button af-header-cta"
              to={token ? "/dashboard" : "/signup"}
              onClick={() => setMenuOpen(false)}
            >
              {token ? "Dashboard" : "Get started"}
              <FiArrowUpRight aria-hidden="true" />
            </Link>
            <button
              className="af-menu-toggle"
              type="button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="af-mobile-nav"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <FiX /> : <FiMenu />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav
            id="af-mobile-nav"
            className="af-mobile-nav"
            aria-label="Mobile navigation"
            onClick={() => setMenuOpen(false)}
          >
            <a href="#how-it-works">
              How it works <FiArrowUpRight />
            </a>
            <a href="#your-money">
              Your money, clearer <FiArrowUpRight />
            </a>
            <a href="#safety-first">
              Safety first <FiArrowUpRight />
            </a>
            <a href="#questions">
              Questions <FiArrowUpRight />
            </a>
            <Link to={token ? "/dashboard" : "/login"}>
              {token ? "Open dashboard" : "Log in"}
              <FiArrowUpRight />
            </Link>
            {token && (
              <button
                type="button"
                className="af-mobile-logout"
                onClick={() => {
                  localStorage.removeItem("token");
                  navigate("/");
                }}
              >
                Log out
              </button>
            )}
          </nav>
        )}
      </header>
    );
  return (
    <header className="af-header af-quiet-header">
      <div className="af-header-inner">
        <Link to="/" aria-label="Adaptive Finance home">
          <Brand />
        </Link>
        <div className="af-header-actions">
          <LanguageSelector />
          {token ? (
            <>
              <button
                className="af-login-link"
                onClick={() => {
                  localStorage.removeItem("token");
                  navigate("/");
                }}
              >
                Log out
              </button>
              <Link className="af-button af-header-cta" to="/dashboard">
                Dashboard
                <FiArrowUpRight />
              </Link>
            </>
          ) : (
            <Link
              className="af-login-link af-auth-nav-link"
              to={location.pathname === "/login" ? "/signup" : "/login"}
            >
              {location.pathname === "/login" ? "Create an account" : "Log in"}
              <FiArrowUpRight />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
export default Navbar;
