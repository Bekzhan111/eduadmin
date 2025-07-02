# Collaboration Access Fix

## Issue Description

When invited co-authors try to edit a book, they get an error loading the book. This happens because the `books` table Row Level Security (RLS) policies were too restrictive and only allowed book owners to read their own books, blocking access for collaborators.

## Root Cause Analysis

1. **Book Collaborators System**: ✅ Working correctly
   - `book_collaborators` table exists with proper structure
   - RLS policies allow viewing collaborators for accessible books
   - Helper functions like `user_has_book_access()` work correctly

2. **Books Table RLS Policies**: ❌ **The Problem**
   - Books table had restrictive RLS policies
   - Only allowed `user_id = auth.uid()` (book owners only)
   - Collaborators couldn't read books they were invited to edit

3. **Collaboration Functions**: ✅ Working correctly
   - Helper functions exist and work properly
   - Invitation system functions correctly
   - User can accept invitations and become collaborators

## The Fix

### Files Created/Modified

1. **Migration File**: `supabase/migrations/20250701000012_fix_books_collaboration_access.sql`
   - Updates books table RLS policies to allow collaboration access
   - Adds proper SELECT, INSERT, UPDATE, DELETE policies
   - Creates performance index for collaboration queries

2. **Test Scripts**:
   - `test-collaboration-access.js` - Verify the fix is working
   - `apply-collaboration-fix.js` - Alternative application method
   - `fix_books_collaboration_access.sql` - Standalone SQL fix

### Key Changes Made

#### New Books Table RLS Policies

```sql
-- SELECT: Allow owners and collaborators to read books
CREATE POLICY "Users can view books they own or collaborate on" ON books
    FOR SELECT USING (
        user_id = auth.uid()  -- Book owner
        OR
        id IN (               -- OR collaborator
            SELECT book_id 
            FROM book_collaborators 
            WHERE user_id = auth.uid()
        )
    );

-- UPDATE: Allow owners and editors to modify books
CREATE POLICY "Owners and editors can update books" ON books
    FOR UPDATE USING (
        user_id = auth.uid()  -- Book owner
        OR
        id IN (               -- OR editor/owner collaborator
            SELECT book_id 
            FROM book_collaborators 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'editor')
        )
    );
```

#### Performance Improvement

```sql
-- Index to speed up collaboration queries
CREATE INDEX IF NOT EXISTS idx_book_collaborators_user_book 
ON book_collaborators(user_id, book_id);
```

## How to Apply the Fix

### Option 1: Using Supabase CLI (Recommended)
```bash
supabase db push
```

### Option 2: Using the Application Script
```bash
node apply-collaboration-fix.js
```

### Option 3: Manual SQL Execution
Run the SQL in `supabase/migrations/20250701000012_fix_books_collaboration_access.sql` in your Supabase dashboard.

## Testing the Fix

Run the test script to verify everything is working:
```bash
node test-collaboration-access.js
```

### Expected Results After Fix

1. ✅ Book owners can still access their books
2. ✅ Collaborators can now read books they're invited to
3. ✅ Collaborators with 'editor' role can modify books
4. ✅ Collaborators with 'viewer' role can only read books
5. ✅ Non-collaborators still cannot access books they shouldn't

## Verification Steps

1. **Create a test book** as User A
2. **Invite User B** as a collaborator
3. **User B accepts** the invitation
4. **User B should now be able to**:
   - View the book in their book list
   - Open the book in the editor
   - Make changes (if they have editor role)
   - Save changes (if they have editor role)

## Security Considerations

- The fix maintains security by only allowing access to users who are explicitly added as collaborators
- Role-based permissions are enforced (viewers can't edit, only owners can delete)
- RLS policies prevent unauthorized access to books
- Performance is optimized with proper indexing

## Files in This Fix

- `supabase/migrations/20250701000012_fix_books_collaboration_access.sql` - Main migration
- `COLLABORATION_ACCESS_FIX.md` - This documentation
- `test-collaboration-access.js` - Test script
- `apply-collaboration-fix.js` - Alternative application script
- `fix_books_collaboration_access.sql` - Standalone SQL fix

## Next Steps

After applying this fix:

1. Test the collaboration functionality thoroughly
2. Monitor performance of book queries with collaborators
3. Consider implementing more granular permissions if needed
4. Update frontend error handling for better user experience