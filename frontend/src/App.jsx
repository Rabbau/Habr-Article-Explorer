import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [articles, setArticles] = useState([])
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('date')
  const [activeTag, setActiveTag] = useState('')
  const [page, setPage] = useState(1)
  const [topTags, setTopTags] = useState([])
  const [totalArticles, setTotalArticles] = useState(0)
  const [loading, setLoading] = useState(false)

  // Используем переменную окружения для бэка
  const API_URL = import.meta.env.VITE_BACKEND_URL

  // Загружаем статьи
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
  }, [sort, page, activeTag, search, API_URL])

  // Загружаем статистику для тегов в сайдбаре
  useEffect(() => {
    axios.get(`${API_URL}/api/stats`).then(res => {
      setTopTags(res.data.top_tags)
      setTotalArticles(res.data.total_articles)
    }).catch(e => console.error(e))
  }, [API_URL])

  // Поиск по Enter
  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      setPage(1)
      setActiveTag('')
      axios.get(`${API_URL}/api/articles`, { params: { search, sort, page: 1, limit: 20 } })
        .then(res => setArticles(res.data.articles))
        .catch(e => console.error(e))
    }
  }

  const handleTagClick = (tag) => {
    setActiveTag(activeTag === tag ? '' : tag)
    setPage(1)
    setSearch('')
  }

  return (
    <div className="app">
      {/* Хедер */}
      <div className="header">
        <h1>Habr <span>Article Explorer</span></h1>
        <div className="stats-bar">
          Статей в базе: <span>{totalArticles}</span>
        </div>
      </div>

      {/* Поиск */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Поиск по заголовку... (Enter для поиска)"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={handleSearch}
        />
      </div>

      <div className="main-layout">
        {/* Сайдбар */}
        <div className="sidebar">
          <h3>Сортировка</h3>
          <div className="sort-buttons">
            {[
              { value: 'date', label: '📅 По дате' },
              { value: 'rating', label: '⭐ По рейтингу' },
              { value: 'views', label: '👁 По просмотрам' },
              { value: 'comments', label: '💬 По комментариям' },
            ].map(s => (
              <button
                key={s.value}
                className={sort === s.value ? 'active' : ''}
                onClick={() => { setSort(s.value); setPage(1) }}
              >
                {s.label}
              </button>
            ))}
          </div>

          <h3>Топ тегов</h3>
          <div className="tag-list">
            {topTags.map(({ tag, count }) => (
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

        {/* Список статей */}
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              Загрузка...
            </div>
          ) : (
            <div className="articles-list">
              {articles.map(article => (
                <div key={article.id} className="article-card">
                  <h2>
                    <a href={article.link} target="_blank" rel="noreferrer">
                      {article.title || 'Без заголовка'}
                    </a>
                  </h2>
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
              ))}
            </div>
          )}

          {/* Пагинация */}
          <div className="pagination">
            <button onClick={() => setPage(p => p - 1)} disabled={page === 1}>
              ← Назад
            </button>
            <button className="active">{page}</button>
            <button onClick={() => setPage(p => p + 1)} disabled={articles.length < 20}>
              Вперёд → 
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App