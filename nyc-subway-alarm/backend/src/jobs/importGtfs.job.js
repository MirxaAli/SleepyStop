import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

const gtfsDir = path.resolve("src/data/gtfs");
const outputPath = path.resolve("src/data/processed/stations.json");

const stopsPath = path.join(gtfsDir, "stops.txt");
const routesPath = path.join(gtfsDir, "routes.txt");
const tripsPath = path.join(gtfsDir, "trips.txt");
const stopTimesPath = path.join(gtfsDir, "stop_times.txt");

function readCsv(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error("Missing file:", filePath);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, "utf-8");

  return parse(content, {
    columns: true,
    skip_empty_lines: true
  });
}

function normalizeStationName(name) {
  return name.replace(/\s+/g, " ").trim();
}

function createId(name, stopId) {
  return `${name}-${stopId}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getMainStopId(stopId, parentStation) {
  return parentStation || stopId;
}

function importGtfs() {
  const stops = readCsv(stopsPath);
  const routes = readCsv(routesPath);
  const trips = readCsv(tripsPath);
  const stopTimes = readCsv(stopTimesPath);

  const routeIdToName = new Map();

  routes.forEach((route) => {
    routeIdToName.set(route.route_id, route.route_short_name);
  });

  const tripIdToRouteName = new Map();

  trips.forEach((trip) => {
    const routeName = routeIdToName.get(trip.route_id);

    if (routeName) {
      tripIdToRouteName.set(trip.trip_id, routeName);
    }
  });

  const childStopToParentStop = new Map();
  const stationMap = new Map();

  stops.forEach((stop) => {
    const stopId = stop.stop_id;
    const parentStation = stop.parent_station;
    const mainStopId = getMainStopId(stopId, parentStation);

    childStopToParentStop.set(stopId, mainStopId);

    const locationType = stop.location_type;
    const name = normalizeStationName(stop.stop_name);
    const latitude = Number(stop.stop_lat);
    const longitude = Number(stop.stop_lon);

    if (!stopId || !name || Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return;
    }

    /*
      Keep main station entries.
      location_type "1" usually means station.
      If location_type is blank but no parent exists, keep it too.
    */
    if (locationType === "1" || !parentStation) {
      const id = createId(name, mainStopId);

      if (!stationMap.has(mainStopId)) {
        stationMap.set(mainStopId, {
          id,
          stopId: mainStopId,
          name,
          lines: [],
          latitude,
          longitude
        });
      }
    }
  });

  const stationLines = new Map();

  stopTimes.forEach((stopTime) => {
    const routeName = tripIdToRouteName.get(stopTime.trip_id);
    const mainStopId = childStopToParentStop.get(stopTime.stop_id) || stopTime.stop_id;

    if (!routeName || !stationMap.has(mainStopId)) {
      return;
    }

    if (!stationLines.has(mainStopId)) {
      stationLines.set(mainStopId, new Set());
    }

    stationLines.get(mainStopId).add(routeName);
  });

  stationLines.forEach((linesSet, stopId) => {
    const station = stationMap.get(stopId);

    if (station) {
      station.lines = Array.from(linesSet).sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true })
      );
    }
  });

  const stations = Array.from(stationMap.values())
    .filter((station) => station.lines.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name));

  fs.writeFileSync(outputPath, JSON.stringify(stations, null, 2));

  console.log(`Imported ${stations.length} subway stations with train lines.`);
  console.log(`Saved to ${outputPath}`);
}

importGtfs();
