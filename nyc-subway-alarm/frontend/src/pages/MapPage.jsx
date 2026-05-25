import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SubwayMap from "../components/Map/SubwayMap.jsx";
import StationSearch from "../components/Search/StationSearch.jsx";
import RouteFilter from "../components/Search/RouteFilter.jsx";
import FavoriteStops from "../components/Favorites/FavoriteStops.jsx";
import useGeolocation from "../hooks/useGeolocation.js";
import { getDistanceInMeters } from "../utils/distance.js";
import {
  requestNotificationPermission,
  sendNotification
} from "../hooks/useNotification.js";
import { vibratePhone } from "../hooks/useVibration.js";
import {
  checkBackendHealth,
  getStations,
  getSubwayLines
} from "../services/api.js";
import {
  getFavoriteStations,
  saveFavoriteStation,
  removeFavoriteStation
} from "../utils/favorites.js";

const cardAnimation = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 }
};

export default function MapPage() {
  const [backendStatus, setBackendStatus] = useState("Checking backend...");
  const [stations, setStations] = useState([]);
  const [subwayLines, setSubwayLines] = useState(null);

  const [selectedLine, setSelectedLine] = useState("All");
  const [selectedStation, setSelectedStation] = useState(null);
  const [favoriteStations, setFavoriteStations] = useState([]);

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

        const lineData = await getSubwayLines();
        setSubwayLines(lineData);
      } catch (error) {
        console.error("Backend connection error:", error);
        setBackendStatus(
          "Backend not connected. Make sure backend port 8080 is open."
        );
      }
    }

    loadData();
  }, []);

  useEffect(() => {
    setFavoriteStations(getFavoriteStations());
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
    if (
      !alarmStarted ||
      hasAlerted ||
      distanceToStop === null ||
      !selectedStation
    ) {
      return;
    }

    if (distanceToStop <= alertDistance) {
      triggerAlarm();
      setHasAlerted(true);
    }
  }, [
    alarmStarted,
    hasAlerted,
    distanceToStop,
    selectedStation,
    alertDistance,
    alertType
  ]);

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
      alert(
        "Notification permission denied. You can still use vibration on supported phones."
      );
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
      alert(
        "Notification permission denied. Vibration may still work on supported phones."
      );
    }

    triggerAlarm();
  }

  function handleSaveFavorite() {
    if (!selectedStation) {
      alert("Please select a station first.");
      return;
    }

    const updatedFavorites = saveFavoriteStation(selectedStation);
    setFavoriteStations(updatedFavorites);
  }

  function handleSelectFavorite(station) {
    setSelectedStation(station);
    setAlarmStarted(false);
    setHasAlerted(false);
  }

  function handleRemoveFavorite(stationId) {
    const updatedFavorites = removeFavoriteStation(stationId);
    setFavoriteStations(updatedFavorites);
  }

  return (
    <div className="app">
      <motion.header
        className="header"
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <h1>SleepyStop</h1>
        <p>NYC subway stop alarm for sleepy commuters.</p>
      </motion.header>

      <main className="main">
        <motion.div
          className="left-panel"
          initial="hidden"
          animate="visible"
          transition={{ staggerChildren: 0.12 }}
        >
          <motion.section
            className="card status-card"
            variants={cardAnimation}
            transition={{ duration: 0.35 }}
          >
            <h2>Project Status</h2>
            <p>{backendStatus}</p>
            <p>Stations loaded: {stations.length}</p>
            <p>Showing stations: {filteredStations.length}</p>
            <p>
              Subway route lines:{" "}
              {subwayLines?.features?.length
                ? subwayLines.features.length
                : "Loading..."}
            </p>
          </motion.section>

          <motion.section
            className="card"
            variants={cardAnimation}
            transition={{ duration: 0.35 }}
          >
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
          </motion.section>

          <motion.section
            className="card favorites-card"
            variants={cardAnimation}
            transition={{ duration: 0.35 }}
          >
            <h2>Favorite Stops</h2>

            <FavoriteStops
              favorites={favoriteStations}
              onSelectFavorite={handleSelectFavorite}
              onRemoveFavorite={handleRemoveFavorite}
            />
          </motion.section>

          <motion.section
            className="card trip-panel"
            variants={cardAnimation}
            transition={{ duration: 0.35 }}
          >
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
                onChange={(event) =>
                  setAlertDistance(Number(event.target.value))
                }
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

            <motion.button
              className="secondary-button"
              onClick={handleTestAlarm}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
            >
              Test Alarm
            </motion.button>

            <motion.button
              className="favorite-save-button"
              onClick={handleSaveFavorite}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
            >
              Save Favorite
            </motion.button>

            <AnimatePresence>
              {selectedStation && (
                <motion.div
                  className="selected-station"
                  initial={{ opacity: 0, x: -20, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: "auto" }}
                  exit={{ opacity: 0, x: -20, height: 0 }}
                  transition={{ duration: 0.35 }}
                >
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
                    <motion.button
                      className="primary-button animated-start-button"
                      onClick={handleStartAlarm}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.94 }}
                    >
                      Start Alarm
                    </motion.button>
                  ) : (
                    <motion.button
                      className="danger-button"
                      onClick={handleStopAlarm}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.94 }}
                    >
                      Stop Alarm
                    </motion.button>
                  )}

                  {alarmStarted && !hasAlerted && (
                    <motion.p
                      className="alarm-active pulse-status"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      Alarm is active. Tracking your trip...
                    </motion.p>
                  )}

                  {hasAlerted && (
                    <motion.p
                      className="alarm-triggered"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      Alarm triggered for this stop.
                    </motion.p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        </motion.div>

        <motion.section
          className="map-card"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45 }}
        >
          <SubwayMap
            stations={filteredStations}
            subwayLines={subwayLines}
            selectedStation={selectedStation}
            userLocation={location}
          />
        </motion.section>
      </main>
    </div>
  );
}
