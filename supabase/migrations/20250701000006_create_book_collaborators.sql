-- Create book_collaborators table to manage co-author relationships
CREATE TABLE book_collaborators (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'reviewer', 'viewer')),
    permissions JSONB DEFAULT '{}',
    invited_by UUID REFERENCES auth.users(id),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(book_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX idx_book_collaborators_book_id ON book_collaborators(book_id);
CREATE INDEX idx_book_collaborators_user_id ON book_collaborators(user_id);
CREATE INDEX idx_book_collaborators_role ON book_collaborators(role);

-- Enable RLS
ALTER TABLE book_collaborators ENABLE ROW LEVEL SECURITY;

-- RLS Policies for book_collaborators
-- Users can view collaborators for books they have access to
CREATE POLICY "Users can view book collaborators" ON book_collaborators
    FOR SELECT USING (
        book_id IN (
            SELECT bc.book_id 
            FROM book_collaborators bc 
            WHERE bc.user_id = auth.uid()
        )
    );

-- Only owners and editors can manage collaborators
CREATE POLICY "Owners and editors can manage collaborators" ON book_collaborators
    FOR ALL USING (
        book_id IN (
            SELECT bc.book_id 
            FROM book_collaborators bc 
            WHERE bc.user_id = auth.uid() 
            AND bc.role IN ('owner', 'editor')
        )
    );

-- Users can insert themselves as collaborators (for invitation acceptance)
CREATE POLICY "Users can join as collaborators" ON book_collaborators
    FOR INSERT WITH CHECK (user_id = auth.uid());