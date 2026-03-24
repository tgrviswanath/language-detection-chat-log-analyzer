import React, { useState, useCallback } from "react";
import {
  Box, TextField, Button, CircularProgress, Alert, Typography,
  Paper, Chip, Divider, Table, TableHead, TableRow, TableCell,
  TableBody, TableContainer, Grid,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { analyzeLines, analyzeFile } from "../services/langApi";

const SENTIMENT_COLORS = { positive: "#4caf50", negative: "#f44336", neutral: "#9e9e9e" };
const PIE_COLORS = ["#1976d2", "#42a5f5", "#90caf9", "#bbdefb", "#e3f2fd"];

const SAMPLE_LOG = `Alice: Hello everyone! How are you all doing today?
Bob: Bonjour! Je vais très bien, merci!
Carlos: Hola! Estoy bien, gracias por preguntar.
Alice: That's great to hear! Let's start the meeting.
Bob: Oui, commençons. J'ai quelques points à discuter.
Carlos: Perfecto, yo también tengo preguntas.
Alice: This project is going really well, I'm excited!
Bob: C'est fantastique! Le travail est excellent.`;

export default function ChatLogPage() {
  const [input, setInput] = useState("");
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); setInput(""); }
  }, []);

  const handleAnalyze = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      let res;
      if (file) {
        res = await analyzeFile(file);
      } else {
        const lines = input.split("\n").filter((l) => l.trim());
        res = await analyzeLines(lines);
      }
      setResult(res.data);
    } catch (e) {
      setError(e.response?.data?.detail || "Analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = (input.trim() || file) && !loading;
  const summary = result?.summary;

  const sentimentData = summary
    ? Object.entries(summary.sentiment_distribution).map(([k, v]) => ({
        name: k, value: v, fill: SENTIMENT_COLORS[k],
      }))
    : [];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Analyze a Chat Log</Typography>

      {/* File drop zone */}
      <Paper
        variant="outlined"
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        sx={{
          p: 2, mb: 2, textAlign: "center", cursor: "pointer",
          borderStyle: "dashed", borderWidth: 2,
          borderColor: dragging ? "primary.main" : "grey.400",
          bgcolor: dragging ? "primary.50" : "grey.50",
        }}
        onClick={() => document.getElementById("chat-file").click()}
      >
        <UploadFileIcon sx={{ color: "primary.main" }} />
        <Typography variant="body2">
          {file ? file.name : "Drop a .txt chat log or click to upload"}
        </Typography>
        <input id="chat-file" type="file" accept=".txt" hidden
          onChange={(e) => { setFile(e.target.files[0]); setInput(""); }} />
      </Paper>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        — or paste chat lines below (format: <code>Speaker: message</code>) —
      </Typography>

      <TextField
        fullWidth multiline rows={6}
        label="Paste chat log"
        value={input}
        onChange={(e) => { setInput(e.target.value); setFile(null); }}
        sx={{ mb: 1 }}
      />

      <Button size="small" variant="text" onClick={() => { setInput(SAMPLE_LOG); setFile(null); }}
        sx={{ mb: 2 }}>
        Load sample multilingual chat
      </Button>

      <Button variant="contained" fullWidth size="large"
        disabled={!canSubmit} onClick={handleAnalyze}
        startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
      >
        {loading ? "Analyzing..." : "Analyze Chat Log"}
      </Button>

      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

      {result && summary && (
        <Box sx={{ mt: 3 }}>
          <Divider sx={{ mb: 2 }} />

          {/* Summary chips */}
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 3 }}>
            <Chip label={`💬 ${summary.total_messages} messages`} color="primary" />
            <Chip label={`📝 ${summary.total_words} words`} variant="outlined" />
            <Chip label={`🌐 ${summary.languages_detected.length} language(s)`} variant="outlined" />
          </Box>

          <Grid container spacing={3}>
            {/* Sentiment pie */}
            <Grid item xs={12} md={5}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Sentiment Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={sentimentData} dataKey="value" nameKey="name"
                    cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`}>
                    {sentimentData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Grid>

            {/* Top words bar */}
            <Grid item xs={12} md={7}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Top Words
              </Typography>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={summary.top_words} layout="vertical">
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="word" width={70} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1976d2" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Grid>

            {/* Languages detected */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Languages Detected
              </Typography>
              {summary.languages_detected.map((l, i) => (
                <Box key={i} sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography variant="body2">🌐 {l.name} ({l.code})</Typography>
                  <Chip label={`${l.count} msg`} size="small" />
                </Box>
              ))}
            </Grid>

            {/* Top speakers */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Top Speakers
              </Typography>
              {summary.top_speakers.map((s, i) => (
                <Box key={i} sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography variant="body2">👤 {s.speaker}</Typography>
                  <Chip label={`${s.messages} msg`} size="small" color="primary" variant="outlined" />
                </Box>
              ))}
            </Grid>
          </Grid>

          {/* Per-message table */}
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
            Message Details
          </Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Speaker</TableCell>
                  <TableCell>Message</TableCell>
                  <TableCell>Language</TableCell>
                  <TableCell>Sentiment</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {result.messages.map((m, i) => (
                  <TableRow key={i}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell><strong>{m.speaker}</strong></TableCell>
                    <TableCell sx={{ maxWidth: 250, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {m.text}
                    </TableCell>
                    <TableCell>
                      <Chip label={m.language.name} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={m.sentiment.label}
                        size="small"
                        color={m.sentiment.label === "positive" ? "success" : m.sentiment.label === "negative" ? "error" : "default"}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );
}
