# Исправление проблем с Supabase Storage

## Проблема
`StorageApiError: new row violates row-level security policy`

## Решение

### 1. Применить SQL скрипт в Supabase

1. Откройте Supabase Dashboard
2. Перейдите в раздел **SQL Editor**
3. Выполните содержимое файла `fix-storage-policies.sql`

### 2. Проверить настройки

После выполнения скрипта проверьте:

1. **Storage > Buckets** - должен быть bucket `media`
2. **Storage > Policies** - должны быть 4 политики:
   - Anyone can view media files
   - Authenticated users can upload media files  
   - Authenticated users can update media files
   - Authenticated users can delete media files

### 3. Настройки bucket

Bucket `media` должен иметь:
- **Public**: true
- **File size limit**: 50MB
- **Allowed MIME types**: изображения, видео, аудио

### 4. Тестирование

После применения исправлений:
1. Перезапустите приложение
2. Попробуйте загрузить изображение через редактор книги
3. Проверьте консоль на наличие ошибок

## Что исправлено

1. **Упрощены политики RLS** - убраны сложные проверки владельца
2. **Убрано автоматическое создание bucket** - предполагается, что bucket уже существует
3. **Улучшена обработка ошибок** - специальное сообщение для ошибок RLS
4. **Обновлены типы файлов** - добавлены все поддерживаемые форматы

## Альтернативное решение

Если проблемы продолжаются, можно временно отключить RLS для storage.objects:

```sql
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
```

**⚠️ Внимание**: Это снизит безопасность, используйте только для тестирования! 
