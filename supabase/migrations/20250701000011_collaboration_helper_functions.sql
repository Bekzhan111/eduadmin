-- Helper functions for collaboration system

-- Function to check if user has permission for a book
CREATE OR REPLACE FUNCTION user_has_book_permission(book_uuid UUID, user_uuid UUID, required_role TEXT DEFAULT 'viewer')
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
    role_hierarchy INTEGER;
    required_hierarchy INTEGER;
BEGIN
    -- Get user's role for the book
    SELECT role INTO user_role
    FROM book_collaborators
    WHERE book_id = book_uuid AND user_id = user_uuid;
    
    -- If no role found, user has no access
    IF user_role IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Define role hierarchy (higher number = more permissions)
    role_hierarchy := CASE user_role
        WHEN 'owner' THEN 4
        WHEN 'editor' THEN 3
        WHEN 'reviewer' THEN 2
        WHEN 'viewer' THEN 1
        ELSE 0
    END;
    
    required_hierarchy := CASE required_role
        WHEN 'owner' THEN 4
        WHEN 'editor' THEN 3
        WHEN 'reviewer' THEN 2
        WHEN 'viewer' THEN 1
        ELSE 0
    END;
    
    RETURN role_hierarchy >= required_hierarchy;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add a user as book owner (for new books)
CREATE OR REPLACE FUNCTION add_book_owner(book_uuid UUID, user_uuid UUID)
RETURNS UUID AS $$
DECLARE
    collaborator_id UUID;
BEGIN
    INSERT INTO book_collaborators (book_id, user_id, role, invited_by, joined_at)
    VALUES (book_uuid, user_uuid, 'owner', user_uuid, NOW())
    RETURNING id INTO collaborator_id;
    
    RETURN collaborator_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to accept an invitation
CREATE OR REPLACE FUNCTION accept_collaboration_invitation(invitation_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    invitation_record collaboration_invitations%ROWTYPE;
    existing_collaborator UUID;
BEGIN
    -- Get invitation details
    SELECT * INTO invitation_record
    FROM collaboration_invitations
    WHERE id = invitation_uuid
    AND status = 'pending'
    AND expires_at > NOW()
    AND (invitee_id = auth.uid() OR invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid()));
    
    -- Check if invitation exists and is valid
    IF invitation_record.id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check if user is already a collaborator
    SELECT id INTO existing_collaborator
    FROM book_collaborators
    WHERE book_id = invitation_record.book_id
    AND user_id = auth.uid();
    
    -- If already a collaborator, just update status
    IF existing_collaborator IS NOT NULL THEN
        UPDATE collaboration_invitations
        SET status = 'accepted', invitee_id = auth.uid(), updated_at = NOW()
        WHERE id = invitation_uuid;
        RETURN TRUE;
    END IF;
    
    -- Add user as collaborator
    INSERT INTO book_collaborators (
        book_id,
        user_id,
        role,
        permissions,
        invited_by,
        joined_at
    ) VALUES (
        invitation_record.book_id,
        auth.uid(),
        invitation_record.role,
        invitation_record.permissions,
        invitation_record.inviter_id,
        NOW()
    );
    
    -- Update invitation status
    UPDATE collaboration_invitations
    SET status = 'accepted', invitee_id = auth.uid(), updated_at = NOW()
    WHERE id = invitation_uuid;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject an invitation
CREATE OR REPLACE FUNCTION reject_collaboration_invitation(invitation_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE collaboration_invitations
    SET status = 'rejected', invitee_id = auth.uid(), updated_at = NOW()
    WHERE id = invitation_uuid
    AND status = 'pending'
    AND (invitee_id = auth.uid() OR invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid()));
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove a collaborator
CREATE OR REPLACE FUNCTION remove_book_collaborator(book_uuid UUID, collaborator_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_user_role TEXT;
    target_user_role TEXT;
BEGIN
    -- Get current user's role
    SELECT role INTO current_user_role
    FROM book_collaborators
    WHERE book_id = book_uuid AND user_id = auth.uid();
    
    -- Get target user's role
    SELECT role INTO target_user_role
    FROM book_collaborators
    WHERE book_id = book_uuid AND user_id = collaborator_user_id;
    
    -- Only owners can remove other collaborators
    -- Users can remove themselves (except if they're the only owner)
    IF current_user_role = 'owner' OR (auth.uid() = collaborator_user_id AND target_user_role != 'owner') THEN
        -- Prevent removing the last owner
        IF target_user_role = 'owner' THEN
            IF (SELECT COUNT(*) FROM book_collaborators WHERE book_id = book_uuid AND role = 'owner') <= 1 THEN
                RETURN FALSE; -- Cannot remove the last owner
            END IF;
        END IF;
        
        DELETE FROM book_collaborators
        WHERE book_id = book_uuid AND user_id = collaborator_user_id;
        
        RETURN FOUND;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update collaborator role
CREATE OR REPLACE FUNCTION update_collaborator_role(book_uuid UUID, collaborator_user_id UUID, new_role TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    current_user_role TEXT;
    target_user_role TEXT;
BEGIN
    -- Validate new role
    IF new_role NOT IN ('owner', 'editor', 'reviewer', 'viewer') THEN
        RETURN FALSE;
    END IF;
    
    -- Get current user's role
    SELECT role INTO current_user_role
    FROM book_collaborators
    WHERE book_id = book_uuid AND user_id = auth.uid();
    
    -- Get target user's role
    SELECT role INTO target_user_role
    FROM book_collaborators
    WHERE book_id = book_uuid AND user_id = collaborator_user_id;
    
    -- Only owners can change roles
    IF current_user_role != 'owner' THEN
        RETURN FALSE;
    END IF;
    
    -- Prevent changing the last owner's role
    IF target_user_role = 'owner' AND new_role != 'owner' THEN
        IF (SELECT COUNT(*) FROM book_collaborators WHERE book_id = book_uuid AND role = 'owner') <= 1 THEN
            RETURN FALSE; -- Cannot change the last owner's role
        END IF;
    END IF;
    
    UPDATE book_collaborators
    SET role = new_role
    WHERE book_id = book_uuid AND user_id = collaborator_user_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's books with their role
CREATE OR REPLACE FUNCTION get_user_books_with_roles(user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE (
    book_id UUID,
    role TEXT,
    permissions JSONB,
    joined_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT bc.book_id, bc.role, bc.permissions, bc.joined_at
    FROM book_collaborators bc
    WHERE bc.user_id = user_uuid
    ORDER BY bc.joined_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to expire old invitations
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void AS $$
BEGIN
    UPDATE collaboration_invitations
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to clean up inactive editing sessions and presence
CREATE OR REPLACE FUNCTION cleanup_inactive_sessions()
RETURNS void AS $$
BEGIN
    -- Clean up editing sessions older than 1 hour
    DELETE FROM editing_sessions 
    WHERE last_activity < NOW() - INTERVAL '1 hour';
    
    -- Mark users as offline if inactive for more than 5 minutes
    UPDATE user_presence 
    SET is_online = false 
    WHERE last_seen < NOW() - INTERVAL '5 minutes' 
    AND is_online = true;
    
    -- Remove presence records older than 24 hours
    DELETE FROM user_presence
    WHERE last_seen < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;