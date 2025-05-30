'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SkeletonLoader } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';

type Teacher = {
  id: string;
  email: string;
  display_name: string;
  role: string;
  max_students: number;
  students_count: number;
  created_at: string;
  school_id: string;
  school_name?: string;
};

type TeacherKey = {
  id: string;
  key: string;
  role: 'teacher';
  is_active: boolean;
  max_uses: number;
  uses: number;
  created_at: string;
};

type School = {
  id: string;
  name: string;
};

export default function TeachersPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [availableKeys, setAvailableKeys] = useState<TeacherKey[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userSchoolId, setUserSchoolId] = useState<string | null>(null);
  
  const [generateCount, setGenerateCount] = useState(5);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  
  const fetchTeachers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const supabase = createClient();
      
      // Get current user session and role
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        setError('Authentication error. Please sign in again.');
        setIsLoading(false);
        return;
      }
      
      // Get user data including role and school_id
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role, school_id')
        .eq('id', sessionData.session.user.id)
        .single();
      
      if (userError) {
        console.error('Error fetching user data:', userError);
        setError(`Error fetching user data: ${userError.message}`);
        setIsLoading(false);
        return;
      }
      
      setUserRole(userData.role);
      setUserSchoolId(userData.school_id);
      
      // If super admin, fetch all schools for selection
      if (userData.role === 'super_admin') {
        const { data: schoolsData, error: schoolsError } = await supabase
          .from('schools')
          .select('id, name')
          .order('name');
          
        if (schoolsError) {
          console.error('Error fetching schools:', schoolsError);
          setError(`Error fetching schools: ${schoolsError.message}`);
        } else {
          setSchools(schoolsData || []);
        }
      }
      
      // Fetch teachers based on user role
      let teachersQuery = supabase.from('users').select(`
        id, email, display_name, role, max_students, students_count, created_at, school_id,
        schools:school_id (name)
      `).eq('role', 'teacher');
      
      // If school admin, only fetch teachers from their school
      if (userData.role === 'school') {
        teachersQuery = teachersQuery.eq('school_id', userData.school_id);
      }
      
      const { data: teachersData, error: teachersError } = await teachersQuery;
      
      if (teachersError) {
        console.error('Error fetching teachers:', teachersError);
        setError(`Error fetching teachers: ${teachersError.message}`);
        setIsLoading(false);
        return;
      }
      
      // Fetch available teacher registration keys
      let keysQuery = supabase
        .from('registration_keys')
        .select('id, key, role, is_active, max_uses, uses, created_at')
        .eq('role', 'teacher')
        .eq('is_active', true);
      
      // If school admin, only fetch keys from their school
      if (userData.role === 'school' && userData.school_id) {
        keysQuery = keysQuery.eq('school_id', userData.school_id);
      }
      
      const { data: keysData, error: keysError } = await keysQuery;
      
      if (keysError) {
        console.error('Error fetching registration keys:', keysError);
        setError(`Error fetching registration keys: ${keysError.message}`);
      } else {
        setAvailableKeys(keysData as TeacherKey[] || []);
      }
      
      // Format teachers data and cast as Teacher[] to fix type issue
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
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);
  
  const handleGenerateKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (generateCount <= 0) {
      setError('Please enter a valid number of keys to generate');
      return;
    }
    
    // For super admin, require school selection
    if (userRole === 'super_admin' && !selectedSchoolId) {
      setError('Please select a school to generate teacher keys for');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const supabase = createClient();
      
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        setError('Authentication error. Please sign in again.');
        setIsLoading(false);
        return;
      }
      
      // Determine which school ID to use
      const targetSchoolId = userRole === 'super_admin' ? selectedSchoolId : userSchoolId;
      
      // Generate teacher keys
      const { data: _result, error: generateError } = await supabase.rpc(
        'generate_teacher_keys',
        {
          creator_id: sessionData.session.user.id,
          target_school_id: targetSchoolId,
          count: generateCount
        }
      );
      
      if (generateError) {
        console.error('Error generating keys:', generateError);
        setError(`Error generating keys: ${generateError.message}`);
        setIsLoading(false);
        return;
      }
      
      const schoolName = userRole === 'super_admin' 
        ? schools.find(s => s.id === selectedSchoolId)?.name || 'selected school'
        : 'your school';
      
      setSuccess(`Successfully generated ${generateCount} teacher registration keys for ${schoolName}!`);
      setShowGenerateForm(false);
      setSelectedSchoolId(''); // Reset selection
      fetchTeachers(); // Refresh data
    } catch (error) {
      console.error('Error generating keys:', error);
      setError(`Error generating keys: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        {/* Page header skeleton */}
        <div className="flex justify-between items-center">
          <SkeletonLoader type="text" lines={1} className="w-1/4" />
          <SkeletonLoader type="custom" height={40} width={150} />
        </div>
        
        {/* Registration keys section skeleton */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <SkeletonLoader type="text" lines={1} className="w-1/5" />
            <SkeletonLoader type="custom" height={32} width={160} />
          </div>
          <SkeletonLoader type="table" rows={5} />
        </div>
        
        {/* Teachers section skeleton */}
        <div className="space-y-4">
          <SkeletonLoader type="text" lines={1} className="w-1/6" />
          <SkeletonLoader type="table" rows={6} />
        </div>
      </div>
    );
  }
  
  if (!userRole) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Unable to determine your role. Please sign in again.
        </div>
      </div>
    );
  }
  
  // Check if user has permission to view this page
  if (userRole !== 'super_admin' && userRole !== 'school') {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          You don&apos;t have permission to access this page.
        </div>
        <Button className="mt-4" onClick={() => router.push('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Teacher Management</h1>
        <Button 
          onClick={() => router.push('/dashboard')}
          variant="outline"
        >
          Back to Dashboard
        </Button>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}
      
      {/* Teacher Registration Keys */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Teacher Registration Keys</h2>
          <Button 
            onClick={() => setShowGenerateForm(!showGenerateForm)}
            size="sm"
          >
            {showGenerateForm ? 'Cancel' : 'Generate New Keys'}
          </Button>
        </div>
        
        {showGenerateForm && (
          <form onSubmit={handleGenerateKeys} className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-md">
            <div className="flex flex-col space-y-4">
              {/* School Selection for Super Admin */}
              {userRole === 'super_admin' && (
                <div>
                  <label htmlFor="schoolSelect" className="block text-sm font-medium mb-1">
                    Select School
                  </label>
                  <select
                    id="schoolSelect"
                    value={selectedSchoolId}
                    onChange={(e) => setSelectedSchoolId(e.target.value)}
                    className="block w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  >
                    <option value="">Select a school</option>
                    {schools.map((school) => (
                      <option key={school.id} value={school.id}>
                        {school.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Key Count Input */}
              <div className="flex flex-col md:flex-row md:space-x-4 md:items-end">
                <div className="flex-1">
                  <label htmlFor="generateCount" className="block text-sm font-medium mb-1">
                    Number of Keys to Generate
                  </label>
                  <Input
                    id="generateCount"
                    type="number"
                    min="1"
                    max="20"
                    value={generateCount}
                    onChange={(e) => setGenerateCount(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Generating...' : 'Generate Keys'}
                </Button>
              </div>
            </div>
          </form>
        )}
        
        {availableKeys.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Registration Key
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Uses
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {availableKeys.map((key) => (
                  <tr key={key.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                      {key.key}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {key.uses} / {key.max_uses}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(key.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
            No available teacher registration keys. Generate some keys to register teachers.
          </div>
        )}
      </div>
      
      {/* Registered Teachers */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Registered Teachers</h2>
        
        {teachers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Email
                  </th>
                  {userRole === 'super_admin' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      School
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Students
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {teachers.map((teacher) => (
                  <tr key={teacher.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">
                        {teacher.display_name || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">{teacher.email}</div>
                    </td>
                    {userRole === 'super_admin' && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">{teacher.school_name}</div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {teacher.students_count} / {teacher.max_students || 'Unlimited'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(teacher.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
            No teachers registered yet.
          </div>
        )}
      </div>
      
      {/* How to Register Teachers */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">How to Register Teachers</h2>
        <ol className="list-decimal pl-6 space-y-2 text-gray-700 dark:text-gray-300">
          <li>Generate registration keys using the button above</li>
          <li>Share a registration key with each teacher</li>
          <li>Teachers should visit the registration page and enter their key</li>
          <li>After registration, teachers will be able to access their dashboard</li>
          <li>Teachers can then manage their assigned students</li>
        </ol>
      </div>
    </div>
  );
} 