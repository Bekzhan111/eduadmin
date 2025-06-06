-- Migration: Add book views tracking
-- This migration creates a table to track book views by users

-- Create book_views table
CREATE TABLE IF NOT EXISTS book_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    
    -- Add indexes for performance
    INDEX idx_book_views_book_id (book_id),
    INDEX idx_book_views_user_id (user_id),
    INDEX idx_book_views_viewed_at (viewed_at),
    INDEX idx_book_views_session_id (session_id)
);

-- Enable RLS
ALTER TABLE book_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for book_views
-- Allow authors to see views for their books
CREATE POLICY "Authors can view their book views" ON book_views
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM books 
            WHERE books.id = book_views.book_id 
            AND books.author_id = auth.uid()
        )
    );

-- Allow super admins to see all views
CREATE POLICY "Super admins can view all book views" ON book_views
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'super_admin'
        )
    );

-- Allow anyone to insert views (for tracking)
CREATE POLICY "Anyone can track book views" ON book_views
    FOR INSERT 
    WITH CHECK (true);

-- Add view_count column to books table
ALTER TABLE books ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Create function to increment view count
CREATE OR REPLACE FUNCTION increment_book_view_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE books 
    SET view_count = view_count + 1 
    WHERE id = NEW.book_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically increment view count
DROP TRIGGER IF EXISTS trigger_increment_book_view_count ON book_views;
CREATE TRIGGER trigger_increment_book_view_count
    AFTER INSERT ON book_views
    FOR EACH ROW
    EXECUTE FUNCTION increment_book_view_count();

-- Create function to get unique viewers count for a book
CREATE OR REPLACE FUNCTION get_unique_viewers_count(book_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(DISTINCT COALESCE(user_id, session_id))
        FROM book_views 
        WHERE book_id = book_uuid
    );
END;
$$ LANGUAGE plpgsql;

-- Create function to get book statistics including views
CREATE OR REPLACE FUNCTION get_book_stats(book_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_views', COUNT(*),
        'unique_viewers', COUNT(DISTINCT COALESCE(user_id, session_id)),
        'registered_viewers', COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL),
        'anonymous_viewers', COUNT(DISTINCT session_id) FILTER (WHERE user_id IS NULL),
        'views_today', COUNT(*) FILTER (WHERE viewed_at >= CURRENT_DATE),
        'views_this_week', COUNT(*) FILTER (WHERE viewed_at >= CURRENT_DATE - INTERVAL '7 days'),
        'views_this_month', COUNT(*) FILTER (WHERE viewed_at >= CURRENT_DATE - INTERVAL '30 days')
    ) INTO result
    FROM book_views 
    WHERE book_id = book_uuid;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Update existing books to have view_count = 0
UPDATE books SET view_count = 0 WHERE view_count IS NULL; 