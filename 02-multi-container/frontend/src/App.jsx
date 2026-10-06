import { useState, useEffect } from 'react'

const API_URL = '/api'

export default function App() {
  const [tasks, setTasks]   = useState([])
  const [title, setTitle]   = useState('')
  const [source, setSource] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTasks()
  }, [])

  async function fetchTasks() {
    setLoading(true)
    const res  = await fetch(`${API_URL}/tasks`)
    const data = await res.json()
    setTasks(data.tasks)
    setSource(data.source)
    setLoading(false)
  }

  async function addTask(e) {
    e.preventDefault()
    if (!title.trim()) return

    await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    })

    setTitle('')
    fetchTasks()
  }

  async function toggleTask(id) {
    await fetch(`${API_URL}/tasks/${id}`, { method: 'PATCH' })
    fetchTasks()
  }

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', fontFamily: 'sans-serif', padding: '0 20px' }}>
      <h1>🐳 TaskFlow</h1>
      <p style={{ color: '#888' }}>Running inside Docker. Data source: <strong>{source}</strong></p>

      <form onSubmit={addTask} style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a task..."
          style={{ flex: 1, padding: '8px 12px', fontSize: 16, borderRadius: 6, border: '1px solid #ddd' }}
        />
        <button type="submit" style={{ padding: '8px 16px', fontSize: 16, borderRadius: 6, cursor: 'pointer' }}>
          Add
        </button>
      </form>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {tasks.map((task) => (
            <li
              key={task.id}
              onClick={() => toggleTask(task.id)}
              style={{
                padding: '12px 16px',
                marginBottom: 8,
                borderRadius: 8,
                background: '#f9f9f9',
                cursor: 'pointer',
                textDecoration: task.done ? 'line-through' : 'none',
                color: task.done ? '#aaa' : '#000',
                border: '1px solid #eee',
              }}
            >
              {task.done ? '✅' : '⬜'} {task.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
