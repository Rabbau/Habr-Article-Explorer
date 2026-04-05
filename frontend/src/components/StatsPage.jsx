import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const ORANGE = '#ef7f1a'
const COLORS = ['#ef7f1a', '#f59e3f', '#f7b865', '#fad08a', '#fce3b5']

function StatsPage({ stats }) {
  if (!stats) return null

  const { top_tags, top_authors, total_articles } = stats

  return (
    <div className="stats-page">
      <div className="stats-grid">

        {/* Карточка - всего статей */}
        <div className="stat-card stat-card--highlight">
          <div className="stat-card__number">{total_articles}</div>
          <div className="stat-card__label">статей в базе</div>
        </div>

        {/* Топ тегов - горизонтальный бар чарт */}
        <div className="stat-card stat-card--wide">
          <h3 className="stat-card__title">Топ 15 тегов</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={top_tags.slice(0, 15)}
              layout="vertical"
              margin={{ left: 20, right: 30 }}
            >
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis
                type="category"
                dataKey="tag"
                width={160}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(value) => [`${value} статей`, 'Количество']}
                contentStyle={{ borderRadius: 8, border: '1px solid #eee' }}
              />
              <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                {top_tags.slice(0, 15).map((_, i) => (
                  <Cell
                    key={i}
                    fill={COLORS[Math.min(i, COLORS.length - 1)]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Топ авторов */}
        <div className="stat-card stat-card--wide">
          <h3 className="stat-card__title">Топ 10 авторов</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={top_authors}
              layout="vertical"
              margin={{ left: 20, right: 30 }}
            >
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis
                type="category"
                dataKey="author"
                width={140}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(value) => [`${value} статей`, 'Количество']}
                contentStyle={{ borderRadius: 8, border: '1px solid #eee' }}
              />
              <Bar dataKey="count" fill={ORANGE} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Список топ тегов с прогресс-баром */}
        <div className="stat-card">
          <h3 className="stat-card__title">Теги по популярности</h3>
          <div className="tag-progress-list">
            {top_tags.slice(0, 10).map(({ tag, count }, i) => (
              <div key={tag} className="tag-progress-item">
                <div className="tag-progress-header">
                  <span className="tag-progress-name">{tag}</span>
                  <span className="tag-progress-count">{count}</span>
                </div>
                <div className="tag-progress-bar">
                  <div
                    className="tag-progress-fill"
                    style={{
                      width: `${(count / top_tags[0].count) * 100}%`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Список топ авторов */}
        <div className="stat-card">
          <h3 className="stat-card__title">Авторы по количеству статей</h3>
          <div className="authors-list">
            {top_authors.map(({ author, count }, i) => (
              <div key={author} className="author-item">
                <span className="author-rank">#{i + 1}</span>
                <span className="author-name">{author}</span>
                <span className="author-count">{count} ст.</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

export default StatsPage