-- Create editing_sessions table to track who's editing what (section locking)
CREATE TABLE editing_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    section_id TEXT NOT NULL, -- Could be chapter_id, page_id, or any identifiable section
    section_type TEXT NOT NULL CHECK (section_type IN ('chapter', 'page', 'section', 'block')),
    locked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    cursor_position JSONB, -- Store cursor/selection position data
    
    UNIQUE(book_id, section_id)
);

-- Create indexes for better performance
CREATE INDEX idx_editing_sessions_book_id ON editing_sessions(book_id);
CREATE INDEX idx_editing_sessions_user_id ON editing_sessions(user_id);
CREATE INDEX idx_editing_sessions_section_id ON editing_sessions(section_id);
CREATE INDEX idx_editing_sessions_last_activity ON editing_sessions(last_activity);

-- Enable RLS
ALTER TABLE editing_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for editing_sessions
-- Users can view editing sessions for books they have access to
CREATE POLICY "Users can view editing sessions for accessible books" ON editing_sessions
    FOR SELECT USING (
        book_id IN (
            SELECT bc.book_id 
            FROM book_collaborators bc 
            WHERE bc.user_id = auth.uid()
        )
    );

-- Users can create editing sessions for books they can edit
CREATE POLICY "Users can create editing sessions" ON editing_sessions
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        book_id IN (
            SELECT bc.book_id 
            FROM book_collaborators bc 
            WHERE bc.user_id = auth.uid() 
            AND bc.role IN ('owner', 'editor')
        )
    );

-- Users can update their own editing sessions
CREATE POLICY "Users can update their own editing sessions" ON editing_sessions
    FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own editing sessions
CREATE POLICY "Users can delete their own editing sessions" ON editing_sessions
    FOR DELETE USING (user_id = auth.uid());

-- Owners can manage all editing sessions for their books
CREATE POLICY "Owners can manage all editing sessions" ON editing_sessions
    FOR ALL USING (
        book_id IN (
            SELECT bc.book_id 
            FROM book_collaborators bc 
            WHERE bc.user_id = auth.uid() 
            AND bc.role = 'owner'
        )
    );

-- Create function to automatically clean up old editing sessions
CREATE OR REPLACE FUNCTION cleanup_old_editing_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM editing_sessions 
    WHERE last_activity < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update last_activity on session updates
CREATE OR REPLACE FUNCTION update_editing_session_activity()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_activity = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_editing_session_activity
    BEFORE UPDATE ON editing_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_editing_session_activity();