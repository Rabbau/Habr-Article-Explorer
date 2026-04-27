import { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'

const PRIORITIES = [
  { value: 'neutral', label: 'Нейтрально' },
  { value: 'important', label: 'Важно' },
  { value: 'urgent', label: 'Срочно' },
]

function TodoPage({ user, onLogin, token, apiUrl }) {
  const [tasks, setTasks] = useState([])
  const [search, setSearch] = useState('')
  const [sortMode, setSortMode] = useState('all')
  const [title, setTitle] = useState('')
  const [dueAt, setDueAt] = useState('')
  const [priority, setPriority] = useState('neutral')
  const [loading, setLoading] = useState(false)

  const canManage = Boolean(user && token)

  const getAuthHeaders = useCallback(() => {
    if (!token) return {}
    return { Authorization: `Bearer ${token}` }
  }, [token])

  const fetchTodos = useCallback(async () => {
    if (!canManage) return

    setLoading(true)
    try {
      const res = await axios.get(`${apiUrl}/todos`, {
        headers: getAuthHeaders(),
      })
      setTasks(Array.isArray(res?.data?.todos) ? res.data.todos : [])
    } catch (e) {
      console.error(e)
      setTasks([])
    } finally {
      setLoading(false)
    }
  }, [apiUrl, canManage, getAuthHeaders])

  useEffect(() => {
    fetchTodos()
  }, [fetchTodos])

  const filteredAndSorted = useMemo(() => {
    const source = canManage ? tasks : []
    const q = search.trim().toLowerCase()
    let list = source.filter((task) => task.title.toLowerCase().includes(q))

    if (sortMode === 'alpha') {
      list = [...list].sort((a, b) => a.title.localeCompare(b.title, 'ru'))
    }

    if (sortMode === 'created') {
      list = [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    }

    if (sortMode === 'due') {
      list = [...list].sort((a, b) => {
        if (!a.dueAt && !b.dueAt) return 0
        if (!a.dueAt) return 1
        if (!b.dueAt) return -1
        return new Date(a.dueAt) - new Date(b.dueAt)
      })
    }

    return list
  }, [tasks, search, sortMode, canManage])

  const activeTasks = filteredAndSorted.filter((task) => !task.done)
  const doneTasks = filteredAndSorted.filter((task) => task.done)

  const addTask = async () => {
    if (!canManage || !title.trim()) return

    try {
      const res = await axios.post(
        `${apiUrl}/todos`,
        {
          title: title.trim(),
          due_at: dueAt || null,
          priority,
        },
        { headers: getAuthHeaders() },
      )

      const todo = res?.data?.todo
      if (todo) {
        setTasks((prev) => [todo, ...prev])
      }
      setTitle('')
      setDueAt('')
      setPriority('neutral')
    } catch (e) {
      console.error(e)
    }
  }

  const updateTask = async (id, patch) => {
    if (!canManage) return

    try {
      const payload = { ...patch }
      if ('dueAt' in payload) {
        payload.due_at = payload.dueAt
        delete payload.dueAt
      }
      const res = await axios.patch(`${apiUrl}/todos/${id}`, payload, {
        headers: getAuthHeaders(),
      })
      const todo = res?.data?.todo
      if (!todo) return
      setTasks((prev) => prev.map((task) => (task.id === id ? todo : task)))
    } catch (e) {
      console.error(e)
    }
  }

  const removeTask = async (id) => {
    if (!canManage) return

    try {
      await axios.delete(`${apiUrl}/todos/${id}`, {
        headers: getAuthHeaders(),
      })
      setTasks((prev) => prev.filter((task) => task.id !== id))
    } catch (e) {
      console.error(e)
    }
  }

  const TaskCard = ({ task }) => (
    <div className={`todo-card ${task.done ? 'done' : ''}`}>
      <button
        type="button"
        className={`todo-check ${task.done ? 'checked' : ''}`}
        onClick={() => updateTask(task.id, { done: !task.done })}
        disabled={!canManage}
      >
        {task.done ? '✓' : ''}
      </button>

      <div className="todo-card-main">
        <div className="todo-card-title">{task.title}</div>
        <div className="todo-card-meta">
          {task.dueAt ? `Срок: ${new Date(task.dueAt).toLocaleString('ru-RU')}` : 'Нет срока'}
        </div>
      </div>

      <span className={`todo-priority todo-priority--${task.priority}`}>
        {PRIORITIES.find((p) => p.value === task.priority)?.label || 'Нейтрально'}
      </span>

      <button
        type="button"
        className={`todo-icon-btn ${task.starred ? 'active' : ''}`}
        onClick={() => updateTask(task.id, { starred: !task.starred })}
        disabled={!canManage}
        title="Избранная задача"
      >
        ★
      </button>

      <button
        type="button"
        className="todo-icon-btn"
        onClick={() => removeTask(task.id)}
        disabled={!canManage}
        title="Удалить задачу"
      >
        ×
      </button>
    </div>
  )

  return (
    <div className="todo-page">
      <div className="todo-head">
        <h2>Мои задачи</h2>
        {user && <div className="todo-user">Привет, {user.name || user.email}</div>}
      </div>

      {!canManage && (
        <div className="todo-auth-banner">
          Авторизуйтесь через Google, чтобы управлять задачами
          <button type="button" className="btn-login" onClick={onLogin}>
            Войти через Google
          </button>
        </div>
      )}

      <div className="todo-toolbar">
        <input
          type="text"
          className="todo-search"
          placeholder="Поиск задач..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="todo-sort-buttons">
          <button className={sortMode === 'all' ? 'active' : ''} onClick={() => setSortMode('all')}>Все</button>
          <button className={sortMode === 'alpha' ? 'active' : ''} onClick={() => setSortMode('alpha')}>По алфавиту</button>
          <button className={sortMode === 'created' ? 'active' : ''} onClick={() => setSortMode('created')}>По дате создания</button>
          <button className={sortMode === 'due' ? 'active' : ''} onClick={() => setSortMode('due')}>По сроку</button>
        </div>
      </div>

      <div className="todo-add-row">
        <input
          type="text"
          placeholder="Что нужно сделать..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={!canManage}
        />
        <input
          type="datetime-local"
          value={dueAt}
          onChange={(e) => setDueAt(e.target.value)}
          disabled={!canManage}
        />
        <select value={priority} onChange={(e) => setPriority(e.target.value)} disabled={!canManage}>
          {PRIORITIES.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
        <button type="button" className="todo-add-btn" onClick={addTask} disabled={!canManage || !title.trim()}>
          Добавить
        </button>
      </div>

      {loading && <div className="todo-empty">Загрузка задач...</div>}

      <div className="todo-section">
        <h3>Активные</h3>
        {activeTasks.length === 0 ? (
          <div className="todo-empty">Нет активных задач</div>
        ) : (
          activeTasks.map((task) => <TaskCard key={task.id} task={task} />)
        )}
      </div>

      <div className="todo-section">
        <h3>Сделанное</h3>
        {doneTasks.length === 0 ? (
          <div className="todo-empty">Нет завершённых задач</div>
        ) : (
          doneTasks.map((task) => <TaskCard key={task.id} task={task} />)
        )}
      </div>
    </div>
  )
}

export default TodoPage
