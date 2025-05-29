# Bug Fixes

This file documents any bugs encountered during development and their fixes.

## Current Bugs
No bugs reported yet.

## Resolved Bugs

### 1. Row Level Security Policies with USING + WITH CHECK
**Issue:** When creating RLS policies for INSERT operations, encountered error that requested WITH CHECK expression instead of USING.

**Fix:** Changed the policy syntax to use WITH CHECK for INSERT operations instead of USING.

```sql
-- Incorrect syntax
create policy "Super admin can insert users"
on public.users for insert
using (exists (...))
with check (true);

-- Correct syntax
create policy "Super admin can insert users"
on public.users for insert
with check (exists (...));
```

### 2. useState vs useEffect Hook
**Issue:** Incorrect usage of useState hook with a callback function and dependency array, which is the pattern for useEffect.

**Fix:** Changed to useEffect hook for handling side effects on component mount.

```jsx
// Incorrect
useState(() => {
  // Side effect code
}, []);

// Correct
useEffect(() => {
  // Side effect code
}, [dependencies]);
```

### 3. Type Issues with Form Values
**Issue:** Type errors when using string vs number in form values with zod and react-hook-form.

**Fix:** Used z.coerce.number() for number inputs to properly handle type conversion.

```typescript
// Incorrect
z.string().transform(val => parseInt(val, 10)).refine(val => !isNaN(val) && val > 0)

// Correct
z.coerce.number().min(1)
```

### 4. TailwindCSS PostCSS Plugin Configuration
**Issue:** Build error when TailwindCSS wasn't properly configured with the correct PostCSS plugin.

**Fix:** Updated postcss.config.js to use @tailwindcss/postcss instead of tailwindcss directly.

```javascript
// Incorrect
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}

// Correct
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}
```

### 5. ESLint Errors with Unused Variables
**Issue:** ESLint errors for intentionally unused variables in function parameters.

**Fix:** Updated ESLint configuration to ignore variables starting with underscore.

```javascript
// Add to eslint.config.mjs
{
  rules: {
    "@typescript-eslint/no-unused-vars": ["error", {
      "argsIgnorePattern": "^_",
      "varsIgnorePattern": "^_"
    }]
  }
}
```

### 6. Next.js Cookies API Type Issue
**Issue:** Type error with cookies() function returning a Promise in newer versions of Next.js.

**Fix:** Updated the cookies handling in Supabase server client to use async/await.

```typescript
// Incorrect
const cookieStore = cookies();
return cookieStore.get(name)?.value;

// Correct
async get(name: string) {
  const cookieStore = await cookies();
  return cookieStore.get(name)?.value;
}
```

### 7. Tailwind CSS v4 Unknown Utility Classes
**Issue:** Build error: "Cannot apply unknown utility class: bg-white" when using Tailwind CSS v4, which is still in early stages.

**Fix:** 
Downgraded from Tailwind CSS v4 to v3.4.1 which has better compatibility with Next.js:

```bash
# Remove Tailwind CSS v4
npm uninstall tailwindcss @tailwindcss/postcss

# Install Tailwind CSS v3 with compatible dependency versions
npm install tailwindcss@3.4.1 postcss@8.4.35 autoprefixer@10.4.17 --save-dev
```

And updated configuration files:

```javascript
// postcss.config.js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}

// tailwind.config.js
module.exports = {
  // Standard Tailwind CSS v3 configuration
  // No need for explicit color definitions
}
```

### 8. Turbopack Compatibility with Tailwind CSS
**Issue:** After configuring Tailwind CSS, encountered Turbopack errors during development.

**Fix:** Removed the `--turbopack` flag from the development script in package.json to use the standard Next.js development server which has better compatibility with Tailwind CSS.

```json
// Before
"scripts": {
  "dev": "next dev --turbopack",
  // other scripts
}

// After
"scripts": {
  "dev": "next dev",
  // other scripts
}
```

### 9. Error Handling in User Data Fetching
**Issue:** Error in KeyManagement component when fetching user data: `Error fetching user info: {}` with no useful error details.

**Fix:** Improved error handling in the KeyManagement component:
1. Added proper session error handling
2. Added checks for userData existence
3. Added appropriate error messages for different failure scenarios
4. Set loading state properly on error conditions
5. Made async functions properly awaited
6. Added nested try/catch blocks to better isolate and report database errors
7. Added detailed error messages that include the actual error message from the database
8. Added database table verification to check if required tables exist
9. Enhanced Supabase client creation with environment variable checks

```typescript
// Added table verification function
const checkDatabaseTables = async () => {
  try {
    const supabase = createClient();
    const { data: tableData, error: tableError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
      
    if (tableError) {
      if (tableError.code === '42P01') { // PostgreSQL error code for undefined_table
        console.error('Users table does not exist:', tableError);
        setError('Database table "users" does not exist. Please run database migrations.');
      } else {
        console.error('Error checking users table:', tableError);
        setError(`Database error: ${tableError.message}`);
      }
      setIsLoading(false);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking database tables:', error);
    setError(`Database connection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    setIsLoading(false);
    return false;
  }
};

// Enhanced Supabase client creation
export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // Check if the environment variables are set
  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase environment variables are missing');
    
    // Provide specific error messages
    if (!supabaseUrl && !supabaseKey) {
      console.error('Both NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are missing');
    } else if (!supabaseUrl) {
      console.error('NEXT_PUBLIC_SUPABASE_URL is missing');
    } else {
      console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY is missing');
    }
  }
  
  return createBrowserClient(supabaseUrl || '', supabaseKey || '');
};
```

### 10. 403 Forbidden Error
**Issue:** Error when trying to access a protected route.

**Fix:** Updated the error handling in the component to show a more user-friendly error message.

```typescript
// Incorrect
const error = new Error('Forbidden');
error.statusCode = 403;
throw error;

// Correct
const error = new Error('You do not have permission to access this resource.');
error.statusCode = 403;
throw error;
```

### 11. Infinite Recursion in RLS Policies
**Issue:** Database error causing "infinite recursion detected in policy for relation 'users'" when trying to access user data. This was happening because the RLS policies for the users table were self-referential - they were querying the same table they were protecting.

**Fix:** Applied a SQL migration that:
1. Created a SECURITY DEFINER function that runs with elevated privileges to bypass RLS
2. Dropped all existing policies on the users table
3. Created new policies that use the secure function to avoid recursion

```sql
-- 1. Created a helper function that avoids recursion by running with elevated privileges
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text 
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role FROM users WHERE id = user_id;
  RETURN user_role;
END;
$$;

-- 2. Dropped all existing policies and created new ones that use the helper function
-- Example of fixed policy for super admins:
CREATE POLICY "RLS_super_admin_see_all_20250520_123456" ON users
FOR SELECT USING (
  public.get_user_role(auth.uid()) = 'super_admin'
);
```

The fix ensures that policies no longer directly reference columns from the users table in a way that triggers infinite recursion, while still maintaining proper row-level security based on user roles.

### 12. Key Hierarchy System Implementation
**Issue:** The system required a hierarchical key distribution system (super_admin → school → teacher → student) with specific registration flows for different roles.

**Fix:** 
1. Created specialized database functions with proper authorization checks:
   - `generate_school_key` - Super admin generates keys for schools
   - `generate_teacher_keys` - Generates multiple teacher keys for a school
   - `generate_student_keys` - Generates multiple student keys for a school
   - `assign_student_keys_to_teacher` - Assigns student keys to specific teachers
2. Implemented triggers to track and enforce teacher quotas:
   - `check_teacher_quota` - Prevents exceeding max student limits
   - `increment_teacher_student_count` - Updates counts when students register
3. Updated RLS policies to support the key hierarchy and secure access controls
4. Created a multi-step registration flow that adapts based on the key role:
   - School registration requires additional details (name, city, address, BIN)
   - Other roles have a streamlined single-step process

### 13. Role-Specific Dashboard Views
**Issue:** The dashboard needed to provide different information and functionality based on user roles.

**Fix:**
1. Created a `get_dashboard_summary` function that returns personalized stats based on the user role
2. Implemented role-specific dashboard UIs:
   - Super admin: school stats, user counts, key management
   - School admin: teacher/student stats, key assignment interface
   - Teacher: student quota tracking, registration key management
   - Student: simple dashboard with school information
   - Author/Moderator: content management interfaces
3. Developed specialized UI components for key management and assignment

### 14. Missing Email Column in Users Table
**Issue:** Errors when trying to query the `email` column in the users table, resulting in HTTP 400 Bad Request errors.

**Fix:**
1. Added the missing email column to the users table
2. Updated the email values for existing users by copying from the auth.users table
```sql
-- Add the missing email column to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS email TEXT;

-- Copy email from auth.users to public.users for existing users
UPDATE public.users 
SET email = auth.users.email
FROM auth.users 
WHERE public.users.id = auth.users.id
AND public.users.email IS NULL;
```

### 15. Ambiguous Column Reference in Database Functions
**Issue:** When generating keys or assigning keys, getting errors about ambiguous column references:
```
column reference "school_id" is ambiguous
```

**Fix:**
1. Updated the functions to use fully qualified column names (`users.school_id` instead of just `school_id`)
2. Renamed function parameters that conflicted with column names:
   - Changed `teacher_id` to `target_teacher_id` in the assign keys function
   - Changed `school_id` to `target_school_id` in key generation functions
3. Used explicit variable declarations and better naming to avoid ambiguity
4. Fixed the function calls in the UI components to use the updated parameter names
5. Dropped and recreated all affected functions to ensure clean implementation
6. Updated the register_school function to use the renamed functions properly

### 16. Mobile Navigation and Role-Based Access
**Issue:** The application lacked a proper mobile-responsive navigation with role-based access control. Also, the dashboard page had metadata in a client component causing a Next.js error.

**Fix:**
1. Created a new integrated layout structure:
   - Added a responsive `AppBar` component for the top navigation
   - Enhanced the `Sidebar` component with proper mobile support
   - Created a `DashboardLayout` component to integrate both elements
2. Implemented proper role-based navigation filtering:
   - Added role-specific menu items that only appear for appropriate roles
   - Organized navigation items with consistent icons and labels
   - Fixed responsive states for mobile and desktop views
3. Fixed the client component issue:
   - Removed metadata from client components (metadata belongs in server components only)
   - Updated the dashboard pages to work within the new layout system

```typescript
// Created a DashboardLayout component that integrates AppBar and Sidebar
'use client';

import { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import AppBar from '@/components/layout/AppBar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <AppBar onToggleSidebar={toggleSidebar} />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} />
        
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
```

The fix ensures:
1. Mobile users can navigate the application through a hamburger menu
2. Desktop users have a persistent sidebar navigation
3. Navigation items are filtered by user role (security + UX improvement)
4. Consistent layout across all dashboard pages

### 17. Empty Error Details in Navigation Components
**Issue:** Error message "Error fetching user info: {}" appearing in the console, with no detailed information about what went wrong when fetching user data in the AppBar and Sidebar components.

**Fix:**
1. Improved error handling in both AppBar and Sidebar components:
   - Added proper null/undefined checks for sessionData and userData
   - Implemented nested try/catch blocks to isolate different error sources
   - Added specific error messages for different failure scenarios
   - Improved error formatting to include actual error messages instead of empty objects
   - Added early returns in error conditions to prevent undefined value access

```typescript
// Before (error-prone code):
try {
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role, name, email, display_name')
    .eq('id', sessionData.session.user.id)
    .single();
  
  if (userError) {
    console.error('Error fetching user info:', userError);
    setIsLoading(false);
    return;
  }
  
  setUserInfo({
    role: userData.role,
    name: userData.display_name || userData.name || null,
    email: userData.email || sessionData.session.user.email || '',
  });
} catch (error) {
  console.error('Error in getUserInfo:', error);
} finally {
  setIsLoading(false);
}

// After (improved error handling):
try {
  const supabase = createClient();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.error('Session error:', sessionError.message);
    setIsLoading(false);
    return;
  }
  
  if (!sessionData?.session) {
    console.error('No active session');
    setIsLoading(false);
    return;
  }
  
  try {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, name, email, display_name')
      .eq('id', sessionData.session.user.id)
      .single();
    
    if (userError) {
      console.error('Error fetching user info:', userError.message);
      setIsLoading(false);
      return;
    }
    
    if (!userData) {
      console.error('No user data found');
      setIsLoading(false);
      return;
    }
    
    setUserInfo({
      role: userData.role || 'unknown',
      name: userData.display_name || userData.name || null,
      email: userData.email || sessionData.session.user.email || '',
    });
  } catch (userDataError) {
    console.error('Error in user data fetch:', userDataError instanceof Error ? userDataError.message : String(userDataError));
  }
} catch (error) {
  console.error('Error in getUserInfo:', error instanceof Error ? error.message : String(error));
} finally {
  setIsLoading(false);
}
```

The fix ensures:
1. Proper error messages with actual details instead of empty objects
2. Protection against accessing properties of undefined objects
3. Clearer reporting of different types of failures (session errors vs user data errors)
4. Fallback values for missing data points (role, name, email)

### 18. Missing Column in Database Schema
**Issue:** Error "column users.name does not exist" occurring when the AppBar component tries to query a column (`name`) that doesn't exist in the users table.

**Fix:**
1. Updated the query in the AppBar component to only select columns that actually exist in the database:
   - Removed `name` from the query, keeping only `role`, `email`, and `display_name`
   - Modified the user info assignment to only use `display_name` as the name fallback
   - Added a comment in the Sidebar component to document that we should only query for columns we need
   
```typescript
// Before (querying nonexistent column):
const { data: userData, error: userError } = await supabase
  .from('users')
  .select('role, name, email, display_name')
  .eq('id', sessionData.session.user.id)
  .single();
  
// After (only querying existing columns):
const { data: userData, error: userError } = await supabase
  .from('users')
  .select('role, email, display_name')
  .eq('id', sessionData.session.user.id)
  .single();

// Before (referencing nonexistent column):
setUserInfo({
  role: userData.role || 'unknown',
  name: userData.display_name || userData.name || null,
  email: userData.email || sessionData.session.user.email || '',
});

// After (using only existing columns):
setUserInfo({
  role: userData.role || 'unknown',
  name: userData.display_name || null,
  email: userData.email || sessionData.session.user.email || '',
});
```

This fix ensures that we only query for columns that exist in the database schema, preventing SQL errors. It's a good practice to keep database queries minimal by only requesting the specific columns needed by the component.

### 19. Type Error in TeachersPage Component
**Issue:** TypeScript error in the teachers dashboard page regarding nested property access in the Supabase query response: "Property 'name' does not exist on type '{ name: any; }[]'."

**Fix:** Improved the data mapping logic to handle the nested schools object more safely:

1. Added better type handling for the response from Supabase
2. Used type guards to safely extract the school name
3. Created a proper Teacher object with explicit property mapping rather than spreading with modification
4. Applied proper type casting to ensure the resulting object conforms to our Teacher type

```typescript
// Before (causing type error):
const formattedTeachers = teachersData ? teachersData.map(teacher => ({
  ...teacher,
  school_name: teacher.schools?.name || 'Unknown School'
})) : [];

// After (fixed):
if (teachersData) {
  const formattedTeachers = teachersData.map((teacher) => {
    const schoolName = teacher.schools && typeof teacher.schools === 'object' && 
      'name' in teacher.schools && typeof teacher.schools.name === 'string' 
      ? teacher.schools.name 
      : 'Unknown School';
        
    return {
      id: teacher.id,
      email: teacher.email,
      display_name: teacher.display_name,
      role: teacher.role,
      max_students: teacher.max_students,
      students_count: teacher.students_count,
      created_at: teacher.created_at,
      school_id: teacher.school_id,
      school_name: schoolName
    } as Teacher;
  });
    
  setTeachers(formattedTeachers);
} else {
  setTeachers([]);
}
```

This approach ensures type safety when dealing with nested objects in Supabase query responses, particularly when joining related tables.

### 20. Enhanced Registration Process with Full Name and Key-Based Role Assignment
**Enhancement:** Updated the registration process to include full name collection and automatic role assignment based on registration key type.

**Changes Made:**
1. **Updated Registration Schema**: Added `full_name` field as a required field in the registration form
2. **Enhanced Database Functions**: Updated `register_with_key` and `register_school` functions to accept and store `display_name` parameter
3. **Improved User Experience**: Registration now shows the assigned role after successful registration
4. **Key-Based Role Assignment**: The system now automatically assigns roles (School, Teacher, Student, Moderator, Author) based on the registration key provided

**Frontend Changes:**
```typescript
// Before (only email, password, key):
const registrationSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  key: z.string().min(4, 'Please enter a valid registration key')
});

// After (includes full name):
const registrationSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  key: z.string().min(4, 'Please enter a valid registration key')
});
```

**Database Function Updates:**
```sql
-- Updated register_with_key function to accept display_name
CREATE OR REPLACE FUNCTION public.register_with_key(
  user_id UUID,
  registration_key TEXT,
  display_name TEXT DEFAULT NULL
)

-- Updated register_school function to accept display_name
CREATE OR REPLACE FUNCTION public.register_school(
  registration_key TEXT,
  user_id UUID,
  display_name TEXT,
  school_name TEXT,
  city TEXT,
  address TEXT,
  bin TEXT,
  max_teachers INTEGER DEFAULT 10,
  max_students INTEGER DEFAULT 100
)
```

**User Flow Improvements:**
1. User enters full name, email, password, and registration key
2. System validates the key and determines the role automatically
3. For school roles, additional school information is collected in step 2
4. For other roles (teacher, student, author, moderator), registration completes immediately
5. Success message shows the assigned role: "Registration successful! You have been registered as [role]. You can now log in."

This enhancement ensures that:
- All users have proper display names stored in the database
- Role assignment is automatic and secure based on valid registration keys
- The registration process is streamlined and user-friendly
- Different user types get appropriate registration flows

### 21. Registration Page UI Enhancement and User Experience Improvements
**Enhancement:** Completely redesigned the registration page with modern UI, better information architecture, and improved user experience.

**Changes Made:**
1. **Modern Visual Design**: 
   - Added gradient background with blue-to-indigo theme
   - Implemented card-based layout with proper shadows and borders
   - Added branded header with icon and improved typography
   - Enhanced dark mode support throughout the interface

2. **Role Information Card**: 
   - Added informative card explaining different registration key types
   - Used color-coded icons for each role (School, Teacher, Student, Author, Moderator)
   - Provided clear descriptions of what each key type does
   - Added explanatory text about automatic role assignment

3. **Enhanced Form Design**:
   - Added icons to form labels for better visual hierarchy
   - Implemented proper placeholder text for all inputs
   - Enhanced error state styling with better color contrast
   - Added helpful hints and validation messages
   - Used monospace font for registration keys and BIN fields

4. **Improved Loading States**:
   - Added animated loading spinners for better feedback
   - Enhanced button states with proper disabled styling
   - Improved loading text to be more descriptive

5. **Better Error and Success Handling**:
   - Redesigned error messages with icons and better styling
   - Enhanced success messages with visual feedback
   - Improved message positioning and readability
   - Added proper dark mode support for all message types

6. **School Registration Step Enhancement**:
   - Added dedicated header section for school information step
   - Improved form layout and field organization
   - Enhanced button styling and interaction states
   - Better visual separation between steps

**UI Components Added:**
```typescript
// Icon imports for better visual hierarchy
import { User, Mail, Lock, Key, School, Users, BookOpen, Shield, UserCheck } from 'lucide-react';

// Role information card with color-coded icons
<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
    <Key className="h-5 w-5 mr-2 text-indigo-600" />
    Registration Key Types
  </h3>
  <div className="space-y-3 text-sm">
    <div className="flex items-center text-gray-700 dark:text-gray-300">
      <School className="h-4 w-4 mr-2 text-blue-500" />
      <span><strong>School Key:</strong> Register as a school administrator</span>
    </div>
    // ... other role types
  </div>
</div>
```

**Enhanced Form Styling:**
```typescript
// Before (basic styling):
<Input
  id="full_name"
  type="text"
  {...registerForm1('full_name')}
  className={errorsForm1.full_name ? 'border-red-300' : ''}
/>

// After (enhanced with icons, placeholders, dark mode):
<label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
  <User className="h-4 w-4 inline mr-1" />
  Full Name
</label>
<Input
  id="full_name"
  type="text"
  placeholder="Enter your full name"
  {...registerForm1('full_name')}
  className={`${errorsForm1.full_name ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'} dark:bg-gray-700 dark:text-white`}
/>
```

**User Experience Improvements:**
1. **Clear Information Architecture**: Users now understand what each registration key does before entering it
2. **Visual Feedback**: Better loading states, error messages, and success confirmations
3. **Accessibility**: Proper color contrast, clear labels, and helpful text
4. **Mobile Responsive**: Enhanced layout that works well on all screen sizes
5. **Dark Mode Support**: Complete dark mode implementation for better user preference support

This enhancement transforms the registration experience from a basic form to a professional, informative, and user-friendly interface that guides users through the registration process while clearly explaining the role-based system.

### 22. Email Confirmation 404 Error and PKCE Authentication Flow Fix
**Issue:** When users clicked the email confirmation link sent by Supabase, they encountered a 404 error and PKCE authentication failures with the error "both auth code and code verifier should be non-empty".

**Root Cause:** 
1. The registration process was configured to redirect to `/auth/callback` after email confirmation
2. No auth callback route was created to handle the email confirmation flow
3. Supabase PKCE flow requires a server-side route handler, not a client-side page component
4. The auth code exchange must happen on the server to properly handle the PKCE flow

**Final Solution Applied:**
1. **Removed Client-Side Page Component**: Deleted the page.tsx approach which doesn't work with PKCE
2. **Created Server-Side Route Handler**: Added `/src/app/auth/callback/route.ts` to handle email confirmations server-side
3. **Implemented Proper PKCE Flow**: Used `supabase.auth.exchangeCodeForSession(code)` in the route handler
4. **Added Error Handling**: Proper error handling with redirects to login page with error messages
5. **Enhanced User Feedback**: Updated login form to display auth callback errors from URL parameters

**Technical Implementation:**
```typescript
// Server-side route handler for PKCE auth callback
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Successful authentication, redirect to dashboard
      return NextResponse.redirect(`${origin}${next}`);
    } else {
      console.error('Auth callback error:', error);
      // Redirect to login with error message
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
    }
  }

  // If no code, redirect to login
  return NextResponse.redirect(`${origin}/login`);
}
```

**Enhanced Error Handling in Login Form:**
```typescript
// Check for error messages from URL parameters (e.g., from auth callback)
useEffect(() => {
  const urlError = searchParams.get('error');
  if (urlError) {
    setError(decodeURIComponent(urlError));
    // Clean up the URL by removing the error parameter
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('error');
    window.history.replaceState({}, '', newUrl.toString());
  }
}, [searchParams]);
```

**Key Differences from Previous Approach:**
1. **Server-Side Processing**: Auth code exchange happens on the server, not client
2. **Proper PKCE Support**: Route handler correctly handles PKCE flow requirements
3. **Automatic Redirects**: Users are automatically redirected after successful/failed authentication
4. **Error Propagation**: Errors are passed to the login page via URL parameters
5. **Clean User Experience**: No manual page components needed, everything is handled automatically

**Result:** 
- Email confirmation now works seamlessly with PKCE flow
- No more "auth code and code verifier should be non-empty" errors
- Users are properly authenticated after clicking confirmation links
- Clear error feedback for any authentication failures
- Automatic redirects to appropriate pages based on auth status
- Improved overall security with proper PKCE implementation

### 23. "No Active Session" Console Errors and Build Issues
**Issue:** Console errors showing "No active session" were appearing when AppBar and Sidebar components tried to fetch user information, even when users weren't logged in. Additionally, build errors occurred due to dynamic server usage and missing Suspense boundaries.

**Root Cause:** 
1. AppBar and Sidebar components were being rendered even when no user session existed
2. The components were treating the absence of a session as an error rather than a normal state
3. Pages using server-side authentication with cookies needed to be marked as dynamic
4. LoginForm component using `useSearchParams()` needed a Suspense boundary

**Fix Applied:**
1. **Improved Error Handling in Layout Components**: 
   - Updated AppBar and Sidebar to not log "No active session" as an error
   - Changed the message to a comment indicating it's a normal state
   - Maintained proper error logging for actual session errors

2. **Enhanced DashboardLayout Authentication**:
   - Added authentication check before rendering AppBar and Sidebar
   - Implemented loading state while checking authentication
   - Added automatic redirect to login for unauthenticated users
   - Prevented layout components from rendering without valid session

3. **Fixed Build Errors**:
   - Added `export const dynamic = 'force-dynamic'` to pages using server-side authentication
   - Wrapped LoginForm in Suspense boundary to handle `useSearchParams()` properly
   - Added loading fallback UI for better user experience

**Technical Implementation:**
```typescript
// DashboardLayout authentication check
useEffect(() => {
  const checkAuth = async () => {
    try {
      const supabase = createClient();
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError.message);
        setIsAuthenticated(false);
        router.push('/login');
        return;
      }
      
      if (!sessionData?.session) {
        setIsAuthenticated(false);
        router.push('/login');
        return;
      }
      
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Auth check error:', error instanceof Error ? error.message : String(error));
      setIsAuthenticated(false);
      router.push('/login');
    }
  };

  checkAuth();
}, [router]);

// Suspense boundary for LoginForm
<Suspense fallback={<LoadingFallback />}>
  <LoginForm />
</Suspense>

// Dynamic export for auth pages
export const dynamic = 'force-dynamic';
```

**Result:** 
- No more "No active session" console errors
- Clean authentication flow with proper loading states
- Successful builds without dynamic server usage errors
- Better user experience with loading indicators
- Proper separation of authenticated and unauthenticated states
