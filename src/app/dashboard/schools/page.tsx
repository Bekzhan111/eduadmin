'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SkeletonLoader } from '@/components/ui/skeleton';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Key } from 'lucide-react';

type School = {
  id: string;
  name: string;
  city: string;
  address: string;
  bin: string;
  max_teachers: number;
  max_students: number;
  created_at: string;
  created_by: string;
  registration_key?: string;
};

const createSchoolSchema = z.object({
  name: z.string().min(2, 'School name must be at least 2 characters'),
  city: z.string().min(2, 'City must be at least 2 characters'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  bin: z.string().min(4, 'BIN must be at least 4 characters'),
  registration_key: z.string().min(6, 'Registration key must be at least 6 characters'),
  max_teachers: z.coerce.number().int().positive().min(1).max(100),
  max_students: z.coerce.number().int().positive().min(1).max(1000)
});

type CreateSchoolValues = z.infer<typeof createSchoolSchema>;

export default function SchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateSchoolValues>({
    resolver: zodResolver(createSchoolSchema),
    defaultValues: {
      max_teachers: 5,
      max_students: 100,
      registration_key: ''
    }
  });
  
  // Function to generate a secure random key
  const generateRegistrationKey = () => {
    setIsGeneratingKey(true);
    
    // Generate a random key using crypto.getRandomValues for security
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    const randomArray = new Uint8Array(12);
    crypto.getRandomValues(randomArray);
    
    for (let i = 0; i < 12; i++) {
      result += chars[randomArray[i] % chars.length];
    }
    
    // Format as XXX-XXX-XXX-XXX
    const formattedKey = result.match(/.{1,3}/g)?.join('-') || result;
    setValue('registration_key', formattedKey);
    setIsGeneratingKey(false);
  };

  useEffect(() => {
    fetchSchools();
  }, []);
  
  const fetchSchools = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const supabase = createClient();
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        setError('Authentication error: Please log in again');
        setIsLoading(false);
        return;
      }
      
      if (!sessionData.session) {
        setError('Not authenticated: Please log in');
        setIsLoading(false);
        return;
      }
      
      // Check if user is a super_admin
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', sessionData.session.user.id)
        .single();
      
      if (userError) {
        console.error('Error fetching user role:', userError);
        setError(`Error fetching user role: ${userError.message}`);
        setIsLoading(false);
        return;
      }
      
      if (userData.role !== 'super_admin') {
        setError('You do not have permission to access this page');
        setIsLoading(false);
        return;
      }
      
      // Fetch schools data including registration key
      const { data: schoolsData, error: schoolsError } = await supabase
        .from('schools')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (schoolsError) {
        console.error('Error fetching schools:', schoolsError);
        setError(`Error fetching schools: ${schoolsError.message}`);
        setIsLoading(false);
        return;
      }
      
      setSchools(schoolsData || []);
      setIsLoading(false);
    } catch (error) {
      console.error('Unexpected error:', error);
      setError(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  };
  
  const onSubmit = async (data: CreateSchoolValues) => {
    setError(null);
    setSuccess(null);
    
    try {
      const supabase = createClient();
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        setError('Authentication error: Please log in again');
        return;
      }
      
      // Create the school with the provided registration key
      const { data: schoolData, error: schoolError } = await supabase
        .from('schools')
        .insert([
          {
            name: data.name,
            city: data.city,
            address: data.address,
            bin: data.bin,
            registration_key: data.registration_key,
            max_teachers: data.max_teachers,
            max_students: data.max_students,
            created_by: sessionData.session.user.id
          }
        ])
        .select()
        .single();
      
      if (schoolError) {
        console.error('Error creating school:', schoolError);
        setError(`Error creating school: ${schoolError.message}`);
        return;
      }
      
      // Create the registration key in the registration_keys table
      const { error: keyError } = await supabase
        .from('registration_keys')
        .insert([
          {
            key: data.registration_key,
            role: 'school',
            max_uses: 1,
            is_active: true,
            uses: 0,
            created_by: sessionData.session.user.id
          }
        ]);
      
      if (keyError) {
        console.error('Error creating registration key:', keyError);
        // Don't fail the school creation, just warn
        console.warn('School created but registration key could not be added to registration_keys table');
      }
      
      // Generate teacher and student keys for the school
      await supabase.rpc(
        'generate_teacher_keys',
        { 
          creator_id: sessionData.session.user.id, 
          target_school_id: schoolData.id, 
          count: data.max_teachers 
        }
      );
      
      await supabase.rpc(
        'generate_student_keys',
        { 
          creator_id: sessionData.session.user.id, 
          target_school_id: schoolData.id, 
          count: data.max_students 
        }
      );
      
      setSuccess(`School created successfully! Registration key: ${data.registration_key}`);
      reset();
      fetchSchools();
      setShowModal(false);
    } catch (error) {
      console.error('Error creating school:', error);
      setError(`Error creating school: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        {/* Page header skeleton */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <SkeletonLoader type="text" lines={1} className="w-1/4" />
            <SkeletonLoader type="text" lines={1} className="w-1/2" />
          </div>
          <SkeletonLoader type="custom" height={40} width={120} />
        </div>
        
        {/* Schools list card skeleton */}
        <div className="space-y-4">
          <SkeletonLoader type="text" lines={1} className="w-1/6" />
          <SkeletonLoader type="table" rows={6} />
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
        <Button onClick={fetchSchools} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Schools Management</h1>
        <Button onClick={() => setShowModal(true)}>Create New School</Button>
      </div>
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}
      
      {/* Schools List */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Schools</h2>
        
        {schools.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    City
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    BIN
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Max Teachers
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Max Students
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {schools.map((school) => (
                  <tr key={school.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {school.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {school.city}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {school.address}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {school.bin}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {school.max_teachers}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {school.max_students}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {new Date(school.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link 
                        href={`/dashboard/schools/${school.id}`}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500 dark:text-gray-400">
            No schools found
          </div>
        )}
      </div>
      
      {/* Create School Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-2xl w-full p-6">
            <h3 className="text-xl font-semibold mb-4">Create New School</h3>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1">
                  School Name
                </label>
                <Input
                  id="name"
                  {...register('name')}
                  className={errors.name ? 'border-red-300' : ''}
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="city" className="block text-sm font-medium mb-1">
                  City
                </label>
                <Input
                  id="city"
                  {...register('city')}
                  className={errors.city ? 'border-red-300' : ''}
                />
                {errors.city && (
                  <p className="mt-1 text-xs text-red-500">{errors.city.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="address" className="block text-sm font-medium mb-1">
                  Address
                </label>
                <Input
                  id="address"
                  {...register('address')}
                  className={errors.address ? 'border-red-300' : ''}
                />
                {errors.address && (
                  <p className="mt-1 text-xs text-red-500">{errors.address.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="bin" className="block text-sm font-medium mb-1">
                  BIN
                </label>
                <Input
                  id="bin"
                  {...register('bin')}
                  className={errors.bin ? 'border-red-300' : ''}
                />
                {errors.bin && (
                  <p className="mt-1 text-xs text-red-500">{errors.bin.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="registration_key" className="block text-sm font-medium mb-1">
                  Registration Key
                </label>
                <div className="flex space-x-2">
                  <Input
                    id="registration_key"
                    {...register('registration_key')}
                    className={`flex-1 ${errors.registration_key ? 'border-red-300' : ''}`}
                    placeholder="Enter or generate a registration key"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateRegistrationKey}
                    disabled={isGeneratingKey}
                    className="px-3"
                  >
                    {isGeneratingKey ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    ) : (
                      <>
                        <Key className="h-4 w-4 mr-1" />
                        Generate
                      </>
                    )}
                  </Button>
                </div>
                {errors.registration_key && (
                  <p className="mt-1 text-xs text-red-500">{errors.registration_key.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  This key will be used by school administrators to register their account
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="max_teachers" className="block text-sm font-medium mb-1">
                    Max Teachers
                  </label>
                  <Input
                    id="max_teachers"
                    type="number"
                    {...register('max_teachers')}
                    className={errors.max_teachers ? 'border-red-300' : ''}
                  />
                  {errors.max_teachers && (
                    <p className="mt-1 text-xs text-red-500">{errors.max_teachers.message}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="max_students" className="block text-sm font-medium mb-1">
                    Max Students
                  </label>
                  <Input
                    id="max_students"
                    type="number"
                    {...register('max_students')}
                    className={errors.max_students ? 'border-red-300' : ''}
                  />
                  {errors.max_students && (
                    <p className="mt-1 text-xs text-red-500">{errors.max_students.message}</p>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Create School</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 