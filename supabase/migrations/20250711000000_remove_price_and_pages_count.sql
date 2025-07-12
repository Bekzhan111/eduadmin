-- Migration: Remove price and pages_count from books table
-- Date: 2025-07-11
-- Description: Remove price and pages_count columns from books table as they are no longer needed

-- Remove the price column from books table
ALTER TABLE books DROP COLUMN IF EXISTS price;

-- Remove the pages_count column from books table  
ALTER TABLE books DROP COLUMN IF EXISTS pages_count;

-- Add a comment about the changes
COMMENT ON TABLE books IS 'Books table - updated to remove price and pages_count fields (removed 2025-07-11)';

-- Migration complete message
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully. Price and pages_count columns removed from books table.';
  RAISE NOTICE 'Frontend and backend code should be updated to not reference these fields.';
END $$;