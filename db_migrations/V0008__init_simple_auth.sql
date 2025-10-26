-- Таблица контактов
CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    telegram VARCHAR(255) NOT NULL,
    color VARCHAR(100) DEFAULT 'from-purple-500 to-pink-500',
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Таблица настроек (для хранения пароля и других настроек)
CREATE TABLE IF NOT EXISTS settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Таблица сессий для защиты от брутфорса
CREATE TABLE IF NOT EXISTS login_attempts (
    ip_address VARCHAR(50) PRIMARY KEY,
    attempts INTEGER DEFAULT 0,
    last_attempt TIMESTAMP DEFAULT NOW(),
    blocked_until TIMESTAMP
);

-- Устанавливаем дефолтный пароль 123123 (bcrypt hash)
INSERT INTO settings (key, value) 
VALUES ('admin_password', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIvAprzZ3i')
ON CONFLICT (key) DO NOTHING;

-- Добавляем тестовые контакты
INSERT INTO contacts (name, role, telegram, color, order_index) VALUES
('Валера', 'Founder & CEO', 'valera_ceo', 'from-purple-500 to-pink-500', 0),
('Антон', 'CTO', 'anton_tech', 'from-blue-500 to-cyan-500', 1),
('Мария', 'Head of Design', 'maria_design', 'from-pink-500 to-rose-500', 2)
ON CONFLICT DO NOTHING;