-- Create collaboration tables for book editor
-- This migration creates the foundation for the collaboration system

-- Book collaborators table - stores co-author relationships
CREATE TABLE IF NOT EXISTS book_collaborators (
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

-- Collaboration invitations table - manages invitation workflow
CREATE TABLE IF NOT EXISTS collaboration_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invitee_email TEXT NOT NULL,
    invitee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('editor', 'reviewer', 'viewer')),
    permissions JSONB DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
    message TEXT,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Editing sessions table - tracks who's editing what (section locking)
CREATE TABLE IF NOT EXISTS editing_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    section_id TEXT NOT NULL,
    section_type TEXT NOT NULL CHECK (section_type IN ('chapter', 'page', 'content')),
    locked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    cursor_position JSONB DEFAULT '{}',
    UNIQUE(book_id, section_id)
);

-- User presence table - real-time presence tracking
CREATE TABLE IF NOT EXISTS user_presence (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_online BOOLEAN DEFAULT TRUE,
    current_section TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(book_id, user_id)
);

-- Book comments table - comments and suggestions system
CREATE TABLE IF NOT EXISTS book_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    section_id TEXT NOT NULL,
    content TEXT NOT NULL,
    position_start INTEGER,
    position_end INTEGER,
    comment_type TEXT NOT NULL DEFAULT 'comment' CHECK (comment_type IN ('comment', 'suggestion', 'question')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'deleted')),
    parent_id UUID REFERENCES book_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_book_collaborators_book_id ON book_collaborators(book_id);
CREATE INDEX IF NOT EXISTS idx_book_collaborators_user_id ON book_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_invitations_book_id ON collaboration_invitations(book_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_invitations_invitee_email ON collaboration_invitations(invitee_email);
CREATE INDEX IF NOT EXISTS idx_collaboration_invitations_status ON collaboration_invitations(status);
CREATE INDEX IF NOT EXISTS idx_editing_sessions_book_id ON editing_sessions(book_id);
CREATE INDEX IF NOT EXISTS idx_editing_sessions_user_id ON editing_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_book_id ON user_presence(book_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_user_id ON user_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_book_comments_book_id ON book_comments(book_id);
CREATE INDEX IF NOT EXISTS idx_book_comments_section_id ON book_comments(section_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_collaboration_invitations_updated_at 
    BEFORE UPDATE ON collaboration_invitations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_presence_updated_at 
    BEFORE UPDATE ON user_presence 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_book_comments_updated_at 
    BEFORE UPDATE ON book_comments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();