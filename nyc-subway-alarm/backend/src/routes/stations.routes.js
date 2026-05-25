import express from "express";
import { getAllStations, searchStations } from "../controllers/stations.controller.js";

const router = express.Router();

router.get("/", getAllStations);
router.get("/search", searchStations);

export default router;
