import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

const stopsPath = path.resolve("src/data/gtfs/stops.txt");
const outputPath = path.resolve("src/data/processed/stations.json");

function normalizeStationName(name) {
  return name
    .replace(/\s+/g, " ")
    .trim();
}

function createId(name, stopId) {
  return `${name}-${stopId}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function importStops() {
  if (!fs.existsSync(stopsPath)) {
    console.error("stops.txt not found at:", stopsPath);
    console.error("Download and unzip MTA GTFS first.");
    process.exit(1);
  }

  const fileContent = fs.readFileSync(stopsPath, "utf-8");

  const rows = parse(fileContent, {
    columns: true,
    skip_empty_lines: true
  });

  const stationMap = new Map();

  rows.forEach((row) => {
    const stopId = row.stop_id;
    const name = normalizeStationName(row.stop_name);
    const latitude = Number(row.stop_lat);
    const longitude = Number(row.stop_lon);

    if (!stopId || !name || Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return;
    }

    /*
      In MTA subway GTFS, parent stations usually represent the main station.
      Child stops may represent northbound/southbound platforms.
      We keep parent stations when possible to avoid duplicate platform markers.
    */
    const locationType = row.location_type;
    const parentStation = row.parent_station;

    if (locationType !== "1" && parentStation) {
      return;
    }

    const id = createId(name, stopId);

    if (!stationMap.has(id)) {
      stationMap.set(id, {
        id,
        stopId,
        name,
        lines: [],
        latitude,
        longitude
      });
    }
  });

  const stations = Array.from(stationMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  fs.writeFileSync(outputPath, JSON.stringify(stations, null, 2));

  console.log(`Imported ${stations.length} subway stations.`);
  console.log(`Saved to ${outputPath}`);
}

importStops();
