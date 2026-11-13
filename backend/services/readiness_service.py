def calculate_readiness(research: dict, analysis: dict):
    sources = research["sources"]
    claims = analysis.get("claims", [])
    categories = {c.get("category", "Development").lower() for c in claims}
    coverage = min(100, round(len(categories) / 4 * 100))
    source_availability = min(100, round(len(sources) / 12 * 100))
    verification = round(sum(c["status"] == "VERIFIED" for c in claims) / max(1, len(claims)) * 100) if claims else 0
    meeting_insights = min(100, round(len(analysis.get("questions", [])) / 6 * 100))
    score = round(coverage * .25 + source_availability * .25 + verification * .30 + meeting_insights * .20)
    return {"score": score, "label": "Research readiness, not meeting success probability", "components": {
        "Research category coverage": coverage, "Recent source availability": source_availability,
        "Evidence verification": verification, "Meeting-specific insights": meeting_insights},
        "explanation": "Weighted from category coverage (25%), source availability (25%), verified-claim share (30%), and meeting-specific questions (20%). This measures briefing completeness only."}
