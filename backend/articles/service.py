from backend.database import get_connection

def fetch_articles(search, tag, sort, page, limit):
    conn = get_connection()
    cursor = conn.cursor()

    where_clauses = []
    params = []

    if search:
        where_clauses.append("title LIKE ?")
        params.append(f"%{search}%")

    if tag:
        where_clauses.append("tags LIKE ?")
        params.append(f"%{tag}%")

    where_sql = "WHERE " + " AND ".join(where_clauses) if where_clauses else ""

    sort_map = {
        "date": "date DESC",
        "rating": "rating DESC",
        "views": "views DESC",
        "comments": "comments DESC",
    }
    order_sql = sort_map.get(sort, "date DESC")

    offset = (page - 1) * limit

    cursor.execute(f"""
        SELECT * FROM articles
        {where_sql}
        ORDER BY {order_sql}
        LIMIT ? OFFSET ?
    """, params + [limit, offset])

    rows = cursor.fetchall()
    conn.close()

    articles = []
    for row in rows:
        article = dict(row)
        article["tags"] = article["tags"].split(",") if article["tags"] else []
        articles.append(article)

    return articles

def get_article_by_id(article_id: int):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT * FROM articles WHERE id = ?",
        (article_id,)
    )
    row = cursor.fetchone()
    conn.close()

    if not row:
        return None

    article = dict(row)
    article["tags"] = article["tags"].split(",") if article["tags"] else []
    return article

def get_stats_data():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) as total FROM articles")
    total = cursor.fetchone()["total"]

    cursor.execute("SELECT tags FROM articles WHERE tags != ''")
    rows = cursor.fetchall()

    tag_counts = {}
    for row in rows:
        for tag in row["tags"].split(","):
            tag = tag.strip()
            if tag:
                tag_counts[tag] = tag_counts.get(tag, 0) + 1

    top_tags = sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)[:20]

    cursor.execute("""
        SELECT author, COUNT(*) as count
        FROM articles
        WHERE author != ''
        GROUP BY author
        ORDER BY count DESC
        LIMIT 10
    """)
    top_authors = [dict(row) for row in cursor.fetchall()]

    conn.close()

    return {
        "total_articles": total,
        "top_tags": [{"tag": t, "count": c} for t, c in top_tags],
        "top_authors": top_authors,
    }