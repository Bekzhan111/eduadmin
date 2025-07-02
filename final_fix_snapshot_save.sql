-- COMPREHENSIVE FIX FOR BOOK EDIT HISTORY SNAPSHOT SAVING
-- Run this in the Supabase SQL Editor

-- 1. Drop the existing function to ensure a clean slate
DROP FUNCTION IF EXISTS save_book_edit_snapshot;

-- 2. Create the fixed function with proper error handling
CREATE OR REPLACE FUNCTION save_book_edit_snapshot(
    book_uuid UUID,
    snapshot_name TEXT,
    description TEXT DEFAULT NULL
) RETURNS JSONB 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    history JSONB;
    entries JSONB;
    current_version TEXT;
    current_entry JSONB;
    updated_entry JSONB;
    result JSONB;
    current_user_id UUID;
    user_name TEXT;
    new_entry JSONB;
    canvas_data JSONB;
    found_book BOOLEAN;
BEGIN
    -- Check if book exists
    SELECT EXISTS(SELECT 1 FROM books WHERE id = book_uuid) INTO found_book;
    IF NOT found_book THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Book not found',
            'book_uuid', book_uuid
        );
    END IF;

    -- Get current user ID safely
    current_user_id := COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::UUID);
    
    -- Get user name
    SELECT display_name INTO user_name FROM users WHERE id = current_user_id;
    
    -- Get the current history and canvas data
    SELECT edit_history, canvas_elements::JSONB INTO history, canvas_data FROM books WHERE id = book_uuid;
    
    -- Initialize history if it doesn't exist
    IF history IS NULL THEN
        history := jsonb_build_object(
            'current_version', NULL,
            'entries', jsonb_build_array()
        );
    END IF;
    
    -- Generate a new version ID
    current_version := gen_random_uuid()::TEXT;
    
    -- Get entries array or initialize it
    entries := COALESCE(history->'entries', jsonb_build_array());
    
    -- Create new entry with current canvas data
    new_entry := jsonb_build_object(
        'id', current_version,
        'timestamp', EXTRACT(EPOCH FROM NOW())::TEXT,
        'user_id', current_user_id,
        'user_name', COALESCE(user_name, 'Unknown User'),
        'elements', canvas_data,
        'snapshot_name', snapshot_name,
        'description', COALESCE(description, '')
    );
    
    -- Add the new entry to the entries array
    entries := entries || jsonb_build_array(new_entry);
    
    -- Update the history object
    history := jsonb_set(history, '{entries}', entries);
    history := jsonb_set(history, '{current_version}', to_jsonb(current_version));
    
    -- Update the database
    UPDATE books 
    SET edit_history = history
    WHERE id = book_uuid;
    
    -- Return success response with updated history
    RETURN jsonb_build_object(
        'success', true,
        'history', history,
        'message', 'Snapshot saved successfully'
    );
EXCEPTION WHEN OTHERS THEN
    -- Return error information
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'book_uuid', book_uuid,
        'user_id', current_user_id
    );
END;
$$;

-- 4. Add comment to the function
COMMENT ON FUNCTION save_book_edit_snapshot IS 'Saves a named snapshot in the edit history with improved error handling';

-- 5. Test the function
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_proc
        WHERE proname = 'save_book_edit_snapshot'
    ) THEN
        RAISE NOTICE 'Function save_book_edit_snapshot successfully created';
        
        -- Check if function has SECURITY DEFINER
        IF EXISTS (
            SELECT 1
            FROM pg_proc
            WHERE proname = 'save_book_edit_snapshot'
            AND prosecdef = true
        ) THEN
            RAISE NOTICE 'Function has SECURITY DEFINER attribute';
        ELSE
            RAISE WARNING 'Function does NOT have SECURITY DEFINER attribute';
        END IF;
    ELSE
        RAISE EXCEPTION 'Function save_book_edit_snapshot was not created';
    END IF;
END
$$; 
 