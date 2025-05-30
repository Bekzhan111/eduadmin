# Registration Key System Documentation

## Overview
The EduAdmin platform uses a hierarchical registration key system to control user access and maintain proper role-based organization. This system ensures that users are properly connected to their respective schools or operate independently based on their role.

## Key Hierarchy

### 1. Super Admin Level
- **Super Admins** can create all types of keys
- They have the highest level of access and can manage the entire platform

### 2. School Level (Standalone)
- **School Keys** are created by Super Admins
- These keys are **standalone** and not connected to any other entity
- School admins register using these keys and gain the ability to manage their institution

### 3. School-Connected Level
Once a school is registered, school administrators can create:

#### Teacher Keys
- **Connected to the specific school**
- Teachers registered with these keys become part of that school
- Can be managed by the school administrator

#### Student Keys  
- **Connected to the specific school**
- Students registered with these keys become part of that school
- Can be managed by the school administrator

### 4. Platform Level (Standalone)
Super Admins can also create platform-wide roles:

#### Author Keys
- **Standalone** keys for content creators
- Not connected to any specific school
- Have platform-wide content creation permissions

#### Moderator Keys
- **Standalone** keys for content moderators
- Not connected to any specific school
- Have platform-wide moderation permissions

## Registration Process

### For School Administrators
1. User enters full name, email, password, and school registration key
2. System validates the key and identifies it as a school key
3. User proceeds to step 2: School Information
4. User provides school details (name, city, address, BIN)
5. System creates both user account and school record
6. User can now log in and manage their school

### For Teachers and Students
1. User enters full name, email, password, and teacher/student registration key
2. System validates the key and identifies the associated school
3. User is immediately registered and connected to the school
4. User can log in and access school-specific features

### For Authors and Moderators
1. User enters full name, email, password, and author/moderator registration key
2. System validates the key (standalone, not school-connected)
3. User is immediately registered with platform-wide permissions
4. User can log in and access content creation/moderation features

## Key Generation Logic

### Database Function: `create_registration_key`
```sql
-- Parameters:
-- creator_id: UUID of the user creating the key
-- role: 'school' | 'teacher' | 'student' | 'author' | 'moderator'
-- school_id: UUID (required for teacher/student, null for others)
-- max_uses: Integer (how many times the key can be used)
-- expires_in: Interval (e.g., '7 days', '30 days')
```

### Key Assignment Rules
1. **School keys**: `school_id` is NULL (standalone)
2. **Teacher/Student keys**: `school_id` is set to the creator's school
3. **Author/Moderator keys**: `school_id` is NULL (standalone)

## Database Schema

### registration_keys table
```sql
- id: UUID (primary key)
- key: TEXT (unique registration key)
- role: TEXT (school/teacher/student/author/moderator)
- school_id: UUID (foreign key to schools table, nullable)
- teacher_id: UUID (for student keys created by teachers)
- is_active: BOOLEAN (whether key can be used)
- max_uses: INTEGER (maximum number of uses)
- uses: INTEGER (current number of uses)
- expires_at: TIMESTAMP (when key expires)
- created_at: TIMESTAMP (when key was created)
- created_by: UUID (who created the key)
```

## Security Considerations

1. **Key Validation**: All keys are validated for activity status and expiration
2. **Role Assignment**: Users cannot choose their role; it's determined by the key
3. **School Association**: Teacher/Student users are automatically linked to the correct school
4. **Usage Limits**: Keys have configurable usage limits and expiration dates
5. **Creator Restrictions**: School admins can only create keys for their own school

## User Interface

The registration page provides:
- Clear explanation of key types and hierarchy
- Visual indicators showing the relationship between roles
- Automatic role detection based on the provided key
- Multi-step registration for school administrators
- Single-step registration for other roles

## Benefits of This System

1. **Controlled Access**: Only authorized personnel can create registration keys
2. **Proper Organization**: Users are automatically organized by school/role
3. **Security**: No manual role selection reduces potential abuse
4. **Scalability**: Schools can independently manage their users
5. **Flexibility**: Platform-wide roles (Author/Moderator) operate independently
6. **Audit Trail**: Full tracking of who created which keys and when 