import express from "express";
import cors from "cors";

import stationsRoutes from "./routes/stations.routes.js";
import mapRoutes from "./routes/map.routes.js";
import realtimeRoutes from "./routes/realtime.routes.js";

const app = express();

app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "NYC Subway Alarm Backend is running"
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    app: "nyc-subway-alarm"
  });
});

app.use("/api/stations", stationsRoutes);
app.use("/api/map", mapRoutes);
app.use("/api/realtime", realtimeRoutes);

export default app;