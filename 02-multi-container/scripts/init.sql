CREATE TABLE IF NOT EXISTS tasks (
  id        SERIAL PRIMARY KEY,
  title     VARCHAR(255) NOT NULL,
  done      BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO tasks (title) VALUES
  ('Learn Docker'),
  ('Build TaskFlow'),
  ('Ship to production');
