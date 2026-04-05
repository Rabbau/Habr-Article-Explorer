import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import StatsPage from './components/StatsPage'
import './App.css'

const API_URL = import.meta.env.VITE_BACKEND_URL

function App() {
  const [darkMode, setDarkMode] = useState(false)
  const [articles, setArticles] = useState([])
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('date')
  const [activeTag, setActiveTag] = useState('')
  const [page, setPage] = useState(1)
  const [topTags, setTopTags] = useState([])
  const [totalArticles, setTotalArticles] = useState(0)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('articles')
  const [stats, setStats] = useState(null)

  // AUTH
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [favorites, setFavorites] = useState(new Set())

  // Подхватываем токен из URL после Google редиректа
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const t = params.get('token')
    if (t) {
      localStorage.setItem('token', t)
      setToken(t)
      window.history.replaceState({}, '', '/')
    }
  }, [])

  // Декодируем токен
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

  // Загружаем избранное
  const fetchFavorites = useCallback(async () => {
    if (!token) return
    try {
      const res = await axios.get(`${API_URL}/favorites`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setFavorites(new Set(res.data.articles.map(a => a.id)))
    } catch (e) {
      console.error(e)
    }
  }, [token])

  useEffect(() => { fetchFavorites() }, [fetchFavorites])

  useEffect(() => {
    document.body.classList.toggle('dark-body', darkMode)
  }, [darkMode])

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true)
      try {
        const params = { sort, page, limit: 20 }
        if (search) params.search = search
        if (activeTag) params.tag = activeTag
        const res = await axios.get(`${API_URL}/api/articles`, { params })
        setArticles(res.data.articles)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchArticles()
  }, [sort, page, activeTag, search])

  useEffect(() => {
    axios.get(`${API_URL}/api/stats`).then(res => {
      setTopTags(res.data.top_tags)
      setTotalArticles(res.data.total_articles)
      setStats(res.data)
    }).catch(e => console.error(e))
  }, [])

  const handleSearch = (e) => {
    if (e.key === 'Enter') { setPage(1); setActiveTag('') }
  }

  const handleTagClick = (tag) => {
    setActiveTag(activeTag === tag ? '' : tag)
    setPage(1); setSearch(''); setActiveTab('articles')
  }

  const handleLogin = () => {
    window.location.href = `${API_URL}/auth/google`
  }

  const handleLogout = () => {
    setToken(null); setUser(null); setFavorites(new Set())
    localStorage.removeItem('token')
  }

  const toggleFavorite = async (article) => {
    if (!token) { handleLogin(); return }
    const isFav = favorites.has(article.id)
    try {
      if (isFav) {
        await axios.delete(`${API_URL}/favorites/${article.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setFavorites(prev => { const s = new Set(prev); s.delete(article.id); return s })
      } else {
        await axios.post(`${API_URL}/favorites/${article.id}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setFavorites(prev => new Set([...prev, article.id]))
      }
    } catch (e) {
      console.error(e)
    }
  }

  // Загружаем избранные статьи для вкладки
  const [favArticles, setFavArticles] = useState([])
  useEffect(() => {
    if (activeTab !== 'favorites' || !token) return
    axios.get(`${API_URL}/favorites`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setFavArticles(res.data.articles))
      .catch(e => console.error(e))
  }, [activeTab, token])

  const ArticleCard = ({ article }) => (
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
      {article.preview_text && (
        <p className="article-preview">{article.preview_text}</p>
      )}
      <div className="article-tags">
        {article.tags.map(tag => (
          <span key={tag} className="article-tag"
            onClick={() => handleTagClick(tag)} style={{ cursor: 'pointer' }}>
            {tag}
          </span>
        ))}
      </div>
    </div>
  )

  return (
    <div className={`app ${darkMode ? 'dark' : ''}`}>
      <div className="header">
        <h1>Habr <span>Article Explorer</span></h1>
        <div className="header-right">
          <div className="tabs">
            <button className={`tab ${activeTab === 'articles' ? 'active' : ''}`}
              onClick={() => setActiveTab('articles')}>📰 Статьи</button>
            <button className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
              onClick={() => setActiveTab('stats')}>📊 Статистика</button>
            {user && (
              <button className={`tab ${activeTab === 'favorites' ? 'active' : ''}`}
                onClick={() => setActiveTab('favorites')}>❤️ Избранное</button>
            )}
            <button className="tab tab--theme" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>

          {/* Авторизация */}
          {user ? (
            <div className="user-block">
              <span className="user-name">👤 {user.name || user.email}</span>
              <button className="btn-logout" onClick={handleLogout}>Выйти</button>
            </div>
          ) : (
            <button className="btn-login" onClick={handleLogin}>
              <img src="https://www.google.com/favicon.ico" width="16" height="16" alt="" />
              Войти через Google
            </button>
          )}

          <div className="stats-bar">Статей в базе: <span>{totalArticles}</span></div>
        </div>
      </div>

      {activeTab === 'stats' && <StatsPage stats={stats} />}

      {activeTab === 'favorites' && (
        <div className="articles-column" style={{ marginTop: 20 }}>
          {favArticles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
              Нет избранных статей
            </div>
          ) : (
            <div className="articles-list">
              {favArticles.map(article => <ArticleCard key={article.id} article={article} />)}
            </div>
          )}
        </div>
      )}

      {activeTab === 'articles' && (
        <>
          <div className="search-bar">
            <input type="text" placeholder="Поиск по заголовку... (Enter для поиска)"
              value={search} onChange={e => setSearch(e.target.value)} onKeyDown={handleSearch} />
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
                  <span className="mini-stat__value mini-stat__value--tag">{topTags[0]?.tag || '—'}</span>
                </div>
                <div className="mini-stat">
                  <span className="mini-stat__label">Статей в нём</span>
                  <span className="mini-stat__value">{topTags[0]?.count || 0}</span>
                </div>
              </div>
              <h3>Сортировка</h3>
              <div className="sort-buttons">
                {[
                  { value: 'date', label: '📅 По дате' },
                  { value: 'rating', label: '⭐ По рейтингу' },
                  { value: 'views', label: '👁 По просмотрам' },
                  { value: 'comments', label: '💬 По комментариям' },
                ].map(s => (
                  <button key={s.value} className={sort === s.value ? 'active' : ''}
                    onClick={() => { setSort(s.value); setPage(1) }}>{s.label}</button>
                ))}
              </div>
              <h3>Топ тегов</h3>
              <div className="tag-list">
                {topTags.map(({ tag, count }) => (
                  <span key={tag} className={`tag ${activeTag === tag ? 'active' : ''}`}
                    onClick={() => handleTagClick(tag)} title={`${count} статей`}>{tag}</span>
                ))}
              </div>
            </div>

            <div className="articles-column">
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>Загрузка...</div>
              ) : (
                <div className="articles-list">
                  {articles.map(article => <ArticleCard key={article.id} article={article} />)}
                </div>
              )}
              <div className="pagination">
                <button onClick={() => setPage(p => p - 1)} disabled={page === 1}>← Назад</button>
                <button className="active">{page}</button>
                <button onClick={() => setPage(p => p + 1)} disabled={articles.length < 20}>Вперёд →</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default App