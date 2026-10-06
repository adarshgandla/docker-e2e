// ==============================================================================
// 🐳 ALL-IN-ONE SINGLE CONTAINER SERVER (EXPRESS + SQLITE + REACT SPA HOST)
// ==============================================================================
// In a Single-Container architecture:
// 1. One process (Node.js) serves both the REST API (/api/*) and compiled frontend.
// 2. Data is persisted using an embedded, file-based SQLite database (/data/tasks.db).
// 3. Mounting a single Docker volume to /data ensures 100% data durability across restarts!
// ==============================================================================

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 4000;

// Enable CORS and JSON body parsing
app.use(cors());
app.use(express.json());

// ------------------------------------------------------------------------------
// 💾 EMBEDDED SQLITE DATABASE INITIALIZATION
// ------------------------------------------------------------------------------
// In Docker, /data is designated as a persistent VOLUME.
// If running locally on host without Docker, fallback to a local ./data folder.
const DB_DIR = process.env.DB_DIR || path.join(__dirname, '../data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, 'tasks.db');
console.log(`📁 Connecting to SQLite database at: ${DB_PATH}`);

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Failed to connect to SQLite:', err.message);
    process.exit(1);
  }
  console.log('✅ SQLite connected successfully');
});

// Auto-create schema and seed default tasks if table is empty
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      done INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.get('SELECT COUNT(*) AS count FROM tasks', (err, row) => {
    if (!err && row && row.count === 0) {
      console.log('🌱 Seeding initial tasks into SQLite...');
      const stmt = db.prepare('INSERT INTO tasks (title, done) VALUES (?, ?)');
      stmt.run('Learn Docker Single Container Pattern', 1);
      stmt.run('Understand Embedded SQLite Persistence', 0);
      stmt.run('Deploy All-in-One Container to Production', 0);
      stmt.finalize();
    }
  });
});

// ------------------------------------------------------------------------------
// 🚀 REST API ENDPOINTS
// ------------------------------------------------------------------------------

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mode: 'single-container',
    database: 'sqlite3',
    time: new Date().toISOString()
  });
});

// GET /api/tasks: Fetch all tasks
app.get('/api/tasks', (req, res) => {
  db.all('SELECT id, title, done, created_at FROM tasks ORDER BY id DESC', [], (err, rows) => {
    if (err) {
      console.error('Database query error:', err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
    // Format done boolean for frontend compatibility
    const tasks = rows.map((r) => ({ ...r, done: Boolean(r.done) }));
    res.json({ source: 'sqlite', tasks });
  });
});

// POST /api/tasks: Create a new task
app.post('/api/tasks', (req, res) => {
  const { title } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const query = 'INSERT INTO tasks (title, done) VALUES (?, 0)';
  db.run(query, [title.trim()], function (err) {
    if (err) {
      console.error('Insert error:', err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }

    db.get('SELECT id, title, done, created_at FROM tasks WHERE id = ?', [this.lastID], (getErr, row) => {
      if (getErr) {
        return res.status(201).json({ id: this.lastID, title: title.trim(), done: false });
      }
      res.status(201).json({ ...row, done: Boolean(row.done) });
    });
  });
});

// PATCH /api/tasks/:id: Toggle task completion status
app.patch('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  db.run('UPDATE tasks SET done = CASE WHEN done = 1 THEN 0 ELSE 1 END WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Internal server error' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    db.get('SELECT id, title, done, created_at FROM tasks WHERE id = ?', [id], (getErr, row) => {
      res.json({ ...row, done: Boolean(row.done) });
    });
  });
});

// ------------------------------------------------------------------------------
// 🌐 STATIC FRONTEND HOSTING (SPA SERVING)
// ------------------------------------------------------------------------------
// In production Docker image, compiled React build files reside in /app/public
const publicPath = path.join(__dirname, '../public');

if (fs.existsSync(publicPath)) {
  console.log(`📦 Serving static React frontend from: ${publicPath}`);
  app.use(express.static(publicPath));

  // SPA Wildcard Route: Forward any non-API route to index.html so React Router works
  app.get('*', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send(`
      <h2>🚀 TaskFlow Single-Container API is Running!</h2>
      <p>Frontend static build directory not found. Access API endpoints:</p>
      <ul>
        <li><a href="/api/health">/api/health</a></li>
        <li><a href="/api/tasks">/api/tasks</a></li>
      </ul>
    `);
  });
}

// ------------------------------------------------------------------------------
// 🛑 GRACEFUL SHUTDOWN HANDLER (SIGTERM / SIGINT)
// ------------------------------------------------------------------------------
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 TaskFlow Single-Container running on port ${PORT}`);
});

const handleShutdown = (signal) => {
  console.log(`\n🛑 Received ${signal}. Draining active connections...`);
  server.close(() => {
    console.log('🔌 HTTP server stopped accepting new requests.');
    db.close((err) => {
      if (err) {
        console.error('❌ Error closing SQLite:', err.message);
        process.exit(1);
      }
      console.log('📦 SQLite database connection closed safely.');
      process.exit(0);
    });
  });

  // Fallback force kill after 10s timeout
  setTimeout(() => {
    console.error('⚠️ Forcing process exit after shutdown timeout');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
