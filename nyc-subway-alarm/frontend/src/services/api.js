import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

console.log("API BASE URL:", API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL
});

export async function checkBackendHealth() {
  const response = await api.get("/api/health");
  return response.data;
}

export async function getStations() {
  const response = await api.get("/api/stations");
  return response.data;
}

export default api;
