-- Fix for the book edit history snapshot saving function
-- Run this directly in the Supabase SQL Editor

-- First, check if the function exists and drop it
DROP FUNCTION IF EXISTS save_book_edit_snapshot;

-- Create the fixed function with proper error handling and debugging
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
    current_user_id UUID;
    user_name TEXT;
    new_entry JSONB;
    canvas_data JSONB;
    debug_info JSONB;
BEGIN
    -- Debug information
    debug_info := jsonb_build_object(
        'function', 'save_book_edit_snapshot',
        'book_uuid', book_uuid,
        'snapshot_name', snapshot_name,
        'description', description
    );
    
    -- Get current user ID safely
    current_user_id := COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::UUID);
    debug_info := debug_info || jsonb_build_object('current_user_id', current_user_id);
    
    -- Get user name
    BEGIN
        SELECT display_name INTO user_name FROM users WHERE id = current_user_id;
        debug_info := debug_info || jsonb_build_object('user_name', user_name);
    EXCEPTION WHEN OTHERS THEN
        debug_info := debug_info || jsonb_build_object('user_name_error', SQLERRM);
        user_name := 'Unknown User';
    END;
    
    -- Get the current history and canvas data
    BEGIN
        SELECT edit_history, canvas_elements::JSONB INTO history, canvas_data 
        FROM books WHERE id = book_uuid;
        
        debug_info := debug_info || jsonb_build_object(
            'history_found', history IS NOT NULL,
            'canvas_data_found', canvas_data IS NOT NULL
        );
    EXCEPTION WHEN OTHERS THEN
        debug_info := debug_info || jsonb_build_object('book_query_error', SQLERRM);
        RETURN jsonb_build_object(
            'success', false, 
            'message', 'Error fetching book data: ' || SQLERRM,
            'debug_info', debug_info
        );
    END;
    
    -- Check if book exists
    IF canvas_data IS NULL THEN
        RETURN jsonb_build_object(
            'success', false, 
            'message', 'Book not found or has no canvas elements',
            'debug_info', debug_info
        );
    END IF;
    
    -- Check if history exists
    IF history IS NULL THEN
        -- Create initial history if none exists
        new_entry := jsonb_build_object(
            'id', gen_random_uuid(),
            'timestamp', now(),
            'user_id', current_user_id,
            'user_name', COALESCE(user_name, 'Unknown User'),
            'elements', canvas_data,
            'snapshot_name', snapshot_name,
            'description', COALESCE(description, '')
        );
        
        -- Create new history with this entry
        entries := jsonb_build_array(new_entry);
        current_version := new_entry->>'id';
        history := jsonb_build_object(
            'entries', entries,
            'current_version', current_version
        );
        
        -- Update the book
        BEGIN
            UPDATE books SET edit_history = history WHERE id = book_uuid;
            debug_info := debug_info || jsonb_build_object('action', 'created_new_history');
        EXCEPTION WHEN OTHERS THEN
            debug_info := debug_info || jsonb_build_object('update_error', SQLERRM);
            RETURN jsonb_build_object(
                'success', false, 
                'message', 'Error updating book with new history: ' || SQLERRM,
                'debug_info', debug_info
            );
        END;
        
        RETURN jsonb_build_object('success', true, 'history', history, 'debug_info', debug_info);
    END IF;
    
    -- Get current version and entries
    current_version := history->>'current_version';
    entries := history->'entries';
    
    debug_info := debug_info || jsonb_build_object(
        'current_version', current_version,
        'entries_count', jsonb_array_length(entries)
    );
    
    -- Find the current entry to update
    FOR i IN 0..jsonb_array_length(entries)-1 LOOP
        IF (entries->i->>'id') = current_version THEN
            current_entry := entries->i;
            
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
            
            -- Replace in array
            entries := jsonb_set(entries, array[i::text], updated_entry);
            
            -- Update history with updated entries
            history := jsonb_set(history, '{entries}', entries);
            
            -- Update the book
            BEGIN
                UPDATE books SET edit_history = history WHERE id = book_uuid;
                debug_info := debug_info || jsonb_build_object('action', 'updated_existing_entry');
            EXCEPTION WHEN OTHERS THEN
                debug_info := debug_info || jsonb_build_object('update_error', SQLERRM);
                RETURN jsonb_build_object(
                    'success', false, 
                    'message', 'Error updating book with modified history: ' || SQLERRM,
                    'debug_info', debug_info
                );
            END;
            
            RETURN jsonb_build_object('success', true, 'history', history, 'debug_info', debug_info);
        END IF;
    END LOOP;
    
    -- If current version not found but we have canvas data, create new entry
    debug_info := debug_info || jsonb_build_object('action', 'creating_new_entry');
    
    new_entry := jsonb_build_object(
        'id', gen_random_uuid(),
        'timestamp', now(),
        'user_id', current_user_id,
        'user_name', COALESCE(user_name, 'Unknown User'),
        'elements', canvas_data,
        'snapshot_name', snapshot_name,
        'description', COALESCE(description, '')
    );
    
    -- Add to existing entries
    entries := entries || jsonb_build_array(new_entry);
    
    -- Update history with new entries and current version
    history := jsonb_set(history, '{entries}', entries);
    history := jsonb_set(history, '{current_version}', to_jsonb(new_entry->>'id'));
    
    -- Update the book
    BEGIN
        UPDATE books SET edit_history = history WHERE id = book_uuid;
    EXCEPTION WHEN OTHERS THEN
        debug_info := debug_info || jsonb_build_object('update_error', SQLERRM);
        RETURN jsonb_build_object(
            'success', false, 
            'message', 'Error updating book with new entry: ' || SQLERRM,
            'debug_info', debug_info
        );
    END;
    
    RETURN jsonb_build_object('success', true, 'history', history, 'debug_info', debug_info);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment to the function
COMMENT ON FUNCTION save_book_edit_snapshot IS 'Saves a named snapshot in the edit history with improved error handling';

-- Test function to check if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_proc
        WHERE proname = 'save_book_edit_snapshot'
    ) THEN
        RAISE NOTICE 'Function save_book_edit_snapshot successfully created';
    ELSE
        RAISE EXCEPTION 'Function save_book_edit_snapshot was not created';
    END IF;
END
$$; 
