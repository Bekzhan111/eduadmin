-- Migration: Add book edit history field
-- This migration adds a column to store version history for book edits

-- Add edit_history column to books table
ALTER TABLE books ADD COLUMN IF NOT EXISTS edit_history JSONB DEFAULT NULL;

-- Create function to create or update book edit history
CREATE OR REPLACE FUNCTION create_or_update_book_edit_history()
RETURNS TRIGGER AS $$
DECLARE
    history JSONB;
    new_entry JSONB;
    entries JSONB;
    current_version TEXT;
    user_name TEXT;
BEGIN
    -- Get user name for the entry
    SELECT display_name INTO user_name FROM users WHERE id = auth.uid();
    
    -- Create new history entry
    new_entry := jsonb_build_object(
        'id', gen_random_uuid(),
        'timestamp', now(),
        'user_id', auth.uid(),
        'user_name', COALESCE(user_name, 'Unknown User'),
        'elements', NEW.canvas_elements,
        'snapshot_name', NULL,
        'description', NULL
    );
    
    -- Get existing history or initialize new one
    IF NEW.edit_history IS NULL THEN
        -- Initialize new history
        entries := jsonb_build_array(new_entry);
        current_version := new_entry->>'id';
        history := jsonb_build_object(
            'entries', entries,
            'current_version', current_version
        );
    ELSE
        -- Add to existing history
        history := NEW.edit_history;
        entries := history->'entries';
        
        -- Add new entry
        entries := entries || jsonb_build_array(new_entry);
        
        -- Keep only last 50 entries if more than that
        IF jsonb_array_length(entries) > 50 THEN
            entries := entries - 0;
        END IF;
        
        -- Update history with new entries and current version
        history := jsonb_set(history, '{entries}', entries);
        history := jsonb_set(history, '{current_version}', to_jsonb(new_entry->>'id'));
    END IF;
    
    -- Set the edit_history field
    NEW.edit_history := history;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or update trigger for edit history
DROP TRIGGER IF EXISTS trigger_update_book_edit_history ON books;
CREATE TRIGGER trigger_update_book_edit_history
    BEFORE UPDATE OF canvas_elements ON books
    FOR EACH ROW
    WHEN (OLD.canvas_elements IS DISTINCT FROM NEW.canvas_elements)
    EXECUTE FUNCTION create_or_update_book_edit_history();

-- Create function to save named snapshots
CREATE OR REPLACE FUNCTION save_book_edit_snapshot(
    book_uuid UUID,
    snapshot_name TEXT,
    description TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    history JSONB;
    entries JSONB;
    current_version TEXT;
    current_entry JSONB;
    updated_entry JSONB;
    result JSONB;
BEGIN
    -- Get the current history
    SELECT edit_history INTO history FROM books WHERE id = book_uuid;
    
    -- Check if history exists
    IF history IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'No edit history found');
    END IF;
    
    -- Get current version and entries
    current_version := history->>'current_version';
    entries := history->'entries';
    
    -- Find the current entry to update
    SELECT jsonb_array_elements(entries) INTO current_entry 
    WHERE (value->>'id') = current_version;
    
    -- If entry not found, return error
    IF current_entry IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Current version not found in history');
    END IF;
    
    -- Update the entry with snapshot name and description
    updated_entry := jsonb_set(
        jsonb_set(
            current_entry, 
            '{snapshot_name}', 
            to_jsonb(snapshot_name)
        ),
        '{description}', 
        to_jsonb(COALESCE(description, ''))
    );
    
    -- Replace the entry in the array
    FOR i IN 0..jsonb_array_length(entries)-1 LOOP
        IF (entries->i->>'id') = current_version THEN
            entries := jsonb_set(entries, array[i::text], updated_entry);
            EXIT;
        END IF;
    END LOOP;
    
    -- Update history with updated entries
    history := jsonb_set(history, '{entries}', entries);
    
    -- Update the book
    UPDATE books SET edit_history = history WHERE id = book_uuid;
    
    RETURN jsonb_build_object('success', true, 'history', history);
END;
$$ LANGUAGE plpgsql;

-- Create function to get edit history
CREATE OR REPLACE FUNCTION get_book_edit_history(book_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    history JSONB;
BEGIN
    SELECT edit_history INTO history FROM books WHERE id = book_uuid;
    RETURN COALESCE(history, jsonb_build_object('entries', '[]'::jsonb, 'current_version', null));
END;
$$ LANGUAGE plpgsql;

-- Create RLS policy for edit_history
CREATE POLICY "Authors can manage book edit history" ON books
    FOR ALL
    USING (author_id = auth.uid())
    WITH CHECK (author_id = auth.uid());

-- Super admins can manage all edit histories
CREATE POLICY "Super admins can manage all book edit histories" ON books
    FOR ALL
    USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super_admin'));

COMMENT ON COLUMN books.edit_history IS 'JSON field storing the history of edits for the book';
COMMENT ON FUNCTION create_or_update_book_edit_history() IS 'Automatically tracks edit history when canvas_elements change';
COMMENT ON FUNCTION save_book_edit_snapshot(UUID, TEXT, TEXT) IS 'Saves a named snapshot in the edit history';
COMMENT ON FUNCTION get_book_edit_history(UUID) IS 'Gets the edit history for a book'; 
