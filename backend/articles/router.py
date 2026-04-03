from fastapi import APIRouter, Query
from fastapi import HTTPException

from backend.articles.service import fetch_articles, get_article_by_id, get_stats_data

router = APIRouter(
    prefix="/api",
    tags=["articles"],
)

@router.get("/articles")
def get_articles(
    search: str = Query(None, description="Поиск по заголовку"),
    tag: str = Query(None, description="Фильтр по тегу"),
    sort: str = Query("date", description="Сортировка: date, rating, views, comments"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    articles = fetch_articles(search, tag, sort, page, limit)
    return {"articles": articles, "page": page, "limit": limit}


@router.get("/articles/{article_id}")
def get_article(article_id: int):
    article = get_article_by_id(article_id)

    if not article:
        raise HTTPException(status_code=404, detail="Статья не найдена")

    return article


@router.get("/stats")
def get_stats():
    return get_stats_data()