'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Shield, UserX, UserCheck, Trash2, RefreshCw } from 'lucide-react';
import { supabase } from '@/supabase/client';
import { useSupabase } from '@/supabase/provider';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-provider';
import type { UserRole, Profile } from '@/lib/supabase-types';
import { createServerSupabaseClient } from '@/supabase/server';
import { cookies } from 'next/headers';

// Types for admin dashboard
interface UserWithProfile {
  id: string;
  email: string;
  display_name: string | null;
  role: UserRole;
  status: string;
  whatsapp_verified: boolean;
  created_at: string;
  last_login_at: string | null;
}

export default function AdminDashboard() {
  const { t } = useLanguage();
  const { user, isLoading: isUserLoading } = useSupabase();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null); // Track which user is being updated

  // Fetch all users (admin only)
  const fetchUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to load users',
      });
    } finally {
      setIsLoadingUsers(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user) {
      fetchUsers();
    }
  }, [user, fetchUsers]);

  // Update user role
  const updateUserRole = async (userId: string, newRole: UserRole) => {
    setIsUpdating(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: `User role updated to ${newRole}`,
      });
      
      fetchUsers(); // Refresh list
    } catch (error: any) {
      console.error('Failed to update role:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update role',
      });
    } finally {
      setIsUpdating(null);
    }
  };

  // Update user status
  const updateUserStatus = async (userId: string, newStatus: string) => {
    setIsUpdating(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', userId);
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: `User status updated to ${newStatus}`,
      });
      
      fetchUsers(); // Refresh list
    } catch (error: any) {
      console.error('Failed to update status:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update status',
      });
    } finally {
      setIsUpdating(null);
    }
  };

  // Delete user (soft delete by setting status to 'rejected')
  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to reject this user? This action cannot be undone.')) {
      return;
    }
    
    setIsUpdating(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'rejected' })
        .eq('id', userId);
      
      if (error) throw error;
      
      toast({
        title: 'User Rejected',
        description: 'User has been rejected and cannot login',
      });
      
      fetchUsers(); // Refresh list
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to reject user',
      });
    } finally {
      setIsUpdating(null);
    }
  };

  // Role badge colors
  const getRoleBadgeVariant = (role: UserRole): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (role) {
      case 'owner': return 'default';
      case 'admin': return 'secondary';
      case 'employee': return 'outline';
      case 'importer': return 'outline';
      case 'supplier': return 'outline';
      case 'agent': return 'outline';
      default: return 'outline';
    }
  };

  // Status badge colors
  const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'active': return 'default';
      case 'pending_verification': return 'secondary';
      case 'suspended': return 'destructive';
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  };

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-headline flex items-center gap-2">
                <Shield className="h-6 w-6" />
                Admin Dashboard - User Management
              </CardTitle>
              <CardDescription>
                Manage user roles, statuses, and permissions
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchUsers}
              disabled={isLoadingUsers}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingUsers ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingUsers ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No users found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>WhatsApp</TableHead>
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
                          <div className="font-medium">
                            {userProfile.display_name || 'No name'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {userProfile.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <select
                          value={userProfile.role}
                          onChange={(e) => updateUserRole(userProfile.id, e.target.value as UserRole)}
                          disabled={isUpdating === userProfile.id}
                          className="px-2 py-1 rounded border bg-background"
                        >
                          <option value="owner">Owner</option>
                          <option value="admin">Admin</option>
                          <option value="employee">Employee</option>
                          <option value="importer">Importer</option>
                          <option value="supplier">Supplier</option>
                          <option value="agent">Agent</option>
                        </select>
                      </TableCell>
                      <TableCell>
                        <select
                          value={userProfile.status}
                          onChange={(e) => updateUserStatus(userProfile.id, e.target.value)}
                          disabled={isUpdating === userProfile.id}
                          className="px-2 py-1 rounded border bg-background"
                        >
                          <option value="pending_verification">Pending</option>
                          <option value="active">Active</option>
                          <option value="suspended">Suspended</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </TableCell>
                      <TableCell>
                        {userProfile.whatsapp_verified ? (
                          <Badge variant="default">Verified</Badge>
                        ) : (
                          <Badge variant="destructive">Not Verified</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(userProfile.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {userProfile.last_login_at
                          ? new Date(userProfile.last_login_at).toLocaleDateString()
                          : 'Never'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {/* Approve button for pending verification */}
                          {userProfile.status === 'pending_verification' && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => updateUserStatus(userProfile.id, 'active')}
                              disabled={isUpdating === userProfile.id}
                            >
                              {isUpdating === userProfile.id ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : null}
                              Approve
                            </Button>
                          )}
                          
                          {/* Suspend button for active users */}
                          {userProfile.status === 'active' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateUserStatus(userProfile.id, 'suspended')}
                              disabled={isUpdating === userProfile.id}
                            >
                              {isUpdating === userProfile.id ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : null}
                              Suspend
                            </Button>
                          )}
                          
                          {/* Delete/Reject button */}
                          {userProfile.status !== 'rejected' && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteUser(userProfile.id)}
                              disabled={isUpdating === userProfile.id}
                            >
                              {isUpdating === userProfile.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
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

      {/* Audit Logs Section (Read-only) */}
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Audit Logs</CardTitle>
          <CardDescription>
            View all system activity and changes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Audit logs are immutable and track all INSERT, UPDATE, and DELETE operations.
            <br />
            <a href="/dashboard/admin/audit-logs" className="text-primary hover:underline">
              View full audit trail →
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
