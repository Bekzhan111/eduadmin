'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/utils/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { SkeletonLoader } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Users, Edit, Trash2, Eye, Filter } from 'lucide-react';

type User = {
  id: string;
  email: string;
  display_name: string | null;
  role: string;
  school_id: string | null;
  school_name?: string;
  created_at: string;
  last_login?: string;
  is_active?: boolean;
};

export default function UsersPage() {
  const { userProfile, isLoading: authLoading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [schoolFilter, setSchoolFilter] = useState<string>('all');
  const [schools, setSchools] = useState<{id: string, name: string}[]>([]);

  // Role badge colors
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-red-500 text-white';
      case 'school': return 'bg-blue-500 text-white';
      case 'teacher': return 'bg-green-500 text-white';
      case 'student': return 'bg-yellow-500 text-black';
      case 'author': return 'bg-purple-500 text-white';
      case 'moderator': return 'bg-orange-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

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

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const supabase = createClient();
      
      // Fetch users with safer approach to avoid relationship conflicts
      const { data: usersData, error: usersError } = await supabase
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
        .order('created_at', { ascending: false });
      
      if (usersError) {
        throw new Error(`Не удалось получить пользователей: ${usersError.message}`);
      }
      
      // Fetch schools separately to avoid relationship conflicts
      const { data: schoolsData, error: schoolsError } = await supabase
        .from('schools')
        .select('id, name');
      
      if (schoolsError) {
        console.error('Error fetching schools for users:', schoolsError);
      }
      
      // Create a schools map for quick lookup
      const schoolsMap = new Map();
      (schoolsData || []).forEach(school => {
        schoolsMap.set(school.id, school.name);
      });
      
      // Format the data
      const formattedUsers = (usersData || []).map(user => ({
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        role: user.role,
        school_id: user.school_id,
        school_name: user.school_id ? schoolsMap.get(user.school_id) : undefined,
        created_at: user.created_at,
        last_login: user.last_login,
        is_active: true, // You can implement this logic based on your needs
      }));
      
      setUsers(formattedUsers);
      setFilteredUsers(formattedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(error instanceof Error ? error.message : 'Не удалось получить пользователей');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Filter users based on search term, role, and school
  useEffect(() => {
    let filtered = users;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.display_name && user.display_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.school_name && user.school_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }
    
    // Apply school filter
    if (schoolFilter !== 'all') {
      filtered = filtered.filter(user => user.school_id === schoolFilter);
    }
    
    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter, schoolFilter]);

  useEffect(() => {
    if (!authLoading && userProfile) {
      if (userProfile.role !== 'super_admin') {
        setError('Доступ запрещен. Только суперадминистраторы могут просматривать эту страницу.');
        setIsLoading(false);
        return;
      }
      
      fetchUsers();
      fetchSchools();
    }
  }, [authLoading, userProfile, fetchUsers, fetchSchools]);

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя? Это действие не может быть отменено.')) {
      return;
    }
    
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
      
      if (error) {
        throw new Error(`Не удалось удалить пользователя: ${error.message}`);
      }
      
      // Refresh the users list
      await fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(error instanceof Error ? error.message : 'Не удалось удалить пользователя');
    }
  };

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
        
        {/* Filters card skeleton */}
        <div className="space-y-4">
          <div className="space-y-2">
            <SkeletonLoader type="text" lines={1} className="w-1/6" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SkeletonLoader type="custom" height={40} width="100%" count={3} />
          </div>
        </div>
        
        {/* Table skeleton */}
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
              <p className="text-lg font-semibold">Ошибка</p>
              <p>{error}</p>
              <Button onClick={() => window.location.reload()} className="mt-4">
                Перезагрузить Страницу
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Управление Пользователями</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Управление всеми пользователями в системе
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-sm">
            <Users className="h-4 w-4 mr-1" />
            {filteredUsers.length} пользователей
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Фильтры
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Поиск</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Поиск по имени, email или школе..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Role Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Роль</label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Фильтр по роли" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все Роли</SelectItem>
                  <SelectItem value="super_admin">Суперадминистратор</SelectItem>
                  <SelectItem value="school">Администратор Школы</SelectItem>
                  <SelectItem value="teacher">Учитель</SelectItem>
                  <SelectItem value="student">Студент</SelectItem>
                  <SelectItem value="author">Автор</SelectItem>
                  <SelectItem value="moderator">Модератор</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* School Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Школа</label>
              <Select value={schoolFilter} onValueChange={setSchoolFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Фильтр по школе" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все Школы</SelectItem>
                  <SelectItem value="no-school">Без Школы</SelectItem>
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

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Все Пользователи</CardTitle>
          <CardDescription>
            Просмотр и управление всеми пользователями в системе
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Пользователь</TableHead>
                  <TableHead>Роль</TableHead>
                  <TableHead>Школа</TableHead>
                  <TableHead>Создан</TableHead>
                  <TableHead>Последний Вход</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {user.display_name || 'Без имени'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {user.role === 'super_admin' ? 'СУПЕРАДМИНИСТРАТОР' :
                         user.role === 'school' ? 'АДМИНИСТРАТОР ШКОЛЫ' :
                         user.role === 'teacher' ? 'УЧИТЕЛЬ' :
                         user.role === 'student' ? 'СТУДЕНТ' :
                         user.role === 'author' ? 'АВТОР' :
                         user.role === 'moderator' ? 'МОДЕРАТОР' :
                         user.role.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.school_name || (
                        <span className="text-gray-400 italic">Без школы</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString('ru-RU')}
                    </TableCell>
                    <TableCell>
                      {user.last_login ? 
                        new Date(user.last_login).toLocaleDateString('ru-RU') : 
                        <span className="text-gray-400 italic">Никогда</span>
                      }
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? "default" : "secondary"}>
                        {user.is_active ? "Активен" : "Неактивен"}
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
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Пользователи, соответствующие вашим критериям, не найдены.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 