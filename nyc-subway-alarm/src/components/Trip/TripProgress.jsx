export default function TripProgress({ distanceToStop, alertDistance }) {
  if (distanceToStop === null || distanceToStop === undefined) {
    return null;
  }

  const distance = Math.round(distanceToStop);

  let status = "Far away";
  let progress = 20;

  if (distance <= alertDistance) {
    status = "Alert zone";
    progress = 100;
  } else if (distance <= alertDistance * 2) {
    status = "Almost there";
    progress = 80;
  } else if (distance <= alertDistance * 5) {
    status = "Getting close";
    progress = 55;
  } else {
    status = "Far away";
    progress = 25;
  }

  return (
    <div className="trip-progress">
      <div className="trip-progress-header">
        <strong>{status}</strong>
        <span>{distance} meters away</span>
      </div>

      <div className="progress-track">
        <div
          className={
            distance <= alertDistance
              ? "progress-fill progress-fill-alert"
              : "progress-fill"
          }
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      <p className="trip-progress-note">
        Alarm target: {alertDistance} meters before your stop.
      </p>
    </div>
  );
}
