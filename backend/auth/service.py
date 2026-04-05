import httpx
from backend.database import get_connection


def get_or_create_user(email: str, name: str, google_id: str):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT * FROM users WHERE email = ?",
        (email,)
    )
    user = cursor.fetchone()

    if user:
        conn.close()
        return dict(user)

    cursor.execute("""
        INSERT INTO users (email, name, google_id)
        VALUES (?, ?, ?)
    """, (email, name, google_id))

    conn.commit()

    cursor.execute(
        "SELECT * FROM users WHERE email = ?",
        (email,)
    )
    user = cursor.fetchone()

    conn.close()
    return dict(user)