-- Создаем таблицу глав для книг
-- Эта миграция безопасно создает таблицу только если она не существует

-- Создание таблицы chapters
CREATE TABLE IF NOT EXISTS chapters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    order_index INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Draft')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Создание индексов для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_chapters_book_id ON chapters(book_id);
CREATE INDEX IF NOT EXISTS idx_chapters_order ON chapters(book_id, order_index);
CREATE INDEX IF NOT EXISTS idx_chapters_status ON chapters(status);

-- Политики безопасности (RLS - Row Level Security)
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;

-- Политика для чтения глав: пользователи могут читать главы активных книг
CREATE POLICY IF NOT EXISTS "Users can read active chapters" ON chapters
    FOR SELECT 
    USING (
        status = 'Active' 
        AND EXISTS (
            SELECT 1 FROM books 
            WHERE books.id = chapters.book_id 
            AND books.status = 'Active'
        )
    );

-- Политика для создания глав: только авторы книг могут создавать главы
CREATE POLICY IF NOT EXISTS "Authors can create chapters" ON chapters
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM books 
            WHERE books.id = chapters.book_id 
            AND books.author_id = auth.uid()
        )
    );

-- Политика для обновления глав: только авторы книг могут обновлять главы
CREATE POLICY IF NOT EXISTS "Authors can update their chapters" ON chapters
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM books 
            WHERE books.id = chapters.book_id 
            AND books.author_id = auth.uid()
        )
    );

-- Политика для удаления глав: только авторы книг могут удалять главы
CREATE POLICY IF NOT EXISTS "Authors can delete their chapters" ON chapters
    FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM books 
            WHERE books.id = chapters.book_id 
            AND books.author_id = auth.uid()
        )
    );

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_chapters_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для обновления updated_at
DROP TRIGGER IF EXISTS update_chapters_updated_at_trigger ON chapters;
CREATE TRIGGER update_chapters_updated_at_trigger
    BEFORE UPDATE ON chapters
    FOR EACH ROW
    EXECUTE FUNCTION update_chapters_updated_at();

-- Добавляем комментарии для документации
COMMENT ON TABLE chapters IS 'Таблица глав книг для образовательной платформы';
COMMENT ON COLUMN chapters.id IS 'Уникальный идентификатор главы';
COMMENT ON COLUMN chapters.book_id IS 'Ссылка на книгу, к которой относится глава';
COMMENT ON COLUMN chapters.title IS 'Название главы';
COMMENT ON COLUMN chapters.content IS 'HTML содержимое главы';
COMMENT ON COLUMN chapters.order_index IS 'Порядковый номер главы в книге';
COMMENT ON COLUMN chapters.status IS 'Статус главы (Active, Inactive, Draft)';

-- Вставляем демонстрационные данные (только если таблица пустая)
INSERT INTO chapters (book_id, title, content, order_index, status, created_by)
SELECT 
    b.id,
    'Демонстрационная глава',
    '<h1>Демонстрационная глава</h1><p>Это пример содержимого главы для книги "' || b.title || '".</p><p>В реальной системе здесь будет находиться полноценный образовательный контент.</p>',
    1,
    'Active',
    b.author_id
FROM books b
WHERE NOT EXISTS (SELECT 1 FROM chapters WHERE book_id = b.id)
  AND b.status = 'Active'
LIMIT 5; -- Ограничиваем до 5 книг для демонстрации

-- Выводим информацию о созданной структуре
DO $$
DECLARE
    chapter_count INTEGER;
    book_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO chapter_count FROM chapters;
    SELECT COUNT(*) INTO book_count FROM books WHERE status = 'Active';
    
    RAISE NOTICE 'Таблица chapters успешно создана!';
    RAISE NOTICE 'Всего глав в системе: %', chapter_count;
    RAISE NOTICE 'Всего активных книг: %', book_count;
END $$; 