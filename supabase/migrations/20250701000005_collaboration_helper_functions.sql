-- Helper functions for collaboration system
-- These functions handle complex collaboration operations

-- Function to accept a collaboration invitation
CREATE OR REPLACE FUNCTION accept_collaboration_invitation(invitation_id UUID)
RETURNS VOID AS $$
DECLARE
    invitation_data collaboration_invitations%ROWTYPE;
BEGIN
    -- Get invitation details
    SELECT * INTO invitation_data
    FROM collaboration_invitations
    WHERE id = invitation_id AND status = 'pending' AND expires_at > NOW();

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invitation not found, expired, or already processed';
    END IF;

    -- Update invitation status
    UPDATE collaboration_invitations
    SET status = 'accepted', updated_at = NOW()
    WHERE id = invitation_id;

    -- Add user as collaborator
    INSERT INTO book_collaborators (
        book_id,
        user_id,
        role,
        permissions,
        invited_by,
        joined_at,
        created_at
    ) VALUES (
        invitation_data.book_id,
        COALESCE(invitation_data.invitee_id, auth.uid()),
        invitation_data.role,
        invitation_data.permissions,
        invitation_data.inviter_id,
        NOW(),
        NOW()
    )
    ON CONFLICT (book_id, user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject a collaboration invitation
CREATE OR REPLACE FUNCTION reject_collaboration_invitation(invitation_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE collaboration_invitations
    SET status = 'rejected', updated_at = NOW()
    WHERE id = invitation_id AND status = 'pending';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invitation not found or already processed';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup expired invitations
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE collaboration_invitations
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'pending' AND expires_at < NOW();

    GET DIAGNOSTICS expired_count = ROW_COUNT;
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup stale editing sessions
CREATE OR REPLACE FUNCTION cleanup_stale_editing_sessions()
RETURNS INTEGER AS $$
DECLARE
    stale_count INTEGER;
BEGIN
    DELETE FROM editing_sessions
    WHERE last_activity < NOW() - INTERVAL '1 hour';

    GET DIAGNOSTICS stale_count = ROW_COUNT;
    RETURN stale_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup offline presence
CREATE OR REPLACE FUNCTION cleanup_offline_presence()
RETURNS INTEGER AS $$
DECLARE
    offline_count INTEGER;
BEGIN
    UPDATE user_presence
    SET is_online = FALSE, updated_at = NOW()
    WHERE last_seen < NOW() - INTERVAL '10 minutes' AND is_online = TRUE;

    GET DIAGNOSTICS offline_count = ROW_COUNT;
    RETURN offline_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's book access level
CREATE OR REPLACE FUNCTION get_user_book_access(book_uuid UUID, user_uuid UUID)
RETURNS TABLE(
    access_level TEXT,
    role TEXT,
    permissions JSONB
) AS $$
BEGIN
    -- Check if user is the book owner
    IF EXISTS (
        SELECT 1 FROM books WHERE id = book_uuid AND user_id = user_uuid
    ) THEN
        RETURN QUERY SELECT 'owner'::TEXT, 'owner'::TEXT, 
            '{"canEdit": true, "canReview": true, "canInvite": true, "canDelete": true, "canPublish": true}'::JSONB;
        RETURN;
    END IF;
    
    -- Check if user is a collaborator
    RETURN QUERY
    SELECT 'collaborator'::TEXT, bc.role::TEXT, bc.permissions
    FROM book_collaborators bc
    WHERE bc.book_id = book_uuid AND bc.user_id = user_uuid;
    
    -- If no access found, return no access
    IF NOT FOUND THEN
        RETURN QUERY SELECT 'none'::TEXT, 'none'::TEXT, '{}'::JSONB;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to transfer book ownership
CREATE OR REPLACE FUNCTION transfer_book_ownership(
    book_uuid UUID,
    current_owner_id UUID,
    new_owner_id UUID
)
RETURNS VOID AS $$
BEGIN
    -- Verify current ownership
    IF NOT EXISTS (
        SELECT 1 FROM books WHERE id = book_uuid AND user_id = current_owner_id
    ) THEN
        RAISE EXCEPTION 'Only the current owner can transfer ownership';
    END IF;

    -- Start transaction
    BEGIN
        -- Update book owner
        UPDATE books SET user_id = new_owner_id, updated_at = NOW()
        WHERE id = book_uuid;

        -- Update collaborator records
        -- Remove old owner's collaborator record if exists
        DELETE FROM book_collaborators
        WHERE book_id = book_uuid AND user_id = current_owner_id;

        -- Add current owner as editor if not the same person
        IF current_owner_id != new_owner_id THEN
            INSERT INTO book_collaborators (
                book_id, user_id, role, permissions, invited_by, joined_at, created_at
            ) VALUES (
                book_uuid, current_owner_id, 'editor',
                '{"canEdit": true, "canReview": true, "canInvite": false, "canDelete": false, "canPublish": false}',
                new_owner_id, NOW(), NOW()
            );
        END IF;

        -- Update new owner's collaborator record to owner or remove if exists
        DELETE FROM book_collaborators
        WHERE book_id = book_uuid AND user_id = new_owner_id;

    EXCEPTION
        WHEN OTHERS THEN
            RAISE EXCEPTION 'Failed to transfer ownership: %', SQLERRM;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get collaboration summary
CREATE OR REPLACE FUNCTION get_collaboration_summary(book_uuid UUID)
RETURNS TABLE(
    total_collaborators INTEGER,
    active_collaborators INTEGER,
    pending_invitations INTEGER,
    recent_comments INTEGER,
    online_users INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*)::INTEGER FROM book_collaborators WHERE book_id = book_uuid),
        (SELECT COUNT(*)::INTEGER FROM book_collaborators bc 
         JOIN user_presence up ON bc.user_id = up.user_id 
         WHERE bc.book_id = book_uuid AND up.book_id = book_uuid AND up.last_seen > NOW() - INTERVAL '1 hour'),
        (SELECT COUNT(*)::INTEGER FROM collaboration_invitations 
         WHERE book_id = book_uuid AND status = 'pending' AND expires_at > NOW()),
        (SELECT COUNT(*)::INTEGER FROM book_comments 
         WHERE book_id = book_uuid AND created_at > NOW() - INTERVAL '24 hours'),
        (SELECT COUNT(*)::INTEGER FROM user_presence 
         WHERE book_id = book_uuid AND is_online = TRUE AND last_seen > NOW() - INTERVAL '5 minutes');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION accept_collaboration_invitation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_collaboration_invitation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_invitations() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_stale_editing_sessions() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_offline_presence() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_book_access(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION transfer_book_ownership(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_collaboration_summary(UUID) TO authenticated;