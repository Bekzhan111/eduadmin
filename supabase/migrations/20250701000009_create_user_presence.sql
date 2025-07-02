-- Create user_presence table for real-time presence tracking
CREATE TABLE user_presence (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_online BOOLEAN DEFAULT true,
    current_section TEXT, -- What section they're currently viewing/editing
    metadata JSONB DEFAULT '{}', -- Store additional presence data like browser info, etc.
    
    UNIQUE(book_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX idx_user_presence_book_id ON user_presence(book_id);
CREATE INDEX idx_user_presence_user_id ON user_presence(user_id);
CREATE INDEX idx_user_presence_is_online ON user_presence(is_online);
CREATE INDEX idx_user_presence_last_seen ON user_presence(last_seen);

-- Enable RLS
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_presence
-- Users can view presence for books they have access to
CREATE POLICY "Users can view presence for accessible books" ON user_presence
    FOR SELECT USING (
        book_id IN (
            SELECT bc.book_id 
            FROM book_collaborators bc 
            WHERE bc.user_id = auth.uid()
        )
    );

-- Users can manage their own presence
CREATE POLICY "Users can manage their own presence" ON user_presence
    FOR ALL USING (user_id = auth.uid());

-- Create function to automatically mark users as offline after inactivity
CREATE OR REPLACE FUNCTION update_user_presence_offline()
RETURNS void AS $$
BEGIN
    UPDATE user_presence 
    SET is_online = false 
    WHERE last_seen < NOW() - INTERVAL '5 minutes' 
    AND is_online = true;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update last_seen on presence updates
CREATE OR REPLACE FUNCTION update_user_presence_last_seen()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_seen = NOW();
    IF NEW.is_online IS NULL THEN
        NEW.is_online = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_presence_last_seen
    BEFORE UPDATE ON user_presence
    FOR EACH ROW
    EXECUTE FUNCTION update_user_presence_last_seen();

-- Create trigger to set last_seen on insert
CREATE TRIGGER trigger_insert_user_presence_last_seen
    BEFORE INSERT ON user_presence
    FOR EACH ROW
    EXECUTE FUNCTION update_user_presence_last_seen();