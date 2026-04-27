from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.articles.router import router as artiRouter
from backend.auth.router import router as authRouter
from backend.favorites.router import router as favRouter
from backend.todos.router import router as todoRouter
from backend.auth.models import create_users_table
from backend.favorites.models import create_favorites_table
from backend.todos.models import create_todos_table

app = FastAPI(title="Habr Article Explorer API")


create_users_table()
create_favorites_table()
create_todos_table()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(artiRouter)
app.include_router(authRouter)
app.include_router(favRouter)
app.include_router(todoRouter)
