const express = require('express');
const { Pool }  = require('pg');
const { createClient } = require('redis');
const cors    = require('cors');

const app  = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const cache = createClient({ url: process.env.REDIS_URL });

cache.on('error', (err) => console.error('Redis error:', err));
cache.connect().then(() => console.log('✅ Redis connected'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.get('/api/tasks', async (req, res) => {
  try {
    const cached = await cache.get('tasks');
    if (cached) {
      return res.json({ source: 'cache', tasks: JSON.parse(cached) });
    }

    const result = await db.query('SELECT * FROM tasks ORDER BY created_at DESC');
    const tasks  = result.rows;
    await cache.setEx('tasks', 30, JSON.stringify(tasks));

    res.json({ source: 'database', tasks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/tasks', async (req, res) => {
  const { title } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }

  try {
    const result = await db.query(
      'INSERT INTO tasks (title) VALUES ($1) RETURNING *',
      [title.trim()]
    );
    await cache.del('tasks');

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.patch('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(
      'UPDATE tasks SET done = NOT done WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    await cache.del('tasks');
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

db.connect()
  .then(() => {
    console.log('✅ PostgreSQL connected');
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 API running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ PostgreSQL connection failed:', err.message);
    process.exit(1);
  });
