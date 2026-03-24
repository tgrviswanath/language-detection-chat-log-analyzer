import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


@patch("app.core.service.detect_language", new_callable=AsyncMock)
def test_detect_endpoint(mock_detect):
    mock_detect.return_value = {"code": "en", "name": "English", "confidence": 0.95}
    response = client.post("/api/v1/detect", json={"text": "Hello world"})
    assert response.status_code == 200
    assert response.json()["code"] == "en"


@patch("app.core.service.analyze_lines", new_callable=AsyncMock)
def test_analyze_endpoint(mock_analyze):
    mock_analyze.return_value = {"messages": [], "summary": {"total_messages": 0}}
    response = client.post("/api/v1/analyze", json={"lines": ["Alice: Hello"]})
    assert response.status_code == 200


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
