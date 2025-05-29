# How to Fix the Infinite Recursion in Users Table Policy

If you're encountering this error:
```
infinite recursion detected in policy for relation "users"
```

Follow these steps to fix it:

## Option 1: Using the Supabase Dashboard

1. Go to your Supabase project dashboard: https://app.supabase.io
2. Navigate to SQL Editor
3. Create a new query
4. Paste the content of `src/migrations/fix_rls_users_policy_safer.sql` (recommended) or `src/migrations/fix_rls_users_policy.sql`
5. Run the query

### If you encounter "policy already exists" errors

If you get an error like:
```
ERROR: 42710: policy "School admin can see school users" for table "users" already exists
```

Use the safer version of the migration script: `src/migrations/fix_rls_users_policy_safer.sql`
This script uses dynamic SQL and checks for existing policies before trying to create new ones, with unique policy names to avoid conflicts.

## Option 2: Using the Supabase CLI

If you have the Supabase CLI installed:

```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref wxrqdytayiamnpwjauvi

# Apply the safer migration
supabase db push src/migrations/fix_rls_users_policy_safer.sql
```

## What This Fix Does

The error occurs because of recursive Row Level Security (RLS) policies. When a policy tries to query the same table it's protecting, it can create an infinite loop.

The fix:

1. Creates a `SECURITY DEFINER` function that runs with elevated privileges
2. This function can bypass RLS to safely get a user's role
3. Rewrites policies to use this function, breaking the recursion
4. Uses unique policy names to avoid conflicts with existing policies

## Verifying the Fix

After applying the fix:

1. Try to access the Dashboard and User Management sections again
2. The infinite recursion error should be gone
3. You should be able to view users according to your permission level:
   - Super admins can see all users
   - School admins can see users from their school only
   - Regular users can see their own profile 