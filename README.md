# EduAdmin - Educational Platform Management System

A comprehensive educational platform built with Next.js, Supabase, and TypeScript for managing schools, teachers, students, and educational content.

## 🚀 Features

- **Multi-role Authentication**: Super Admin, School Admin, Teacher, Student, Author, Moderator roles
- **School Management**: Create and manage educational institutions
- **User Management**: Comprehensive user registration and management system
- **Book Management**: Educational content creation, moderation, and distribution
- **Registration Keys**: Secure key-based registration system
- **Universal Skeleton Loading**: Smooth loading experience with shimmer animations
- **Dark Mode Support**: Complete dark/light theme support
- **Responsive Design**: Mobile-first responsive interface

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Styling**: Tailwind CSS, shadcn/ui components
- **Deployment**: Vercel
- **Form Handling**: React Hook Form with Zod validation

## 📦 Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd eduadmin
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your Supabase project in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. Run the development server:
```bash
npm run dev
```

## 🎨 Skeleton Loader Component

The application features a universal skeleton loader system that provides smooth loading experiences across all pages.

### Basic Usage

```tsx
import { SkeletonLoader } from '@/components/ui/skeleton';

// Text skeleton
<SkeletonLoader type="text" lines={3} />

// Card skeleton
<SkeletonLoader type="card" count={3} />

// Table skeleton
<SkeletonLoader type="table" rows={5} />

// Avatar skeleton
<SkeletonLoader type="avatar" count={2} />

// Custom skeleton
<SkeletonLoader type="custom" height={60} width={300} count={4} />
```

### Skeleton Types

#### 1. **Text Skeleton** (`type="text"`)
- **Purpose**: Mimics text content with multiple lines
- **Props**: `lines` (number of text lines)
- **Use case**: Loading paragraphs, descriptions, titles

```tsx
<SkeletonLoader type="text" lines={2} />
```

#### 2. **Card Skeleton** (`type="card"`)
- **Purpose**: Mimics card layouts with image, title, and content
- **Props**: `count` (number of cards)
- **Use case**: Loading product cards, user cards, content cards

```tsx
<SkeletonLoader type="card" count={3} />
```

#### 3. **Table Skeleton** (`type="table"`)
- **Purpose**: Mimics table structure with header and rows
- **Props**: `rows` (number of table rows)
- **Use case**: Loading data tables, lists

```tsx
<SkeletonLoader type="table" rows={8} />
```

#### 4. **Avatar Skeleton** (`type="avatar"`)
- **Purpose**: Mimics user avatar with name and info
- **Props**: `count` (number of avatars)
- **Use case**: Loading user lists, profile sections

```tsx
<SkeletonLoader type="avatar" count={5} />
```

#### 5. **Custom Skeleton** (`type="custom"`)
- **Purpose**: Custom dimensions for specific layouts
- **Props**: `height`, `width`, `count`
- **Use case**: Loading buttons, specific UI elements

```tsx
<SkeletonLoader type="custom" height={40} width={120} count={2} />
```

### Advanced Features

#### Shimmer Animation
All skeletons include a smooth shimmer animation that works in both light and dark modes:

```css
/* Automatically applied */
.animate-shimmer {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 2s linear infinite;
}
```

#### Dark Mode Support
Skeletons automatically adapt to dark mode:

```tsx
// Light mode: gray-200 to gray-300
// Dark mode: gray-700 to gray-600
<SkeletonLoader type="text" lines={3} />
```

#### Responsive Design
Skeletons are responsive and adapt to different screen sizes:

```tsx
// Cards automatically adjust to grid layout
<SkeletonLoader type="card" count={6} /> // 1 col mobile, 2 col tablet, 3 col desktop
```

### Implementation Examples

#### Dashboard Page Loading
```tsx
if (isLoading) {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="space-y-2">
        <SkeletonLoader type="text" lines={1} className="w-1/3" />
        <SkeletonLoader type="text" lines={1} className="w-1/2" />
      </div>
      
      {/* Stats cards */}
      <SkeletonLoader type="card" count={4} />
      
      {/* Activity section */}
      <div className="space-y-4">
        <SkeletonLoader type="text" lines={1} className="w-1/4" />
        <SkeletonLoader type="custom" count={5} height={60} />
      </div>
    </div>
  );
}
```

#### Table Page Loading
```tsx
if (isLoading) {
  return (
    <div className="space-y-6">
      {/* Header and filters */}
      <div className="flex justify-between items-center">
        <SkeletonLoader type="text" lines={1} className="w-1/4" />
        <SkeletonLoader type="custom" height={40} width={120} />
      </div>
      
      {/* Filters */}
      <div className="flex gap-4">
        <SkeletonLoader type="custom" height={40} width={200} count={3} />
      </div>
      
      {/* Table */}
      <SkeletonLoader type="table" rows={8} />
    </div>
  );
}
```

### Best Practices

1. **Match Content Structure**: Skeleton should closely match the actual content layout
2. **Consistent Timing**: Use consistent loading times across similar components
3. **Smooth Transitions**: Ensure smooth transition from skeleton to actual content
4. **Responsive Design**: Test skeletons on different screen sizes
5. **Accessibility**: Skeletons should not interfere with screen readers

### Customization

#### Custom Skeleton Styles
```tsx
// Custom className for specific styling
<SkeletonLoader 
  type="custom" 
  height={100} 
  width="100%" 
  className="rounded-xl" 
/>
```

#### Animation Speed
Modify the animation speed in `tailwind.config.js`:

```js
animation: {
  shimmer: 'shimmer 1.5s linear infinite', // Faster animation
}
```

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js app router pages
├── components/
│   ├── ui/                # Reusable UI components
│   │   └── skeleton.tsx   # Universal skeleton loader
│   ├── auth/              # Authentication components
│   └── layout/            # Layout components
├── contexts/              # React contexts
├── utils/                 # Utility functions
└── styles/               # Global styles
```

## 🔐 Authentication Roles

- **Super Admin**: Full system access, manage all schools and users
- **School Admin**: Manage their school, teachers, and students
- **Teacher**: Manage their students and access school books
- **Student**: Access assigned books and materials
- **Author**: Create and manage educational content
- **Moderator**: Review and approve educational content

## 📚 Key Features

### Registration Key System
- Secure key-based registration for different roles
- Automatic key generation with quotas
- Key validation and usage tracking

### Book Management
- Multi-status workflow (Draft → Moderation → Approved → Active)
- Role-based access control
- School library management

### Dashboard Analytics
- Real-time statistics and metrics
- Role-specific dashboard views
- Activity tracking and reporting

## 🚀 Deployment

The application is deployed on Vercel with automatic deployments from the main branch.

```bash
# Build for production
npm run build

# Deploy to Vercel
vercel --prod
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
