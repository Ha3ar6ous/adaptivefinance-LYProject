import { useEffect } from "react";
import {
  Navigate,
  Route,
  Routes,
  BrowserRouter,
  useLocation,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import "./styles/design-tokens.css";
import "./styles/product.css";
import LandingPage from "./modules/landing/LandingPage";
import LoginPage from "./modules/auth/LoginPage";
import SignupPage from "./modules/auth/SignupPage";
import Dashboard from "./modules/dashboard/Dashboard";
import DashboardHome from "./modules/dashboard/DashboardHome";
import EnterData from "./modules/data/EnterData";
import IncomeHistory from "./modules/dashboard/IncomeHistory";
import Forecasts from "./modules/dashboard/Forecasts";
import HealthDecisions from "./modules/dashboard/HealthDecisions";
import ChatPage from "./modules/dashboard/ChatPage";
import ChatProvider from "./modules/dashboard/ChatProvider";
import InvestmentEngine from "./modules/dashboard/InvestmentEngine";
import OnboardingPage from "./modules/onboarding/OnboardingPage";

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
};

const GlobalHeader = () => {
  const { pathname } = useLocation();
  return pathname.startsWith("/dashboard") ? null : <Navbar />;
};

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <div
        style={{
          position: "relative",
          width: "100%",
          minHeight: "100vh",
          backgroundColor: "var(--af-paper)",
        }}
      >
        <div style={{ position: "relative", zIndex: 1 }}>
          <GlobalHeader />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route
              path="/onboarding"
              element={
                <PrivateRoute>
                  <OnboardingPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <ChatProvider>
                    <Dashboard />
                  </ChatProvider>
                </PrivateRoute>
              }
            >
              <Route index element={<DashboardHome />} />
              <Route path="enter-data" element={<EnterData />} />
              <Route path="income-history" element={<IncomeHistory />} />
              <Route path="forecasts" element={<Forecasts />} />
              <Route path="health" element={<HealthDecisions />} />
              <Route path="investments" element={<InvestmentEngine />} />
              <Route path="chat" element={<ChatPage />} />
            </Route>
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
