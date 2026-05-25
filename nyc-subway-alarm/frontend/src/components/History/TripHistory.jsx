import { motion, AnimatePresence } from "framer-motion";
import {
  BASE_SUBWAY_FARE,
  getWeeklyFareSummary
} from "../../utils/history.js";

function formatDateTime(value) {
  const date = new Date(value);

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function formatMoney(value) {
  return `$${Number(value).toFixed(2)}`;
}

export default function TripHistory({
  history,
  isOpen,
  onToggle,
  onSelectHistory,
  onClearHistory
}) {
  const weeklySummary = getWeeklyFareSummary(history);

  return (
    <div className="history-box">
      <button className="history-toggle-button" onClick={onToggle}>
        {isOpen ? "Hide History" : "Show History"}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="history-panel"
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="fare-summary-card">
              <h3>Weekly Fare Summary</h3>

              <div className="fare-summary-grid">
                <div>
                  <span>Trips this week</span>
                  <strong>{weeklySummary.tripCount}</strong>
                </div>

                <div>
                  <span>Estimated fare</span>
                  <strong>{formatMoney(weeklySummary.rawTotal)}</strong>
                </div>

                <div>
                  <span>After weekly cap</span>
                  <strong>{formatMoney(weeklySummary.cappedTotal)}</strong>
                </div>

                <div>
                  <span>Weekly cap</span>
                  <strong>{formatMoney(weeklySummary.weeklyCap)}</strong>
                </div>
              </div>

              {weeklySummary.savedByCap > 0 && (
                <p className="fare-saved">
                  OMNY cap savings: {formatMoney(weeklySummary.savedByCap)}
                </p>
              )}

              <p className="fare-note">
                Estimated subway fare: {formatMoney(BASE_SUBWAY_FARE)} per trip.
              </p>
            </div>

            {history.length === 0 ? (
              <p className="history-empty">
                No trip history yet. Select a destination stop to save it here.
              </p>
            ) : (
              <>
                <div className="history-list">
                  {history.map((item) => (
                    <button
                      key={item.id}
                      className="history-item"
                      onClick={() => onSelectHistory(item)}
                    >
                      <strong>{item.name}</strong>

                      {item.lines?.length > 0 && (
                        <span>Lines: {item.lines.join(", ")}</span>
                      )}

                      <span>
                        Fare: {formatMoney(item.fare || BASE_SUBWAY_FARE)}
                      </span>

                      <small>{formatDateTime(item.savedAt)}</small>
                    </button>
                  ))}
                </div>

                <button
                  className="history-clear-button"
                  onClick={onClearHistory}
                >
                  Clear History
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
