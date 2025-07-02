-- Create book_comments table for comments and suggestions system
CREATE TABLE book_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    section_id TEXT NOT NULL, -- Reference to specific section/chapter/page
    content TEXT NOT NULL,
    position_start INTEGER, -- Character position where comment starts
    position_end INTEGER, -- Character position where comment ends
    comment_type TEXT NOT NULL DEFAULT 'comment' CHECK (comment_type IN ('comment', 'suggestion', 'question', 'note')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'archived')),
    parent_id UUID REFERENCES book_comments(id) ON DELETE CASCADE, -- For threaded comments
    metadata JSONB DEFAULT '{}', -- Store additional comment data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_book_comments_book_id ON book_comments(book_id);
CREATE INDEX idx_book_comments_user_id ON book_comments(user_id);
CREATE INDEX idx_book_comments_section_id ON book_comments(section_id);
CREATE INDEX idx_book_comments_parent_id ON book_comments(parent_id);
CREATE INDEX idx_book_comments_status ON book_comments(status);
CREATE INDEX idx_book_comments_comment_type ON book_comments(comment_type);
CREATE INDEX idx_book_comments_created_at ON book_comments(created_at);

-- Enable RLS
ALTER TABLE book_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for book_comments
-- Users can view comments for books they have access to
CREATE POLICY "Users can view comments for accessible books" ON book_comments
    FOR SELECT USING (
        book_id IN (
            SELECT bc.book_id 
            FROM book_collaborators bc 
            WHERE bc.user_id = auth.uid()
        )
    );

-- Users can create comments for books they have access to
CREATE POLICY "Users can create comments" ON book_comments
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        book_id IN (
            SELECT bc.book_id 
            FROM book_collaborators bc 
            WHERE bc.user_id = auth.uid()
        )
    );

-- Users can update their own comments
CREATE POLICY "Users can update their own comments" ON book_comments
    FOR UPDATE USING (user_id = auth.uid());

-- Owners and editors can update any comments (for moderation)
CREATE POLICY "Owners and editors can moderate comments" ON book_comments
    FOR UPDATE USING (
        book_id IN (
            SELECT bc.book_id 
            FROM book_collaborators bc 
            WHERE bc.user_id = auth.uid() 
            AND bc.role IN ('owner', 'editor')
        )
    );

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments" ON book_comments
    FOR DELETE USING (user_id = auth.uid());

-- Owners can delete any comments
CREATE POLICY "Owners can delete any comments" ON book_comments
    FOR DELETE USING (
        book_id IN (
            SELECT bc.book_id 
            FROM book_collaborators bc 
            WHERE bc.user_id = auth.uid() 
            AND bc.role = 'owner'
        )
    );

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_book_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_book_comments_updated_at
    BEFORE UPDATE ON book_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_book_comments_updated_at();

-- Create function to get comment threads (parent + replies)
CREATE OR REPLACE FUNCTION get_comment_thread(comment_uuid UUID)
RETURNS TABLE (
    id UUID,
    book_id UUID,
    user_id UUID,
    section_id TEXT,
    content TEXT,
    position_start INTEGER,
    position_end INTEGER,
    comment_type TEXT,
    status TEXT,
    parent_id UUID,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    level INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE comment_tree AS (
        -- Base case: start with the root comment
        SELECT 
            c.id, c.book_id, c.user_id, c.section_id, c.content,
            c.position_start, c.position_end, c.comment_type, c.status,
            c.parent_id, c.metadata, c.created_at, c.updated_at,
            0 as level
        FROM book_comments c
        WHERE c.id = comment_uuid OR c.parent_id = comment_uuid

        UNION ALL

        -- Recursive case: find replies to comments in the tree
        SELECT 
            c.id, c.book_id, c.user_id, c.section_id, c.content,
            c.position_start, c.position_end, c.comment_type, c.status,
            c.parent_id, c.metadata, c.created_at, c.updated_at,
            ct.level + 1
        FROM book_comments c
        INNER JOIN comment_tree ct ON c.parent_id = ct.id
    )
    SELECT * FROM comment_tree ORDER BY created_at;
END;
$$ LANGUAGE plpgsql;