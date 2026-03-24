from app.core.analyzer import detect_language, analyze_sentiment, top_words, analyze_chat_log


def test_detect_english():
    result = detect_language("Hello, how are you today?")
    assert result["code"] == "en"
    assert result["name"] == "English"


def test_detect_french():
    result = detect_language("Bonjour, comment allez-vous aujourd'hui?")
    assert result["code"] == "fr"


def test_detect_empty():
    result = detect_language("")
    assert result["code"] == "unknown"


def test_sentiment_positive():
    result = analyze_sentiment("This is absolutely wonderful and amazing!")
    assert result["label"] == "positive"
    assert result["polarity"] > 0


def test_sentiment_negative():
    result = analyze_sentiment("This is terrible and awful.")
    assert result["label"] == "negative"


def test_top_words():
    result = top_words("hello world hello python python python", n=3)
    assert result[0]["word"] == "python"
    assert result[0]["count"] == 3


def test_analyze_chat_log():
    lines = [
        "Alice: Hello how are you?",
        "Bob: I am doing great thanks!",
        "Alice: That is wonderful news.",
    ]
    result = analyze_chat_log(lines)
    assert result["summary"]["total_messages"] == 3
    assert len(result["messages"]) == 3
    speakers = {m["speaker"] for m in result["messages"]}
    assert "Alice" in speakers
    assert "Bob" in speakers
