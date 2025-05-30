# Database Migration Instructions

## Fix for "Only school admins can assign student keys" Error

### Problem
Super administrators were unable to assign student keys to teachers due to database function permissions that only allowed `school` role users.

### Solution
Apply the SQL migration in `src/migrations/fix_assign_keys_permissions.sql` to update the database function.

### How to Apply the Migration

#### Option 1: Using Supabase Dashboard (Recommended)
1. Open your Supabase project dashboard
2. Go to the **SQL Editor** section
3. Copy the entire content from `src/migrations/fix_assign_keys_permissions.sql`
4. Paste it into a new query in the SQL Editor
5. Click **Run** to execute the migration

#### Option 2: Using Supabase CLI
```bash
# If you have Supabase CLI installed
supabase db reset --linked
# Then apply your migrations
```

#### Option 3: Direct Database Connection
If you have direct PostgreSQL access to your database:
```bash
psql "your-database-connection-string" -f src/migrations/fix_assign_keys_permissions.sql
```

### What This Migration Does

1. **Drops the existing function** to ensure clean update
2. **Creates updated function** with proper role permissions:
   - `super_admin`: Can assign keys to any teacher in any school
   - `school`: Can assign keys only to teachers in their own school
   - Other roles: Cannot assign keys (proper error message)
3. **Maintains security** while enabling appropriate administrative functionality
4. **Grants proper permissions** to authenticated users

### Verification

After applying the migration, test the functionality:

1. **As Super Admin**: Should be able to assign student keys to teachers in any school
2. **As School Admin**: Should be able to assign student keys to teachers in their own school
3. **As Other Roles**: Should receive clear error message when attempting to assign keys

### Expected Results

- ✅ Super administrators can assign student keys to teachers
- ✅ School administrators retain their existing permissions
- ✅ Proper error messages for unauthorized users
- ✅ Maintains security model with role-based permissions

### Troubleshooting

If you encounter any issues:

1. **Permission Errors**: Ensure you're running the migration with database admin privileges
2. **Function Already Exists**: The migration includes `DROP FUNCTION IF EXISTS` to handle this
3. **Still Getting Errors**: Check the browser console for specific error messages and verify the migration was applied successfully

### Rollback (If Needed)

If you need to rollback this change:
```sql
-- Revert to school-only permissions (not recommended)
-- This would require recreating the original function with only 'school' role check
```

**Note**: Rollback is not recommended as super administrators should logically have equal or greater permissions than school administrators. 