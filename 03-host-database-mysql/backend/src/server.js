// ==============================================================================
// 🐳 TRACK 3: CONTAINERIZED APP CONNECTING TO HOST DATABASE (MYSQL)
// ==============================================================================
// Architecture Pattern: "Host Database Bridge"
// In many enterprise scenarios, the database is NOT running inside Docker.
// Instead, it runs natively on the developer's host OS (or on an external server).
//
// 🔑 Critical Docker Concept:
// - Inside a Docker container, 'localhost' refers to the CONTAINER itself.
// - To connect to services on the HOST machine (Windows/macOS), use:
//   host: 'host.docker.internal'
// - On Linux hosts, Docker Compose requires:
//   extra_hosts: ["host.docker.internal:host-gateway"]
// ==============================================================================

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 4001;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// ------------------------------------------------------------------------------
// ⚙️ HOST DATABASE CONFIGURATION
// ------------------------------------------------------------------------------
const DB_CONFIG = {
  host: process.env.MYSQL_HOST || 'host.docker.internal',
  port: parseInt(process.env.MYSQL_PORT || '3306', 10),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'root',
  database: process.env.MYSQL_DATABASE || 'simple_app',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 5000 // 5 seconds connection timeout
};

console.log('--------------------------------------------------------------------');
console.log('🔌 DATABASE BRIDGE INITIALIZATION:');
console.log(`   Host:     ${DB_CONFIG.host}`);
console.log(`   Port:     ${DB_CONFIG.port}`);
console.log(`   User:     ${DB_CONFIG.user}`);
console.log(`   Database: ${DB_CONFIG.database}`);
console.log('--------------------------------------------------------------------');

let pool = null;
let dbConnected = false;
let lastDbError = null;
let activeTableName = 'todos'; // 'todos' (default in simple_app) or 'tasks'
let isTodosSchema = true;

// Fallback in-memory task store (used if host database is temporarily offline or initializing)
let fallbackTasks = [
  { id: 1, title: 'Understand host.docker.internal DNS resolver', done: true, created_at: new Date().toISOString() },
  { id: 2, title: 'Grant remote user permissions: root@%', done: false, created_at: new Date().toISOString() },
  { id: 3, title: 'Connect Docker container to native Host MySQL', done: false, created_at: new Date().toISOString() }
];

// ------------------------------------------------------------------------------
// 🔄 DATABASE CONNECTION & SCHEMA INITIALIZATION
// ------------------------------------------------------------------------------
async function initDatabase() {
  try {
    // 1. First test connection to MySQL server
    const serverConn = await mysql.createConnection({
      host: DB_CONFIG.host,
      port: DB_CONFIG.port,
      user: DB_CONFIG.user,
      password: DB_CONFIG.password,
      connectTimeout: 5000
    });

    console.log(`✅ Successfully connected to Host MySQL on ${DB_CONFIG.host}:${DB_CONFIG.port}!`);

    // 2. Ensure database exists
    await serverConn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_CONFIG.database}\`;`);
    await serverConn.end();

    // 3. Establish connection pool to the database
    pool = mysql.createPool(DB_CONFIG);

    // 4. Inspect existing tables in the database (supports simple_app.todos or taskflow.tasks)
    const [tables] = await pool.query('SHOW TABLES;');
    const tableNames = tables.map((t) => Object.values(t)[0]);

    if (tableNames.includes('todos')) {
      activeTableName = 'todos';
      isTodosSchema = true;
      console.log(`📂 Found existing table 'todos' in '${DB_CONFIG.database}'.`);
    } else if (tableNames.includes('tasks')) {
      activeTableName = 'tasks';
      isTodosSchema = false;
      console.log(`📂 Found existing table 'tasks' in '${DB_CONFIG.database}'.`);
    } else {
      activeTableName = 'todos';
      isTodosSchema = true;
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS todos (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          completed TINYINT(1) DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;
      await pool.query(createTableQuery);
      console.log(`🌱 Created table 'todos' in '${DB_CONFIG.database}'.`);

      // Seed initial data if empty
      const [rows] = await pool.query('SELECT COUNT(*) AS count FROM todos;');
      if (rows[0].count === 0) {
        await pool.query(`
          INSERT INTO todos (title, completed) VALUES
          ('Docker Setup Complete', 1),
          ('Connected to Host MySQL simple_app', 0);
        `);
      }
    }

    dbConnected = true;
    lastDbError = null;
    console.log(`🚀 Host MySQL '${DB_CONFIG.database}.${activeTableName}' is ready and accepting queries.`);
  } catch (err) {
    dbConnected = false;
    lastDbError = {
      code: err.code || 'UNKNOWN_ERROR',
      message: err.message,
      host: DB_CONFIG.host,
      port: DB_CONFIG.port,
      user: DB_CONFIG.user
    };

    console.error('⚠️ [HOST MYSQL CONNECTION NOTICE]:');
    console.error(`   Error Code: ${err.code}`);
    console.error(`   Message:    ${err.message}`);
    console.error('💡 TROUBLESHOOTING GUIDE FOR HOST DATABASE:');
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      console.error('   1. Is MySQL running on your host machine on port 3306?');
      console.error('   2. Is MySQL configured to listen on all interfaces (bind-address = 0.0.0.0)?');
      console.error('   3. If running on Linux, verify extra_hosts: ["host.docker.internal:host-gateway"].');
    } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error(`   1. Access denied for '${DB_CONFIG.user}'@'%' with provided password.`);
      console.error('   2. Inside MySQL, grant access to remote Docker subnet:');
      console.error("      CREATE USER IF NOT EXISTS 'root'@'%' IDENTIFIED BY 'your_password';");
      console.error("      GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;");
      console.error("      FLUSH PRIVILEGES;");
    }
  }
}

// Initial DB connection attempt
initDatabase();

// ------------------------------------------------------------------------------
// 🚀 REST API ENDPOINTS
// ------------------------------------------------------------------------------

// Health check endpoint with rich diagnostics
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mode: 'host-database-bridge',
    database_target: 'Host MySQL (Native)',
    database_host: DB_CONFIG.host,
    database_port: DB_CONFIG.port,
    database_user: DB_CONFIG.user,
    database_name: DB_CONFIG.database,
    database_connected: dbConnected,
    database_error: lastDbError,
    time: new Date().toISOString()
  });
});

// GET /api/tasks: Fetch all tasks
app.get('/api/tasks', async (req, res) => {
  if (dbConnected && pool) {
    try {
      const selectQuery = isTodosSchema
        ? `SELECT id, title, completed AS done, created_at FROM \`${activeTableName}\` ORDER BY id DESC;`
        : `SELECT id, title, done, created_at FROM \`${activeTableName}\` ORDER BY id DESC;`;
      const [rows] = await pool.query(selectQuery);
      const formattedTasks = rows.map((r) => ({ ...r, done: Boolean(r.done) }));
      return res.json({
        source: 'host-mysql',
        host: DB_CONFIG.host,
        database: DB_CONFIG.database,
        table: activeTableName,
        tasks: formattedTasks
      });
    } catch (err) {
      console.error('Query error against host MySQL:', err.message);
      // Fallback to in-memory store
    }
  }

  // Graceful fallback if host DB is offline or credentials need setting
  res.json({
    source: 'fallback-memory',
    host: DB_CONFIG.host,
    notice: 'Host MySQL offline or access denied. Showing fallback data.',
    db_status: lastDbError ? lastDbError.code : 'DISCONNECTED',
    tasks: fallbackTasks
  });
});

// POST /api/tasks: Create a new task
app.post('/api/tasks', async (req, res) => {
  const { title } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }

  if (dbConnected && pool) {
    try {
      const insertQuery = isTodosSchema
        ? `INSERT INTO \`${activeTableName}\` (title, completed) VALUES (?, 0);`
        : `INSERT INTO \`${activeTableName}\` (title, done) VALUES (?, 0);`;
      const [result] = await pool.query(insertQuery, [title.trim()]);

      const selectQuery = isTodosSchema
        ? `SELECT id, title, completed AS done, created_at FROM \`${activeTableName}\` WHERE id = ?;`
        : `SELECT id, title, done, created_at FROM \`${activeTableName}\` WHERE id = ?;`;
      const [newRow] = await pool.query(selectQuery, [result.insertId]);

      return res.status(201).json({
        ...newRow[0],
        done: Boolean(newRow[0].done),
        source: 'host-mysql'
      });
    } catch (err) {
      console.error('Insert error against host MySQL:', err.message);
    }
  }

  // Fallback in-memory insertion
  const newTask = {
    id: Date.now(),
    title: title.trim(),
    done: false,
    created_at: new Date().toISOString()
  };
  fallbackTasks.unshift(newTask);
  res.status(201).json({ ...newTask, source: 'fallback-memory' });
});

// PATCH /api/tasks/:id: Toggle task completion
app.patch('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;

  if (dbConnected && pool) {
    try {
      const updateQuery = isTodosSchema
        ? `UPDATE \`${activeTableName}\` SET completed = CASE WHEN completed = 1 THEN 0 ELSE 1 END WHERE id = ?;`
        : `UPDATE \`${activeTableName}\` SET done = CASE WHEN done = 1 THEN 0 ELSE 1 END WHERE id = ?;`;
      await pool.query(updateQuery, [id]);

      const selectQuery = isTodosSchema
        ? `SELECT id, title, completed AS done, created_at FROM \`${activeTableName}\` WHERE id = ?;`
        : `SELECT id, title, done, created_at FROM \`${activeTableName}\` WHERE id = ?;`;
      const [rows] = await pool.query(selectQuery, [id]);

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }
      return res.json({
        ...rows[0],
        done: Boolean(rows[0].done),
        source: 'host-mysql'
      });
    } catch (err) {
      console.error('Update error against host MySQL:', err.message);
    }
  }

  // Fallback in-memory toggle
  const task = fallbackTasks.find((t) => String(t.id) === String(id));
  if (task) {
    task.done = !task.done;
    return res.json({ ...task, source: 'fallback-memory' });
  }
  res.status(404).json({ error: 'Task not found' });
});

// ------------------------------------------------------------------------------
// 🌐 STATIC FRONTEND HOSTING (SPA SERVING)
// ------------------------------------------------------------------------------
const publicPath = path.join(__dirname, '../public');

if (fs.existsSync(publicPath)) {
  console.log(`📦 Serving static React frontend from: ${publicPath}`);
  app.use(express.static(publicPath));

  app.get('*', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send(`
      <h2>🚀 TaskFlow Track 3 (Host MySQL Bridge) is Running!</h2>
      <p>Target Database: Host Machine MySQL (<code>${DB_CONFIG.host}:${DB_CONFIG.port}</code>)</p>
      <p>Database Status: <strong>${dbConnected ? 'CONNECTED' : 'DISCONNECTED / FALLBACK'}</strong></p>
      <ul>
        <li><a href="/api/health">/api/health</a></li>
        <li><a href="/api/tasks">/api/tasks</a></li>
      </ul>
    `);
  });
}

// ------------------------------------------------------------------------------
// 🛑 GRACEFUL SHUTDOWN (SIGTERM / SIGINT)
// ------------------------------------------------------------------------------
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 TaskFlow Host DB Bridge running on port ${PORT}`);
});

const handleShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Draining active connections...`);
  server.close(async () => {
    console.log('🔌 HTTP server stopped accepting new requests.');
    if (pool) {
      await pool.end();
      console.log('📦 Host MySQL connection pool closed safely.');
    }
    process.exit(0);
  });

  setTimeout(() => {
    console.error('⚠️ Forcing process exit after shutdown timeout');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
