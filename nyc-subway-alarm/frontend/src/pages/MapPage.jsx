import { useEffect, useState } from "react";
import SubwayMap from "../components/Map/SubwayMap.jsx";
import StationSearch from "../components/Search/StationSearch.jsx";
import { checkBackendHealth } from "../services/api.js";

export default function MapPage() {
  const [backendStatus, setBackendStatus] = useState("Checking backend...");
  const [selectedStation, setSelectedStation] = useState(null);

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
          <h2>Select Destination</h2>

          <StationSearch onSelectStation={setSelectedStation} />

          {selectedStation && (
            <div className="selected-station">
              <h3>Selected Stop</h3>
              <p>
                <strong>{selectedStation.name}</strong>
              </p>
              <p>Lines: {selectedStation.lines.join(", ")}</p>
              <p>
                Alert will be prepared for 100 meters before this stop.
              </p>
            </div>
          )}
        </section>

        <section className="map-card">
          <SubwayMap selectedStation={selectedStation} />
        </section>
      </main>
    </div>
  );
}
