import express from "express";
import cors from "cors";
import stationsRoutes from "./routes/stations.routes.js";
import mapRoutes from "./routes/map.routes.js";

const app = express();

app.use(cors());
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

export default app;
