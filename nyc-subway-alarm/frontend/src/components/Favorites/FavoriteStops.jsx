export default function FavoriteStops({
  favorites,
  onSelectFavorite,
  onRemoveFavorite
}) {
  if (favorites.length === 0) {
    return (
      <div className="favorites-empty">
        <p>No favorite stops yet.</p>
        <p>Select a station and click “Save Favorite”.</p>
      </div>
    );
  }

  return (
    <div className="favorites-list">
      {favorites.map((station) => (
        <div className="favorite-item" key={station.id}>
          <button
            className="favorite-select"
            onClick={() => onSelectFavorite(station)}
          >
            <strong>{station.name}</strong>
            {station.lines?.length > 0 && (
              <span>{station.lines.join(", ")}</span>
            )}
          </button>

          <button
            className="favorite-remove"
            onClick={() => onRemoveFavorite(station.id)}
            aria-label={`Remove ${station.name}`}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
