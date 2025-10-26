-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    telegram VARCHAR(255) NOT NULL,
    color VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create news table
CREATE TABLE IF NOT EXISTS news (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    date VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default contacts
INSERT INTO contacts (name, role, telegram, color) VALUES
('Алексей Иванов', 'Основатель', 'alexivanov', 'from-purple-500 to-pink-500'),
('Мария Петрова', 'Менеджер проектов', 'mariapetrova', 'from-blue-500 to-cyan-500'),
('Дмитрий Сидоров', 'Технический директор', 'dmitrysid', 'from-violet-500 to-purple-500');

-- Insert default news
INSERT INTO news (title, date, description) VALUES
('Запуск нового проекта', '20 октября 2025', 'Мы рады объявить о старте нашего нового амбициозного проекта в сфере технологий'),
('Расширение команды', '15 октября 2025', 'К нашей команде присоединились новые талантливые специалисты'),
('Участие в конференции', '10 октября 2025', 'Выступили на международной конференции с докладом о цифровой трансформации');