import { useEffect, useState } from "react";
import SubwayMap from "../components/Map/SubwayMap.jsx";
import StationSearch from "../components/Search/StationSearch.jsx";
import useGeolocation from "../hooks/useGeolocation.js";
import { getDistanceInMeters } from "../utils/distance.js";
import { requestNotificationPermission, sendNotification } from "../hooks/useNotification.js";
import { vibratePhone } from "../hooks/useVibration.js";
import { checkBackendHealth } from "../services/api.js";

export default function MapPage() {
  const [backendStatus, setBackendStatus] = useState("Checking backend...");
  const [selectedStation, setSelectedStation] = useState(null);
  const [alarmStarted, setAlarmStarted] = useState(false);
  const [hasAlerted, setHasAlerted] = useState(false);

  const { location, error: locationError } = useGeolocation();

  useEffect(() => {
    async function testBackend() {
      try {
        const data = await checkBackendHealth();
        setBackendStatus(`Backend connected: ${data.status}`);
      } catch (error) {
        setBackendStatus("Backend not connected. Make sure backend is running on port 8080.");
      }
    }

    testBackend();
  }, []);

  const distanceToStop =
    location && selectedStation
      ? getDistanceInMeters(
          location.latitude,
          location.longitude,
          selectedStation.latitude,
          selectedStation.longitude
        )
      : null;

  useEffect(() => {
    if (!alarmStarted || hasAlerted || distanceToStop === null || !selectedStation) {
      return;
    }

    if (distanceToStop <= 100) {
      sendNotification(
        "Wake up! Your stop is near.",
        `You are within 100 meters of ${selectedStation.name}.`
      );

      vibratePhone();
      setHasAlerted(true);
    }
  }, [alarmStarted, hasAlerted, distanceToStop, selectedStation]);

  async function handleStartAlarm() {
    const permission = await requestNotificationPermission();

    if (permission === "denied") {
      alert("Notification permission denied. Vibration may still work on supported phones.");
    }

    setHasAlerted(false);
    setAlarmStarted(true);
  }

  function handleStopAlarm() {
    setAlarmStarted(false);
    setHasAlerted(false);
  }

  return (
    <div className="app">
      <header className="header">
        <h1>SleepyStop</h1>
        <p>NYC subway stop alarm for sleepy commuters.</p>
      </header>

      <main className="main">
        <section className="card">
          <h2>Project Status</h2>
          <p>{backendStatus}</p>
        </section>

        <section className="card">
          <h2>Your Location</h2>

          {location ? (
            <>
              <p>Latitude: {location.latitude.toFixed(6)}</p>
              <p>Longitude: {location.longitude.toFixed(6)}</p>
              <p>Accuracy: about {Math.round(location.accuracy)} meters</p>
            </>
          ) : (
            <p>Waiting for location permission...</p>
          )}

          {locationError && <p className="error-text">{locationError}</p>}
        </section>

        <section className="card">
          <h2>Select Destination</h2>

          <StationSearch
            onSelectStation={(station) => {
              setSelectedStation(station);
              setAlarmStarted(false);
              setHasAlerted(false);
            }}
          />

          {selectedStation && (
            <div className="selected-station">
              <h3>Selected Stop</h3>
              <p>
                <strong>{selectedStation.name}</strong>
              </p>
              <p>Lines: {selectedStation.lines.join(", ")}</p>

              {distanceToStop !== null && (
                <p>
                  Distance from you: <strong>{Math.round(distanceToStop)} meters</strong>
                </p>
              )}

              <p>Alarm target: 100 meters before this stop.</p>

              {!alarmStarted ? (
                <button className="primary-button" onClick={handleStartAlarm}>
                  Start Alarm
                </button>
              ) : (
                <button className="danger-button" onClick={handleStopAlarm}>
                  Stop Alarm
                </button>
              )}

              {alarmStarted && !hasAlerted && (
                <p className="alarm-active">Alarm is active.</p>
              )}

              {hasAlerted && (
                <p className="alarm-triggered">Alarm triggered for this stop.</p>
              )}
            </div>
          )}
        </section>

        <section className="map-card">
          <SubwayMap selectedStation={selectedStation} userLocation={location} />
        </section>
      </main>
    </div>
  );
}
