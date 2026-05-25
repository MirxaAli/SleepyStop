import express from "express";
import cors from "cors";

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

export default app;
