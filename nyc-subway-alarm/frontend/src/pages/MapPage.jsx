import { useEffect, useState } from "react";
import SubwayMap from "../components/Map/SubwayMap.jsx";
import StationSearch from "../components/Search/StationSearch.jsx";
import RouteFilter from "../components/Search/RouteFilter.jsx";
import useGeolocation from "../hooks/useGeolocation.js";
import { getDistanceInMeters } from "../utils/distance.js";
import { requestNotificationPermission, sendNotification } from "../hooks/useNotification.js";
import { vibratePhone } from "../hooks/useVibration.js";
import { checkBackendHealth, getStations } from "../services/api.js";

export default function MapPage() {
  const [backendStatus, setBackendStatus] = useState("Checking backend...");
  const [stations, setStations] = useState([]);
  const [selectedLine, setSelectedLine] = useState("All");
  const [selectedStation, setSelectedStation] = useState(null);

  const [alarmStarted, setAlarmStarted] = useState(false);
  const [hasAlerted, setHasAlerted] = useState(false);

  const [alertDistance, setAlertDistance] = useState(100);
  const [alertType, setAlertType] = useState("both");

  const { location, error: locationError } = useGeolocation();

  useEffect(() => {
    async function loadData() {
      try {
        const health = await checkBackendHealth();
        setBackendStatus(`Backend connected: ${health.status}`);

        const stationData = await getStations();
        setStations(stationData);
      } catch (error) {
        setBackendStatus("Backend not connected. Make sure backend port 8080 is open.");
      }
    }

    loadData();
  }, []);

  const filteredStations =
    selectedLine === "All"
      ? stations
      : stations.filter((station) => station.lines?.includes(selectedLine));

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

    if (distanceToStop <= alertDistance) {
      triggerAlarm();
      setHasAlerted(true);
    }
  }, [alarmStarted, hasAlerted, distanceToStop, selectedStation, alertDistance, alertType]);

  function triggerAlarm() {
    const stopName = selectedStation?.name || "your selected stop";

    if (alertType === "notification" || alertType === "both") {
      sendNotification(
        "Wake up! Your stop is near.",
        `You are close to ${stopName}.`
      );
    }

    if (alertType === "vibration" || alertType === "both") {
      vibratePhone();
    }
  }

  async function handleStartAlarm() {
    if (!selectedStation) {
      alert("Please select a destination station first.");
      return;
    }

    const permission = await requestNotificationPermission();

    if (permission === "denied" && alertType !== "vibration") {
      alert("Notification permission denied. You can still use vibration on supported phones.");
    }

    setHasAlerted(false);
    setAlarmStarted(true);
  }

  function handleStopAlarm() {
    setAlarmStarted(false);
    setHasAlerted(false);
  }

  async function handleTestAlarm() {
    const permission = await requestNotificationPermission();

    if (permission === "denied" && alertType !== "vibration") {
      alert("Notification permission denied. Vibration may still work on supported phones.");
    }

    triggerAlarm();
  }

  return (
    <div className="app">
      <header className="header">
        <h1>SleepyStop</h1>
        <p>NYC subway stop alarm for sleepy commuters.</p>
      </header>

      <main className="main">
        <section className="card status-card">
          <h2>Project Status</h2>
          <p>{backendStatus}</p>
          <p>Stations loaded: {stations.length}</p>
          <p>Showing stations: {filteredStations.length}</p>
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

        <section className="card trip-panel">
          <h2>Set Your Stop Alarm</h2>

          <RouteFilter
            selectedLine={selectedLine}
            onSelectLine={(line) => {
              setSelectedLine(line);
              setSelectedStation(null);
              setAlarmStarted(false);
              setHasAlerted(false);
            }}
          />

          <StationSearch
            stations={filteredStations}
            onSelectStation={(station) => {
              setSelectedStation(station);
              setAlarmStarted(false);
              setHasAlerted(false);
            }}
          />

          <div className="form-group">
            <label>Alert Distance</label>
            <select
              value={alertDistance}
              onChange={(event) => setAlertDistance(Number(event.target.value))}
            >
              <option value={100}>100 meters before stop</option>
              <option value={200}>200 meters before stop</option>
              <option value={300}>300 meters before stop</option>
              <option value={500}>500 meters before stop</option>
            </select>
          </div>

          <div className="form-group">
            <label>Alert Type</label>
            <select
              value={alertType}
              onChange={(event) => setAlertType(event.target.value)}
            >
              <option value="both">Notification + Vibration</option>
              <option value="notification">Notification only</option>
              <option value="vibration">Vibration only</option>
            </select>
          </div>

          <button className="secondary-button" onClick={handleTestAlarm}>
            Test Alarm
          </button>

          {selectedStation && (
            <div className="selected-station">
              <h3>Selected Stop</h3>
              <p>
                <strong>{selectedStation.name}</strong>
              </p>

              {selectedStation.lines?.length > 0 ? (
                <p>Lines: {selectedStation.lines.join(", ")}</p>
              ) : (
                <p>Lines: not assigned yet</p>
              )}

              {distanceToStop !== null && (
                <p>
                  Distance from you:{" "}
                  <strong>{Math.round(distanceToStop)} meters</strong>
                </p>
              )}

              <p>
                Alarm will trigger at:{" "}
                <strong>{alertDistance} meters before stop</strong>
              </p>

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
                <p className="alarm-active">Alarm is active. Tracking your trip...</p>
              )}

              {hasAlerted && (
                <p className="alarm-triggered">Alarm triggered for this stop.</p>
              )}
            </div>
          )}
        </section>

        <section className="map-card">
          <SubwayMap
            stations={filteredStations}
            selectedStation={selectedStation}
            userLocation={location}
          />
        </section>
      </main>
    </div>
  );
}
