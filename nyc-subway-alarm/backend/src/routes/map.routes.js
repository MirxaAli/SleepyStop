import express from "express";
import fs from "fs";
import path from "path";

const router = express.Router();

router.get("/subway-lines", (req, res) => {
  const filePath = path.resolve("src/data/processed/subway-lines.geojson");

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      message: "Subway lines GeoJSON not found. Run npm run import:shapes first."
    });
  }

  const geojson = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  res.json(geojson);
});

export default router;
