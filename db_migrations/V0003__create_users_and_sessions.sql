-- Создание таблицы пользователей
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('superadmin', 'editor')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы сессий
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  session_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание индексов для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

-- Вставка суперадмина по умолчанию (пароль: admin123)
INSERT INTO users (username, password_hash, role) 
VALUES ('admin', '$2b$10$rQZ5YJKvXqKp5fZxqL.fHOYxJxKvXqKp5fZxqL.fHOYxJxKvXqKp5e', 'superadmin')
ON CONFLICT (username) DO NOTHING;