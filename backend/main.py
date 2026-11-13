from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import init_db
from .routes.meetings import router
from .config import settings
from .services.gemini_service import configured


app = FastAPI(
    title="BrieflyAI API",
    version="1.0.0",
    description="Source-backed pre-meeting intelligence agent"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(router)


@app.on_event("startup")
def startup():
    init_db()


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "app": settings.app_name,
        "integrations": {
            "tavily_configured": bool(settings.tavily_api_key),
            "gemini_configured": configured()
        }
    }