'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/utils/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { 
  Users, 
  School, 
  GraduationCap, 
  BookOpen, 
  Key, 
  Shield,
  TrendingUp,
  Activity,
  BarChart3,
  PieChart,
  Calendar,
  Settings,
  Edit,
  Eye,
  Plus
} from 'lucide-react';
import { SkeletonLoader } from '@/components/ui/skeleton';

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
  book_stats?: {
    total_books?: number;
    draft_books?: number;
    moderation_books?: number;
    active_books?: number;
    total_assigned?: number;
    approved_books?: number;
    weekly_reviews?: number;
  };
};

export default function DashboardPage() {
  const router = useRouter();
  const { session, userProfile, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  
  const fetchDashboardSummary = useCallback(async () => {
    if (!session || !userProfile) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const supabase = createClient();
      
      // Fetch dashboard summary based on role
      const { data: summaryData, error: summaryError } = await supabase.rpc(
        'get_dashboard_summary',
        { user_id: session.user.id }
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
  }, [session, userProfile]);
  
  useEffect(() => {
    // Only fetch data if we have a session and user profile
    if (!authLoading && session && userProfile) {
      fetchDashboardSummary();
    } else if (!authLoading && !session) {
      // If auth loading is done and no session, redirect to login
      router.push('/login');
    }
  }, [authLoading, session, userProfile, fetchDashboardSummary, router]);
  
  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        {/* Page header skeleton */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <SkeletonLoader type="text" lines={1} className="w-1/3" />
            <SkeletonLoader type="text" lines={1} className="w-1/2" />
          </div>
          <SkeletonLoader type="custom" height={32} width={120} />
        </div>
        
        {/* Stats cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SkeletonLoader type="custom" count={4} height={120} />
        </div>
        
        {/* Recent activity section skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonLoader type="custom" count={2} height={300} />
        </div>
      </div>
    );
  }

  // If no session after auth loading is complete, the useEffect will handle redirect
  if (!session) {
    return <div className="p-4">Redirecting to login...</div>;
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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Super Admin Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Educational Platform Management Overview
              </p>
            </div>
            <Badge variant="outline" className="text-sm">
              <Activity className="h-4 w-4 mr-1" />
              System Active
            </Badge>
          </div>
          
          {/* Main Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <School className="h-8 w-8 text-blue-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Schools</p>
                    <p className="text-2xl font-bold">{summary.school_count || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-green-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold">{summary.user_count || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <GraduationCap className="h-8 w-8 text-purple-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Teachers</p>
                    <p className="text-2xl font-bold">{summary.teacher_count || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-orange-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Students</p>
                    <p className="text-2xl font-bold">{summary.student_count || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Registration Reports */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Registration Keys Overview
                </CardTitle>
                <CardDescription>
                  Active registration keys by role
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                      <span className="text-sm">School Keys</span>
                    </div>
                    <span className="font-semibold">{summary.key_stats?.school_keys || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm">Teacher Keys</span>
                    </div>
                    <span className="font-semibold">{summary.key_stats?.teacher_keys || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                      <span className="text-sm">Student Keys</span>
                    </div>
                    <span className="font-semibold">{summary.key_stats?.student_keys || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                      <span className="text-sm">Author Keys</span>
                    </div>
                    <span className="font-semibold">{summary.key_stats?.author_keys || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                      <span className="text-sm">Moderator Keys</span>
                    </div>
                    <span className="font-semibold">{summary.key_stats?.moderator_keys || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="h-5 w-5 mr-2" />
                  Platform Growth
                </CardTitle>
                <CardDescription>
                  Registration trends and platform adoption
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Schools Registered</p>
                      <p className="text-xs text-gray-500">Educational institutions</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">{summary.school_count || 0}</p>
                      <p className="text-xs text-green-600 flex items-center">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Active
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Teachers Onboarded</p>
                      <p className="text-xs text-gray-500">Educators using platform</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">{summary.teacher_count || 0}</p>
                      <p className="text-xs text-green-600 flex items-center">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Growing
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Students Enrolled</p>
                      <p className="text-xs text-gray-500">Learners on platform</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-purple-600">{summary.student_count || 0}</p>
                      <p className="text-xs text-green-600 flex items-center">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Expanding
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Manage your educational platform efficiently
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/dashboard/schools">
                  <Button className="w-full h-12 flex items-center justify-center">
                    <School className="h-4 w-4 mr-2" />
                    Manage Schools
                  </Button>
                </Link>
                <Link href="/dashboard/users">
                  <Button variant="outline" className="w-full h-12 flex items-center justify-center">
                    <Users className="h-4 w-4 mr-2" />
                    Manage Users
                  </Button>
                </Link>
                <Link href="/dashboard/books">
                  <Button variant="outline" className="w-full h-12 flex items-center justify-center">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Manage Books
                  </Button>
                </Link>
                <Link href="/dashboard/keys">
                  <Button variant="outline" className="w-full h-12 flex items-center justify-center">
                    <Key className="h-4 w-4 mr-2" />
                    Registration Keys
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest registrations and platform activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    <div>
                      <p className="text-sm font-medium">New school registration</p>
                      <p className="text-xs text-gray-500">School admin account created</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">2 hours ago</span>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    <div>
                      <p className="text-sm font-medium">Teacher keys generated</p>
                      <p className="text-xs text-gray-500">5 new teacher registration keys</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">4 hours ago</span>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                    <div>
                      <p className="text-sm font-medium">Student enrollment</p>
                      <p className="text-xs text-gray-500">15 students joined platform</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">6 hours ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    
    case 'school':
      return (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">School Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {summary.school_name}
              </p>
            </div>
            <Badge variant="outline" className="text-sm">
              <School className="h-4 w-4 mr-1" />
              School Administrator
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <GraduationCap className="h-8 w-8 text-purple-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Teachers</p>
                    <p className="text-2xl font-bold">{summary.teacher_count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-green-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Students</p>
                    <p className="text-2xl font-bold">{summary.student_count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <BookOpen className="h-8 w-8 text-blue-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">School Books</p>
                    <p className="text-2xl font-bold">{summary.book_stats?.total_books || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Key className="h-8 w-8 text-orange-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Available Keys</p>
                    <p className="text-2xl font-bold">{(summary.key_stats?.teacher_keys || 0) + (summary.key_stats?.student_keys || 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Manage your school efficiently
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/dashboard/teachers">
                  <Button className="w-full h-12 flex items-center justify-center">
                    <GraduationCap className="h-4 w-4 mr-2" />
                    Manage Teachers
                  </Button>
                </Link>
                <Link href="/dashboard/students">
                  <Button variant="outline" className="w-full h-12 flex items-center justify-center">
                    <Users className="h-4 w-4 mr-2" />
                    Manage Students
                  </Button>
                </Link>
                <Link href="/dashboard/books">
                  <Button variant="outline" className="w-full h-12 flex items-center justify-center">
                    <BookOpen className="h-4 w-4 mr-2" />
                    School Books
                  </Button>
                </Link>
                <Link href="/dashboard/keys">
                  <Button variant="outline" className="w-full h-12 flex items-center justify-center">
                    <Key className="h-4 w-4 mr-2" />
                    Key Management
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    
    case 'teacher':
      return (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Teacher Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {summary.school_name}
              </p>
            </div>
            <Badge variant="outline" className="text-sm">
              <GraduationCap className="h-4 w-4 mr-1" />
              Teacher
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-green-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">My Students</p>
                    <p className="text-2xl font-bold">{summary.student_count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Key className="h-8 w-8 text-blue-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Student Keys</p>
                    <p className="text-2xl font-bold">{summary.key_stats?.student_keys || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <BookOpen className="h-8 w-8 text-purple-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">School Books</p>
                    <p className="text-2xl font-bold">{summary.book_stats?.total_books || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <School className="h-8 w-8 text-orange-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">School</p>
                    <p className="text-base font-semibold">{summary.school_name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Manage your students and teaching materials
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link href="/dashboard/students">
                  <Button className="w-full h-12 flex items-center justify-center">
                    <Users className="h-4 w-4 mr-2" />
                    Manage My Students
                  </Button>
                </Link>
                <Link href="/dashboard/books">
                  <Button variant="outline" className="w-full h-12 flex items-center justify-center">
                    <BookOpen className="h-4 w-4 mr-2" />
                    School Books
                  </Button>
                </Link>
                <Link href="/dashboard/keys">
                  <Button variant="outline" className="w-full h-12 flex items-center justify-center">
                    <Key className="h-4 w-4 mr-2" />
                    Student Keys
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    
    case 'student':
      return (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Student Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {summary.school_name}
              </p>
            </div>
            <Badge variant="outline" className="text-sm">
              <Users className="h-4 w-4 mr-1" />
              Student
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <School className="h-8 w-8 text-blue-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">School</p>
                    <p className="text-lg font-semibold">{summary.school_name || 'Not assigned'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <GraduationCap className="h-8 w-8 text-green-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Teacher</p>
                    <p className="text-lg font-semibold">{summary.teacher_id ? 'Assigned' : 'Not assigned'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <BookOpen className="h-8 w-8 text-purple-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Available Books</p>
                    <p className="text-2xl font-bold">{summary.book_stats?.total_books || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Access your educational resources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/dashboard/books">
                  <Button className="w-full h-12 flex items-center justify-center">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Browse Books
                  </Button>
                </Link>
                <Link href="/dashboard/settings">
                  <Button variant="outline" className="w-full h-12 flex items-center justify-center">
                    <Settings className="h-4 w-4 mr-2" />
                    Student Settings
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    
    case 'author':
      return (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Author Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Create and manage your educational content
              </p>
            </div>
            <Badge variant="outline" className="text-sm">
              <BookOpen className="h-4 w-4 mr-1" />
              Content Creator
            </Badge>
          </div>
          
          {/* Author Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <BookOpen className="h-8 w-8 text-blue-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">My Books</p>
                    <p className="text-2xl font-bold">{summary.book_stats?.total_books || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Edit className="h-8 w-8 text-gray-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Draft Books</p>
                    <p className="text-2xl font-bold">{summary.book_stats?.draft_books || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Eye className="h-8 w-8 text-orange-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">In Moderation</p>
                    <p className="text-2xl font-bold">{summary.book_stats?.moderation_books || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-green-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Published</p>
                    <p className="text-2xl font-bold">{summary.book_stats?.active_books || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Manage your educational content and books
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link href="/dashboard/books">
                  <Button className="w-full h-12 flex items-center justify-center">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Manage My Books
                  </Button>
                </Link>
                <Link href="/dashboard/books">
                  <Button variant="outline" className="w-full h-12 flex items-center justify-center">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Book
                  </Button>
                </Link>
                <Link href="/dashboard/settings">
                  <Button variant="outline" className="w-full h-12 flex items-center justify-center">
                    <Settings className="h-4 w-4 mr-2" />
                    Author Settings
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    
    case 'moderator':
      return (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Moderator Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Review and approve educational content for publication
              </p>
            </div>
            <Badge variant="outline" className="text-sm">
              <Shield className="h-4 w-4 mr-1" />
              Content Moderator
            </Badge>
          </div>
          
          {/* Moderator Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Eye className="h-8 w-8 text-orange-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending Review</p>
                    <p className="text-2xl font-bold">{summary.book_stats?.moderation_books || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-blue-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Approved</p>
                    <p className="text-2xl font-bold">{summary.book_stats?.approved_books || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Calendar className="h-8 w-8 text-green-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">This Week</p>
                    <p className="text-2xl font-bold">{summary.book_stats?.weekly_reviews || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <BookOpen className="h-8 w-8 text-purple-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Assigned</p>
                    <p className="text-2xl font-bold">{summary.book_stats?.total_assigned || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Review educational content and manage approvals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link href="/dashboard/books">
                  <Button className="w-full h-12 flex items-center justify-center">
                    <Eye className="h-4 w-4 mr-2" />
                    Review Books
                  </Button>
                </Link>
                <Link href="/dashboard/books">
                  <Button variant="outline" className="w-full h-12 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Approved Content
                  </Button>
                </Link>
                <Link href="/dashboard/settings">
                  <Button variant="outline" className="w-full h-12 flex items-center justify-center">
                    <Settings className="h-4 w-4 mr-2" />
                    Moderator Settings
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
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