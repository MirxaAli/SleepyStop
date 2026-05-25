const HISTORY_KEY = "sleepystop_trip_history";

export const BASE_SUBWAY_FARE = 3.0;
export const WEEKLY_FARE_CAP = 35.0;

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
    fare: BASE_SUBWAY_FARE,
    savedAt: new Date().toISOString()
  };

  const updatedHistory = [newItem, ...history].slice(0, 50);

  localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));

  return updatedHistory;
}

export function clearTripHistory() {
  localStorage.removeItem(HISTORY_KEY);
  return [];
}

export function getWeeklyFareSummary(history) {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  const weeklyTrips = history.filter((item) => {
    const tripDate = new Date(item.savedAt);
    return tripDate >= sevenDaysAgo && tripDate <= now;
  });

  const rawTotal = weeklyTrips.reduce((sum, item) => {
    return sum + Number(item.fare || BASE_SUBWAY_FARE);
  }, 0);

  const cappedTotal = Math.min(rawTotal, WEEKLY_FARE_CAP);
  const savedByCap = Math.max(0, rawTotal - WEEKLY_FARE_CAP);

  return {
    tripCount: weeklyTrips.length,
    rawTotal,
    cappedTotal,
    savedByCap,
    weeklyCap: WEEKLY_FARE_CAP
  };
}
