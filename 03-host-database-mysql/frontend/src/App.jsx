import { useState, useEffect } from 'react'

const API_URL = '/api'

export default function App() {
  const [tasks, setTasks] = useState([])
  const [title, setTitle] = useState('')
  const [source, setSource] = useState('')
  const [dbStatus, setDbStatus] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHealth()
    fetchTasks()
  }, [])

  async function fetchHealth() {
    try {
      const res = await fetch(`${API_URL}/health`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setDbStatus(data)
    } catch (err) {
      console.error('Failed to fetch health status:', err)
      setDbStatus({ api_unreachable: true })
    }
  }

  async function fetchTasks() {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/tasks`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setTasks(data.tasks || [])
      setSource(data.source)
    } catch (err) {
      console.error('Failed to fetch tasks:', err)
    } finally {
      setLoading(false)
    }
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
    fetchHealth()
  }

  async function toggleTask(id) {
    await fetch(`${API_URL}/tasks/${id}`, { method: 'PATCH' })
    fetchTasks()
  }

  const isApiUnreachable = dbStatus?.api_unreachable
  const isConnected = dbStatus?.database_connected

  return (
    <div style={{ maxWidth: 680, margin: '40px auto', fontFamily: 'system-ui, -apple-system, sans-serif', padding: '0 20px', color: '#1f2937' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <h1 style={{ margin: 0, fontSize: 28 }}>🐳 TaskFlow 🚀 [CI/CD Live Auto-Deploy Test V.1]</h1>
        <span style={{
          background: '#dbeafe',
          color: '#1e40af',
          fontSize: 12,
          fontWeight: 700,
          padding: '4px 8px',
          borderRadius: 6
        }}>
          TRACK 3: HOST MYSQL BRIDGE
        </span>
      </div>

      <p style={{ color: '#4b5563', fontSize: 14, margin: '0 0 20px 0' }}>
        Containerized App connecting directly to <strong>Host-Native MySQL</strong> via <code>host.docker.internal:3306</code>.
      </p>

      {/* Database Diagnostic Card */}
      <div style={{
        background: isConnected ? '#ecfdf5' : isApiUnreachable ? '#fef2f2' : '#fffbeb',
        border: `1px solid ${isConnected ? '#a7f3d0' : isApiUnreachable ? '#fecaca' : '#fde68a'}`,
        borderRadius: 8,
        padding: 16,
        marginBottom: 24,
        fontSize: 13
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <strong>🔌 Database Target:</strong>
          <span style={{
            background: isConnected ? '#10b981' : isApiUnreachable ? '#ef4444' : '#f59e0b',
            color: '#fff',
            padding: '2px 8px',
            borderRadius: 12,
            fontWeight: 600,
            fontSize: 11
          }}>
            {isConnected
              ? 'CONNECTED TO HOST MYSQL'
              : isApiUnreachable
              ? 'BACKEND API UNREACHABLE (CHECK PORT 4001)'
              : 'FALLBACK MODE (NEEDS PERMISSIONS)'}
          </span>
        </div>
        <div style={{ color: '#374151' }}>
          <div>Host: <code>{dbStatus?.database_host || 'host.docker.internal'}:{dbStatus?.database_port || 3306}</code></div>
          <div>User: <code>{dbStatus?.database_user || 'root'}</code> | Database: <code>{dbStatus?.database_name || 'simple_app'}</code></div>
          <div>Active Data Source: <strong>{source || (isApiUnreachable ? 'none (API unreachable)' : 'loading...')}</strong></div>
        </div>

        {!isConnected && !isApiUnreachable && (
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #fde68a', color: '#92400e', fontSize: 12 }}>
            💡 <strong>Quick Fix for Host MySQL:</strong> Ensure database <code>{dbStatus?.database_name || 'simple_app'}</code> exists and grant <code>root@'%'</code> remote access in MySQL.
          </div>
        )}

        {isApiUnreachable && (
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #fecaca', color: '#b91c1c', fontSize: 12 }}>
            ⚠️ <strong>Backend Unreachable:</strong> Ensure backend container is running on port 4001 (e.g. <code>docker compose up -d</code>).
          </div>
        )}
      </div>

      {/* Task Creation Form */}
      <form onSubmit={addTask} style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a new task to Host MySQL..."
          style={{ flex: 1, padding: '10px 14px', fontSize: 15, borderRadius: 6, border: '1px solid #d1d5db', outline: 'none' }}
        />
        <button
          type="submit"
          style={{
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            padding: '10px 20px',
            fontSize: 15,
            fontWeight: 600,
            borderRadius: 6,
            cursor: 'pointer'
          }}
        >
          Add Task
        </button>
      </form>

      {/* Task List */}
      {loading ? (
        <p style={{ color: '#6b7280' }}>Loading tasks...</p>
      ) : tasks.length === 0 ? (
        <p style={{ color: '#9ca3af' }}>No tasks found. Add your first task above!</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {tasks.map((task) => (
            <li
              key={task.id}
              onClick={() => toggleTask(task.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: 6,
                marginBottom: 8,
                cursor: 'pointer',
                transition: 'background 0.15s ease'
              }}
            >
              <input
                type="checkbox"
                checked={task.done}
                onChange={() => {}}
                style={{ cursor: 'pointer', width: 16, height: 16 }}
              />
              <span style={{
                flex: 1,
                fontSize: 15,
                textDecoration: task.done ? 'line-through' : 'none',
                color: task.done ? '#9ca3af' : '#111827'
              }}>
                {task.title}
              </span>
              <span style={{ fontSize: 11, color: '#9ca3af' }}>
                {task.done ? '✓ Done' : 'Pending'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
