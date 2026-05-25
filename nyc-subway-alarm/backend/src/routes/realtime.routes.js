import express from "express";
import { getArrivalsForStop } from "../services/mtaRealtime.service.js";

const router = express.Router();

router.get("/arrivals/:stopId", async (req, res) => {
  try {
    const { stopId } = req.params;

    const arrivals = await getArrivalsForStop(stopId);

    res.json({
      stopId,
      arrivals
    });
  } catch (error) {
    console.error("Realtime arrivals error:", error);
    res.status(500).json({
      message: "Failed to load real-time arrivals"
    });
  }
});

export default router;
