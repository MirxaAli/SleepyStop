import { motion, AnimatePresence } from "framer-motion";

function formatDateTime(value) {
  const date = new Date(value);

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

export default function TripHistory({
  history,
  isOpen,
  onToggle,
  onSelectHistory,
  onClearHistory
}) {
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
