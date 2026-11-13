from datetime import timedelta
from urllib.parse import urlparse
from uuid import uuid4
from ..models import MeetingInput, Source
from .tavily_service import search


def research_queries(meeting: MeetingInput) -> list[str]:
    name = meeting.subject
    kind = meeting.meeting_type
    queries = [f'"{name}" recent company announcements product launches partnerships',
               f'"{name}" leadership executive appointment interview',
               f'{name} industry competitors market regulatory developments']
    if kind == "Investor meeting": queries += [f'"{name}" funding investment acquisition financial results growth strategy', f'{name} competitors market share business performance']
    elif kind == "Sales meeting": queries += [f'"{name}" expansion hiring business needs technology initiatives', f'"{name}" recent product launch customer challenges']
    elif kind == "Partnership discussion": queries += [f'"{name}" strategic partnerships ecosystem collaboration', f'{name} partner announcements expansion initiatives']
    elif kind == "Job interview": queries += [f'"{name}" careers culture hiring recent company news', f'"{name}" products strategy leadership priorities']
    elif kind == "Business development": queries += [f'"{name}" expansion strategy new markets business development', f'{name} strategic initiatives partnership opportunities']
    if meeting.objective.strip(): queries.append(f'"{name}" {meeting.objective.strip()}')
    # Preserve order while removing repeated queries.
    return list(dict.fromkeys(queries))

async def run_research(meeting: MeetingInput):
    end_date = meeting.meeting_date
    start_date = end_date - timedelta(days=30)
    queries = research_queries(meeting)
    source_map = {}
    errors = []
    completed = 0
    for query in queries:
        try:
            data = await search(query, start_date, end_date)
            completed += 1
            for item in data.get("results", []):
                url = item.get("url")
                if not url: continue
                normalized = url.split("#")[0].rstrip("/")
                if normalized in source_map: continue
                source_map[normalized] = Source(id=str(uuid4())[:8], title=item.get("title") or urlparse(url).netloc,
                    url=url, domain=urlparse(url).netloc.removeprefix("www."),
                    published_date=item.get("published_date") or item.get("published_date_str"),
                    content=(item.get("raw_content") or item.get("content") or "")[:5000], query=query)
        except Exception as exc:
            errors.append(str(exc))
    return {"sources": list(source_map.values()), "queries": queries, "completed_searches": completed,
            "start_date": start_date.isoformat(), "end_date": end_date.isoformat(), "errors": errors}
