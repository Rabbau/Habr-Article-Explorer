from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.articles import router as artiRouter
from backend.auth import router as authRouter
from backend.auth.models import create_users_table

app = FastAPI(title="Habr Article Explorer API")

create_users_table()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(artiRouter.router)
app.include_router(authRouter.router)