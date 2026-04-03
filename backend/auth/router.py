from fastapi import APIRouter
from fastapi.responses import RedirectResponse
import httpx
from jose import jwt
from datetime import datetime, timedelta

from backend.core.config import GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, SECRET_KEY
from .service import get_or_create_user

router = APIRouter(prefix="/auth", tags=["auth"])

CLIENT_ID = GOOGLE_CLIENT_ID
CLIENT_SECRET = GOOGLE_CLIENT_SECRET
SECRET_KEY = SECRET_KEY 
REDIRECT_URI = "https://habr-article-explorer.onrender.com/auth/callback"
FRONTEND_URL = "https://habr-article-explorer-1.onrender.com/"  
ALGORITHM = "HS256"


def create_jwt(user: dict) -> str:
    payload = {
        "sub": str(user["id"]),
        "email": user["email"],
        "name": user.get("name"),
        "exp": datetime.utcnow() + timedelta(days=7),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


@router.get("/google")
def google_login():
    url = (
        "https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={CLIENT_ID}"
        f"&response_type=code"
        f"&redirect_uri={REDIRECT_URI}"
        f"&scope=openid email profile"
    )
    return RedirectResponse(url)


@router.get("/callback")
def google_callback(code: str):
    token_response = httpx.post(
        "https://oauth2.googleapis.com/token",
        data={
            "code": code,
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "redirect_uri": REDIRECT_URI,
            "grant_type": "authorization_code",
        }
    )
    access_token = token_response.json().get("access_token")

    user_info = httpx.get(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        headers={"Authorization": f"Bearer {access_token}"}
    ).json()

    user = get_or_create_user(
        email=user_info["email"],
        name=user_info.get("name"),
        google_id=user_info["id"]
    )

    token = create_jwt(dict(user))

    return RedirectResponse(f"{FRONTEND_URL}?token={token}")