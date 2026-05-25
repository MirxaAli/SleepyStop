import fs from "fs";
import path from "path";

const stationsPath = path.resolve("src/data/processed/stations.json");

export function getAllStations(req, res) {
  const stations = JSON.parse(fs.readFileSync(stationsPath, "utf-8"));
  res.json(stations);
}

export function searchStations(req, res) {
  const query = req.query.q?.toLowerCase() || "";
  const stations = JSON.parse(fs.readFileSync(stationsPath, "utf-8"));

  const results = stations.filter((station) =>
    station.name.toLowerCase().includes(query)
  );

  res.json(results);
}
