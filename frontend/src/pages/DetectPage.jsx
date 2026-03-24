import React, { useState } from "react";
import {
  Box, TextField, Button, CircularProgress, Alert,
  Paper, Typography, Chip,
} from "@mui/material";
import { detectLanguage } from "../services/langApi";

const EXAMPLES = [
  "Hello, how are you doing today?",
  "Bonjour, comment allez-vous aujourd'hui?",
  "Hola, ¿cómo estás hoy?",
  "Guten Tag, wie geht es Ihnen heute?",
  "こんにちは、今日はお元気ですか？",
  "مرحبا، كيف حالك اليوم؟",
];

const SENTIMENT_COLOR = { positive: "success", negative: "error", neutral: "default" };

export default function DetectPage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDetect = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await detectLanguage(text);
      setResult(res.data);
    } catch (e) {
      setError(e.response?.data?.detail || "Detection failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Detect Language of a Single Text</Typography>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
        {EXAMPLES.map((ex, i) => (
          <Chip key={i} label={`Example ${i + 1}`} size="small" variant="outlined"
            onClick={() => setText(ex)} clickable />
        ))}
      </Box>

      <TextField
        fullWidth multiline rows={3}
        label="Enter text in any language"
        value={text}
        onChange={(e) => setText(e.target.value)}
        sx={{ mb: 2 }}
      />

      <Button variant="contained" fullWidth size="large"
        disabled={!text.trim() || loading} onClick={handleDetect}
        startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
      >
        {loading ? "Detecting..." : "Detect Language"}
      </Button>

      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

      {result && (
        <Paper elevation={2} sx={{ mt: 3, p: 3, borderLeft: 6, borderColor: "primary.main" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
            <Chip label={`🌐 ${result.name}`} color="primary" size="medium"
              sx={{ fontWeight: "bold", fontSize: "1rem" }} />
            <Typography variant="body2" color="text.secondary">
              Code: <strong>{result.code}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Confidence: <strong>{(result.confidence * 100).toFixed(0)}%</strong>
            </Typography>
          </Box>
        </Paper>
      )}
    </Box>
  );
}
