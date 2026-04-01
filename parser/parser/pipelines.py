import sqlite3

class SQLitePipeline:
    def open_spider(self, spider):
        self.conn = sqlite3.connect("habr_articles.db")
        self.cursor = self.conn.cursor()
        # Создаем таблицу, если нет
        self.cursor.execute("""
            CREATE TABLE IF NOT EXISTS articles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT,
                author TEXT,
                date TEXT,
                tags TEXT,
                views INTEGER,
                comments INTEGER,
                rating INTEGER,
                link TEXT,
                preview_text TEXT
            )
        """)
        self.conn.commit()

    def close_spider(self, spider):
        self.conn.close()

    def process_item(self, item, spider):
        self.cursor.execute("""
            INSERT INTO articles (title, author, date, tags, views, comments, rating, link, preview_text)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            item.get("title"),
            item.get("author"),
            item.get("date"),
            ",".join(item.get("tags", [])),  # сохраняем теги как строку
            item.get("views") or 0,
            item.get("comments") or 0,
            item.get("rating") or 0,
            item.get("link"),
            item.get("preview_text")
        ))
        self.conn.commit()
        return item