from datetime import date, timedelta
from uuid import uuid4
from .gemini_service import complete_json

SYSTEM = "You are a cautious research analyst. Only use the supplied source material. Never invent facts, dates, roles, or citations. Return valid JSON only. For each claim use source_ids from the supplied source IDs. Mark claims VERIFIED only when a source directly supports the claim; PARTIALLY VERIFIED when support is incomplete; UNVERIFIED when evidence is absent; CONFLICTING when sources disagree; OUTDATED only when the source publication date is outside the requested window or clearly superseded. Do not assign numeric confidence."

async def analyze(meeting: dict, research: dict):
    sources = research["sources"]
    source_context = [{"id": s.id, "title": s.title, "url": s.url, "published_date": s.published_date, "content": s.content[:2600]} for s in sources]
    prompt = f'''Prepare a concise meeting intelligence briefing. Meeting: {meeting}. Research window: {research['start_date']} to {research['end_date']}. Meeting type should shape priorities. Use only evidence below. Return JSON with keys: executive_summary (string), developments (array of objects with title, summary, why_it_matters, source_ids, importance [high/medium/low]), key_people (array of objects with name, role, context, source_ids), opportunities (array strings), risks (array strings), questions (5-7 specific questions), claims (array of objects with text, status, explanation, source_ids, category). Include only people and claims supported by sources. If no evidence, say so and use empty arrays. No generic filler. Sources: {source_context}'''
    result = await complete_json(SYSTEM, prompt)
    valid_ids = {s.id for s in sources}
    claims = []
    for c in result.get("claims", [])[:30]:
        ids = [x for x in c.get("source_ids", []) if x in valid_ids]
        status = c.get("status", "UNVERIFIED")
        if status == "VERIFIED" and not ids: status = "UNVERIFIED"
        claims.append({"id": str(uuid4())[:8], "text": c.get("text", ""), "status": status,
                       "explanation": c.get("explanation", "No explanation supplied."), "source_ids": ids,
                       "confidence": "Not quantified", "category": c.get("category", "Development")})
    for key in ["developments", "key_people", "opportunities", "risks", "questions"]:
        if not isinstance(result.get(key), list): result[key] = []
    result["claims"] = claims
    result["questions"] = result["questions"][:7]
    return result
