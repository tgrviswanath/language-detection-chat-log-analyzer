# Project 05 - Language Detection & Chat Log Analyzer

Microservice NLP project that detects languages and analyzes multilingual chat logs using langdetect, TextBlob, and NLTK.

## Architecture

```
Frontend :3000  →  Backend :8000  →  NLP Service :8001
  React/MUI        FastAPI/httpx      FastAPI/langdetect/TextBlob/NLTK
```

## Local Run

```bash
# Terminal 1 - NLP Service (no training needed)
cd nlp-service && python -m venv venv && venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001

# Terminal 2 - Backend
cd backend && python -m venv venv && venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Terminal 3 - Frontend
cd frontend && npm install && npm start
```

## Docker

```bash
docker-compose up --build
```

## Stack

| Layer | Tools |
|-------|-------|
| NLP Service | langdetect, langid, TextBlob, NLTK |
| Backend | FastAPI, httpx |
| Frontend | React, MUI, Recharts (PieChart + BarChart) |

## Features

- Single text language detection with 20+ languages
- Chat log analysis (paste text or upload .txt file)
- Per-message: language + sentiment detection
- Summary: language distribution, sentiment pie, top words bar chart, top speakers
- Built-in sample multilingual chat log
