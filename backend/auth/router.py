from fastapi import APIRouter
from fastapi.responses import RedirectResponse
import httpx

from backend.core import GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
from .service import get_or_create_user

router = APIRouter(prefix="/auth", tags=["auth"])


CLIENT_ID = GOOGLE_CLIENT_ID
CLIENT_SECRET = GOOGLE_CLIENT_SECRET
REDIRECT_URI = "https://habr-article-explorer.onrender.com/auth/callback"


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
    token_url = "https://oauth2.googleapis.com/token"

    token_data = {
        "code": code,
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "redirect_uri": REDIRECT_URI,
        "grant_type": "authorization_code",
    }

    token_response = httpx.post(token_url, data=token_data)
    token_json = token_response.json()

    access_token = token_json.get("access_token")

    userinfo_response = httpx.get(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        headers={"Authorization": f"Bearer {access_token}"}
    )

    user_info = userinfo_response.json()

    email = user_info["email"]
    name = user_info.get("name")
    google_id = user_info["id"]

    user = get_or_create_user(email, name, google_id)

    return {"user": user}