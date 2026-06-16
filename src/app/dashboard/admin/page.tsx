
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Shield, Trash2, RefreshCw } from 'lucide-react';
import { supabase } from '@/supabase/client';
import { useSupabase } from '@/supabase/provider';
import { useToast } from '@/hooks/use-toast';
import type { UserRole } from '@/lib/supabase-types';

interface UserWithProfile {
  id: string;
  email: string;
  display_name: string | null;
  role: UserRole;
  status: string;
  created_at: string;
  last_login_at: string | null;
}

export default function AdminDashboard() {
  const { user, isLoading: isUserLoading } = useSupabase();
  const { toast } = useToast();

  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id,email,display_name,role,status,created_at,last_login_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to load users' });
    } finally {
      setIsLoadingUsers(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user) fetchUsers();
  }, [user, fetchUsers]);

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    setIsUpdating(userId);
    try {
      const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
      if (error) throw error;
      toast({ title: 'Success', description: `User role updated to ${newRole}` });
      fetchUsers();
    } catch (error: any) {
      console.error('Failed to update role:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to update role' });
    } finally {
      setIsUpdating(null);
    }
  };

  const updateUserStatus = async (userId: string, newStatus: string) => {
    setIsUpdating(userId);
    try {
      const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', userId);
      if (error) throw error;
      toast({ title: 'Success', description: `User status updated to ${newStatus}` });
      fetchUsers();
    } catch (error: any) {
      console.error('Failed to update status:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to update status' });
    } finally {
      setIsUpdating(null);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to reject this user? This action cannot be undone.')) return;
    setIsUpdating(userId);
    try {
      const { error } = await supabase.from('profiles').update({ status: 'rejected' }).eq('id', userId);
      if (error) throw error;
      toast({ title: 'User Rejected', description: 'User has been rejected and cannot login' });
      fetchUsers();
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to reject user' });
    } finally {
      setIsUpdating(null);
    }
  };

  const getRoleBadgeVariant = (role: UserRole): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (role) {
      case 'مالك': return 'default';
      case 'إشراف إداري': return 'secondary';
      case 'موظف': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'active': return 'default';
      case 'suspended':
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  };

  if (isUserLoading || !user) {
    return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="font-headline flex items-center gap-2"><Shield className="h-6 w-6" />Admin Dashboard - User Management</CardTitle>
              <CardDescription>Manage user roles, statuses, and permissions</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchUsers} disabled={isLoadingUsers}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingUsers ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingUsers ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : users.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">No users found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((userProfile) => (
                    <TableRow key={userProfile.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{userProfile.display_name || 'No name'}</div>
                          <div className="text-sm text-muted-foreground">{userProfile.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <select
                          value={userProfile.role}
                          onChange={(e) => updateUserRole(userProfile.id, e.target.value as UserRole)}
                          disabled={isUpdating === userProfile.id}
                          className="rounded border bg-background px-2 py-1"
                        >
                          <option value="مالك">مالك</option>
                          <option value="إشراف إداري">إشراف إداري</option>
                          <option value="موظف">موظف</option>
                          <option value="مستورد">مستورد</option>
                          <option value="مورد">مورد</option>
                          <option value="مصدر">مصدر</option>
                          <option value="مستخدم مسجل">مستخدم مسجل</option>
                          <option value="زائر">زائر</option>
                        </select>
                        <div className="mt-2"><Badge variant={getRoleBadgeVariant(userProfile.role)}>{userProfile.role}</Badge></div>
                      </TableCell>
                      <TableCell>
                        <select
                          value={userProfile.status}
                          onChange={(e) => updateUserStatus(userProfile.id, e.target.value)}
                          disabled={isUpdating === userProfile.id}
                          className="rounded border bg-background px-2 py-1"
                        >
                          <option value="active">Active</option>
                          <option value="suspended">Suspended</option>
                          <option value="rejected">Rejected</option>
                        </select>
                        <div className="mt-2"><Badge variant={getStatusBadgeVariant(userProfile.status)}>{userProfile.status}</Badge></div>
                      </TableCell>
                      <TableCell>{new Date(userProfile.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>{userProfile.last_login_at ? new Date(userProfile.last_login_at).toLocaleDateString() : 'Never'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {userProfile.status === 'active' && (
                            <Button variant="outline" size="sm" onClick={() => updateUserStatus(userProfile.id, 'suspended')} disabled={isUpdating === userProfile.id}>Suspend</Button>
                          )}
                          {userProfile.status !== 'rejected' && (
                            <Button variant="destructive" size="sm" onClick={() => deleteUser(userProfile.id)} disabled={isUpdating === userProfile.id}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
