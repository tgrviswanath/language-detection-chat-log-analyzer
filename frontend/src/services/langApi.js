import axios from "axios";

const api = axios.create({ baseURL: process.env.REACT_APP_API_URL });

export const detectLanguage = (text) => api.post("/api/v1/detect", { text });
export const analyzeLines = (lines) => api.post("/api/v1/analyze", { lines });
export const analyzeFile = (file) => {
  const form = new FormData();
  form.append("file", file);
  return api.post("/api/v1/analyze/file", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
