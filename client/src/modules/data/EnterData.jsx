import { Link } from "react-router-dom";
import { FiArrowUpRight, FiClock, FiShield } from "react-icons/fi";
import { Notice, PageHeading, Panel } from "../../components/ui/ProductUi";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { useState } from "react";
import { FiEdit3 } from "react-icons/fi";

const EnterData = () => {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [platform, setPlatform] = useState("");
  const [hoursWorked, setHoursWorked] = useState("");
  const [ordersCompleted, setOrdersCompleted] = useState("");
  const [income, setIncome] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [existingEntry, setExistingEntry] = useState(null);
  const [pendingData, setPendingData] = useState(null);

  const today = new Date();
  const maxDate = today.toISOString().split("T")[0];
  const minDate = new Date(
    today.getFullYear(),
    today.getMonth() - 2,
    today.getDate(),
  )
    .toISOString()
    .split("T")[0];

  const checkAndSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please login to save entries.");
      setLoading(false);
      return;
    }

    try {
      const userRes = await fetch("http://localhost:5000/api/data/user", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await userRes.json();
      const entries = data.entries || [];

      const existing = entries.find((e) => e.date === date);

      if (existing) {
        setExistingEntry(existing);
        setPendingData({
          date,
          platform,
          hours_worked: Number(hoursWorked),
          orders_completed: Number(ordersCompleted),
          income: Number(income),
        });
        setShowConfirm(true);
        setLoading(false);
      } else {
        submitEntry({
          date,
          platform,
          hours_worked: Number(hoursWorked),
          orders_completed: Number(ordersCompleted),
          income: Number(income),
        });
      }
    } catch (err) {
      console.error(err);
      setError("Error checking existing entries.");
      setLoading(false);
    }
  };

  const submitEntry = async (data) => {
    setLoading(true);
    const token = localStorage.getItem("token");

    try {
      const response = await fetch("http://localhost:5000/api/data/entry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.message || "Unable to save entry");
        setLoading(false);
        return;
      }
      setMessage("Entry saved successfully!");
      setDate(new Date().toISOString().split("T")[0]);
      setPlatform("");
      setHoursWorked("");
      setOrdersCompleted("");
      setIncome("");
      setShowConfirm(false);
      setExistingEntry(null);
      setPendingData(null);
    } catch (err) {
      console.error(err);
      setError("Server error while saving entry.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmUpdate = () => {
    if (pendingData) {
      submitEntry(pendingData);
    }
  };

  const handleCancelUpdate = () => {
    setShowConfirm(false);
    setExistingEntry(null);
    setPendingData(null);
  };

  return (
    <div>
      <PageHeading
        eyebrow="ONE DAY. A CLEARER PICTURE."
        title={
          <>
            Make today <span>count.</span>
          </>
        }
        description="A busy shift, a quiet day, or something in between. Bring your earnings into focus."
      />
      {message && (
        <Notice tone="success" title="Your day is recorded.">
          {message}{" "}
          <Link to="/dashboard/income-history">View income history</Link>
        </Notice>
      )}
      {error && <Notice tone="error">{error}</Notice>}
      {showConfirm && existingEntry && (
        <ConfirmDialog
          title="This day is already in your picture."
          onCancel={handleCancelUpdate}
          busy={loading}
        >
          <p className="af-dialog-copy">
            An entry exists for <strong>{existingEntry.date}</strong>. Review
            the recorded details before replacing them.
          </p>
          <dl className="af-dialog-entry">
            <div>
              <dt>Platform</dt>
              <dd>{existingEntry.platform}</dd>
            </div>
            <div>
              <dt>Hours worked</dt>
              <dd>{existingEntry.hours_worked}h</dd>
            </div>
            <div>
              <dt>Orders completed</dt>
              <dd>{existingEntry.orders_completed}</dd>
            </div>
            <div>
              <dt>Income</dt>
              <dd>₹{existingEntry.income}</dd>
            </div>
          </dl>
          <p className="af-dialog-copy">
            Update this day with the values you’ve just entered?
          </p>
          <div className="af-dialog-actions">
            <button
              type="button"
              className="af-ui-button af-ui-button-secondary"
              onClick={handleCancelUpdate}
              disabled={loading}
            >
              Keep existing entry
            </button>
            <button
              type="button"
              className="af-ui-button"
              onClick={handleConfirmUpdate}
              disabled={loading}
            >
              {loading ? "Updating…" : "Update entry"}
            </button>
          </div>
        </ConfirmDialog>
      )}
      <div className="af-entry-layout">
        <Panel
          title="Your daily entry"
          description="The details behind a day’s earnings."
        >
          <form
            className="af-form af-entry-form"
            onSubmit={checkAndSubmit}
            aria-busy={loading}
          >
            <div className="af-field-grid">
              <label className="af-field">
                <span>Date</span>
                <input
                  type="date"
                  value={date}
                  min={minDate}
                  max={maxDate}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
                <small>Choose a day from the last two months.</small>
              </label>
              <label className="af-field">
                <span>Platform</span>
                <input
                  type="text"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  list="af-platforms"
                  placeholder="e.g. Swiggy or freelance"
                  required
                />
                <datalist id="af-platforms">
                  {[
                    "Swiggy",
                    "Zomato",
                    "Uber",
                    "Blinkit",
                    "Freelance",
                    "Other",
                  ].map((item) => (
                    <option value={item} key={item} />
                  ))}
                </datalist>
                <small>Where did you earn this income?</small>
              </label>
              <label className="af-field">
                <span>Hours worked</span>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={hoursWorked}
                  onChange={(e) => setHoursWorked(e.target.value)}
                  placeholder="e.g. 8"
                  required
                />
              </label>
              <label className="af-field">
                <span>Orders completed</span>
                <input
                  type="number"
                  min="0"
                  value={ordersCompleted}
                  onChange={(e) => setOrdersCompleted(e.target.value)}
                  placeholder="e.g. 24"
                  required
                />
              </label>
            </div>
            <label className="af-field af-entry-income">
              <span>Total income for the day</span>
              <span className="af-currency-field">
                <span aria-hidden="true">₹</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </span>
              <small>Record what you earned, including a ₹0 day.</small>
            </label>
            <div className="af-entry-submit">
              <span>
                <FiShield /> A clearer picture, one day at a time.
              </span>
              <button
                type="submit"
                className="af-ui-button"
                disabled={loading || showConfirm}
              >
                {loading ? "Saving…" : "Save my day"}
                <FiArrowUpRight />
              </button>
            </div>
          </form>
        </Panel>
        <aside className="af-entry-aside">
          <span className="af-aside-icon">
            <FiEdit3 />
          </span>
          <span className="af-ui-eyebrow">SMALL HABIT. BIGGER PICTURE.</span>
          <h2>
            A minute today.
            <br />
            <span>More clarity tomorrow.</span>
          </h2>
          <p>
            Consistent entries help reveal your earning patterns — including the
            quieter days.
          </p>
          <div className="af-entry-tip">
            <FiClock />
            <span>
              Make it part of your day.
              <small>Log your earnings after your last shift.</small>
            </span>
          </div>
          <Link to="/dashboard/income-history" className="af-panel-link">
            See your recorded days <FiArrowUpRight />
          </Link>
        </aside>
      </div>
    </div>
  );
};
export default EnterData;
