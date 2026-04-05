import sqlite3


class SQLitePipeline:
    def open_spider(self, spider):
        self.conn = sqlite3.connect("habr_articles.db")
        self.cursor = self.conn.cursor()

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

        self.cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_articles_link 
            ON articles(link)
        """)

        self.cursor.execute("SELECT link FROM articles")
        self.existing_links = set(row[0] for row in self.cursor.fetchall())

    def close_spider(self, spider):
        self.conn.commit()
        self.conn.close()

    def process_item(self, item, spider):
        link = item.get("link")

        if link in self.existing_links:
            return item

        self.cursor.execute("""
            INSERT INTO articles
            (title, author, date, tags, views, comments, rating, link, preview_text)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            item.get("title"),
            item.get("author"),
            item.get("date"),
            ",".join(item.get("tags", [])),
            item.get("views") or 0,
            item.get("comments") or 0,
            item.get("rating") or 0,
            link,
            item.get("preview_text")
        ))

        self.existing_links.add(link)

        return item