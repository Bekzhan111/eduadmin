'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/utils/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SkeletonLoader } from '@/components/ui/skeleton';
import { Search, GraduationCap, Edit, Trash2, Eye, Filter } from 'lucide-react';

type Student = {
  id: string;
  email: string;
  display_name: string | null;
  role: string;
  school_id: string | null;
  school_name?: string | null;
  teacher_id?: string | null;
  teacher_name?: string;
  created_at: string;
  last_login?: string;
  is_active?: boolean;
};

export default function StudentsPage() {
  const { userProfile, isLoading: authLoading } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [schoolFilter, setSchoolFilter] = useState<string>('all');
  const [schools, setSchools] = useState<{id: string, name: string}[]>([]);

  const fetchSchools = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('schools')
        .select('id, name')
        .order('name');
      
      if (error) {
        console.error('Error fetching schools:', error);
        return;
      }
      
      setSchools(data || []);
    } catch (error) {
      console.error('Error fetching schools:', error);
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const supabase = createClient();
      
      // Fetch students with school information using a safer approach
      const { data: studentsData, error: studentsError } = await supabase
        .from('users')
        .select(`
          id,
          email,
          display_name,
          role,
          school_id,
          created_at,
          last_login
        `)
        .eq('role', 'student')
        .order('created_at', { ascending: false });
      
      if (studentsError) {
        throw new Error(`Failed to fetch students: ${studentsError.message}`);
      }
      
      // Fetch schools separately to avoid relationship conflicts
      const { data: schoolsData, error: schoolsError } = await supabase
        .from('schools')
        .select('id, name');
      
      if (schoolsError) {
        console.error('Error fetching schools for students:', schoolsError);
      }
      
      // Create a schools map for quick lookup
      const schoolsMap = new Map();
      (schoolsData || []).forEach(school => {
        schoolsMap.set(school.id, school.name);
      });
      
      // Format the data
      const formattedStudents = (studentsData || []).map(student => ({
        id: student.id,
        email: student.email,
        display_name: student.display_name,
        role: student.role,
        school_id: student.school_id,
        school_name: student.school_id ? schoolsMap.get(student.school_id) : undefined,
        created_at: student.created_at,
        last_login: student.last_login,
        is_active: true,
      }));
      
      setStudents(formattedStudents);
      setFilteredStudents(formattedStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch students');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Filter students based on search term and school
  useEffect(() => {
    let filtered = students;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(student => 
        (student.email && student.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (student.display_name && student.display_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (student.school_name && student.school_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Apply school filter
    if (schoolFilter !== 'all') {
      if (schoolFilter === 'no-school') {
        filtered = filtered.filter(student => !student.school_id);
      } else {
        filtered = filtered.filter(student => student.school_id === schoolFilter);
      }
    }
    
    setFilteredStudents(filtered);
  }, [students, searchTerm, schoolFilter]);

  useEffect(() => {
    if (!authLoading && userProfile) {
      if (userProfile.role !== 'super_admin') {
        setError('Access denied. Only super administrators can view this page.');
        setIsLoading(false);
        return;
      }
      
      fetchStudents();
      fetchSchools();
    }
  }, [authLoading, userProfile, fetchStudents, fetchSchools]);

  if (authLoading || isLoading) {
    return (
      <div className="p-6 space-y-6">
        {/* Page header skeleton */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <SkeletonLoader type="text" lines={1} className="w-1/3" />
            <SkeletonLoader type="text" lines={1} className="w-1/2" />
          </div>
          <SkeletonLoader type="custom" height={32} width={140} />
        </div>
        
        {/* Filters skeleton */}
        <div className="space-y-4">
          <SkeletonLoader type="text" lines={1} className="w-1/6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SkeletonLoader type="custom" height={40} width="100%" count={2} />
          </div>
        </div>
        
        {/* Students table skeleton */}
        <SkeletonLoader type="table" rows={8} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p className="text-lg font-semibold">Error</p>
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Students Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage all students in the system
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-sm">
            <GraduationCap className="h-4 w-4 mr-1" />
            {filteredStudents.length} students
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name, email, or school..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">School</label>
              <Select value={schoolFilter} onValueChange={setSchoolFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by school" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Schools</SelectItem>
                  <SelectItem value="no-school">No School</SelectItem>
                  {schools.map((school) => (
                    <SelectItem key={school.id} value={school.id}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Students</CardTitle>
          <CardDescription>
            View and manage all students in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>School</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {student.display_name || 'No name'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {student.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {student.school_name || (
                        <span className="text-gray-400 italic">No school</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(student.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {student.last_login ? 
                        new Date(student.last_login).toLocaleDateString() : 
                        <span className="text-gray-400 italic">Never</span>
                      }
                    </TableCell>
                    <TableCell>
                      <Badge variant={student.is_active ? "default" : "secondary"}>
                        {student.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredStudents.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No students found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}