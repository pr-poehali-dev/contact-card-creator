-- Обновляем пароль админа
-- Используем bcrypt хеш для пароля: admin123
UPDATE users 
SET password_hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5ztRg4z8W7JKu'
WHERE username = 'admin' AND role = 'superadmin';