import axios from "axios";

const API_BASE_URL = "http://localhost:8080";

const api = axios.create({
  baseURL: API_BASE_URL
});

export async function checkBackendHealth() {
  const response = await api.get("/api/health");
  return response.data;
}

export default api;
