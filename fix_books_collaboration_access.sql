-- Migration: Fix Books Table RLS Policies for Collaboration Access
-- Description: Updates books table RLS policies to allow collaborators to read books they have been invited to work on

-- Drop existing restrictive books table policies if they exist
DROP POLICY IF EXISTS "Users can only view their own books" ON books;
DROP POLICY IF EXISTS "Authors can view their own books" ON books;
DROP POLICY IF EXISTS "Users can view own books" ON books;

-- Create updated RLS policy for books SELECT that includes collaboration access
CREATE POLICY "Users can view books they own or collaborate on" ON books
    FOR SELECT USING (
        -- User is the book owner
        user_id = auth.uid()
        OR
        -- User is a collaborator with access to this book
        id IN (
            SELECT book_id 
            FROM book_collaborators 
            WHERE user_id = auth.uid()
        )
    );

-- Create policy for INSERT (only book owners can create books)
CREATE POLICY "Authenticated users can create books" ON books
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Create policy for UPDATE (owners and collaborators with edit permission can update)
CREATE POLICY "Owners and editors can update books" ON books
    FOR UPDATE USING (
        -- User is the book owner
        user_id = auth.uid()
        OR
        -- User is a collaborator with editor role or higher
        id IN (
            SELECT book_id 
            FROM book_collaborators 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'editor')
        )
    );

-- Create policy for DELETE (only book owners can delete)
CREATE POLICY "Only owners can delete books" ON books
    FOR DELETE USING (user_id = auth.uid());

-- Ensure RLS is enabled on books table
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- Create an index to improve performance of collaboration queries
CREATE INDEX IF NOT EXISTS idx_book_collaborators_user_book ON book_collaborators(user_id, book_id);

-- Update the existing user_has_book_access function to be more robust
CREATE OR REPLACE FUNCTION user_has_book_access(book_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user is the book owner
    IF EXISTS (
        SELECT 1 FROM books 
        WHERE id = book_uuid AND user_id = user_uuid
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- Check if user is a collaborator with access
    IF EXISTS (
        SELECT 1 FROM book_collaborators 
        WHERE book_id = book_uuid AND user_id = user_uuid
    ) THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment: This migration fixes the collaboration access issue by allowing collaborators to read books they have been invited to work on.