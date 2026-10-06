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

async function startServer(retries = 5, delay = 2000) {
  while (retries > 0) {
    try {
      await db.connect();
      console.log('✅ PostgreSQL connected');
      const server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 API running on port ${PORT}`);
      });

      // Graceful Shutdown Handler (Drains connections on Docker stop / SIGTERM)
      const handleShutdown = async (signal) => {
        console.log(`\n🛑 Received ${signal}. Initiating graceful shutdown...`);
        server.close(async () => {
          console.log('🔌 HTTP server stopped accepting new requests.');
          try {
            await db.end();
            console.log('📦 PostgreSQL connection pool closed.');
            await cache.quit();
            console.log('⚡ Redis client disconnected.');
            process.exit(0);
          } catch (err) {
            console.error('❌ Error during graceful shutdown cleanup:', err.message);
            process.exit(1);
          }
        });

        // Force shutdown if requests do not finish draining within 10 seconds
        setTimeout(() => {
          console.error('⚠️ Forcing process exit after shutdown timeout');
          process.exit(1);
        }, 10000).unref();
      };

      process.on('SIGTERM', () => handleShutdown('SIGTERM'));
      process.on('SIGINT', () => handleShutdown('SIGINT'));
      return;
    } catch (err) {
      retries -= 1;
      console.log(`⏳ Waiting for PostgreSQL to initialize... (${retries} retries remaining)`);
      if (retries === 0) {
        console.error('❌ PostgreSQL connection failed:', err.message);
        process.exit(1);
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

startServer();
