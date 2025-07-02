-- Migration: Fix Books Table RLS Policies for Collaboration Access
-- Description: Updates books table RLS policies to allow collaborators to read books they have been invited to work on
-- Issue: Collaborators cannot access books they're invited to edit because books table RLS policies are too restrictive

-- Drop existing restrictive books table policies if they exist
DROP POLICY IF EXISTS "Users can only view their own books" ON books;
DROP POLICY IF EXISTS "Authors can view their own books" ON books;
DROP POLICY IF EXISTS "Users can view own books" ON books;
DROP POLICY IF EXISTS "Books are viewable by owner" ON books;
DROP POLICY IF EXISTS "Enable read access for owners" ON books;

-- Ensure RLS is enabled on books table
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- Create updated RLS policy for books SELECT that includes collaboration access
CREATE POLICY "Users can view books they own or collaborate on" ON books
    FOR SELECT USING (
        -- User is the book owner (original logic)
        user_id = auth.uid()
        OR
        -- User is a collaborator with access to this book (new logic)
        id IN (
            SELECT book_id 
            FROM book_collaborators 
            WHERE user_id = auth.uid()
        )
    );

-- Create policy for INSERT (only authenticated users can create books)
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

-- Create an index to improve performance of collaboration queries
CREATE INDEX IF NOT EXISTS idx_book_collaborators_user_book ON book_collaborators(user_id, book_id);

-- Grant necessary permissions
GRANT SELECT ON books TO authenticated;
GRANT INSERT ON books TO authenticated;
GRANT UPDATE ON books TO authenticated;
GRANT DELETE ON books TO authenticated;

-- Comment: This migration fixes the collaboration access issue by allowing collaborators to read and edit books they have been invited to work on.