from fastapi import APIRouter, Header, HTTPException
from jose import JWTError, jwt

from backend.core.config import SECRET_KEY
from backend.todos.schemas import TodoCreate, TodoUpdate
from backend.todos.service import create_todo, delete_todo, list_todos, update_todo

router = APIRouter(prefix="/todos", tags=["todos"])

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
def get_user_todos(authorization: str = Header(None)):
    user_id = get_current_user_id(authorization)
    return {"todos": list_todos(user_id)}


@router.post("")
def create_user_todo(data: TodoCreate, authorization: str = Header(None)):
    user_id = get_current_user_id(authorization)
    title = data.title.strip()
    if not title:
        raise HTTPException(status_code=422, detail="Title cannot be empty")
    todo = create_todo(
        user_id=user_id,
        title=title,
        due_at=data.due_at,
        priority=data.priority,
    )
    return {"todo": todo}


@router.patch("/{todo_id}")
def patch_user_todo(todo_id: int, data: TodoUpdate, authorization: str = Header(None)):
    user_id = get_current_user_id(authorization)
    patch = data.model_dump(exclude_unset=True)

    if "title" in patch:
        patch["title"] = patch["title"].strip() if patch["title"] is not None else None
        if patch["title"] == "":
            raise HTTPException(status_code=422, detail="Title cannot be empty")

    todo = update_todo(user_id=user_id, todo_id=todo_id, patch=patch)
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    return {"todo": todo}


@router.delete("/{todo_id}")
def delete_user_todo(todo_id: int, authorization: str = Header(None)):
    user_id = get_current_user_id(authorization)
    deleted = delete_todo(user_id=user_id, todo_id=todo_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Todo not found")
    return {"status": "deleted"}
