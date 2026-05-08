import json
from socket import timeout as SocketTimeout
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from fastapi import APIRouter, Query

router = APIRouter(prefix="/google", tags=["google"])


@router.get("/suggestions", response_model=list[str])
def google_suggestions(
    q: str = Query(min_length=1, max_length=200),
) -> list[str]:
    params = urlencode({"client": "firefox", "q": q})
    request = Request(
        f"https://suggestqueries.google.com/complete/search?{params}",
        headers={"User-Agent": "Mozilla/5.0"},
    )

    try:
        with urlopen(request, timeout=2) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except (
        HTTPError,
        URLError,
        SocketTimeout,
        json.JSONDecodeError,
        UnicodeDecodeError,
    ):
        return []

    if isinstance(payload, list) and len(payload) > 1 and isinstance(payload[1], list):
        return [suggestion for suggestion in payload[1] if isinstance(suggestion, str)]

    return []
