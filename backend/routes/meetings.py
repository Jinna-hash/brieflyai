from fastapi import APIRouter, HTTPException
from uuid import uuid4
from datetime import datetime, timezone

from ..models import MeetingInput
from ..services.research_agent import run_research
from ..services.verification_service import analyze
from ..services.readiness_service import calculate_readiness
from ..services.gemini_service import GeminiError
from ..database import save_briefing, list_briefings, get_briefing
from ..config import settings

router = APIRouter(prefix="/api", tags=["briefings"])


@router.post("/briefings")
async def create_briefing(meeting: MeetingInput):

    if not settings.tavily_api_key:
        raise HTTPException(
            503,
            "Live research unavailable: configure TAVILY_API_KEY in .env."
        )

    if not settings.gemini_api_key:
        raise HTTPException(
            503,
            "AI analysis unavailable: configure GEMINI_API_KEY in .env."
        )

    research = await run_research(meeting)

    if not research["sources"]:
        detail = "; ".join(research["errors"][:2]) or (
            "No sources matched the selected 30-day window."
        )
        raise HTTPException(
            502,
            f"Research returned no usable sources. {detail}"
        )

    try:
        analysis = await analyze(
            meeting.model_dump(mode="json"),
            research
        )
    except GeminiError as exc:
        raise HTTPException(502, str(exc)) from exc

    readiness = calculate_readiness(research, analysis)

    briefing = {
        "id": str(uuid4()),
        "meeting": meeting.model_dump(mode="json"),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "research_window": {
            "start": research["start_date"],
            "end": research["end_date"]
        },
        "executive_summary": analysis.get(
            "executive_summary",
            "No summary could be generated."
        ),
        "developments": analysis.get("developments", []),
        "key_people": analysis.get("key_people", []),
        "opportunities": analysis.get("opportunities", []),
        "risks": analysis.get("risks", []),
        "questions": analysis.get("questions", []),
        "claims": analysis.get("claims", []),
        "sources": [s.model_dump() for s in research["sources"]],
        "readiness": readiness,
        "transparency": {
            "searches_performed": research["completed_searches"],
            "searches_planned": len(research["queries"]),
            "unique_sources": len(research["sources"]),
            "claims_extracted": len(analysis.get("claims", [])),
            "claims_verified": sum(
                c["status"] == "VERIFIED"
                for c in analysis.get("claims", [])
            ),
            "research_errors": research["errors"],
            "completion": (
                "completed"
                if not research["errors"]
                else "completed_with_search_errors"
            )
        },
        "provider": "Tavily + Gemini"
    }

    save_briefing(briefing)
    return briefing


@router.get("/briefings")
def history():
    return list_briefings()


@router.get("/briefings/{briefing_id}")
def briefing_detail(briefing_id: str):
    data = get_briefing(briefing_id)

    if not data:
        raise HTTPException(404, "Briefing not found")

    return data