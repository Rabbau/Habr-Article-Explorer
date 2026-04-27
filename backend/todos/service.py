from backend.database import get_connection


ALLOWED_PRIORITIES = {"neutral", "important", "urgent"}


def normalize_priority(priority: str | None) -> str:
    if priority in ALLOWED_PRIORITIES:
        return priority
    return "neutral"


def row_to_todo(row):
    return {
        "id": row["id"],
        "title": row["title"],
        "dueAt": row["due_at"],
        "priority": row["priority"],
        "done": bool(row["done"]),
        "starred": bool(row["starred"]),
        "createdAt": row["created_at"],
    }


def list_todos(user_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT id, title, due_at, priority, done, starred, created_at
        FROM todos
        WHERE user_id = ?
        ORDER BY datetime(created_at) DESC
        """,
        (user_id,),
    )
    rows = cursor.fetchall()
    conn.close()
    return [row_to_todo(row) for row in rows]


def create_todo(user_id: int, title: str, due_at: str | None, priority: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO todos (user_id, title, due_at, priority, done, starred)
        VALUES (?, ?, ?, ?, 0, 0)
        """,
        (user_id, title.strip(), due_at, normalize_priority(priority)),
    )
    todo_id = cursor.lastrowid
    conn.commit()

    cursor.execute(
        """
        SELECT id, title, due_at, priority, done, starred, created_at
        FROM todos
        WHERE id = ? AND user_id = ?
        """,
        (todo_id, user_id),
    )
    row = cursor.fetchone()
    conn.close()
    return row_to_todo(row) if row else None


def update_todo(user_id: int, todo_id: int, patch: dict):
    fields = []
    values = []

    if "title" in patch and patch["title"] is not None:
        fields.append("title = ?")
        values.append(str(patch["title"]).strip())

    if "due_at" in patch:
        fields.append("due_at = ?")
        values.append(patch["due_at"])

    if "priority" in patch and patch["priority"] is not None:
        fields.append("priority = ?")
        values.append(normalize_priority(patch["priority"]))

    if "done" in patch and patch["done"] is not None:
        fields.append("done = ?")
        values.append(1 if patch["done"] else 0)

    if "starred" in patch and patch["starred"] is not None:
        fields.append("starred = ?")
        values.append(1 if patch["starred"] else 0)

    if not fields:
        return get_todo(user_id, todo_id)

    values.extend([todo_id, user_id])

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        f"UPDATE todos SET {', '.join(fields)} WHERE id = ? AND user_id = ?",
        values,
    )
    conn.commit()

    cursor.execute(
        """
        SELECT id, title, due_at, priority, done, starred, created_at
        FROM todos
        WHERE id = ? AND user_id = ?
        """,
        (todo_id, user_id),
    )
    row = cursor.fetchone()
    conn.close()
    return row_to_todo(row) if row else None


def get_todo(user_id: int, todo_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT id, title, due_at, priority, done, starred, created_at
        FROM todos
        WHERE id = ? AND user_id = ?
        """,
        (todo_id, user_id),
    )
    row = cursor.fetchone()
    conn.close()
    return row_to_todo(row) if row else None


def delete_todo(user_id: int, todo_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "DELETE FROM todos WHERE id = ? AND user_id = ?",
        (todo_id, user_id),
    )
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted
