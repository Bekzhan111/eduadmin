'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/utils/supabase';
import { safeCopyToClipboard, showCopyNotification } from '@/utils/clipboard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SkeletonLoader } from '@/components/ui/skeleton';
import { Search, BookOpen, UserPlus, Edit, Trash2, Eye, Filter, Plus, Copy, Key } from 'lucide-react';

type Author = {
  id: string;
  email: string;
  display_name: string | null;
  role: string;
  created_at: string;
  last_login?: string;
  is_active?: boolean;
};

type AuthorKey = {
  id: string;
  key: string;
  role: 'author';
  is_active: boolean;
  max_uses: number;
  uses: number;
  created_at: string;
  expires_at?: string;
};

function AuthorsPage() {
  const { userProfile, isLoading: authLoading } = useAuth();
  const [authors, setAuthors] = useState<Author[]>([]);
  const [authorKeys, setAuthorKeys] = useState<AuthorKey[]>([]);
  const [filteredAuthors, setFilteredAuthors] = useState<Author[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [expirationDays, setExpirationDays] = useState(30);

  const fetchAuthors = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const supabase = createClient();
      
      // Fetch authors
      const { data: authorsData, error: authorsError } = await supabase
        .from('users')
        .select(`
          id,
          email,
          display_name,
          role,
          created_at,
          last_login
        `)
        .eq('role', 'author')
        .order('created_at', { ascending: false });
      
      if (authorsError) {
        throw new Error(`Не удалось получить авторов: ${authorsError.message}`);
      }
      
      // Fetch author registration keys
      const { data: keysData, error: keysError } = await supabase
        .from('registration_keys')
        .select('id, key, role, is_active, max_uses, uses, created_at, expires_at')
        .eq('role', 'author')
        .order('created_at', { ascending: false });
      
      if (keysError) {
        console.error('Error fetching author keys:', keysError);
        setError(`Ошибка получения ключей авторов: ${keysError.message}`);
      } else {
        setAuthorKeys(keysData as AuthorKey[] || []);
      }
      
      // Format the data
      const formattedAuthors = (authorsData || []).map(author => ({
        id: author.id,
        email: author.email,
        display_name: author.display_name,
        role: author.role,
        created_at: author.created_at,
        last_login: author.last_login,
        is_active: true, // You can implement this logic based on your needs
      }));
      
      setAuthors(formattedAuthors);
      setFilteredAuthors(formattedAuthors);
    } catch (error) {
      console.error('Error fetching authors:', error);
      setError(error instanceof Error ? error.message : 'Не удалось получить авторов');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Filter authors based on search term and status
  useEffect(() => {
    let filtered = authors;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(author => 
        (author.email && author.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (author.display_name && author.display_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      filtered = filtered.filter(author => author.is_active === isActive);
    }
    
    setFilteredAuthors(filtered);
  }, [authors, searchTerm, statusFilter]);

  useEffect(() => {
    if (!authLoading && userProfile) {
      if (userProfile.role !== 'super_admin') {
        setError('Доступ запрещен. Только суперадминистраторы могут просматривать эту страницу.');
        setIsLoading(false);
        return;
      }
      
      fetchAuthors();
    }
  }, [authLoading, userProfile, fetchAuthors]);

  const handleDeleteAuthor = async (authorId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этого автора? Это действие не может быть отменено.')) {
      return;
    }
    
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', authorId);
      
      if (error) {
        throw new Error(`Не удалось удалить автора: ${error.message}`);
      }
      
      // Refresh the authors list
      await fetchAuthors();
    } catch (error) {
      console.error('Error deleting author:', error);
      alert(error instanceof Error ? error.message : 'Не удалось удалить автора');
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот ключ? Это действие не может быть отменено.')) {
      return;
    }
    
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('registration_keys')
        .delete()
        .eq('id', keyId);
      
      if (error) {
        throw new Error(`Не удалось удалить ключ: ${error.message}`);
      }
      
      setSuccess('Ключ успешно удален');
      await fetchAuthors(); // Refresh the keys list
    } catch (error) {
      console.error('Error deleting key:', error);
      setError(error instanceof Error ? error.message : 'Не удалось удалить ключ');
    }
  };

  // Generate random key
  const generateKeyCode = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const handleGenerateAuthorKey = async () => {
    setIsGenerating(true);
    setError(null);
    setSuccess(null);
    
    try {
      const supabase = createClient();
      
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error('Вы должны войти в систему для генерации ключей');
      }
      
      // Generate a secure key
      const keyCode = generateKeyCode();
      const expiresAt = expirationDays > 0 
        ? new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000) 
        : null;
      
      // Insert the key into registration_keys table
      const { error } = await supabase
        .from('registration_keys')
        .insert([{
          key: keyCode,
          role: 'author',
          school_id: null,
          created_by: sessionData.session.user.id,
          is_active: true,
          expires_at: expiresAt ? expiresAt.toISOString() : null,
          max_uses: 1,
          uses: 0
        }]);
      
      if (error) {
        throw new Error(`Не удалось сгенерировать ключ автора: ${error.message}`);
      }
      
      setSuccess(`Ключ автора успешно сгенерирован: ${keyCode}`);
      
      // Copy to clipboard using safe method
      const copySuccess = await safeCopyToClipboard(keyCode);
      showCopyNotification(keyCode, copySuccess);
      
      // Refresh the keys list
      await fetchAuthors();
    } catch (error) {
      console.error('Error generating author key:', error);
      setError(error instanceof Error ? error.message : 'Не удалось сгенерировать ключ автора');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyKey = async (keyCode: string) => {
    const copySuccess = await safeCopyToClipboard(keyCode);
    showCopyNotification(keyCode, copySuccess);
  };

  const getKeyStatus = (key: AuthorKey) => {
    if (!key.is_active || key.uses >= key.max_uses) {
      return <Badge className="bg-red-500 text-white">Использован</Badge>;
    }
    if (key.expires_at && new Date(key.expires_at) < new Date()) {
      return <Badge className="bg-yellow-500 text-white">Истек</Badge>;
    }
    return <Badge className="bg-green-500 text-white">Активен</Badge>;
  };

  if (authLoading || isLoading) {
    return (
      <div className="p-6 space-y-6">
        {/* Page header skeleton */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <SkeletonLoader type="text" lines={1} className="w-1/3" />
            <SkeletonLoader type="text" lines={1} className="w-1/2" />
          </div>
          <div className="flex items-center space-x-2">
            <SkeletonLoader type="custom" height={32} width={120} />
            <SkeletonLoader type="custom" height={40} width={80} />
            <SkeletonLoader type="custom" height={40} width={200} />
          </div>
        </div>
        
        {/* Stats cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SkeletonLoader type="custom" count={4} height={120} />
        </div>
        
        {/* Registration keys section skeleton */}
        <div className="space-y-4">
          <div className="space-y-2">
            <SkeletonLoader type="text" lines={1} className="w-1/4" />
            <SkeletonLoader type="text" lines={1} className="w-1/3" />
          </div>
          <SkeletonLoader type="table" rows={5} />
        </div>
        
        {/* Filters section skeleton */}
        <div className="space-y-4">
          <SkeletonLoader type="text" lines={1} className="w-1/6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SkeletonLoader type="custom" height={40} width="100%" count={2} />
          </div>
        </div>
        
        {/* Authors table skeleton */}
        <SkeletonLoader type="table" rows={8} />
      </div>
    );
  }

  if (error && !authors.length && !authorKeys.length) {
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Управление Авторами</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Управление авторами контента и их ключами регистрации
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-sm">
            <BookOpen className="h-4 w-4 mr-1" />
            {filteredAuthors.length} авторов
          </Badge>
          <div className="flex items-center space-x-2">
            <Input
              type="number"
              min="0"
              max="365"
              value={expirationDays}
              onChange={(e) => setExpirationDays(parseInt(e.target.value) || 0)}
              placeholder="Дней"
              className="w-20"
            />
            <span className="text-sm text-gray-500">дней (0 = безлимитно)</span>
          </div>
          <Button 
            onClick={handleGenerateAuthorKey}
            disabled={isGenerating}
          >
            <Plus className="h-4 w-4 mr-2" />
            {isGenerating ? 'Генерируется...' : 'Сгенерировать Ключ Автора'}
          </Button>
        </div>
      </div>

      {/* Success/Error Messages */}
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

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Всего Авторов</p>
                <p className="text-2xl font-bold">{authors.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Активные Авторы</p>
                <p className="text-2xl font-bold">{authors.filter(a => a.is_active).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Key className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ключи Авторов</p>
                <p className="text-2xl font-bold">{authorKeys.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <UserPlus className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Доступные Ключи</p>
                <p className="text-2xl font-bold">
                  {authorKeys.filter(k => k.is_active && k.uses < k.max_uses && (!k.expires_at || new Date(k.expires_at) > new Date())).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Author Registration Keys */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Key className="h-5 w-5 mr-2" />
            Ключи Регистрации Авторов
          </CardTitle>
          <CardDescription>
            Ключи регистрации для создания аккаунтов авторов
          </CardDescription>
        </CardHeader>
        <CardContent>
          {authorKeys.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ключ</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Использования</TableHead>
                    <TableHead>Создан</TableHead>
                    <TableHead>Истекает</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {authorKeys.map((key) => (
                    <TableRow key={key.id}>
                      <TableCell>
                        <div className="font-mono text-sm">
                          {key.key}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getKeyStatus(key)}
                      </TableCell>
                      <TableCell>
                        {key.uses} / {key.max_uses}
                      </TableCell>
                      <TableCell>
                        {new Date(key.created_at).toLocaleDateString('ru-RU')}
                      </TableCell>
                      <TableCell>
                        {key.expires_at ? 
                          new Date(key.expires_at).toLocaleDateString('ru-RU') : 
                          <span className="text-gray-400 italic">Без истечения</span>
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleCopyKey(key.key)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteKey(key.id)}
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
          ) : (
            <div className="text-center py-8 text-gray-500">
              Ключи регистрации авторов не найдены. Сгенерируйте ключи для включения регистрации авторов.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Фильтры Авторов
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Поиск</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Поиск по имени или email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Статус</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Фильтр по статусу" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все Авторы</SelectItem>
                  <SelectItem value="active">Активные</SelectItem>
                  <SelectItem value="inactive">Неактивные</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Authors Table */}
      <Card>
        <CardHeader>
          <CardTitle>Зарегистрированные Авторы</CardTitle>
          <CardDescription>
            Просмотр и управление авторами контента в системе
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Автор</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Создан</TableHead>
                  <TableHead>Последний Вход</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAuthors.map((author) => (
                  <TableRow key={author.id}>
                    <TableCell>
                      <div className="font-medium">
                        {author.display_name || 'Без имени'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-500">
                        {author.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(author.created_at).toLocaleDateString('ru-RU')}
                    </TableCell>
                    <TableCell>
                      {author.last_login ? 
                        new Date(author.last_login).toLocaleDateString('ru-RU') : 
                        <span className="text-gray-400 italic">Никогда</span>
                      }
                    </TableCell>
                    <TableCell>
                      <Badge variant={author.is_active ? "default" : "secondary"}>
                        {author.is_active ? "Активен" : "Неактивен"}
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
                          onClick={() => handleDeleteAuthor(author.id)}
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
          
          {filteredAuthors.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Авторы, соответствующие вашим критериям, не найдены.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthorsPageWithSuspense() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
      <AuthorsPage />
    </Suspense>
  );
} 