CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    telegram VARCHAR(255) NOT NULL,
    color VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS news (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    date VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO contacts (name, role, telegram, color) VALUES
('Алексей Иванов', 'Основатель', 'alexivanov', 'from-purple-500 to-pink-500'),
('Мария Петрова', 'Менеджер проектов', 'mariapetrova', 'from-blue-500 to-cyan-500'),
('Дмитрий Сидоров', 'Технический директор', 'dmitrysid', 'from-violet-500 to-purple-500');

INSERT INTO news (title, description, date) VALUES
('Запуск нового проекта', 'Мы рады объявить о старте нашего нового амбициозного проекта в сфере технологий', '20 октября 2025'),
('Расширение команды', 'К нашей команде присоединились новые талантливые специалисты', '15 октября 2025'),
('Участие в конференции', 'Выступили на международной конференции с докладом о цифровой трансформации', '10 октября 2025');