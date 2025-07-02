-- Create collaboration_invitations table to manage invitation workflow
CREATE TABLE collaboration_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invitee_email TEXT NOT NULL,
    invitee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'reviewer', 'viewer')),
    permissions JSONB DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
    message TEXT,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_collaboration_invitations_book_id ON collaboration_invitations(book_id);
CREATE INDEX idx_collaboration_invitations_inviter_id ON collaboration_invitations(inviter_id);
CREATE INDEX idx_collaboration_invitations_invitee_email ON collaboration_invitations(invitee_email);
CREATE INDEX idx_collaboration_invitations_invitee_id ON collaboration_invitations(invitee_id);
CREATE INDEX idx_collaboration_invitations_status ON collaboration_invitations(status);
CREATE INDEX idx_collaboration_invitations_expires_at ON collaboration_invitations(expires_at);

-- Enable RLS
ALTER TABLE collaboration_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for collaboration_invitations
-- Inviters can view invitations they sent
CREATE POLICY "Inviters can view their sent invitations" ON collaboration_invitations
    FOR SELECT USING (inviter_id = auth.uid());

-- Invitees can view invitations sent to them
CREATE POLICY "Invitees can view their received invitations" ON collaboration_invitations
    FOR SELECT USING (
        invitee_id = auth.uid() OR 
        invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

-- Only owners and editors can create invitations
CREATE POLICY "Owners and editors can create invitations" ON collaboration_invitations
    FOR INSERT WITH CHECK (
        inviter_id = auth.uid() AND
        book_id IN (
            SELECT bc.book_id 
            FROM book_collaborators bc 
            WHERE bc.user_id = auth.uid() 
            AND bc.role IN ('owner', 'editor')
        )
    );

-- Invitees can update invitation status (accept/reject)
CREATE POLICY "Invitees can respond to invitations" ON collaboration_invitations
    FOR UPDATE USING (
        invitee_id = auth.uid() OR 
        invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

-- Inviters can cancel their invitations
CREATE POLICY "Inviters can cancel invitations" ON collaboration_invitations
    FOR UPDATE USING (inviter_id = auth.uid());

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_collaboration_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_collaboration_invitations_updated_at
    BEFORE UPDATE ON collaboration_invitations
    FOR EACH ROW
    EXECUTE FUNCTION update_collaboration_invitations_updated_at();