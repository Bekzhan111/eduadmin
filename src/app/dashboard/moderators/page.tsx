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
import { Search, Shield, UserPlus, Edit, Trash2, Eye, Filter, Plus, Copy, Key } from 'lucide-react';

type Moderator = {
  id: string;
  email: string;
  display_name: string | null;
  role: string;
  created_at: string;
  last_login?: string;
  is_active?: boolean;
};

type ModeratorKey = {
  id: string;
  key: string;
  role: 'moderator';
  is_active: boolean;
  max_uses: number;
  uses: number;
  created_at: string;
  expires_at?: string;
};

export default function ModeratorsPage() {
  const { userProfile, isLoading: authLoading } = useAuth();
  const [moderators, setModerators] = useState<Moderator[]>([]);
  const [moderatorKeys, setModeratorKeys] = useState<ModeratorKey[]>([]);
  const [filteredModerators, setFilteredModerators] = useState<Moderator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [expirationDays, setExpirationDays] = useState(30);

  const fetchModerators = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const supabase = createClient();
      
      // Fetch moderators
      const { data: moderatorsData, error: moderatorsError } = await supabase
        .from('users')
        .select(`
          id,
          email,
          display_name,
          role,
          created_at,
          last_login
        `)
        .eq('role', 'moderator')
        .order('created_at', { ascending: false });
      
      if (moderatorsError) {
        throw new Error(`Failed to fetch moderators: ${moderatorsError.message}`);
      }
      
      // Fetch moderator registration keys
      const { data: keysData, error: keysError } = await supabase
        .from('registration_keys')
        .select('id, key, role, is_active, max_uses, uses, created_at, expires_at')
        .eq('role', 'moderator')
        .order('created_at', { ascending: false });
      
      if (keysError) {
        console.error('Error fetching moderator keys:', keysError);
        setError(`Error fetching moderator keys: ${keysError.message}`);
      } else {
        setModeratorKeys(keysData as ModeratorKey[] || []);
      }
      
      // Format the data
      const formattedModerators = (moderatorsData || []).map(moderator => ({
        id: moderator.id,
        email: moderator.email,
        display_name: moderator.display_name,
        role: moderator.role,
        created_at: moderator.created_at,
        last_login: moderator.last_login,
        is_active: true, // You can implement this logic based on your needs
      }));
      
      setModerators(formattedModerators);
      setFilteredModerators(formattedModerators);
    } catch (error) {
      console.error('Error fetching moderators:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch moderators');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Filter moderators based on search term and status
  useEffect(() => {
    let filtered = moderators;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(moderator => 
        (moderator.email && moderator.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (moderator.display_name && moderator.display_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      filtered = filtered.filter(moderator => moderator.is_active === isActive);
    }
    
    setFilteredModerators(filtered);
  }, [moderators, searchTerm, statusFilter]);

  useEffect(() => {
    if (!authLoading && userProfile) {
      if (userProfile.role !== 'super_admin') {
        setError('Access denied. Only super administrators can view this page.');
        setIsLoading(false);
        return;
      }
      
      fetchModerators();
    }
  }, [authLoading, userProfile, fetchModerators]);

  const handleDeleteModerator = async (moderatorId: string) => {
    if (!confirm('Are you sure you want to delete this moderator? This action cannot be undone.')) {
      return;
    }
    
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', moderatorId);
      
      if (error) {
        throw new Error(`Failed to delete moderator: ${error.message}`);
      }
      
      // Refresh the moderators list
      await fetchModerators();
    } catch (error) {
      console.error('Error deleting moderator:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete moderator');
    }
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
      
      setSuccess('Key deleted successfully');
      await fetchModerators(); // Refresh the keys list
    } catch (error) {
      console.error('Error deleting key:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete key');
    }
  };

  // Generate random key
  const generateKeyCode = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const handleGenerateModeratorKey = async () => {
    setIsGenerating(true);
    setError(null);
    setSuccess(null);
    
    try {
      const supabase = createClient();
      
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error('You must be logged in to generate keys');
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
          role: 'moderator',
          school_id: null,
          created_by: sessionData.session.user.id,
          is_active: true,
          expires_at: expiresAt ? expiresAt.toISOString() : null,
          max_uses: 1,
          uses: 0
        }]);
      
      if (error) {
        throw new Error(`Failed to generate moderator key: ${error.message}`);
      }
      
      setSuccess(`Moderator key generated successfully: ${keyCode}`);
      
      // Copy to clipboard using safe method
      const copySuccess = await safeCopyToClipboard(keyCode);
      showCopyNotification(keyCode, copySuccess);
      
      // Refresh the keys list
      await fetchModerators();
    } catch (error) {
      console.error('Error generating moderator key:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate moderator key');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyKey = async (keyCode: string) => {
    const copySuccess = await safeCopyToClipboard(keyCode);
    showCopyNotification(keyCode, copySuccess);
  };

  const getKeyStatus = (key: ModeratorKey) => {
    if (!key.is_active || key.uses >= key.max_uses) {
      return <Badge className="bg-red-500 text-white">Used</Badge>;
    }
    if (key.expires_at && new Date(key.expires_at) < new Date()) {
      return <Badge className="bg-yellow-500 text-white">Expired</Badge>;
    }
    return <Badge className="bg-green-500 text-white">Active</Badge>;
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
            <SkeletonLoader type="custom" height={32} width={140} />
            <SkeletonLoader type="custom" height={40} width={80} />
            <SkeletonLoader type="custom" height={40} width={220} />
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
        
        {/* Moderators table skeleton */}
        <SkeletonLoader type="table" rows={8} />
      </div>
    );
  }

  if (error && !moderators.length && !moderatorKeys.length) {
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Moderators Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage content moderators and their registration keys
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-sm">
            <Shield className="h-4 w-4 mr-1" />
            {filteredModerators.length} moderators
          </Badge>
          <div className="flex items-center space-x-2">
            <Input
              type="number"
              min="0"
              max="365"
              value={expirationDays}
              onChange={(e) => setExpirationDays(parseInt(e.target.value) || 0)}
              placeholder="Days"
              className="w-20"
            />
            <span className="text-sm text-gray-500">days (0 = unlimited)</span>
          </div>
          <Button 
            onClick={handleGenerateModeratorKey}
            disabled={isGenerating}
          >
            <Plus className="h-4 w-4 mr-2" />
            {isGenerating ? 'Generating...' : 'Generate Moderator Key'}
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
              <Shield className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Moderators</p>
                <p className="text-2xl font-bold">{moderators.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Moderators</p>
                <p className="text-2xl font-bold">{moderators.filter(m => m.is_active).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Key className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Moderator Keys</p>
                <p className="text-2xl font-bold">{moderatorKeys.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <UserPlus className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available Keys</p>
                <p className="text-2xl font-bold">
                  {moderatorKeys.filter(k => k.is_active && k.uses < k.max_uses && (!k.expires_at || new Date(k.expires_at) > new Date())).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Moderator Registration Keys */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Key className="h-5 w-5 mr-2" />
            Moderator Registration Keys
          </CardTitle>
          <CardDescription>
            Registration keys for moderator account creation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {moderatorKeys.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Key</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Uses</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {moderatorKeys.map((key) => (
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
          ) : (
            <div className="text-center py-8 text-gray-500">
              No moderator registration keys found. Generate some keys to enable moderator registration.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Moderator Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Moderators</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Moderators Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registered Moderators</CardTitle>
          <CardDescription>
            View and manage content moderators in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Moderator</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredModerators.map((moderator) => (
                  <TableRow key={moderator.id}>
                    <TableCell>
                      <div className="font-medium">
                        {moderator.display_name || 'No name'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-500">
                        {moderator.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(moderator.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {moderator.last_login ? 
                        new Date(moderator.last_login).toLocaleDateString() : 
                        <span className="text-gray-400 italic">Never</span>
                      }
                    </TableCell>
                    <TableCell>
                      <Badge variant={moderator.is_active ? "default" : "secondary"}>
                        {moderator.is_active ? "Active" : "Inactive"}
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
                          onClick={() => handleDeleteModerator(moderator.id)}
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
          
          {filteredModerators.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No moderators found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 