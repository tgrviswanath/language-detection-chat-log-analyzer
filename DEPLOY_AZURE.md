# Azure Deployment Guide — Project 05 Language Detection & Chat Log Analyzer

---

## Azure Services for Language Detection

### 1. Ready-to-Use AI (No Model Needed)

| Service                              | What it does                                                                 | When to use                                        |
|--------------------------------------|------------------------------------------------------------------------------|----------------------------------------------------|
| **Azure AI Language — Language Detection** | Detect language from text — supports 120+ languages with confidence   | Replace your entire langdetect/langid pipeline     |
| **Azure AI Language — Sentiment Analysis** | Sentiment per message in detected language                           | Replace your TextBlob sentiment analysis           |
| **Azure OpenAI Service**             | GPT-4 for multilingual analysis and summarization                            | When you need deep multilingual understanding      |

> **Azure AI Language** provides both language detection and sentiment analysis in a single API call — directly replacing your langdetect + TextBlob + NLTK pipeline.

### 2. Host Your Own Model (Keep Current Stack)

| Service                        | What it does                                                        | When to use                                           |
|--------------------------------|---------------------------------------------------------------------|-------------------------------------------------------|
| **Azure Container Apps**       | Run your 3 Docker containers (frontend, backend, nlp-service)       | Best match for your current microservice architecture |
| **Azure App Service**          | Host FastAPI backend + nlp-service as web apps                      | Simple deployment, no containers needed               |
| **Azure Container Registry**   | Store your Docker images                                            | Used with Container Apps or AKS                       |

### 3. Frontend Hosting

| Service                   | What it does                                                               |
|---------------------------|----------------------------------------------------------------------------|
| **Azure Static Web Apps** | Host your React frontend — free tier available, auto CI/CD from GitHub     |

### 4. Supporting Services

| Service                       | Purpose                                                                  |
|-------------------------------|--------------------------------------------------------------------------|
| **Azure API Management**      | Rate limiting, auth, monitoring for your /api/v1/detect endpoint         |
| **Azure Monitor + App Insights** | Track detection latency, language distribution, request volume        |
| **Azure Key Vault**           | Store API keys and connection strings instead of .env files              |

---

## Recommended Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Azure Static Web Apps — React Frontend                     │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────────────┐
│  Azure Container Apps — Backend (FastAPI :8000)             │
└──────────────────────┬──────────────────────────────────────┘
                       │ Internal
        ┌──────────────┴──────────────┐
        │ Option A                    │ Option B
        ▼                             ▼
┌───────────────────┐    ┌────────────────────────────────────┐
│ Container Apps    │    │ Azure AI Language                  │
│ NLP Service :8001 │    │ Language Detection + Sentiment     │
│ langdetect+TextBlob│   │ No model maintenance needed        │
└───────────────────┘    └────────────────────────────────────┘
```

---

## Prerequisites

```bash
az login
az group create --name rg-language-detection --location uksouth
az extension add --name containerapp --upgrade
```

---

## Step 1 — Create Container Registry and Push Images

```bash
az acr create --resource-group rg-language-detection --name langdetectionacr --sku Basic --admin-enabled true
az acr login --name langdetectionacr
ACR=langdetectionacr.azurecr.io
docker build -f docker/Dockerfile.nlp-service -t $ACR/nlp-service:latest ./nlp-service
docker push $ACR/nlp-service:latest
docker build -f docker/Dockerfile.backend -t $ACR/backend:latest ./backend
docker push $ACR/backend:latest
```

---

## Step 2 — Deploy Container Apps

```bash
az containerapp env create --name langdetect-env --resource-group rg-language-detection --location uksouth

az containerapp create \
  --name nlp-service --resource-group rg-language-detection \
  --environment langdetect-env --image $ACR/nlp-service:latest \
  --registry-server $ACR --target-port 8001 --ingress internal \
  --min-replicas 1 --max-replicas 3 --cpu 0.5 --memory 1.0Gi

az containerapp create \
  --name backend --resource-group rg-language-detection \
  --environment langdetect-env --image $ACR/backend:latest \
  --registry-server $ACR --target-port 8000 --ingress external \
  --min-replicas 1 --max-replicas 5 --cpu 0.5 --memory 1.0Gi \
  --env-vars NLP_SERVICE_URL=http://nlp-service:8001
```

---

## Option B — Use Azure AI Language

```bash
az cognitiveservices account create \
  --name langdetect-language \
  --resource-group rg-language-detection \
  --kind TextAnalytics --sku S --location uksouth --yes
```

```python
from azure.ai.textanalytics import TextAnalyticsClient
from azure.core.credentials import AzureKeyCredential

client = TextAnalyticsClient(
    endpoint=os.getenv("AZURE_LANGUAGE_ENDPOINT"),
    credential=AzureKeyCredential(os.getenv("AZURE_LANGUAGE_KEY"))
)

def detect_and_analyze(text: str) -> dict:
    lang_result = client.detect_language([text])[0]
    sentiment_result = client.analyze_sentiment([text])[0]
    return {
        "language": lang_result.primary_language.name,
        "language_code": lang_result.primary_language.iso6391_name,
        "confidence": round(lang_result.primary_language.confidence_score * 100, 2),
        "sentiment": sentiment_result.sentiment,
    }
```

---

## Estimated Monthly Cost

| Service                  | Tier      | Est. Cost         |
|--------------------------|-----------|-------------------|
| Container Apps (backend) | 0.5 vCPU  | ~$10–15/month     |
| Container Apps (nlp-svc) | 0.5 vCPU  | ~$10–15/month     |
| Container Registry       | Basic     | ~$5/month         |
| Static Web Apps          | Free      | $0                |
| Azure AI Language        | S tier    | Pay per call      |
| **Total (Option A)**     |           | **~$25–35/month** |
| **Total (Option B)**     |           | **~$15–20/month** |

For exact estimates → https://calculator.azure.com

---

## Teardown

```bash
az group delete --name rg-language-detection --yes --no-wait
```
