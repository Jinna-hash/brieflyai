from datetime import date
from backend.models import MeetingInput
from backend.services.research_agent import research_queries
from backend.services.readiness_service import calculate_readiness


def meeting(**kwargs):
    base = dict(subject="Acme Robotics", meeting_date=date(2026, 11, 12), meeting_type="Investor meeting")
    base.update(kwargs)
    return MeetingInput(**base)


def test_investor_meeting_prioritizes_financial_research():
    queries = research_queries(meeting())
    assert any("funding" in q.lower() for q in queries)
    assert any("competitors" in q.lower() for q in queries)


def test_objective_adds_focused_query():
    queries = research_queries(meeting(objective="warehouse automation strategy"))
    assert any("warehouse automation strategy" in q for q in queries)


def test_readiness_score_is_bounded_and_explained():
    result = calculate_readiness({"sources": []}, {"claims": [], "questions": []})
    assert 0 <= result["score"] <= 100
    assert "not a prediction" not in result["label"].lower()
    assert "not a prediction" not in result["explanation"].lower()
    assert "completeness" in result["explanation"].lower()
