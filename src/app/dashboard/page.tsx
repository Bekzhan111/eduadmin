'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Define types for summary data
type DashboardSummary = {
  role: string;
  school_id?: string;
  school_name?: string;
  teacher_id?: string;
  teacher_count?: number;
  student_count?: number;
  user_count?: number;
  school_count?: number;
  key_stats?: {
    school_keys?: number;
    teacher_keys?: number;
    student_keys?: number;
    author_keys?: number;
    moderator_keys?: number;
    unassigned_student_keys?: number;
    assigned_keys?: number;
  };
  student_quota?: number;
};

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  
  const fetchDashboardSummary = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const supabase = createClient();
      
      // Check if user is logged in
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        setError('Error fetching session data');
        setIsLoading(false);
        return;
      }
      
      if (!sessionData.session) {
        router.push('/login');
        return;
      }
      
      // Fetch dashboard summary based on role
      const { data: summaryData, error: summaryError } = await supabase.rpc(
        'get_dashboard_summary',
        { user_id: sessionData.session.user.id }
      );
      
      if (summaryError) {
        console.error('Error fetching summary:', summaryError);
        setError(`Error fetching dashboard summary: ${summaryError.message}`);
        setIsLoading(false);
        return;
      }
      
      setSummary(summaryData);
    } catch (error) {
      console.error('Dashboard error:', error);
      setError(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, [router]);
  
  useEffect(() => {
    fetchDashboardSummary();
  }, [fetchDashboardSummary]);
  
  if (isLoading) {
    return <div className="p-4">Loading dashboard...</div>;
  }
  
  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <Button onClick={fetchDashboardSummary}>Retry</Button>
      </div>
    );
  }
  
  if (!summary) {
    return (
      <div className="p-4">
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded mb-4">
          No dashboard data available.
        </div>
      </div>
    );
  }
  
  // Different dashboard UI based on role
  switch (summary.role) {
    case 'super_admin':
      return (
        <div className="space-y-6">
          <h1 className="text-2xl font-semibold mb-6">Super Admin Dashboard</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Schools</h2>
              <p className="mt-1 text-2xl font-semibold">{summary.school_count}</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</h2>
              <p className="mt-1 text-2xl font-semibold">{summary.user_count}</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">School Keys</h2>
              <p className="mt-1 text-2xl font-semibold">{summary.key_stats?.school_keys || 0}</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Author/Moderator Keys</h2>
              <p className="mt-1 text-2xl font-semibold">
                {(summary.key_stats?.author_keys || 0) + (summary.key_stats?.moderator_keys || 0)}
              </p>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/dashboard/schools">
                <Button className="w-full">Manage Schools</Button>
              </Link>
              <Link href="/dashboard/teachers">
                <Button className="w-full">Manage Teachers</Button>
              </Link>
              <Link href="/dashboard/students">
                <Button className="w-full">Manage Students</Button>
              </Link>
            </div>
          </div>
        </div>
      );
    
    case 'school':
      return (
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold">School Dashboard</h1>
            <div className="text-sm text-gray-500">
              {summary.school_name}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Teachers</h2>
              <p className="mt-1 text-2xl font-semibold">{summary.teacher_count}</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Students</h2>
              <p className="mt-1 text-2xl font-semibold">{summary.student_count}</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Available Teacher Keys</h2>
              <p className="mt-1 text-2xl font-semibold">{summary.key_stats?.teacher_keys || 0}</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Unassigned Student Keys</h2>
              <p className="mt-1 text-2xl font-semibold">{summary.key_stats?.unassigned_student_keys || 0}</p>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href={`/dashboard/schools/${summary.school_id}`}>
                <Button className="w-full">Manage School</Button>
              </Link>
              <Link href="/dashboard/teachers">
                <Button className="w-full">Manage Teachers</Button>
              </Link>
            </div>
          </div>
        </div>
      );
    
    case 'teacher':
      return (
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold">Teacher Dashboard</h1>
            <div className="text-sm text-gray-500">
              {summary.school_name}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Students</h2>
              <p className="mt-1 text-2xl font-semibold">
                {summary.student_count} / {summary.student_quota || 'Unlimited'}
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Available Student Keys</h2>
              <p className="mt-1 text-2xl font-semibold">{summary.key_stats?.assigned_keys || 0}</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">School</h2>
              <p className="mt-1 text-lg font-semibold">{summary.school_name}</p>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Student Registration Keys</h2>
            
            <p className="text-sm text-gray-600 mb-4">
              Share these keys with your students to allow them to register for your class.
            </p>
            
            <Link href="/dashboard/students">
              <Button>Manage My Students</Button>
            </Link>
          </div>
        </div>
      );
    
    case 'student':
      return (
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold">Student Dashboard</h1>
            <div className="text-sm text-gray-500">
              {summary.school_name}
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Student Information</h2>
            
            <div className="space-y-2">
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium">School:</span>
                <span>{summary.school_name || 'Not assigned'}</span>
              </div>
              
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium">Teacher:</span>
                <span>{summary.teacher_id ? 'Assigned' : 'Not assigned'}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="font-medium">Role:</span>
                <span>Student</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">My Courses</h2>
            
            <p className="text-gray-500">No courses available yet.</p>
          </div>
        </div>
      );
    
    case 'author':
    case 'moderator':
      return (
        <div className="space-y-6">
          <h1 className="text-2xl font-semibold mb-6">{summary.role.charAt(0).toUpperCase() + summary.role.slice(1)} Dashboard</h1>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Account Information</h2>
            
            <div className="space-y-2">
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium">Role:</span>
                <span>{summary.role.charAt(0).toUpperCase() + summary.role.slice(1)}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Content Management</h2>
            
            <p className="text-sm text-gray-600 mb-4">
              As an {summary.role}, you can manage educational content.
            </p>
            
            <Link href="/dashboard/content">
              <Button>Manage Content</Button>
            </Link>
          </div>
        </div>
      );
    
    default:
      return (
        <div>
          <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded mb-4">
            Role not recognized: {summary.role}
          </div>
        </div>
      );
  }
} 