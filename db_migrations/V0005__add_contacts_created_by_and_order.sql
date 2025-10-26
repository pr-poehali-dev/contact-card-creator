-- Добавляем поле для отслеживания создателя контакта
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id);

-- Добавляем поле для сортировки контактов
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- Создаём индекс для быстрой сортировки
CREATE INDEX IF NOT EXISTS idx_contacts_order ON contacts(order_index);

-- Устанавливаем order_index для существующих контактов
UPDATE contacts SET order_index = id WHERE order_index = 0;