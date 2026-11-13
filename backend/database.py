import json, sqlite3
from pathlib import Path
from datetime import datetime
from .config import settings

DB_PATH = settings.database_url.replace("sqlite:///", "")
Path(DB_PATH).parent.mkdir(parents=True, exist_ok=True)

def connect():
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    return con

def init_db():
    with connect() as con:
        con.execute("CREATE TABLE IF NOT EXISTS briefings (id TEXT PRIMARY KEY, subject TEXT NOT NULL, meeting_date TEXT NOT NULL, created_at TEXT NOT NULL, payload TEXT NOT NULL)")

def save_briefing(data: dict):
    with connect() as con:
        con.execute("INSERT OR REPLACE INTO briefings VALUES (?, ?, ?, ?, ?)", (data['id'], data['meeting']['subject'], data['meeting']['meeting_date'], data['created_at'], json.dumps(data, default=str)))

def list_briefings():
    with connect() as con:
        rows = con.execute("SELECT id, subject, meeting_date, created_at FROM briefings ORDER BY created_at DESC").fetchall()
        return [dict(r) for r in rows]

def get_briefing(briefing_id: str):
    with connect() as con:
        row = con.execute("SELECT payload FROM briefings WHERE id=?", (briefing_id,)).fetchone()
        return json.loads(row['payload']) if row else None
