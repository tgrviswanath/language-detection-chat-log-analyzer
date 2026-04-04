# AWS Deployment Guide — Project 05 Language Detection & Chat Log Analyzer

---

## AWS Services for Language Detection

### 1. Ready-to-Use AI (No Model Needed)

| Service                    | What it does                                                                 | When to use                                        |
|----------------------------|------------------------------------------------------------------------------|----------------------------------------------------|
| **Amazon Comprehend**      | Detect language from text — supports 100+ languages with confidence scores   | Replace your entire langdetect/langid pipeline     |
| **Amazon Translate**       | Translate detected language to English for further analysis                  | When you need cross-language processing            |
| **Amazon Bedrock**         | Claude/Titan for multilingual analysis and summarization                     | When you need deep multilingual understanding      |

> **Amazon Comprehend** `detect_dominant_language` is the direct replacement for your langdetect + langid pipeline. It also provides sentiment analysis in the detected language.

### 2. Host Your Own Model (Keep Current Stack)

| Service                    | What it does                                                        | When to use                                           |
|----------------------------|---------------------------------------------------------------------|-------------------------------------------------------|
| **AWS App Runner**         | Run backend container — simplest, no VPC or cluster needed          | Quickest path to production                           |
| **Amazon ECS Fargate**     | Run backend + nlp-service containers in a private VPC               | Best match for your current microservice architecture |
| **Amazon ECR**             | Store your Docker images                                            | Used with App Runner, ECS, or EKS                     |

### 3. Frontend Hosting

| Service               | What it does                                                                  |
|-----------------------|-------------------------------------------------------------------------------|
| **Amazon S3**         | Host your React build as a static website                                     |
| **Amazon CloudFront** | CDN in front of S3 — HTTPS, low latency globally                              |

### 4. Supporting Services

| Service                  | Purpose                                                                   |
|--------------------------|---------------------------------------------------------------------------|
| **AWS API Gateway**      | Rate limiting, auth, monitoring for your /api/v1/detect endpoint          |
| **Amazon CloudWatch**    | Track detection latency, language distribution, request volume            |
| **AWS Secrets Manager**  | Store API keys and connection strings instead of .env files               |

---

## Recommended Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  S3 + CloudFront — React Frontend                           │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────────────┐
│  AWS App Runner / ECS Fargate — Backend (FastAPI :8000)     │
└──────────────────────┬──────────────────────────────────────┘
                       │ Internal
        ┌──────────────┴──────────────┐
        │ Option A                    │ Option B
        ▼                             ▼
┌───────────────────┐    ┌────────────────────────────────────┐
│ ECS Fargate       │    │ Amazon Comprehend                  │
│ NLP Service :8001 │    │ Language Detection + Sentiment     │
│ langdetect+TextBlob│   │ No model maintenance needed        │
└───────────────────┘    └────────────────────────────────────┘
```

---

## Prerequisites

```bash
aws configure
AWS_REGION=eu-west-2
AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
```

---

## Step 1 — Create ECR and Push Images

```bash
aws ecr create-repository --repository-name langdetection/nlp-service --region $AWS_REGION
aws ecr create-repository --repository-name langdetection/backend --region $AWS_REGION
ECR=$AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR
docker build -f docker/Dockerfile.nlp-service -t $ECR/langdetection/nlp-service:latest ./nlp-service
docker push $ECR/langdetection/nlp-service:latest
docker build -f docker/Dockerfile.backend -t $ECR/langdetection/backend:latest ./backend
docker push $ECR/langdetection/backend:latest
```

---

## Step 2 — Deploy with App Runner

```bash
aws apprunner create-service \
  --service-name langdetection-backend \
  --source-configuration '{
    "ImageRepository": {
      "ImageIdentifier": "'$ECR'/langdetection/backend:latest",
      "ImageRepositoryType": "ECR",
      "ImageConfiguration": {
        "Port": "8000",
        "RuntimeEnvironmentVariables": {
          "NLP_SERVICE_URL": "http://nlp-service:8001"
        }
      }
    }
  }' \
  --instance-configuration '{"Cpu": "0.5 vCPU", "Memory": "1 GB"}' \
  --region $AWS_REGION
```

---

## Option B — Use Amazon Comprehend

```python
import boto3

comprehend = boto3.client("comprehend", region_name="eu-west-2")

def detect_and_analyze(text: str) -> dict:
    lang_result = comprehend.detect_dominant_language(Text=text)
    top_lang = max(lang_result["Languages"], key=lambda x: x["Score"])

    sentiment_result = comprehend.detect_sentiment(
        Text=text[:5000], LanguageCode=top_lang["LanguageCode"]
    )
    return {
        "language_code": top_lang["LanguageCode"],
        "confidence": round(top_lang["Score"] * 100, 2),
        "sentiment": sentiment_result["Sentiment"].capitalize(),
    }
```

---

## Estimated Monthly Cost

| Service                    | Tier              | Est. Cost          |
|----------------------------|-------------------|--------------------|
| App Runner (backend)       | 0.5 vCPU / 1 GB   | ~$15–20/month      |
| App Runner (nlp-service)   | 0.5 vCPU / 1 GB   | ~$15–20/month      |
| ECR + S3 + CloudFront      | Standard          | ~$3–7/month        |
| Amazon Comprehend          | 50k units free    | $0–pay per call    |
| **Total (Option A)**       |                   | **~$33–47/month**  |
| **Total (Option B)**       |                   | **~$18–27/month**  |

For exact estimates → https://calculator.aws

---

## Teardown

```bash
aws ecr delete-repository --repository-name langdetection/backend --force
aws ecr delete-repository --repository-name langdetection/nlp-service --force
```
