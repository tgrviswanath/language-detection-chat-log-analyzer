from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from app.core.analyzer import detect_language, analyze_chat_log

router = APIRouter(prefix="/api/v1/nlp", tags=["language-detection"])


class TextInput(BaseModel):
    text: str


class LinesInput(BaseModel):
    lines: list[str]


@router.post("/detect")
def detect_single(body: TextInput):
    if not body.text.strip():
        raise HTTPException(status_code=400, detail="text cannot be empty")
    return detect_language(body.text)


@router.post("/analyze")
def analyze_lines(body: LinesInput):
    if not body.lines:
        raise HTTPException(status_code=400, detail="lines cannot be empty")
    return analyze_chat_log(body.lines)


@router.post("/analyze/file")
async def analyze_file(file: UploadFile = File(...)):
    """Accept a .txt chat log file and analyze it."""
    content = await file.read()
    lines = content.decode("utf-8", errors="ignore").splitlines()
    if not lines:
        raise HTTPException(status_code=400, detail="File is empty")
    return analyze_chat_log(lines)
