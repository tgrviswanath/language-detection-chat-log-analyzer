from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from app.core.service import detect_language, analyze_lines, analyze_file
import httpx

router = APIRouter(prefix="/api/v1", tags=["language"])


class TextInput(BaseModel):
    text: str


class LinesInput(BaseModel):
    lines: list[str]


def _handle_error(e: Exception):
    if isinstance(e, httpx.ConnectError):
        raise HTTPException(status_code=503, detail="NLP service unavailable")
    if isinstance(e, httpx.HTTPStatusError):
        raise HTTPException(status_code=e.response.status_code, detail=str(e))
    raise HTTPException(status_code=500, detail=str(e))


@router.post("/detect")
async def detect(body: TextInput):
    try:
        return await detect_language(body.text)
    except Exception as e:
        _handle_error(e)


@router.post("/analyze")
async def analyze(body: LinesInput):
    try:
        return await analyze_lines(body.lines)
    except Exception as e:
        _handle_error(e)


@router.post("/analyze/file")
async def analyze_upload(file: UploadFile = File(...)):
    try:
        content = await file.read()
        return await analyze_file(content, file.filename)
    except Exception as e:
        _handle_error(e)
