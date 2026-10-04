import { FiShield } from "react-icons/fi";
import {
  LoadingState,
  Notice,
  PageHeading,
  Panel,
} from "../../components/ui/ProductUi";
import { useEffect, useState } from "react";
import { FiRefreshCw } from "react-icons/fi";
import AiInlineNote from "../../components/AiInlineNote";
import InvestmentSuggestions from "../../components/InvestmentSuggestions";
import { getAiExplanation } from "../../services/aiApi";
import {
  getInvestmentSuggestion,
  runInvestmentSuggestion,
} from "../../services/analyticsApi";

const InvestmentEngine = () => {
  const [investment, setInvestment] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setError("");
      const [investmentData, aiData] = await Promise.all([
        getInvestmentSuggestion(),
        getAiExplanation().catch(() => null),
      ]);
      setInvestment(investmentData);
      setExplanation(aiData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    try {
      setRefreshing(true);
      setError("");
      const investmentData = await runInvestmentSuggestion();
      const aiData = await getAiExplanation().catch(() => null);
      setInvestment(investmentData);
      setExplanation(aiData);
    } catch (err) {
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <PageHeading
        eyebrow="PROTECT TODAY. MAKE ROOM FOR TOMORROW."
        title={
          <>
            Small steps.
            <br />
            <span>On your terms.</span>
          </>
        }
        description="Personalized micro-investment guidance, grounded in your cash flow and comfort with risk."
        action={
          <button
            type="button"
            className="af-ui-button af-ui-button-secondary"
            onClick={refresh}
            disabled={refreshing}
          >
            <FiRefreshCw />
            {refreshing ? "Refreshing…" : "Refresh suggestions"}
          </button>
        }
      />
      {error && <Notice tone="error">{error}</Notice>}
      <AiInlineNote label="THE CONTEXT BEHIND YOUR GUIDANCE">
        {explanation?.investmentInsight}
      </AiInlineNote>
      {loading ? (
        <LoadingState label="Matching guidance to your financial footing…" />
      ) : (
        <Panel>
          <InvestmentSuggestions investment={investment} />
        </Panel>
      )}
      <div className="af-safety-footer">
        <FiShield />
        <span>
          Guidance is informational. Projections are estimates, and returns are
          not guaranteed. Your essentials and emergency buffer come first.
        </span>
      </div>
    </div>
  );
};
export default InvestmentEngine;
