# Habr Article Explorer

Веб-приложение для просмотра, поиска и анализа статей с Habr на основе локально собранной базы SQLite.

## Стек

- Python 3.12
- FastAPI
- SQLite
- Scrapy
- React 19 + Vite
- Recharts
- JWT (`python-jose`) + Google OAuth (`httpx`)
- Poetry

## Архитектура

Проект состоит из 3 частей:

- `parser/` — Scrapy-парсер, собирает статьи с Habr и сохраняет в SQLite.
- `backend/` — FastAPI API для статей, статистики, авторизации и избранного.
- `frontend/` — React-клиент (Vite), UI для поиска, фильтров, статистики и избранного.

Схема потока данных:

```text
Habr -> Scrapy parser -> parser/habr_articles.db -> FastAPI API -> React UI
```

## Структура проекта

```text
Habr Article Explorer/
├── backend/
│   ├── main.py                 # FastAPI app + роутеры
│   ├── database.py             # Подключение к SQLite
│   ├── core/config.py          # Переменные окружения (OAuth/JWT)
│   ├── articles/               # Статьи + статистика
│   ├── auth/                   # Google OAuth + JWT
│   └── favorites/              # Избранное пользователя
├── parser/
│   ├── scrapy.cfg
│   ├── habr_articles.db        # База статей
│   └── parser/
│       ├── spiders/habr_spider.py
│       └── pipelines.py        # Запись в SQLite
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── components/StatsPage.jsx
│   ├── package.json
│   └── vite.config.js
├── pyproject.toml
└── README.md
```

## Функциональность

- Список статей с пагинацией
- Поиск по заголовку
- Фильтрация по тегам
- Сортировка: `date`, `rating`, `views`, `comments`
- Страница статистики: общее число статей, топ тегов, топ авторов
- Авторизация через Google
- Избранные статьи для авторизованного пользователя

## Быстрый старт (локально)

### 1. Установка зависимостей Python

```bash
poetry install
```

### 2. Настройка backend env

```bash
copy backend\.env.example backend\.env
```

Заполните в `backend/.env`:

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
SECRET_KEY=...
```

### 3. Собрать базу статей (парсер)

```bash
cd parser
poetry run scrapy crawl habr
cd ..
```

После этого будет создана/обновлена база `parser/habr_articles.db`.

### 4. Запустить backend

```bash
poetry run uvicorn backend.main:app --reload
```

API будет доступно на `http://127.0.0.1:8000`.

### 5. Запустить frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend будет доступен на `http://127.0.0.1:5173`.

## API

Базовые эндпоинты:

| Метод | Эндпоинт | Описание |
|---|---|---|
| `GET` | `/api/articles` | Список статей |
| `GET` | `/api/articles/{article_id}` | Детали статьи |
| `GET` | `/api/stats` | Агрегированная статистика |
| `GET` | `/auth/google` | Старт Google OAuth |
| `GET` | `/auth/callback` | OAuth callback |
| `GET` | `/favorites` | Избранное пользователя (Bearer JWT) |
| `POST` | `/favorites/{article_id}` | Добавить в избранное |
| `DELETE` | `/favorites/{article_id}` | Удалить из избранного |

Параметры `GET /api/articles`:

- `search` — поиск по заголовку
- `tag` — фильтр по тегу
- `sort` — `date | rating | views | comments`
- `page` — страница (по умолчанию 1)
- `limit` — размер страницы (1..100, по умолчанию 20)

Swagger: `http://127.0.0.1:8000/docs`

## Переменные окружения

### Backend (`backend/.env`)

| Переменная | Назначение |
|---|---|
| `GOOGLE_CLIENT_ID` | OAuth client id Google |
| `GOOGLE_CLIENT_SECRET` | OAuth secret Google |
| `SECRET_KEY` | Ключ подписи JWT |

### Frontend (`frontend/.env.production`)

| Переменная | Назначение |
|---|---|
| `VITE_BACKEND_URL` | URL backend API для production |

## Деплой

Текущая структура деплоя (Render):

- Frontend: Static Site
- Backend: Web Service (FastAPI)

Для production убедитесь, что:

- в frontend задан `VITE_BACKEND_URL`
- в backend заданы `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `SECRET_KEY`
- OAuth callback URL совпадает с доменом backend (в текущем коде callback зашит в `backend/auth/router.py`)

## Важно

- Парсер пишет в SQLite с дедупликацией по `link`.
- Backend использует ту же базу `parser/habr_articles.db`.
- Таблицы `users` и `favorites` создаются автоматически при старте FastAPI приложения.


## Ссылка на захостченый бесплатный рендер:

сначала запустите backend:
https://habr-article-explorer.onrender.com/

затем frontend:
https://habr-article-explorer-1.onrender.com/
