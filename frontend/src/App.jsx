import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import StatsPage from './components/StatsPage'
import TodoPage from './components/TodoPage'
import './App.css'

const API_URL = (import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')

function App() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === '1')
  const [articles, setArticles] = useState([])
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('date')
  const [activeTag, setActiveTag] = useState('')
  const [page, setPage] = useState(1)
  const [topTags, setTopTags] = useState([])
  const [totalArticles, setTotalArticles] = useState(0)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('articles')
  const [menuOpen, setMenuOpen] = useState(false)
  const [stats, setStats] = useState(null)

  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [favorites, setFavorites] = useState(new Set())
  const [favArticles, setFavArticles] = useState([])

  const safeTopTags = Array.isArray(topTags) ? topTags : []
  const safeArticles = Array.isArray(articles) ? articles : []
  const safeFavArticles = Array.isArray(favArticles) ? favArticles : []

  useEffect(() => {
    document.body.classList.toggle('dark-body', darkMode)
    localStorage.setItem('darkMode', darkMode ? '1' : '0')
  }, [darkMode])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const t = params.get('token')
    if (t) {
      localStorage.setItem('token', t)
      setToken(t)
      window.history.replaceState({}, '', '/')
    }
  }, [])

  useEffect(() => {
    if (!token) return
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      setUser({ id: payload.sub, email: payload.email, name: payload.name })
    } catch {
      setToken(null)
      localStorage.removeItem('token')
    }
  }, [token])

  const fetchFavorites = useCallback(async () => {
    if (!token) return
    try {
      const res = await axios.get(`${API_URL}/favorites`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const items = Array.isArray(res?.data?.articles) ? res.data.articles : []
      setFavorites(new Set(items.map((a) => a.id)))
    } catch (e) {
      console.error(e)
    }
  }, [token])

  useEffect(() => {
    fetchFavorites()
  }, [fetchFavorites])

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true)
      try {
        const params = { sort, page, limit: 20 }
        if (search) params.search = search
        if (activeTag) params.tag = activeTag
        const res = await axios.get(`${API_URL}/api/articles`, { params })
        setArticles(Array.isArray(res?.data?.articles) ? res.data.articles : [])
      } catch (e) {
        console.error(e)
        setArticles([])
      } finally {
        setLoading(false)
      }
    }

    fetchArticles()
  }, [sort, page, activeTag, search])

  useEffect(() => {
    axios
      .get(`${API_URL}/api/stats`)
      .then((res) => {
        setTopTags(Array.isArray(res?.data?.top_tags) ? res.data.top_tags : [])
        setTotalArticles(Number(res?.data?.total_articles) || 0)
        setStats(res.data)
      })
      .catch((e) => {
        console.error(e)
        setTopTags([])
      })
  }, [])

  useEffect(() => {
    if (activeTab !== 'favorites' || !token) return
    axios
      .get(`${API_URL}/favorites`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setFavArticles(Array.isArray(res?.data?.articles) ? res.data.articles : []))
      .catch((e) => {
        console.error(e)
        setFavArticles([])
      })
  }, [activeTab, token])

  useEffect(() => {
    const closeByEscape = (e) => {
      if (e.key === 'Escape') {
        setMenuOpen(false)
      }
    }
    window.addEventListener('keydown', closeByEscape)
    return () => window.removeEventListener('keydown', closeByEscape)
  }, [])

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      setPage(1)
      setActiveTag('')
    }
  }

  const handleTagClick = (tag) => {
    setActiveTag(activeTag === tag ? '' : tag)
    setPage(1)
    setSearch('')
    setActiveTab('articles')
    setMenuOpen(false)
  }

  const handleLogin = () => {
    window.location.href = `${API_URL}/auth/google`
  }

  const handleLogout = () => {
    setToken(null)
    setUser(null)
    setFavorites(new Set())
    localStorage.removeItem('token')
    if (activeTab === 'favorites') {
      setActiveTab('articles')
    }
  }

  const handleTabChangeFromMenu = (tab) => {
    if (tab === 'favorites' && !user) {
      handleLogin()
      return
    }
    setActiveTab(tab)
    setMenuOpen(false)
  }

  const toggleFavorite = async (article) => {
    if (!token) {
      handleLogin()
      return
    }

    const isFav = favorites.has(article.id)

    try {
      if (isFav) {
        await axios.delete(`${API_URL}/favorites/${article.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setFavorites((prev) => {
          const next = new Set(prev)
          next.delete(article.id)
          return next
        })
      } else {
        await axios.post(
          `${API_URL}/favorites/${article.id}`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        )
        setFavorites((prev) => new Set([...prev, article.id]))
      }
    } catch (e) {
      console.error(e)
    }
  }

  const ArticleCard = ({ article }) => {
    const tags = Array.isArray(article?.tags) ? article.tags : []

    return (
      <div className="article-card">
        <div className="article-card__header">
          <h2>
            <a href={article.link} target="_blank" rel="noreferrer">
              {article.title || 'Без заголовка'}
            </a>
          </h2>
          <button
            className={`fav-btn ${favorites.has(article.id) ? 'fav-btn--active' : ''}`}
            onClick={() => toggleFavorite(article)}
            title={favorites.has(article.id) ? 'Убрать из избранного' : 'В избранное'}
          >
            {favorites.has(article.id) ? '❤️' : '🤍'}
          </button>
        </div>

        <div className="article-meta">
          <span>👤 {article.author || 'Аноним'}</span>
          <span>📅 {article.date ? new Date(article.date).toLocaleDateString('ru-RU') : '—'}</span>
          {article.rating !== 0 && <span>⭐ {article.rating}</span>}
        </div>

        {article.preview_text && <p className="article-preview">{article.preview_text}</p>}

        <div className="article-tags">
          {tags.map((tag) => (
            <span
              key={tag}
              className="article-tag"
              onClick={() => handleTagClick(tag)}
              style={{ cursor: 'pointer' }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`app ${darkMode ? 'dark' : ''}`}>
      <div className={`menu-overlay ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(false)} />

      <aside className={`side-drawer ${menuOpen ? 'open' : ''}`}>
        <div className="drawer-head">
          <h3>Разделы</h3>
          <button type="button" className="drawer-close" onClick={() => setMenuOpen(false)}>
            ✕
          </button>
        </div>
        <button
          className={`menu-item ${activeTab === 'articles' ? 'active' : ''}`}
          onClick={() => handleTabChangeFromMenu('articles')}
        >
          📰 Статьи
        </button>
        <button
          className={`menu-item ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => handleTabChangeFromMenu('stats')}
        >
          📊 Статистика
        </button>
        <button
          className={`menu-item ${activeTab === 'favorites' ? 'active' : ''}`}
          onClick={() => handleTabChangeFromMenu('favorites')}
        >
          ❤️ Избранное
        </button>
        <button
          className={`menu-item ${activeTab === 'todo' ? 'active' : ''}`}
          onClick={() => handleTabChangeFromMenu('todo')}
        >
          📋 Задачи
        </button>
      </aside>

      <div className="header">
        <div className="header-left">
          <button
            className={`menu-toggle ${menuOpen ? 'active' : ''}`}
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Открыть меню"
            type="button"
          >
            <span />
            <span />
            <span />
          </button>
          <h1>
            Habr <span>Article Explorer</span>
          </h1>
        </div>

        <div className="header-right">
          <button type="button" className="theme-toggle" onClick={() => setDarkMode((prev) => !prev)}>
            {darkMode ? '☀️' : '🌙'}
          </button>

          {user ? (
            <button className="btn-login" onClick={handleLogout}>
              Выйти
            </button>
          ) : (
            <button className="btn-login" onClick={handleLogin}>
              <img src="https://www.google.com/favicon.ico" width="16" height="16" alt="" />
              Войти через Google
            </button>
          )}

          <div className="stats-bar">
            Статей в базе: <span>{totalArticles}</span>
          </div>
        </div>
      </div>

      {activeTab === 'stats' && <StatsPage stats={stats} />}
      {activeTab === 'todo' && (
        <TodoPage
          key={user?.id || 'guest'}
          user={user}
          onLogin={handleLogin}
          token={token}
          apiUrl={API_URL}
        />
      )}

      {activeTab === 'favorites' && (
        <div className="articles-column" style={{ marginTop: 20 }}>
          {safeFavArticles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>Нет избранных статей</div>
          ) : (
            <div className="articles-list">
              {safeFavArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'articles' && (
        <>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Поиск по заголовку... (Enter для поиска)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearch}
            />
          </div>

          <div className="main-layout">
            <div className="sidebar">
              <h3>Обзор</h3>
              <div className="mini-stats">
                <div className="mini-stat">
                  <span className="mini-stat__label">Статей в базе</span>
                  <span className="mini-stat__value">{totalArticles}</span>
                </div>
                <div className="mini-stat-divider" />
                <div className="mini-stat">
                  <span className="mini-stat__label">Топ тег</span>
                  <span className="mini-stat__value mini-stat__value--tag">{safeTopTags[0]?.tag || '—'}</span>
                </div>
                <div className="mini-stat">
                  <span className="mini-stat__label">Статей в нём</span>
                  <span className="mini-stat__value">{safeTopTags[0]?.count || 0}</span>
                </div>
              </div>

              <h3>Сортировка</h3>
              <div className="sort-select-wrap">
                <select
                  className="sort-select"
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value)
                    setPage(1)
                  }}
                >
                  <option value="date">По дате</option>
                  <option value="rating">По рейтингу</option>
                  <option value="views">По просмотрам</option>
                  <option value="comments">По комментариям</option>
                </select>
              </div>

              <h3>Топ тегов</h3>
              <div className="tag-list">
                {safeTopTags.map(({ tag, count }) => (
                  <span
                    key={tag}
                    className={`tag ${activeTag === tag ? 'active' : ''}`}
                    onClick={() => handleTagClick(tag)}
                    title={`${count} статей`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="articles-column">
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>Загрузка...</div>
              ) : (
                <div className="articles-list">
                  {safeArticles.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              )}

              <div className="pagination">
                <button onClick={() => setPage((p) => p - 1)} disabled={page === 1}>
                  ← Назад
                </button>
                <button className="active">{page}</button>
                <button onClick={() => setPage((p) => p + 1)} disabled={safeArticles.length < 20}>
                  Вперёд →
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default App
