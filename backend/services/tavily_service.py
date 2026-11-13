import httpx
from datetime import timedelta
from ..config import settings

class TavilyError(RuntimeError): pass

async def search(query: str, start_date, end_date, max_results: int | None = None):
    if not settings.tavily_api_key:
        raise TavilyError("TAVILY_API_KEY is not configured. Add it to backend/.env to run live research.")
    payload = {
        "query": query,
        "topic": "news",
        "search_depth": "advanced",
        "max_results": max_results or settings.research_max_results,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "include_answer": False,
        "include_raw_content": True,
    }
    try:
        async with httpx.AsyncClient(timeout=settings.request_timeout) as client:
            response = await client.post("https://api.tavily.com/search", json=payload,
                headers={"Authorization": f"Bearer {settings.tavily_api_key}", "Content-Type": "application/json"})
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as exc:
        raise TavilyError(f"Tavily returned HTTP {exc.response.status_code}: {exc.response.text[:300]}") from exc
    except httpx.HTTPError as exc:
        raise TavilyError(f"Could not reach Tavily: {exc}") from exc
