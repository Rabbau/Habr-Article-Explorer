
# 📖 Habr Article Explorer

[![Python](https://img.shields.io/badge/python-3.12-blue)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.135.2-green)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.2.0-blueviolet)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-4.4.9-yellowgreen)](https://vitejs.dev/)
[![SQLite](https://img.shields.io/badge/SQLite-3.41.2-lightgrey)](https://www.sqlite.org/index.html)
[![Deploy: Render](https://img.shields.io/badge/Deploy-Render-orange)](https://render.com/)

**Habr Article Explorer** — это веб‑приложение для просмотра, поиска и сортировки статей из базы данных Habr.
Бэкенд написан на **FastAPI**, фронтенд на **React + Vite**, база — SQLite.

🔗 Прямой деплой:
Frontend → Static Site
Backend → FastAPI Web Service (Render)

---

## 📌 Содержание

1. 🚀 Возможности
2. 📁 Структура
3. 🧠 Тех. стек
4. 🧰 Как запустить локально
5. 📦 Деплой на Render
6. 📡 API
7. 💡 Примеры запросов
8. 📦 Переменные окружения
9. 📄 Лицензия

---

## 🚀 Возможности

✔️ Просмотр списка статей
✔️ Поиск по заголовку
✔️ Сортировка (дата, рейтинг, просмотры, комментарии)
✔️ Фильтрация по тегам
✔️ Просмотр подробностей статьи
✔️ Статистика:
‑ Общее количество статей
‑ Топ тегов
‑ Топ авторов

---

## 📁 Структура проекта

```
Habr-Article-Explorer/
├─ backend/               # FastAPI API
│   ├─ __init__.py
│   ├─ main.py
│   └─ database.py
├─ parser/
│   └─ habr_articles.db   # SQLite база данных
├─ frontend/              # React + Vite фронтенд
│   ├─ src/
│   │   ├─ App.jsx
│   │   └─ main.jsx
│   └─ package.json
└─ README.md
```

---

## 🧠 Технологии

| Слой       | Технология              |
| ---------- | ----------------------- |
| Backend    | Python, FastAPI, SQLite |
| Frontend   | React, Vite, Axios      |
| Deployment | Render                  |
| Data       | habr_articles.db        |

---

## 🧰 Как запустить локально

### 🧩 Бэкенд


1. Создать виртуальное окружение и установить зависимости:

```bash
poetry install 
```

2. Запустить сервер:

```bash
poetry run uvicorn backend.main:app 
```

👉 API будет доступен на: `http://localhost:8000`

---

### 🧩 Фронтенд

1. Перейти в папку frontend:

```bash
cd frontend
```

2. Установить зависимости:

```bash
npm install
```

4. Запустить приложение:

```bash
npm run dev
```

👉 Приложение откроется в браузере по адресу: `http://localhost:5173`

---

## 📦 Деплой на Render

### 🧠 Backend

1. Создайте **Web Service** на Render
2. Репозиторий: `Rabbau/Habr-Article-Explorer`
3. Ветка: `prod`
4. Build Command:

```bash
pip install poetry && poetry install --only main --no-root
```

6. Start Command:

```bash
poetry run uvicorn backend.main:app --host 0.0.0.0 --port 10000
```

---

### 🧠 Frontend

1. Создайте **Static Site** на Render
2. Репозиторий: тот же
3. Ветка: `prod`
4. Build Command:

```bash
npm install && npm run build
```

5. Publish Directory:

```
dist
```

6. Добавьте ENV:

```
VITE_BACKEND_URL=https://<адрес вашего бэка на Render>
```

---

## 📡 API

All endpoints are prefixed with `/api`.

### 📝 Получить список статей

```
GET /api/articles
```

Query параметры:

| Параметр | Описание                                   |
| -------- | ------------------------------------------ |
| search   | Поиск по заголовку                         |
| tag      | Фильтрация по тегу                         |
| sort     | Сортировка (date, rating, views, comments) |
| page     | Номер страницы                             |
| limit    | Количество на страницу                     |

---

### 📦 Получить одну статью

```
GET /api/articles/{id}
```

---

### 📊 Статистика

```
GET /api/stats
```

Возвращает JSON с полями:

| Поле           | Описание            |
| -------------- | ------------------- |
| total_articles | Общее кол-во статей |
| top_tags       | Список топ‑20 тегов |
| top_authors    | Топ авторов         |

---

## 💡 Примеры запросов

### Axios (React)

```js
axios.get(`${API_URL}/api/stats`)
```

### Curl

```bash
curl https://<backend-url>/api/articles
```

---

## 📦 Переменные окружения

**frontend/.env**

```
VITE_BACKEND_URL=https://<backend-host>
```

---

## Deploy render. необходимо зайти на обе ссылки, чтобы запустить Render

**front**
https://habr-article-explorer-1.onrender.com/

**backend (api)**
https://habr-article-explorer.onrender.com/docs#/default/get_articles_api_articles_get
