'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase';
import { safeCopyToClipboard, showCopyNotification } from '@/utils/clipboard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useParams, useRouter } from 'next/navigation';
import { Copy, Key } from 'lucide-react';

// Utility function to extract meaningful error messages
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (error && typeof error === 'object') {
    // Handle Supabase errors which may have message, details, hint properties
    const errorObj = error as Record<string, unknown>;
    if ('message' in errorObj && typeof errorObj.message === 'string') {
      return errorObj.message;
    }
    if ('details' in errorObj && typeof errorObj.details === 'string') {
      return errorObj.details;
    }
    if ('hint' in errorObj && typeof errorObj.hint === 'string') {
      return errorObj.hint;
    }
    // Fallback to JSON stringify for complex objects
    try {
      return JSON.stringify(error);
    } catch {
      return 'Unknown error object';
    }
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unknown error occurred';
}

type School = {
  id: string;
  name: string;
  city: string;
  address: string;
  bin: string;
  registration_key: string;
  max_teachers: number;
  max_students: number;
  created_at: string;
};

type Teacher = {
  id: string;
  email: string;
  display_name: string;
  max_students: number;
  students_count: number;
  created_at: string;
};

type RegistrationKey = {
  id: string;
  key: string;
  role: 'teacher' | 'student';
  school_id: string;
  teacher_id: string | null;
  is_active: boolean;
  max_uses: number;
  uses: number;
  created_at: string;
};

type Stats = {
  teacher_count: number;
  student_count: number;
  free_teacher_keys: number;
  free_student_keys: number;
};

export default function SchoolDetailPage() {
  const params = useParams();
  const router = useRouter();
  const schoolId = params.id as string;
  
  const [school, setSchool] = useState<School | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [teacherKeys, setTeacherKeys] = useState<RegistrationKey[]>([]);
  const [studentKeys, setStudentKeys] = useState<RegistrationKey[]>([]);
  const [stats, setStats] = useState<Stats>({
    teacher_count: 0,
    student_count: 0,
    free_teacher_keys: 0,
    free_student_keys: 0
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [assignCount, setAssignCount] = useState<number>(1);
  
  const fetchSchoolDetails = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const supabase = createClient();
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        setError('Authentication error: Please log in again');
        setIsLoading(false);
        return;
      }
      
      // Check user permission (must be super_admin or school admin of this school)
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
      
      const isSuperAdmin = userData.role === 'super_admin';
      const isSchoolAdmin = userData.role === 'school' && userData.school_id === schoolId;
      
      if (!isSuperAdmin && !isSchoolAdmin) {
        setError('You do not have permission to access this page');
        setIsLoading(false);
        return;
      }
      
      // Fetch school details
      const { data: schoolData, error: schoolError } = await supabase
        .from('schools')
        .select('*')
        .eq('id', schoolId)
        .single();
      
      if (schoolError) {
        console.error('Error fetching school:', schoolError);
        setError(`Error fetching school: ${schoolError.message}`);
        setIsLoading(false);
        return;
      }
      
      setSchool(schoolData);
      
      // Fetch teachers
      const { data: teachersData, error: teachersError } = await supabase
        .from('users')
        .select('id, email, display_name, max_students, students_count, created_at')
        .eq('school_id', schoolId)
        .eq('role', 'teacher');
      
      if (teachersError) {
        console.error('Error fetching teachers:', teachersError);
        setError(`Error fetching teachers: ${teachersError.message}`);
      } else {
        // Make sure to handle the case where display_name might be null
        const teachersWithDisplayNames = (teachersData || []).map(teacher => ({
          ...teacher,
          display_name: teacher.display_name || teacher.email || 'Unknown'
        }));
        setTeachers(teachersWithDisplayNames);
      }
      
      // Fetch registration keys
      const { data: teacherKeysData, error: teacherKeysError } = await supabase
        .from('registration_keys')
        .select('*')
        .eq('school_id', schoolId)
        .eq('role', 'teacher')
        .eq('is_active', true);
      
      if (teacherKeysError) {
        console.error('Error fetching teacher keys:', teacherKeysError);
        setError(`Error fetching teacher keys: ${teacherKeysError.message}`);
      } else {
        setTeacherKeys(teacherKeysData || []);
      }
      
      const { data: studentKeysData, error: studentKeysError } = await supabase
        .from('registration_keys')
        .select('*')
        .eq('school_id', schoolId)
        .eq('role', 'student')
        .eq('is_active', true);
      
      if (studentKeysError) {
        console.error('Error fetching student keys:', studentKeysError);
        setError(`Error fetching student keys: ${studentKeysError.message}`);
      } else {
        setStudentKeys(studentKeysData || []);
      }
      
      // Calculate stats
      const teacherCount = teachersData?.length || 0;
      
      const { data: studentCountData, error: _studentCountError } = await supabase
        .from('users')
        .select('id')
        .eq('school_id', schoolId)
        .eq('role', 'student');
      
      const studentCount = studentCountData?.length || 0;
      
      const freeTeacherKeys = (teacherKeysData || []).filter(k => k.teacher_id === null && k.is_active && k.uses < k.max_uses).length;
      const freeStudentKeys = (studentKeysData || []).filter(k => k.teacher_id === null && k.is_active && k.uses < k.max_uses).length;
      
      setStats({
        teacher_count: teacherCount,
        student_count: studentCount,
        free_teacher_keys: freeTeacherKeys,
        free_student_keys: freeStudentKeys
      });
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching school details:', getErrorMessage(error));
      setError(`Error fetching school details: ${getErrorMessage(error)}`);
      setIsLoading(false);
    }
  }, [schoolId]);
  
  useEffect(() => {
    fetchSchoolDetails();
  }, [fetchSchoolDetails]);
  
  const assignKeysToTeacher = async () => {
    if (!selectedTeacher || assignCount <= 0) {
      setError('Please select a teacher and enter a valid number of keys');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const supabase = createClient();
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        setError('Authentication error: Please log in again');
        setIsLoading(false);
        return;
      }
      
      // Call the assign keys function
      const { data: result, error: assignError } = await supabase.rpc(
        'assign_student_keys_to_teacher',
        {
          admin_id: sessionData.session.user.id,
          target_teacher_id: selectedTeacher,
          key_count: assignCount
        }
      );
      
      if (assignError) {
        console.error('Error assigning keys:', getErrorMessage(assignError));
        setError(`Error assigning keys: ${getErrorMessage(assignError)}`);
        setIsLoading(false);
        return;
      }
      
      setSuccess(`Successfully assigned ${result} keys to the teacher`);
      setShowAssignModal(false);
      fetchSchoolDetails(); // Refresh data
    } catch (error) {
      console.error('Error assigning keys:', getErrorMessage(error));
      setError(`Error assigning keys: ${getErrorMessage(error)}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const generateMoreKeys = async (role: 'teacher' | 'student', count: number) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const supabase = createClient();
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        setError('Authentication error: Please log in again');
        setIsLoading(false);
        return;
      }
      
      // Call the appropriate key generation function
      const { data: _keys, error: genError } = await supabase.rpc(
        role === 'teacher' ? 'generate_teacher_keys' : 'generate_student_keys',
        {
          creator_id: sessionData.session.user.id,
          target_school_id: schoolId,
          count: count
        }
      );
      
      if (genError) {
        console.error(`Error generating ${role} keys:`, getErrorMessage(genError));
        setError(`Error generating ${role} keys: ${getErrorMessage(genError)}`);
        setIsLoading(false);
        return;
      }
      
      setSuccess(`Successfully generated ${count} ${role} keys`);
      fetchSchoolDetails(); // Refresh data
    } catch (error) {
      console.error('Error generating keys:', getErrorMessage(error));
      setError(`Error generating keys: ${getErrorMessage(error)}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading && !school) {
    return <div className="p-4">Loading school details...</div>;
  }
  
  if (error && !school) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
        <Button onClick={() => router.push('/dashboard/schools')} className="mt-4">
          Back to Schools
        </Button>
      </div>
    );
  }
  
  if (!school) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          School not found
        </div>
        <Button onClick={() => router.push('/dashboard/schools')} className="mt-4">
          Back to Schools
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{school.name}</h1>
          <p className="text-gray-500">{school.city}, {school.address}</p>
        </div>
        <Button onClick={() => router.push('/dashboard/schools')} variant="outline">
          Back to Schools
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
      
      {/* School Registration Key */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Key className="h-5 w-5 mr-2" />
          School Registration Key
        </h2>
        <div className="flex items-center space-x-3">
          <div className="flex-1">
            <Input
              value={school.registration_key}
              readOnly
              className="font-mono bg-gray-50 dark:bg-gray-700"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              const success = await safeCopyToClipboard(school.registration_key);
              showCopyNotification(school.registration_key, success);
            }}
          >
            <Copy className="h-4 w-4 mr-1" />
            Copy
          </Button>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          Share this key with school administrators to register their account
        </p>
      </div>
      
      {/* School Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Teachers</div>
          <div className="mt-1 text-2xl font-semibold">{stats.teacher_count} / {school.max_teachers}</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Students</div>
          <div className="mt-1 text-2xl font-semibold">{stats.student_count} / {school.max_students}</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Free Teacher Keys</div>
          <div className="mt-1 text-2xl font-semibold">{stats.free_teacher_keys}</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Free Student Keys</div>
          <div className="mt-1 text-2xl font-semibold">{stats.free_student_keys}</div>
        </div>
      </div>
      
      {/* Teachers List */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Teachers</h2>
        
        {teachers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Students
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Created At
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {teachers.map((teacher) => (
                  <tr key={teacher.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {teacher.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {teacher.display_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {teacher.students_count} / {teacher.max_students || 'Unlimited'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {new Date(teacher.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500 dark:text-gray-400">
            No teachers found
          </div>
        )}
        
        <div className="mt-4">
          <Button onClick={() => generateMoreKeys('teacher', 5)}>
            Generate 5 More Teacher Keys
          </Button>
        </div>
      </div>
      
      {/* Registration Keys */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Teacher Keys */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Teacher Registration Keys</h2>
          
          {teacherKeys.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Key
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {teacherKeys.map((key) => (
                    <tr key={key.id}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-mono">
                        {key.key}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          key.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {key.is_active ? 'Active' : 'Used'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-4 text-center text-gray-500 dark:text-gray-400">
              No teacher keys available
            </div>
          )}
        </div>
        
        {/* Student Keys */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">
            Student Registration Keys
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({stats.free_student_keys} unassigned)
            </span>
          </h2>
          
          <div className="mb-4">
            <Button 
              onClick={() => setShowAssignModal(true)} 
              disabled={stats.free_student_keys === 0}
            >
              Assign Keys to Teacher
            </Button>
            <Button 
              onClick={() => generateMoreKeys('student', 10)} 
              variant="outline"
              className="ml-2"
            >
              Generate 10 More
            </Button>
          </div>
          
          {studentKeys.length > 0 ? (
            <div className="overflow-y-auto max-h-60">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Key
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Assigned To
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {studentKeys.map((key) => (
                    <tr key={key.id}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-mono">
                        {key.key}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                        {key.teacher_id ? (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {teachers.find(t => t.id === key.teacher_id)?.display_name || 'Unknown Teacher'}
                          </span>
                        ) : (
                          <span className="text-gray-500">Unassigned</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-4 text-center text-gray-500 dark:text-gray-400">
              No student keys available
            </div>
          )}
        </div>
      </div>
      
      {/* Assign Keys Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">Assign Student Keys to Teacher</h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="teacher" className="block text-sm font-medium mb-1">
                  Select Teacher
                </label>
                <select
                  id="teacher"
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                >
                  <option value="">Select a teacher</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.display_name || teacher.email}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="count" className="block text-sm font-medium mb-1">
                  Number of Keys (Max: {stats.free_student_keys})
                </label>
                <Input
                  id="count"
                  type="number"
                  min="1"
                  max={stats.free_student_keys}
                  value={assignCount}
                  onChange={(e) => setAssignCount(parseInt(e.target.value))}
                />
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAssignModal(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={assignKeysToTeacher}
                  disabled={!selectedTeacher || assignCount <= 0 || assignCount > stats.free_student_keys}
                >
                  Assign Keys
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 