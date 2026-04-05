from backend.database import get_connection

def get_favorites(user_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT a.* FROM articles a
        JOIN favorites f ON a.id = f.article_id
        WHERE f.user_id = ?
        ORDER BY f.created_at DESC
    """, (user_id,))
    rows = cursor.fetchall()
    conn.close()
    articles = []
    for row in rows:
        article = dict(row)
        article["tags"] = article["tags"].split(",") if article["tags"] else []
        articles.append(article)
    return articles

def add_favorite(user_id: int, article_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT OR IGNORE INTO favorites (user_id, article_id) VALUES (?, ?)",
        (user_id, article_id)
    )
    conn.commit()
    conn.close()

def remove_favorite(user_id: int, article_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "DELETE FROM favorites WHERE user_id = ? AND article_id = ?",
        (user_id, article_id)
    )
    conn.commit()
    conn.close()