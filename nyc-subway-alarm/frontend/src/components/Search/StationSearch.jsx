import { useState } from "react";

export default function StationSearch({ stations, onSelectStation }) {
  const [searchText, setSearchText] = useState("");

  const filteredStations = stations.filter((station) =>
    station.name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="station-search">
      <label htmlFor="station-search">Destination Station</label>

      <input
        id="station-search"
        type="text"
        placeholder="Search station, example: Times Square"
        value={searchText}
        onChange={(event) => setSearchText(event.target.value)}
      />

      {searchText && (
        <div className="station-results">
          {filteredStations.length > 0 ? (
            filteredStations.map((station) => (
              <button
                key={station.id}
                className="station-result"
                onClick={() => {
                  onSelectStation(station);
                  setSearchText(station.name);
                }}
              >
                <strong>{station.name}</strong>
                <span>{station.lines.join(", ")}</span>
              </button>
            ))
          ) : (
            <p className="no-results">No station found.</p>
          )}
        </div>
      )}
    </div>
  );
}
