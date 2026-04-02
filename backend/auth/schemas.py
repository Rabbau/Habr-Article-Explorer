from pydantic import BaseModel

class UserOut(BaseModel):
    id: int
    email: str
    name: str | None
    google_id: str