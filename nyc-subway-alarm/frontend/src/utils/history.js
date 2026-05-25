const HISTORY_KEY = "sleepystop_trip_history";

export function getTripHistory() {
  const saved = localStorage.getItem(HISTORY_KEY);

  if (!saved) {
    return [];
  }

  try {
    return JSON.parse(saved);
  } catch {
    return [];
  }
}

export function saveTripToHistory(station) {
  const history = getTripHistory();

  const newItem = {
    id: `${station.id}-${Date.now()}`,
    stationId: station.id,
    stopId: station.stopId,
    name: station.name,
    lines: station.lines || [],
    latitude: station.latitude,
    longitude: station.longitude,
    savedAt: new Date().toISOString()
  };

  const updatedHistory = [newItem, ...history].slice(0, 20);

  localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));

  return updatedHistory;
}

export function clearTripHistory() {
  localStorage.removeItem(HISTORY_KEY);
  return [];
}
