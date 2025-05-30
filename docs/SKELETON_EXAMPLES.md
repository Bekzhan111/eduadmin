# Skeleton Loader Examples

This document provides comprehensive examples of how to use the SkeletonLoader component across different scenarios in the EduAdmin platform.

## 📋 Table of Contents

1. [Basic Usage](#basic-usage)
2. [Page-Specific Examples](#page-specific-examples)
3. [Component-Specific Examples](#component-specific-examples)
4. [Advanced Patterns](#advanced-patterns)
5. [Best Practices](#best-practices)

## Basic Usage

### Import the Component
```tsx
import { SkeletonLoader } from '@/components/ui/skeleton';
```

### Simple Text Loading
```tsx
// Single line
<SkeletonLoader type="text" lines={1} />

// Multiple lines
<SkeletonLoader type="text" lines={3} />

// Custom width
<SkeletonLoader type="text" lines={2} className="w-3/4" />
```

### Card Loading
```tsx
// Single card
<SkeletonLoader type="card" count={1} />

// Multiple cards in grid
<SkeletonLoader type="card" count={6} />
```

### Table Loading
```tsx
// Basic table
<SkeletonLoader type="table" rows={5} />

// Large table
<SkeletonLoader type="table" rows={10} />
```

### Avatar Loading
```tsx
// Single avatar
<SkeletonLoader type="avatar" count={1} />

// User list
<SkeletonLoader type="avatar" count={8} />
```

### Custom Dimensions
```tsx
// Button skeleton
<SkeletonLoader type="custom" height={40} width={120} />

// Banner skeleton
<SkeletonLoader type="custom" height={200} width="100%" />

// Multiple custom elements
<SkeletonLoader type="custom" height={60} width={300} count={4} />
```

## Page-Specific Examples

### Dashboard Page
```tsx
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="space-y-2">
        <SkeletonLoader type="text" lines={1} className="w-1/3" />
        <SkeletonLoader type="text" lines={1} className="w-1/2" />
      </div>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SkeletonLoader type="card" count={4} />
      </div>
      
      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <SkeletonLoader type="text" lines={1} className="w-1/4" />
          <SkeletonLoader type="custom" height={300} width="100%" />
        </div>
        <div className="space-y-4">
          <SkeletonLoader type="text" lines={1} className="w-1/4" />
          <SkeletonLoader type="custom" height={300} width="100%" />
        </div>
      </div>
      
      {/* Recent activity */}
      <div className="space-y-4">
        <SkeletonLoader type="text" lines={1} className="w-1/4" />
        <SkeletonLoader type="custom" count={5} height={60} />
      </div>
    </div>
  );
}
```

### Users Management Page
```tsx
function UsersPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <SkeletonLoader type="text" lines={1} className="w-1/4" />
          <SkeletonLoader type="text" lines={1} className="w-1/2" />
        </div>
        <div className="flex items-center space-x-2">
          <SkeletonLoader type="custom" height={32} width={120} />
          <SkeletonLoader type="custom" height={40} width={140} />
        </div>
      </div>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SkeletonLoader type="card" count={4} />
      </div>
      
      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
        <div className="space-y-4">
          <SkeletonLoader type="text" lines={1} className="w-1/6" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SkeletonLoader type="custom" height={40} width="100%" count={3} />
          </div>
        </div>
      </div>
      
      {/* Users table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border">
        <div className="p-6">
          <div className="space-y-4">
            <SkeletonLoader type="text" lines={1} className="w-1/5" />
            <SkeletonLoader type="table" rows={8} />
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Books Management Page
```tsx
function BooksPageSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Header with toggle buttons */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <SkeletonLoader type="text" lines={1} className="w-1/3" />
          <SkeletonLoader type="text" lines={1} className="w-1/2" />
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex space-x-2 mr-4">
            <SkeletonLoader type="custom" height={32} width={80} count={2} />
          </div>
          <SkeletonLoader type="custom" height={32} width={120} />
          <SkeletonLoader type="custom" height={40} width={140} />
        </div>
      </div>
      
      {/* Statistics cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <SkeletonLoader type="card" count={5} />
      </div>
      
      {/* Filters card */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
        <div className="space-y-4">
          <SkeletonLoader type="text" lines={1} className="w-1/6" />
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <SkeletonLoader type="custom" height={40} width="100%" count={5} />
          </div>
        </div>
      </div>
      
      {/* Books table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border">
        <div className="p-6">
          <div className="space-y-4">
            <SkeletonLoader type="text" lines={1} className="w-1/5" />
            <SkeletonLoader type="table" rows={8} />
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Schools Management Page
```tsx
function SchoolsPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <SkeletonLoader type="text" lines={1} className="w-1/4" />
          <SkeletonLoader type="text" lines={1} className="w-1/2" />
        </div>
        <SkeletonLoader type="custom" height={40} width={120} />
      </div>
      
      {/* Summary card */}
      <SkeletonLoader type="card" count={1} />
      
      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <SkeletonLoader type="custom" height={40} width={300} />
        <SkeletonLoader type="custom" height={40} width={200} />
      </div>
      
      {/* Schools table */}
      <SkeletonLoader type="table" rows={6} />
    </div>
  );
}
```

## Component-Specific Examples

### Sidebar Navigation
```tsx
function SidebarSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {/* Navigation items */}
      <SkeletonLoader type="custom" count={6} height={44} />
      
      {/* User info section */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="space-y-2">
          <SkeletonLoader type="text" lines={1} className="w-3/4" />
          <SkeletonLoader type="text" lines={1} className="w-1/2" />
          <SkeletonLoader type="custom" height={32} width="100%" />
        </div>
      </div>
    </div>
  );
}
```

### Modal/Dialog Loading
```tsx
function ModalSkeleton() {
  return (
    <div className="space-y-6">
      {/* Modal header */}
      <SkeletonLoader type="text" lines={1} className="w-1/3" />
      
      {/* Form fields */}
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <SkeletonLoader type="text" lines={1} className="w-1/4" />
            <SkeletonLoader type="custom" height={40} width="100%" />
          </div>
        ))}
      </div>
      
      {/* Action buttons */}
      <div className="flex justify-end space-x-3">
        <SkeletonLoader type="custom" height={40} width={80} count={2} />
      </div>
    </div>
  );
}
```

### Card Grid Loading
```tsx
function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <SkeletonLoader type="card" count={count} />
    </div>
  );
}
```

### Profile Section
```tsx
function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      {/* Profile header */}
      <div className="flex items-center space-x-4">
        <SkeletonLoader type="custom" height={80} width={80} className="rounded-full" />
        <div className="space-y-2">
          <SkeletonLoader type="text" lines={1} className="w-48" />
          <SkeletonLoader type="text" lines={1} className="w-32" />
          <SkeletonLoader type="text" lines={1} className="w-40" />
        </div>
      </div>
      
      {/* Profile details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <SkeletonLoader type="text" lines={1} className="w-1/4" />
          <SkeletonLoader type="custom" count={4} height={50} />
        </div>
        <div className="space-y-4">
          <SkeletonLoader type="text" lines={1} className="w-1/4" />
          <SkeletonLoader type="custom" count={4} height={50} />
        </div>
      </div>
    </div>
  );
}
```

## Advanced Patterns

### Conditional Loading States
```tsx
function ConditionalSkeleton({ 
  isLoading, 
  hasError, 
  isEmpty, 
  children 
}: {
  isLoading: boolean;
  hasError: boolean;
  isEmpty: boolean;
  children: React.ReactNode;
}) {
  if (isLoading) {
    return <SkeletonLoader type="table" rows={5} />;
  }
  
  if (hasError) {
    return (
      <div className="text-center py-8">
        <SkeletonLoader type="text" lines={2} className="w-1/2 mx-auto" />
        <SkeletonLoader type="custom" height={40} width={120} className="mx-auto mt-4" />
      </div>
    );
  }
  
  if (isEmpty) {
    return (
      <div className="text-center py-8">
        <SkeletonLoader type="custom" height={100} width={100} className="mx-auto rounded-full" />
        <SkeletonLoader type="text" lines={2} className="w-1/3 mx-auto mt-4" />
      </div>
    );
  }
  
  return <>{children}</>;
}
```

### Progressive Loading
```tsx
function ProgressiveSkeleton({ stage }: { stage: 'initial' | 'partial' | 'complete' }) {
  if (stage === 'initial') {
    return (
      <div className="space-y-6">
        <SkeletonLoader type="text" lines={1} className="w-1/3" />
        <SkeletonLoader type="card" count={3} />
      </div>
    );
  }
  
  if (stage === 'partial') {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Loaded Title</h1>
        <SkeletonLoader type="card" count={3} />
        <SkeletonLoader type="table" rows={5} />
      </div>
    );
  }
  
  // stage === 'complete' - show actual content
  return null;
}
```

### Responsive Skeleton
```tsx
function ResponsiveSkeleton() {
  return (
    <div className="space-y-6">
      {/* Mobile: 1 column, Tablet: 2 columns, Desktop: 4 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SkeletonLoader type="card" count={4} />
      </div>
      
      {/* Hide on mobile, show on tablet+ */}
      <div className="hidden md:block">
        <SkeletonLoader type="table" rows={8} />
      </div>
      
      {/* Mobile-only simplified view */}
      <div className="md:hidden space-y-3">
        <SkeletonLoader type="avatar" count={5} />
      </div>
    </div>
  );
}
```

## Best Practices

### 1. Match Content Structure
```tsx
// ❌ Bad: Generic skeleton that doesn't match content
<SkeletonLoader type="text" lines={5} />

// ✅ Good: Skeleton that matches actual content layout
<div className="space-y-4">
  <SkeletonLoader type="text" lines={1} className="w-1/3" /> {/* Title */}
  <SkeletonLoader type="text" lines={2} className="w-full" /> {/* Description */}
  <div className="flex space-x-2">
    <SkeletonLoader type="custom" height={32} width={80} /> {/* Button */}
    <SkeletonLoader type="custom" height={32} width={60} /> {/* Button */}
  </div>
</div>
```

### 2. Consistent Loading Times
```tsx
// ✅ Use consistent skeleton patterns across similar components
const SKELETON_CONFIG = {
  userCard: { type: 'card' as const, count: 1 },
  userList: { type: 'avatar' as const, count: 8 },
  dataTable: { type: 'table' as const, rows: 10 }
};

function UserCard({ isLoading }: { isLoading: boolean }) {
  if (isLoading) {
    return <SkeletonLoader {...SKELETON_CONFIG.userCard} />;
  }
  // ... actual content
}
```

### 3. Smooth Transitions
```tsx
// ✅ Use CSS transitions for smooth skeleton-to-content transitions
<div className="transition-opacity duration-300">
  {isLoading ? (
    <SkeletonLoader type="card" count={3} />
  ) : (
    <div className="animate-fade-in">
      {/* Actual content */}
    </div>
  )}
</div>
```

### 4. Accessibility Considerations
```tsx
// ✅ Add proper ARIA labels for screen readers
<div 
  role="status" 
  aria-label="Loading content"
  className="space-y-4"
>
  <SkeletonLoader type="table" rows={5} />
</div>
```

### 5. Performance Optimization
```tsx
// ✅ Memoize skeleton components to prevent unnecessary re-renders
const MemoizedSkeleton = React.memo(function TableSkeleton() {
  return <SkeletonLoader type="table" rows={8} />;
});

function DataTable({ isLoading, data }: { isLoading: boolean; data: any[] }) {
  if (isLoading) {
    return <MemoizedSkeleton />;
  }
  
  return (
    <table>
      {/* Actual table content */}
    </table>
  );
}
```

## Testing Skeleton Components

### Manual Testing
```tsx
// Create a test component to preview different skeleton states
function SkeletonPreview() {
  const [isLoading, setIsLoading] = useState(true);
  
  return (
    <div className="p-6 space-y-8">
      <button 
        onClick={() => setIsLoading(!isLoading)}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Toggle Loading: {isLoading ? 'ON' : 'OFF'}
      </button>
      
      {isLoading ? (
        <SkeletonLoader type="card" count={3} />
      ) : (
        <div>Actual content here</div>
      )}
    </div>
  );
}
```

### Automated Testing
```tsx
// Test skeleton rendering
import { render, screen } from '@testing-library/react';

test('renders skeleton while loading', () => {
  render(<UserList isLoading={true} />);
  
  // Check for skeleton elements
  expect(screen.getByRole('status')).toBeInTheDocument();
  expect(screen.queryByText('User Name')).not.toBeInTheDocument();
});

test('renders content when loaded', () => {
  render(<UserList isLoading={false} users={mockUsers} />);
  
  // Check for actual content
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  expect(screen.getByText('User Name')).toBeInTheDocument();
});
```

This comprehensive guide should help you implement skeleton loading states effectively across your application! 