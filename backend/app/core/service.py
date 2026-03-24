import httpx
from app.core.config import settings

NLP_URL = settings.NLP_SERVICE_URL


async def detect_language(text: str) -> dict:
    async with httpx.AsyncClient() as client:
        r = await client.post(
            f"{NLP_URL}/api/v1/nlp/detect",
            json={"text": text},
            timeout=30.0,
        )
        r.raise_for_status()
        return r.json()


async def analyze_lines(lines: list[str]) -> dict:
    async with httpx.AsyncClient() as client:
        r = await client.post(
            f"{NLP_URL}/api/v1/nlp/analyze",
            json={"lines": lines},
            timeout=60.0,
        )
        r.raise_for_status()
        return r.json()


async def analyze_file(file_bytes: bytes, filename: str) -> dict:
    async with httpx.AsyncClient() as client:
        r = await client.post(
            f"{NLP_URL}/api/v1/nlp/analyze/file",
            files={"file": (filename, file_bytes, "text/plain")},
            timeout=60.0,
        )
        r.raise_for_status()
        return r.json()
