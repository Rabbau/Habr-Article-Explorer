from pydantic import BaseModel, Field


class TodoCreate(BaseModel):
    title: str = Field(min_length=1, max_length=300)
    due_at: str | None = None
    priority: str = Field(default="neutral")


class TodoUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=300)
    due_at: str | None = None
    priority: str | None = None
    done: bool | None = None
    starred: bool | None = None
