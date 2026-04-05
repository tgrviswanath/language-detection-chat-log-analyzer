import asyncio
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from app.core.analyzer import detect_language, analyze_chat_log

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

router = APIRouter(prefix="/api/v1/nlp", tags=["language-detection"])


class TextInput(BaseModel):
    text: str


class LinesInput(BaseModel):
    lines: list[str]


@router.post("/detect")
async def detect_single(body: TextInput):
    if not body.text.strip():
        raise HTTPException(status_code=400, detail="text cannot be empty")
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, detect_language, body.text)


@router.post("/analyze")
async def analyze_lines(body: LinesInput):
    if not body.lines:
        raise HTTPException(status_code=400, detail="lines cannot be empty")
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, analyze_chat_log, body.lines)


@router.post("/analyze/file")
async def analyze_file(file: UploadFile = File(...)):
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="File is empty")
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Max 5MB")
    lines = content.decode("utf-8", errors="ignore").splitlines()
    if not lines:
        raise HTTPException(status_code=400, detail="File is empty")
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, analyze_chat_log, lines)
