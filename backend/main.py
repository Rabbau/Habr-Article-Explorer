from fastapi import FastAPI, Query
from backend.database import get_connection
from fastapi.middleware.cors import CORSMiddleware
import json


app = FastAPI(title="Habr Article Explorer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/articles")
def get_articles(
    search: str = Query(None, description="Поиск по заголовку"),
    tag: str = Query(None, description="Фильтр по тегу"),
    sort: str = Query("date", description="Сортировка: date, rating, views, comments"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
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
        # теги хранятся как строка — превращаем обратно в список
        article["tags"] = article["tags"].split(",") if article["tags"] else []
        articles.append(article)

    return {"articles": articles, "page": page, "limit": limit}


@app.get("/api/articles/{article_id}")
def get_article(article_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM articles WHERE id = ?", (article_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Статья не найдена")

    article = dict(row)
    article["tags"] = article["tags"].split(",") if article["tags"] else []
    return article


@app.get("/api/stats")
def get_stats():
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