from fastapi import APIRouter, Header, HTTPException
from jose import jwt, JWTError
from backend.core.config import SECRET_KEY
from favorites.service import get_favorites, add_favorite, remove_favorite

router = APIRouter(prefix="/favorites", tags=["favorites"])

ALGORITHM = "HS256"

def get_current_user_id(authorization: str = Header(None)) -> int:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return int(payload["sub"])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.get("")
def get_user_favorites(authorization: str = Header(None)):
    user_id = get_current_user_id(authorization)
    return {"articles": get_favorites(user_id)}

@router.post("/{article_id}")
def add_to_favorites(article_id: int, authorization: str = Header(None)):
    user_id = get_current_user_id(authorization)
    add_favorite(user_id, article_id)
    return {"status": "added"}

@router.delete("/{article_id}")
def remove_from_favorites(article_id: int, authorization: str = Header(None)):
    user_id = get_current_user_id(authorization)
    remove_favorite(user_id, article_id)
    return {"status": "removed"}