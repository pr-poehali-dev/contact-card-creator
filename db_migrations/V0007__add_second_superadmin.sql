-- Добавляем второго суперадмина с логином noggano и паролем 123123
-- Хеш для пароля 123123: $2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIvAprzZ3i

INSERT INTO users (username, password_hash, role, created_at)
VALUES (
    'noggano', 
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIvAprzZ3i',
    'superadmin',
    NOW()
)
ON CONFLICT (username) DO NOTHING;