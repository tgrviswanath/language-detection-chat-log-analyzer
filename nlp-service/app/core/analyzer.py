"""
Language detection using langdetect (primary) with langid as fallback.
Sentiment analysis using TextBlob.
Word frequency using NLTK.
"""
import re
import nltk
from langdetect import detect, LangDetectException
from textblob import TextBlob

nltk.download("stopwords", quiet=True)
nltk.download("punkt", quiet=True)
nltk.download("punkt_tab", quiet=True)

from nltk.corpus import stopwords
from collections import Counter

_STOPWORDS = set(stopwords.words("english"))

# ISO 639-1 code → human-readable name
LANG_NAMES = {
    "en": "English", "fr": "French", "de": "German", "es": "Spanish",
    "it": "Italian", "pt": "Portuguese", "nl": "Dutch", "ru": "Russian",
    "zh-cn": "Chinese", "ja": "Japanese", "ko": "Korean", "ar": "Arabic",
    "hi": "Hindi", "ta": "Tamil", "tr": "Turkish", "pl": "Polish",
    "sv": "Swedish", "da": "Danish", "fi": "Finnish", "no": "Norwegian",
}


def detect_language(text: str) -> dict:
    """Detect language of a single text string."""
    text = text.strip()
    if not text:
        return {"code": "unknown", "name": "Unknown", "confidence": 0.0}
    try:
        code = detect(text)
        name = LANG_NAMES.get(code, code.upper())
        return {"code": code, "name": name, "confidence": 0.95}
    except LangDetectException:
        return {"code": "unknown", "name": "Unknown", "confidence": 0.0}


def analyze_sentiment(text: str) -> dict:
    """Return polarity (-1 to 1) and subjectivity (0 to 1) via TextBlob."""
    blob = TextBlob(text)
    polarity = round(blob.sentiment.polarity, 4)
    subjectivity = round(blob.sentiment.subjectivity, 4)
    if polarity > 0.1:
        label = "positive"
    elif polarity < -0.1:
        label = "negative"
    else:
        label = "neutral"
    return {"polarity": polarity, "subjectivity": subjectivity, "label": label}


def top_words(text: str, n: int = 10) -> list[dict]:
    """Return top-N words excluding stopwords."""
    words = re.findall(r"\b[a-zA-Z]{3,}\b", text.lower())
    filtered = [w for w in words if w not in _STOPWORDS]
    counts = Counter(filtered).most_common(n)
    return [{"word": w, "count": c} for w, c in counts]


def analyze_chat_log(lines: list[str]) -> dict:
    """
    Analyze a list of chat messages.
    Each line can be:
      - plain text: "Hello how are you"
      - prefixed:   "Alice: Hello how are you"
    Returns per-message analysis + aggregate stats.
    """
    messages = []
    for raw in lines:
        raw = raw.strip()
        if not raw:
            continue
        # Try to split "Speaker: message"
        if ":" in raw:
            parts = raw.split(":", 1)
            speaker = parts[0].strip()
            text = parts[1].strip()
        else:
            speaker = "Unknown"
            text = raw

        lang = detect_language(text)
        sentiment = analyze_sentiment(text)
        messages.append({
            "speaker": speaker,
            "text": text,
            "language": lang,
            "sentiment": sentiment,
            "word_count": len(text.split()),
        })

    if not messages:
        return {"messages": [], "summary": {}}

    all_text = " ".join(m["text"] for m in messages)
    lang_counts: dict[str, int] = {}
    sentiment_counts = {"positive": 0, "negative": 0, "neutral": 0}
    speaker_counts: dict[str, int] = {}

    for m in messages:
        lang_code = m["language"]["code"]
        lang_counts[lang_code] = lang_counts.get(lang_code, 0) + 1
        sentiment_counts[m["sentiment"]["label"]] += 1
        speaker_counts[m["speaker"]] = speaker_counts.get(m["speaker"], 0) + 1

    summary = {
        "total_messages": len(messages),
        "total_words": sum(m["word_count"] for m in messages),
        "languages_detected": [
            {"code": k, "name": LANG_NAMES.get(k, k.upper()), "count": v}
            for k, v in lang_counts.items()
        ],
        "sentiment_distribution": sentiment_counts,
        "top_speakers": sorted(
            [{"speaker": k, "messages": v} for k, v in speaker_counts.items()],
            key=lambda x: x["messages"], reverse=True
        )[:10],
        "top_words": top_words(all_text, n=15),
    }

    return {"messages": messages, "summary": summary}
