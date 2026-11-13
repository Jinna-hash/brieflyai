from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "BrieflyAI"
    database_url: str = "sqlite:///./brieflyai.db"

    # Tavily research
    tavily_api_key: str | None = None

    # Gemini AI
    gemini_api_key: str | None = None
    gemini_model: str = "gemini-3.6-flash"

    research_max_results: int = 6
    request_timeout: int = 120

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()