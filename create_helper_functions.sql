-- Helper functions for database diagnostics
-- Run this in the Supabase SQL Editor

-- Function to check if another function exists
CREATE OR REPLACE FUNCTION check_function_exists(function_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM pg_proc
        WHERE proname = function_name
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_function_exists IS 'Checks if a function exists in the database';

-- Function to get function details
CREATE OR REPLACE FUNCTION get_function_details(function_name TEXT)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'exists', true,
        'name', p.proname,
        'language', l.lanname,
        'owner', pg_get_userbyid(p.proowner),
        'security', CASE WHEN p.prosecdef THEN 'DEFINER' ELSE 'INVOKER' END,
        'arguments', pg_get_function_arguments(p.oid),
        'result_type', pg_get_function_result(p.oid)
    )
    INTO result
    FROM pg_proc p
    JOIN pg_language l ON p.prolang = l.oid
    WHERE p.proname = function_name;
    
    IF result IS NULL THEN
        RETURN jsonb_build_object('exists', false);
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_function_details IS 'Gets detailed information about a function';

-- Function to check database connectivity
CREATE OR REPLACE FUNCTION check_connection()
RETURNS JSONB AS $$
BEGIN
    RETURN jsonb_build_object(
        'connected', true,
        'timestamp', now(),
        'user', current_user,
        'database', current_database()
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_connection IS 'Simple function to check database connectivity';

-- Test the helper functions
DO $$
BEGIN
    RAISE NOTICE 'check_function_exists(''check_connection'') = %', check_function_exists('check_connection');
    RAISE NOTICE 'get_function_details(''check_connection'') = %', get_function_details('check_connection');
END
$$; 
