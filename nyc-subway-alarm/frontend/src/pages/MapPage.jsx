import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import SubwayMap from "../components/Map/SubwayMap.jsx";
import StationSearch from "../components/Search/StationSearch.jsx";
import RouteFilter from "../components/Search/RouteFilter.jsx";
import FavoriteStops from "../components/Favorites/FavoriteStops.jsx";
import TripProgress from "../components/Trip/TripProgress.jsx";
import LiveArrivals from "../components/Realtime/LiveArrivals.jsx";
import TripHistory from "../components/History/TripHistory.jsx";

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
  getSubwayLines,
  getArrivals
} from "../services/api.js";
import {
  getFavoriteStations,
  saveFavoriteStation,
  removeFavoriteStation
} from "../utils/favorites.js";
import {
  getTripHistory,
  saveTripToHistory,
  clearTripHistory
} from "../utils/history.js";

const cardAnimation = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 }
};

export default function MapPage() {
  const [backendStatus, setBackendStatus] = useState("Connecting...");
  const [stations, setStations] = useState([]);
  const [subwayLines, setSubwayLines] = useState(null);

  const [selectedLine, setSelectedLine] = useState("All");
  const [selectedStation, setSelectedStation] = useState(null);
  const [favoriteStations, setFavoriteStations] = useState([]);
  const [tripHistory, setTripHistory] = useState([]);

  const [menuOpen, setMenuOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const [alarmStarted, setAlarmStarted] = useState(false);
  const [hasAlerted, setHasAlerted] = useState(false);

  const [alertDistance, setAlertDistance] = useState(100);
  const [alertType, setAlertType] = useState("both");

  const [arrivals, setArrivals] = useState([]);
  const [arrivalsLoading, setArrivalsLoading] = useState(false);

  const { location, error: locationError } = useGeolocation();

  useEffect(() => {
    async function loadData() {
      try {
        await checkBackendHealth();
        setBackendStatus("Live");

        const stationData = await getStations();
        setStations(stationData);

        const lineData = await getSubwayLines();
        setSubwayLines(lineData);
      } catch (error) {
        console.error("Backend connection error:", error);
        setBackendStatus("Offline");
      }
    }

    loadData();
  }, []);

  useEffect(() => {
    setFavoriteStations(getFavoriteStations());
    setTripHistory(getTripHistory());
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

  const nearestStation =
    location && stations.length > 0
      ? stations
          .map((station) => ({
            ...station,
            distance: getDistanceInMeters(
              location.latitude,
              location.longitude,
              station.latitude,
              station.longitude
            )
          }))
          .sort((a, b) => a.distance - b.distance)[0]
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

  async function loadArrivalsForStation(station) {
    if (!station?.stopId) {
      setArrivals([]);
      return;
    }

    setArrivalsLoading(true);

    try {
      const data = await getArrivals(station.stopId);
      setArrivals(data.arrivals || []);
    } catch (error) {
      console.error("Live arrivals error:", error);
      setArrivals([]);
    } finally {
      setArrivalsLoading(false);
    }
  }

  function selectStation(station, shouldSaveHistory = true) {
    setSelectedStation(station);
    setAlarmStarted(false);
    setHasAlerted(false);
    loadArrivalsForStation(station);

    if (shouldSaveHistory) {
      const updatedHistory = saveTripToHistory(station);
      setTripHistory(updatedHistory);
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
    selectStation(station);
  }

  function handleRemoveFavorite(stationId) {
    const updatedFavorites = removeFavoriteStation(stationId);
    setFavoriteStations(updatedFavorites);
  }

  function handleSelectHistory(item) {
    selectStation(
      {
        id: item.stationId,
        stopId: item.stopId,
        name: item.name,
        lines: item.lines,
        latitude: item.latitude,
        longitude: item.longitude
      },
      false
    );

    setHistoryOpen(false);
    setMenuOpen(false);
  }

  function handleClearHistory() {
    const updatedHistory = clearTripHistory();
    setTripHistory(updatedHistory);
  }

  return (
    <div className="app">
      <motion.header
        className="app-header"
        initial={{ opacity: 0, y: -22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="brand-section">
          <motion.div
            className="brand-icon"
            animate={{ y: [0, -4, 0] }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            🚇
          </motion.div>

          <div>
            <motion.h1
              className="brand-title"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
            >
              SleepyStop
            </motion.h1>

            <motion.p
              className="brand-subtitle"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25, duration: 0.4 }}
            >
              Never miss your NYC subway stop again.
            </motion.p>
          </div>
        </div>

        <div className="header-actions">
          <motion.div
            className="live-pill"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35, duration: 0.35 }}
          >
            <span className="live-dot"></span>
            {backendStatus === "Live" ? "Live tracking" : "Offline"}
          </motion.div>

          <div className="menu-wrapper">
            <button
              className="menu-button"
              onClick={() => setMenuOpen((value) => !value)}
              aria-label="Open menu"
            >
              ⋮
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  className="menu-dropdown"
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                >
                  <button
                    onClick={() => {
                      setHistoryOpen(true);
                      setMenuOpen(false);
                    }}
                  >
                    History
                  </button>

                  <button
                    onClick={() => {
                      handleClearHistory();
                      setMenuOpen(false);
                    }}
                  >
                    Clear History
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {historyOpen && (
          <motion.div
            className="history-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setHistoryOpen(false)}
          >
            <motion.div
              className="history-modal"
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ duration: 0.25 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="history-modal-header">
                <h2>Trip History</h2>
                <button onClick={() => setHistoryOpen(false)}>×</button>
              </div>

              <TripHistory
                history={tripHistory}
                isOpen={true}
                onToggle={() => setHistoryOpen(false)}
                onSelectHistory={handleSelectHistory}
                onClearHistory={handleClearHistory}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
            <h2>Nearby Station</h2>

            {locationError && <p className="error-text">{locationError}</p>}

            {!location && !locationError && (
              <p>Waiting for your live location...</p>
            )}

            {nearestStation && (
              <>
                <p>
                  You are near <strong>{nearestStation.name}</strong>
                </p>
                <p>
                  Distance:{" "}
                  <strong>{Math.round(nearestStation.distance)} meters away</strong>
                </p>

                {nearestStation.lines?.length > 0 && (
                  <p>Lines: {nearestStation.lines.join(", ")}</p>
                )}

                <button
                  className="secondary-button"
                  onClick={() => selectStation(nearestStation)}
                >
                  Use Nearest Station
                </button>
              </>
            )}
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
                setArrivals([]);
                setAlarmStarted(false);
                setHasAlerted(false);
              }}
            />

            <StationSearch
              stations={filteredStations}
              onSelectStation={selectStation}
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
              Preview Alert
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
                  <h3>Your Destination Stop</h3>

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
                      You are{" "}
                      <strong>{Math.round(distanceToStop)} meters away</strong>{" "}
                      from this stop.
                    </p>
                  )}

                  <TripProgress
                    distanceToStop={distanceToStop}
                    alertDistance={alertDistance}
                  />

                  <LiveArrivals
                    arrivals={arrivals}
                    loading={arrivalsLoading}
                  />

                  <p>
                    Alarm will trigger at{" "}
                    <strong>{alertDistance} meters before the stop</strong>.
                  </p>

                  {!alarmStarted ? (
                    <motion.button
                      className="primary-button animated-start-button"
                      onClick={handleStartAlarm}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.94 }}
                    >
                      Start Tracking
                    </motion.button>
                  ) : (
                    <motion.button
                      className="danger-button"
                      onClick={handleStopAlarm}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.94 }}
                    >
                      Stop Tracking
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
