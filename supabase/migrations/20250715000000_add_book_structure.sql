-- Add structure column to books table
ALTER TABLE books ADD COLUMN IF NOT EXISTS structure JSONB;
COMMENT ON COLUMN books.structure IS 'Book content structure with chapters and sections'; 
