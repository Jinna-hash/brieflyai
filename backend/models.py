from datetime import date, datetime
from pydantic import BaseModel, Field
from typing import Literal, Any

MeetingType = Literal["Sales meeting", "Partnership discussion", "Investor meeting", "Job interview", "Business development", "General meeting"]

class MeetingInput(BaseModel):
    subject: str = Field(min_length=2, max_length=160)
    subject_kind: Literal["Company", "Individual"] = "Company"
    meeting_date: date
    meeting_time: str = "10:00"
    timezone: str = "UTC"
    meeting_type: MeetingType = "General meeting"
    objective: str = Field(default="", max_length=1200)

class Source(BaseModel):
    id: str
    title: str
    url: str
    domain: str
    published_date: str | None = None
    content: str = ""
    query: str = ""

class Claim(BaseModel):
    id: str
    text: str
    status: Literal["VERIFIED", "PARTIALLY VERIFIED", "UNVERIFIED", "CONFLICTING", "OUTDATED"]
    explanation: str
    source_ids: list[str] = []
    confidence: str = "Not quantified"
    category: str = "Development"

class Briefing(BaseModel):
    id: str
    meeting: dict[str, Any]
    created_at: datetime
    research_window: dict[str, str]
    executive_summary: str
    developments: list[dict[str, Any]]
    key_people: list[dict[str, Any]]
    opportunities: list[str]
    risks: list[str]
    questions: list[str]
    claims: list[Claim]
    sources: list[Source]
    readiness: dict[str, Any]
    transparency: dict[str, Any]
    status: str = "completed"
    provider: str
