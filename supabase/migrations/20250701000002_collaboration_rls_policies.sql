-- Migration: Row Level Security Policies for Collaboration System
-- Description: Sets up RLS policies to ensure users can only access collaboration data for books they have permission to view

-- Enable RLS on all collaboration tables
ALTER TABLE book_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE editing_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_comments ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user has access to a book (either as owner or collaborator)
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

-- Helper function to check if user has specific permission for a book
CREATE OR REPLACE FUNCTION user_has_book_permission(book_uuid UUID, user_uuid UUID, permission TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_permissions JSONB;
BEGIN
    -- Check if user is the book owner (owners have all permissions)
    IF EXISTS (
        SELECT 1 FROM books 
        WHERE id = book_uuid AND user_id = user_uuid
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- Get user's permissions as collaborator
    SELECT permissions INTO user_permissions
    FROM book_collaborators 
    WHERE book_id = book_uuid AND user_id = user_uuid;
    
    -- If user is not a collaborator, return false
    IF user_permissions IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check specific permission
    RETURN COALESCE((user_permissions ->> permission)::BOOLEAN, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- BOOK_COLLABORATORS TABLE POLICIES

-- Policy: Users can view collaborators for books they have access to
CREATE POLICY "Users can view book collaborators they have access to"
    ON book_collaborators FOR SELECT
    USING (user_has_book_access(book_id, auth.uid()));

-- Policy: Book owners can insert new collaborators
CREATE POLICY "Book owners can add collaborators"
    ON book_collaborators FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM books 
            WHERE id = book_id AND user_id = auth.uid()
        )
    );

-- Policy: Book owners and users with invite permission can update collaborator roles
CREATE POLICY "Authorized users can update collaborators"
    ON book_collaborators FOR UPDATE
    USING (
        -- User is book owner OR user has invite permission
        EXISTS (SELECT 1 FROM books WHERE id = book_id AND user_id = auth.uid())
        OR user_has_book_permission(book_id, auth.uid(), 'canInvite')
    );

-- Policy: Book owners can delete collaborators, collaborators can remove themselves
CREATE POLICY "Book owners can remove collaborators, users can remove themselves"
    ON book_collaborators FOR DELETE
    USING (
        -- User is book owner OR user is removing themselves
        EXISTS (SELECT 1 FROM books WHERE id = book_id AND user_id = auth.uid())
        OR user_id = auth.uid()
    );

-- COLLABORATION_INVITATIONS TABLE POLICIES

-- Policy: Users can view invitations they sent or received
CREATE POLICY "Users can view their sent or received invitations"
    ON collaboration_invitations FOR SELECT
    USING (
        inviter_id = auth.uid() 
        OR invitee_id = auth.uid()
        OR invitee_email = auth.email()
        OR user_has_book_access(book_id, auth.uid())
    );

-- Policy: Book owners and users with invite permission can create invitations
CREATE POLICY "Authorized users can create invitations"
    ON collaboration_invitations FOR INSERT
    WITH CHECK (
        EXISTS (SELECT 1 FROM books WHERE id = book_id AND user_id = auth.uid())
        OR user_has_book_permission(book_id, auth.uid(), 'canInvite')
    );

-- Policy: Invitees can update invitation status, inviters can cancel
CREATE POLICY "Invitees can respond to invitations, inviters can manage them"
    ON collaboration_invitations FOR UPDATE
    USING (
        inviter_id = auth.uid() 
        OR invitee_id = auth.uid()
        OR invitee_email = auth.email()
    );

-- Policy: Inviters can delete their invitations
CREATE POLICY "Inviters can delete their invitations"
    ON collaboration_invitations FOR DELETE
    USING (inviter_id = auth.uid());

-- EDITING_SESSIONS TABLE POLICIES

-- Policy: Users can view editing sessions for books they have access to
CREATE POLICY "Users can view editing sessions for accessible books"
    ON editing_sessions FOR SELECT
    USING (user_has_book_access(book_id, auth.uid()));

-- Policy: Users with edit permission can create editing sessions
CREATE POLICY "Users with edit permission can create editing sessions"
    ON editing_sessions FOR INSERT
    WITH CHECK (
        user_id = auth.uid() 
        AND (
            EXISTS (SELECT 1 FROM books WHERE id = book_id AND user_id = auth.uid())
            OR user_has_book_permission(book_id, auth.uid(), 'canEdit')
        )
    );

-- Policy: Users can update their own editing sessions
CREATE POLICY "Users can update their own editing sessions"
    ON editing_sessions FOR UPDATE
    USING (user_id = auth.uid());

-- Policy: Users can delete their own editing sessions, book owners can delete any
CREATE POLICY "Users can delete own sessions, owners can delete any"
    ON editing_sessions FOR DELETE
    USING (
        user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM books WHERE id = book_id AND user_id = auth.uid())
    );

-- USER_PRESENCE TABLE POLICIES

-- Policy: Users can view presence for books they have access to
CREATE POLICY "Users can view presence for accessible books"
    ON user_presence FOR SELECT
    USING (user_has_book_access(book_id, auth.uid()));

-- Policy: Users can insert their own presence
CREATE POLICY "Users can insert their own presence"
    ON user_presence FOR INSERT
    WITH CHECK (
        user_id = auth.uid() 
        AND user_has_book_access(book_id, auth.uid())
    );

-- Policy: Users can update their own presence
CREATE POLICY "Users can update their own presence"
    ON user_presence FOR UPDATE
    USING (user_id = auth.uid());

-- Policy: Users can delete their own presence, book owners can delete any
CREATE POLICY "Users can delete own presence, owners can delete any"
    ON user_presence FOR DELETE
    USING (
        user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM books WHERE id = book_id AND user_id = auth.uid())
    );

-- BOOK_COMMENTS TABLE POLICIES

-- Policy: Users can view comments for books they have access to
CREATE POLICY "Users can view comments for accessible books"
    ON book_comments FOR SELECT
    USING (user_has_book_access(book_id, auth.uid()));

-- Policy: Users with review permission can create comments
CREATE POLICY "Users with review permission can create comments"
    ON book_comments FOR INSERT
    WITH CHECK (
        user_id = auth.uid() 
        AND (
            EXISTS (SELECT 1 FROM books WHERE id = book_id AND user_id = auth.uid())
            OR user_has_book_permission(book_id, auth.uid(), 'canReview')
        )
    );

-- Policy: Users can update their own comments
CREATE POLICY "Users can update their own comments"
    ON book_comments FOR UPDATE
    USING (user_id = auth.uid());

-- Policy: Users can delete their own comments, book owners can delete any
CREATE POLICY "Users can delete own comments, owners can delete any"
    ON book_comments FOR DELETE
    USING (
        user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM books WHERE id = book_id AND user_id = auth.uid())
    );

-- Additional security functions

-- Function to automatically create owner collaborator record when book is created
CREATE OR REPLACE FUNCTION create_owner_collaborator()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO book_collaborators (book_id, user_id, role, invited_by, joined_at)
    VALUES (NEW.id, NEW.user_id, 'owner', NEW.user_id, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create owner collaborator record
CREATE TRIGGER create_owner_collaborator_trigger
    AFTER INSERT ON books
    FOR EACH ROW
    EXECUTE FUNCTION create_owner_collaborator();

-- Function to handle invitation acceptance
CREATE OR REPLACE FUNCTION accept_collaboration_invitation(invitation_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    invitation_record collaboration_invitations%ROWTYPE;
BEGIN
    -- Get invitation details
    SELECT * INTO invitation_record
    FROM collaboration_invitations
    WHERE id = invitation_id
    AND (invitee_id = auth.uid() OR invitee_email = auth.email())
    AND status = 'pending'
    AND expires_at > NOW();
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Create collaborator record
    INSERT INTO book_collaborators (book_id, user_id, role, permissions, invited_by)
    VALUES (
        invitation_record.book_id,
        COALESCE(invitation_record.invitee_id, auth.uid()),
        invitation_record.role,
        invitation_record.permissions,
        invitation_record.inviter_id
    );
    
    -- Update invitation status
    UPDATE collaboration_invitations
    SET status = 'accepted', updated_at = NOW()
    WHERE id = invitation_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject invitation
CREATE OR REPLACE FUNCTION reject_collaboration_invitation(invitation_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE collaboration_invitations
    SET status = 'rejected', updated_at = NOW()
    WHERE id = invitation_id
    AND (invitee_id = auth.uid() OR invitee_email = auth.email())
    AND status = 'pending';
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment: RLS policies created successfully. Users can now only access collaboration data for books they have permission to view.