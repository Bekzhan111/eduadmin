-- Migration: Create Collaboration System Tables
-- Description: Creates tables for book collaboration features including collaborators, invitations, editing sessions, presence, and comments

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. book_collaborators table - Store co-author relationships
CREATE TABLE book_collaborators (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    role TEXT CHECK (role IN ('owner', 'editor', 'reviewer', 'viewer')) NOT NULL DEFAULT 'viewer',
    permissions JSONB NOT NULL DEFAULT '{
        "canEdit": false,
        "canReview": false,
        "canInvite": false,
        "canDelete": false,
        "canPublish": false
    }',
    invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique collaboration per book-user pair
    UNIQUE(book_id, user_id)
);

-- 2. collaboration_invitations table - Manage invitation workflow
CREATE TABLE collaboration_invitations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
    inviter_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    invitee_email TEXT NOT NULL,
    invitee_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('editor', 'reviewer', 'viewer')) NOT NULL DEFAULT 'viewer',
    permissions JSONB NOT NULL DEFAULT '{
        "canEdit": false,
        "canReview": false,
        "canInvite": false,
        "canDelete": false,
        "canPublish": false
    }',
    status TEXT CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')) NOT NULL DEFAULT 'pending',
    message TEXT,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. editing_sessions table - Track who's editing what (section locking)
CREATE TABLE editing_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    section_id TEXT NOT NULL, -- page number, element id, or section identifier
    section_type TEXT CHECK (section_type IN ('page', 'element', 'chapter')) NOT NULL DEFAULT 'page',
    locked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    cursor_position JSONB DEFAULT '{}', -- Store cursor/selection position data
    
    -- Ensure unique lock per book-section pair
    UNIQUE(book_id, section_id)
);

-- 4. user_presence table - Real-time presence tracking
CREATE TABLE user_presence (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_online BOOLEAN DEFAULT true,
    current_section TEXT, -- current page/section being viewed
    metadata JSONB DEFAULT '{}', -- additional presence data like viewport, cursor position
    
    -- Ensure unique presence per book-user pair
    UNIQUE(book_id, user_id)
);

-- 5. book_comments table - Comments and suggestions system
CREATE TABLE book_comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    section_id TEXT NOT NULL, -- page number, element id, or section identifier
    content TEXT NOT NULL,
    position_start INTEGER, -- start position for text selection
    position_end INTEGER, -- end position for text selection
    comment_type TEXT CHECK (comment_type IN ('comment', 'suggestion', 'question', 'approval')) NOT NULL DEFAULT 'comment',
    status TEXT CHECK (status IN ('open', 'resolved', 'closed')) NOT NULL DEFAULT 'open',
    parent_id UUID REFERENCES book_comments(id) ON DELETE CASCADE, -- for threaded comments/replies
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_book_collaborators_book_id ON book_collaborators(book_id);
CREATE INDEX idx_book_collaborators_user_id ON book_collaborators(user_id);
CREATE INDEX idx_book_collaborators_role ON book_collaborators(role);

CREATE INDEX idx_collaboration_invitations_book_id ON collaboration_invitations(book_id);
CREATE INDEX idx_collaboration_invitations_invitee_email ON collaboration_invitations(invitee_email);
CREATE INDEX idx_collaboration_invitations_invitee_id ON collaboration_invitations(invitee_id);
CREATE INDEX idx_collaboration_invitations_status ON collaboration_invitations(status);
CREATE INDEX idx_collaboration_invitations_expires_at ON collaboration_invitations(expires_at);

CREATE INDEX idx_editing_sessions_book_id ON editing_sessions(book_id);
CREATE INDEX idx_editing_sessions_user_id ON editing_sessions(user_id);
CREATE INDEX idx_editing_sessions_last_activity ON editing_sessions(last_activity);

CREATE INDEX idx_user_presence_book_id ON user_presence(book_id);
CREATE INDEX idx_user_presence_user_id ON user_presence(user_id);
CREATE INDEX idx_user_presence_is_online ON user_presence(is_online);
CREATE INDEX idx_user_presence_last_seen ON user_presence(last_seen);

CREATE INDEX idx_book_comments_book_id ON book_comments(book_id);
CREATE INDEX idx_book_comments_user_id ON book_comments(user_id);
CREATE INDEX idx_book_comments_section_id ON book_comments(section_id);
CREATE INDEX idx_book_comments_status ON book_comments(status);
CREATE INDEX idx_book_comments_parent_id ON book_comments(parent_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_book_collaborators_updated_at BEFORE UPDATE ON book_collaborators
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collaboration_invitations_updated_at BEFORE UPDATE ON collaboration_invitations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_book_comments_updated_at BEFORE UPDATE ON book_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to automatically update user presence last_seen
CREATE OR REPLACE FUNCTION update_user_presence_last_seen()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_seen = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_presence_last_seen_trigger BEFORE UPDATE ON user_presence
    FOR EACH ROW EXECUTE FUNCTION update_user_presence_last_seen();

-- Cleanup functions for expired data
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS void AS $$
BEGIN
    UPDATE collaboration_invitations 
    SET status = 'expired' 
    WHERE status = 'pending' 
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cleanup_stale_editing_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM editing_sessions 
    WHERE last_activity < NOW() - INTERVAL '30 minutes';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cleanup_offline_presence()
RETURNS void AS $$
BEGIN
    UPDATE user_presence 
    SET is_online = false 
    WHERE last_seen < NOW() - INTERVAL '5 minutes'
    AND is_online = true;
END;
$$ LANGUAGE plpgsql;

-- Function to set role permissions based on role type
CREATE OR REPLACE FUNCTION set_role_permissions(role_name TEXT)
RETURNS JSONB AS $$
BEGIN
    CASE role_name
        WHEN 'owner' THEN
            RETURN '{
                "canEdit": true,
                "canReview": true,
                "canInvite": true,
                "canDelete": true,
                "canPublish": true
            }';
        WHEN 'editor' THEN
            RETURN '{
                "canEdit": true,
                "canReview": true,
                "canInvite": false,
                "canDelete": false,
                "canPublish": false
            }';
        WHEN 'reviewer' THEN
            RETURN '{
                "canEdit": false,
                "canReview": true,
                "canInvite": false,
                "canDelete": false,
                "canPublish": false
            }';
        WHEN 'viewer' THEN
            RETURN '{
                "canEdit": false,
                "canReview": false,
                "canInvite": false,
                "canDelete": false,
                "canPublish": false
            }';
        ELSE
            RETURN '{
                "canEdit": false,
                "canReview": false,
                "canInvite": false,
                "canDelete": false,
                "canPublish": false
            }';
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically set permissions when role is updated
CREATE OR REPLACE FUNCTION update_role_permissions()
RETURNS TRIGGER AS $$
BEGIN
    NEW.permissions = set_role_permissions(NEW.role);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_book_collaborators_permissions BEFORE INSERT OR UPDATE OF role ON book_collaborators
    FOR EACH ROW EXECUTE FUNCTION update_role_permissions();

CREATE TRIGGER update_collaboration_invitations_permissions BEFORE INSERT OR UPDATE OF role ON collaboration_invitations
    FOR EACH ROW EXECUTE FUNCTION update_role_permissions();

-- Comment: Tables created successfully. Next step is to set up Row Level Security policies.