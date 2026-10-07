import { useEffect, useRef, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  FiBarChart2,
  FiEdit3,
  FiHome,
  FiLogOut,
  FiMenu,
  FiMessageSquare,
  FiPieChart,
  FiPlus,
  FiShield,
  FiTrendingUp,
  FiX,
  FiChevronRight,
} from "react-icons/fi";
import Brand from "../landing/Brand";
import LanguageSelector from "../../components/ui/LanguageSelector";

const menuItems = [
  { to: "/dashboard", label: "Overview", icon: FiHome, end: true },
  { to: "enter-data", label: "Enter data", icon: FiEdit3 },
  { to: "income-history", label: "Income history", icon: FiBarChart2 },
  { to: "forecasts", label: "Forecasts", icon: FiTrendingUp },
  { to: "health", label: "Health & decisions", icon: FiShield },
  { to: "investments", label: "Investment suggestions", icon: FiPieChart },
  { to: "chat", label: "AI assistant", icon: FiMessageSquare },
];

const Dashboard = () => {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const toggleRef = useRef(null);
  const sidebarRef = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5000/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (err) {
        console.error("Failed to fetch profile", err);
      }
    };
    fetchProfile();
  }, []);

  // The phone menu is a keyboard-accessible drawer; Escape returns focus to its trigger.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sidebarRef.current?.querySelector("button")?.focus();
    const onKey = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
      if (event.key === "Tab") {
        const targets = [
          ...sidebarRef.current.querySelectorAll("a,button"),
        ].filter((node) => node.getClientRects().length);
        const first = targets[0],
          last = targets[targets.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("chatMessages");
    navigate("/");
  };
  const section =
    menuItems.find((item) =>
      item.end
        ? location.pathname === item.to
        : location.pathname.endsWith("/" + item.to),
    )?.label || "Overview";

  return (
    <div className="af-app af-workspace">
      <a className="af-workspace-skip" href="#af-workspace-main">
        Skip to content
      </a>
      <header className="af-mobile-workspace-header">
        <Link to="/" aria-label="Finspire home">
          <Brand />
        </Link>
        <div>
          <LanguageSelector />
          <button
            type="button"
            className="af-icon-button"
            ref={toggleRef}
            aria-label="Open navigation"
            aria-expanded={open}
            aria-controls="af-workspace-sidebar"
            onClick={() => setOpen(true)}
          >
            <FiMenu />
          </button>
        </div>
      </header>
      {open && (
        <button
          type="button"
          className="af-drawer-backdrop"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        id="af-workspace-sidebar"
        ref={sidebarRef}
        className={`af-workspace-sidebar ${open ? "af-drawer-open" : ""}`}
      >
        <div className="af-sidebar-brand">
          <Link to="/" aria-label="Finspire home">
            <Brand />
          </Link>
          <button
            type="button"
            className="af-icon-button af-drawer-close"
            aria-label="Close navigation"
            onClick={() => {
              setOpen(false);
              toggleRef.current?.focus();
            }}
          >
            <FiX />
          </button>
        </div>
        <span className="af-ui-eyebrow af-sidebar-eyebrow">
          YOUR FINANCIAL PICTURE
        </span>
        <nav className="af-workspace-nav" aria-label="Workspace navigation">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setOpen(false)}
              >
                <Icon aria-hidden="true" />
                <span>{item.label}</span>
                <FiChevronRight className="af-nav-chevron" aria-hidden="true" />
              </NavLink>
            );
          })}
        </nav>
        <div className="af-sidebar-principle">
          <FiShield />
          <span>
            Safety before growth.<small>A clearer next move, every day.</small>
          </span>
        </div>
        <div className="af-sidebar-account">
          <span className="af-avatar" aria-hidden="true">
            {user?.name?.trim().charAt(0).toUpperCase() || "A"}
          </span>
          <div>
            <strong>{user?.name || "Your account"}</strong>
            <span>Independent earner</span>
          </div>
          <button
            type="button"
            className="af-icon-button"
            onClick={handleLogout}
            aria-label="Log out"
          >
            <FiLogOut />
          </button>
        </div>
      </aside>
      <div className="af-workspace-body">
        <header className="af-workspace-topbar">
          <div className="af-breadcrumb">
            <Link to="/dashboard">Workspace</Link>
            <FiChevronRight aria-hidden="true" />
            <span>{section}</span>
          </div>
          <div className="af-workspace-topbar-actions">
            <LanguageSelector />
            <Link
              className="af-ui-button af-ui-button-small"
              to="/dashboard/enter-data"
            >
              <FiPlus /> Add income
            </Link>
          </div>
        </header>
        <main id="af-workspace-main" className="af-workspace-content">
          <div key={location.pathname} className="af-route-transition">
            <Outlet context={{ user }} />
          </div>
          <footer className="af-workspace-foot">
            <span>At your pace. On firmer ground.</span>
            <span>Finspire</span>
          </footer>
        </main>
      </div>
      <nav className="af-bottom-nav" aria-label="Quick navigation">
        {[
          { to: "/dashboard", label: "Overview", icon: FiHome, end: true },
          { to: "enter-data", label: "Add income", icon: FiPlus },
          { to: "forecasts", label: "Outlook", icon: FiTrendingUp },
          { to: "chat", label: "Assistant", icon: FiMessageSquare },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.to} to={item.to} end={item.end}>
              <Icon aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};
export default Dashboard;
