import { motion } from "framer-motion";

export default function LiveArrivals({ arrivals, loading }) {
  if (loading) {
    return (
      <div className="live-arrivals">
        <h4>Live Train Arrivals</h4>
        <p>Loading arrivals...</p>
      </div>
    );
  }

  if (!arrivals || arrivals.length === 0) {
    return (
      <div className="live-arrivals">
        <h4>Live Train Arrivals</h4>
        <p>No live arrivals found for this stop right now.</p>
        <p className="small-note">
          Some MTA stops use direction IDs like N or S, so we may improve this next.
        </p>
      </div>
    );
  }

  return (
    <div className="live-arrivals">
      <h4>Live Train Arrivals</h4>

      <div className="arrival-list">
        {arrivals.map((arrival, index) => (
          <motion.div
            className="arrival-item"
            key={`${arrival.tripId}-${arrival.timestamp}-${index}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.05 }}
          >
            <div className="arrival-route">
              {arrival.route}
            </div>

            <div className="arrival-info">
              <strong>
                {arrival.minutes === 0 ? "Arriving now" : `${arrival.minutes} min`}
              </strong>
              <span>Feed: {arrival.feed}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
