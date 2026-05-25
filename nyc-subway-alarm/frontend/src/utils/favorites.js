const FAVORITES_KEY = "sleepystop_favorite_stations";

export function getFavoriteStations() {
  const saved = localStorage.getItem(FAVORITES_KEY);

  if (!saved) {
    return [];
  }

  try {
    return JSON.parse(saved);
  } catch {
    return [];
  }
}

export function saveFavoriteStation(station) {
  const favorites = getFavoriteStations();

  const alreadyExists = favorites.some((item) => item.id === station.id);

  if (alreadyExists) {
    return favorites;
  }

  const updatedFavorites = [...favorites, station];
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));

  return updatedFavorites;
}

export function removeFavoriteStation(stationId) {
  const favorites = getFavoriteStations();

  const updatedFavorites = favorites.filter((station) => station.id !== stationId);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));

  return updatedFavorites;
}
