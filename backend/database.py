import sqlite3
from pathlib import Path

# БД находится в ../parser/habr_articles.db
DB_PATH = Path(__file__).parent.parent / "parser" / "habr_articles.db"

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn