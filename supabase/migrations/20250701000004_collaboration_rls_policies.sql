-- Row Level Security policies for collaboration tables
-- These policies ensure users can only access collaboration data for books they have permission for

-- Enable RLS on all collaboration tables
ALTER TABLE book_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE editing_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_comments ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user has access to a book
CREATE OR REPLACE FUNCTION user_has_book_access(book_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user is the book owner (from books table)
    IF EXISTS (
        SELECT 1 FROM books 
        WHERE id = book_uuid AND user_id = user_uuid
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- Check if user is a collaborator
    IF EXISTS (
        SELECT 1 FROM book_collaborators 
        WHERE book_id = book_uuid AND user_id = user_uuid
    ) THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user can manage collaborators (owner or editor)
CREATE OR REPLACE FUNCTION user_can_manage_collaborators(book_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user is the book owner
    IF EXISTS (
        SELECT 1 FROM books 
        WHERE id = book_uuid AND user_id = user_uuid
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- Check if user is an editor
    IF EXISTS (
        SELECT 1 FROM book_collaborators 
        WHERE book_id = book_uuid AND user_id = user_uuid AND role IN ('owner', 'editor')
    ) THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Book collaborators policies
CREATE POLICY "Users can view collaborators for books they have access to"
    ON book_collaborators FOR SELECT
    USING (user_has_book_access(book_id, auth.uid()));

CREATE POLICY "Book owners and editors can manage collaborators"
    ON book_collaborators FOR ALL
    USING (user_can_manage_collaborators(book_id, auth.uid()));

-- Collaboration invitations policies
CREATE POLICY "Users can view invitations for books they can manage"
    ON collaboration_invitations FOR SELECT
    USING (
        user_can_manage_collaborators(book_id, auth.uid()) OR 
        invitee_id = auth.uid() OR
        (invitee_email = auth.email() AND auth.uid() IS NOT NULL)
    );

CREATE POLICY "Book owners and editors can create invitations"
    ON collaboration_invitations FOR INSERT
    WITH CHECK (user_can_manage_collaborators(book_id, auth.uid()));

CREATE POLICY "Invitees can update their own invitations"
    ON collaboration_invitations FOR UPDATE
    USING (
        invitee_id = auth.uid() OR 
        (invitee_email = auth.email() AND auth.uid() IS NOT NULL) OR
        user_can_manage_collaborators(book_id, auth.uid())
    );

CREATE POLICY "Book owners and editors can delete invitations"
    ON collaboration_invitations FOR DELETE
    USING (user_can_manage_collaborators(book_id, auth.uid()));

-- Editing sessions policies
CREATE POLICY "Users can view editing sessions for accessible books"
    ON editing_sessions FOR SELECT
    USING (user_has_book_access(book_id, auth.uid()));

CREATE POLICY "Users can manage their own editing sessions"
    ON editing_sessions FOR ALL
    USING (user_id = auth.uid() AND user_has_book_access(book_id, auth.uid()));

-- User presence policies
CREATE POLICY "Users can view presence for accessible books"
    ON user_presence FOR SELECT
    USING (user_has_book_access(book_id, auth.uid()));

CREATE POLICY "Users can manage their own presence"
    ON user_presence FOR ALL
    USING (user_id = auth.uid() AND user_has_book_access(book_id, auth.uid()));

-- Book comments policies
CREATE POLICY "Users can view comments for accessible books"
    ON book_comments FOR SELECT
    USING (user_has_book_access(book_id, auth.uid()));

CREATE POLICY "Collaborators can create comments"
    ON book_comments FOR INSERT
    WITH CHECK (user_has_book_access(book_id, auth.uid()) AND user_id = auth.uid());

CREATE POLICY "Users can update their own comments"
    ON book_comments FOR UPDATE
    USING (user_id = auth.uid() AND user_has_book_access(book_id, auth.uid()));

CREATE POLICY "Users can delete their own comments, owners can delete any"
    ON book_comments FOR DELETE
    USING (
        user_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM books WHERE id = book_id AND user_id = auth.uid())
    );