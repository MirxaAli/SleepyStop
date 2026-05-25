import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

const gtfsDir = path.resolve("src/data/gtfs");
const outputPath = path.resolve("src/data/processed/subway-lines.geojson");

const routesPath = path.join(gtfsDir, "routes.txt");
const tripsPath = path.join(gtfsDir, "trips.txt");
const shapesPath = path.join(gtfsDir, "shapes.txt");

function readCsv(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error("Missing file:", filePath);
    process.exit(1);
  }

  return parse(fs.readFileSync(filePath, "utf-8"), {
    columns: true,
    skip_empty_lines: true
  });
}

function importShapes() {
  const routes = readCsv(routesPath);
  const trips = readCsv(tripsPath);
  const shapes = readCsv(shapesPath);

  const routeInfo = new Map();

  routes.forEach((route) => {
    routeInfo.set(route.route_id, {
      routeId: route.route_id,
      name: route.route_short_name,
      color: route.route_color ? `#${route.route_color}` : "#111827"
    });
  });

  const routeToShape = new Map();

  trips.forEach((trip) => {
    if (!routeToShape.has(trip.route_id) && trip.shape_id) {
      routeToShape.set(trip.route_id, trip.shape_id);
    }
  });

  const shapePoints = new Map();

  shapes.forEach((shape) => {
    const shapeId = shape.shape_id;

    if (!shapePoints.has(shapeId)) {
      shapePoints.set(shapeId, []);
    }

    shapePoints.get(shapeId).push({
      lat: Number(shape.shape_pt_lat),
      lon: Number(shape.shape_pt_lon),
      sequence: Number(shape.shape_pt_sequence)
    });
  });

  const features = [];

  routeToShape.forEach((shapeId, routeId) => {
    const info = routeInfo.get(routeId);
    const points = shapePoints.get(shapeId);

    if (!info || !points || points.length === 0) {
      return;
    }

    const coordinates = points
      .sort((a, b) => a.sequence - b.sequence)
      .map((point) => [point.lon, point.lat]);

    features.push({
      type: "Feature",
      properties: {
        routeId: info.routeId,
        name: info.name,
        color: info.color
      },
      geometry: {
        type: "LineString",
        coordinates
      }
    });
  });

  const geojson = {
    type: "FeatureCollection",
    features
  };

  fs.writeFileSync(outputPath, JSON.stringify(geojson, null, 2));

  console.log(`Imported ${features.length} subway route lines.`);
  console.log(`Saved to ${outputPath}`);
}

importShapes();
