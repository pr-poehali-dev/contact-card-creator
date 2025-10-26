-- Обновляем хеш пароля для суперадмина (пароль: admin123)
-- Используем правильный bcrypt хеш
UPDATE users 
SET password_hash = '$2b$10$N9qo8uLOickgx2ZMRZoMye7FvYX5dOv5BQjN5pT5i.WqQ7YOXDUD2'
WHERE username = 'admin' AND role = 'superadmin';