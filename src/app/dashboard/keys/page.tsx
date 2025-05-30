'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { Search, Key, Copy, Trash2, Filter, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

type RegistrationKey = {
  id: string;
  key: string;
  role: string;
  is_used: boolean;
  used_by?: string;
  created_at: string;
  expires_at?: string;
  created_by: string;
  max_uses?: number;
  current_uses: number;
};

export default function KeyManagementPage() {
  const { userProfile, isLoading: authLoading } = useAuth();
  const [keys, setKeys] = useState<RegistrationKey[]>([]);
  const [filteredKeys, setFilteredKeys] = useState<RegistrationKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchKeys = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const supabase = createClient();
      
      // Fetch registration keys
      const { data: keysData, error: keysError } = await supabase
        .from('registration_keys')
        .select(`
          id,
          key,
          role,
          is_active,
          created_at,
          expires_at,
          created_by,
          max_uses,
          uses
        `)
        .order('created_at', { ascending: false });
      
      if (keysError) {
        throw new Error(`Failed to fetch registration keys: ${keysError.message}`);
      }
      
      // Transform the data to match our type
      const transformedKeys = (keysData || []).map(key => ({
        id: key.id,
        key: key.key,
        role: key.role,
        is_used: !key.is_active || key.uses >= (key.max_uses || 1),
        created_at: key.created_at,
        expires_at: key.expires_at,
        created_by: key.created_by,
        max_uses: key.max_uses || 1,
        current_uses: key.uses || 0,
      }));
      
      setKeys(transformedKeys);
      setFilteredKeys(transformedKeys);
    } catch (error) {
      console.error('Error fetching registration keys:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch registration keys');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Filter keys
  useEffect(() => {
    let filtered = keys;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(key => 
        (key.key && key.key.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (key.role && key.role.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (key.used_by && key.used_by.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(key => key.role === roleFilter);
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'used') {
        filtered = filtered.filter(key => key.is_used);
      } else if (statusFilter === 'unused') {
        filtered = filtered.filter(key => !key.is_used);
      } else if (statusFilter === 'expired') {
        filtered = filtered.filter(key => 
          key.expires_at && new Date(key.expires_at) < new Date()
        );
      }
    }
    
    setFilteredKeys(filtered);
  }, [keys, searchTerm, roleFilter, statusFilter]);

  useEffect(() => {
    if (!authLoading && userProfile) {
      if (userProfile.role !== 'super_admin') {
        setError('Access denied. Only super administrators can view this page.');
        setIsLoading(false);
        return;
      }
      
      fetchKeys();
    }
  }, [authLoading, userProfile, fetchKeys]);

  const handleCopyKey = async (keyCode: string) => {
    const copySuccess = await safeCopyToClipboard(keyCode);
    showCopyNotification(keyCode, copySuccess);
  };

  const handleDeleteKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this key? This action cannot be undone.')) {
      return;
    }
    
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('registration_keys')
        .delete()
        .eq('id', keyId);
      
      if (error) {
        throw new Error(`Failed to delete key: ${error.message}`);
      }
      
      // Refresh the keys list
      await fetchKeys();
    } catch (error) {
      console.error('Error deleting key:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete key');
    }
  };

  const getKeyStatus = (key: RegistrationKey) => {
    if (key.is_used) {
      return <Badge className="bg-green-500 text-white">Used</Badge>;
    }
    if (key.expires_at && new Date(key.expires_at) < new Date()) {
      return <Badge className="bg-red-500 text-white">Expired</Badge>;
    }
    return <Badge className="bg-blue-500 text-white">Active</Badge>;
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'school': return 'bg-blue-500 text-white';
      case 'teacher': return 'bg-green-500 text-white';
      case 'student': return 'bg-yellow-500 text-black';
      case 'author': return 'bg-purple-500 text-white';
      case 'moderator': return 'bg-orange-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
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
          <SkeletonLoader type="custom" height={32} width={120} />
        </div>
        
        {/* Stats cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SkeletonLoader type="custom" count={4} height={120} />
        </div>
        
        {/* Filters skeleton */}
        <div className="space-y-4">
          <SkeletonLoader type="text" lines={1} className="w-1/6" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SkeletonLoader type="custom" height={40} width="100%" count={3} />
          </div>
        </div>
        
        {/* Keys table skeleton */}
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
              <Button onClick={() => window.location.reload()} className="mt-4">
                Reload Page
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Key Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View and manage existing registration keys
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-sm">
            <Key className="h-4 w-4 mr-1" />
            {filteredKeys.length} keys
          </Badge>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Key className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Keys</p>
                <p className="text-2xl font-bold">{keys.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Used Keys</p>
                <p className="text-2xl font-bold">{keys.filter(k => k.is_used).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Keys</p>
                <p className="text-2xl font-bold">
                  {keys.filter(k => !k.is_used && (!k.expires_at || new Date(k.expires_at) > new Date())).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Expired Keys</p>
                <p className="text-2xl font-bold">
                  {keys.filter(k => k.expires_at && new Date(k.expires_at) < new Date()).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search keys, roles, or users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Role Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="school">School</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="author">Author</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="unused">Active/Unused</SelectItem>
                  <SelectItem value="used">Used</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Keys Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registration Keys</CardTitle>
          <CardDescription>
            View and manage all registration keys in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Used By</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredKeys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell>
                      <div className="font-mono text-sm">
                        {key.key}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(key.role)}>
                        {key.role.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getKeyStatus(key)}
                    </TableCell>
                    <TableCell>
                      {key.used_by || (
                        <span className="text-gray-400 italic">Not used</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(key.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {key.expires_at ? 
                        new Date(key.expires_at).toLocaleDateString() : 
                        <span className="text-gray-400 italic">No expiry</span>
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
          
          {filteredKeys.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No registration keys found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 