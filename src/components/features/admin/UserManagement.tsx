'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { Loader, UserPlus, ShieldAlert, Copy, RefreshCw, ShieldCheck, Mail, Shield } from 'lucide-react';
import { DataTable } from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/Badge';

const UserManagement = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'staff'
  });
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [createdUser, setCreatedUser] = useState<{ email: string; tempPass: string } | null>(null);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const result = await apiClient.get<any>('/api/admin/users');
      if (result.success) {
        setUsers(result.users);
      }
    } catch (error) {
      console.error('Fetch users error:', error);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setCreatedUser(null);

    try {
      const result = await apiClient.post<any>('/api/admin/create-user', formData);

      setCreatedUser({
        email: formData.email,
        tempPass: 'KsmHouse2026!'
      });
      
      toast.success('User created successfully');
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        role: 'staff'
      });
      fetchUsers();

    } catch (error: any) {
      console.error('Create user error:', error);
      toast.error(error.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!confirm('Are you sure you want to reset this user\'s password to the default?')) return;

    try {
      const result = await apiClient.post<any>('/api/admin/reset-password', { userId });
      toast.success(result.message || 'Password reset successfully');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to reset password');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const columns = [
    {
      key: 'email',
      label: 'Professional Email',
      render: (val: string) => (
        <div className="flex items-center gap-2">
          <Mail className="w-3 h-3 text-muted-foreground" />
          <span className="font-medium">{val}</span>
        </div>
      )
    },
    {
      key: 'first_name',
      label: 'Name',
      render: (_: any, item: any) => (
        <span className="font-semibold uppercase text-xs">
          {item.first_name} {item.last_name}
        </span>
      )
    },
    {
      key: 'role',
      label: 'Role',
      render: (val: string) => (
        <Badge variant="outline" className="uppercase text-[9px] font-black tracking-widest bg-primary/5 text-primary border-primary/20">
          {val}
        </Badge>
      )
    },
    {
      key: 'must_change_password',
      label: 'Security Status',
      render: (val: boolean) => (
        val ? (
          <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[9px] font-bold uppercase tracking-wider">
            Password Change Required
          </Badge>
        ) : (
          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px] font-bold uppercase tracking-wider">
            Verified & Active
          </Badge>
        )
      )
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="glass-card border-primary/10 shadow-xl overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-primary to-teal-500" />
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-xl">
                  <UserPlus className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold uppercase tracking-tight">Onboard User</CardTitle>
                  <CardDescription className="text-[10px] uppercase font-bold tracking-widest opacity-60">System access protocol</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground/70 tracking-widest ml-1">First Name</label>
                    <Input required placeholder="First Name" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} className="bg-muted/10 h-10 text-sm font-medium" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground/70 tracking-widest ml-1">Last Name</label>
                    <Input required placeholder="Last Name" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} className="bg-muted/10 h-10 text-sm font-medium" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground/70 tracking-widest ml-1">Corporate Email</label>
                  <Input required type="email" placeholder="email@ksmarthouse.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="bg-muted/10 h-10 text-sm font-medium" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground/70 tracking-widest ml-1">Professional Role</label>
                  <Select value={formData.role} onValueChange={val => setFormData({ ...formData, role: val })}>
                    <SelectTrigger className="bg-muted/10 h-10 text-sm font-medium border-primary/5">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">STAFF MEMBER</SelectItem>
                      <SelectItem value="operations_manager">OPERATIONS MANAGER</SelectItem>
                      <SelectItem value="director">DIRECTOR</SelectItem>
                      <SelectItem value="investor">INVESTOR</SelectItem>
                      <SelectItem value="admin">ADMINISTRATOR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full h-11 font-bold uppercase tracking-[0.2em] text-[10px] mt-2 shadow-lg shadow-primary/20" disabled={loading}>
                  {loading ? <Loader className="w-4 h-4 animate-spin" /> : 'Authorize Access'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {createdUser && (
            <Card className="border-emerald-500/30 bg-emerald-500/5 animate-in slide-in-from-left-4 duration-500">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-emerald-600">
                  <ShieldCheck className="w-5 h-5" />
                  <CardTitle className="text-sm font-black uppercase tracking-tighter">Identity Established</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-card border border-emerald-500/20 rounded-xl space-y-2">
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-60">Credentials Token</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="font-mono text-[10px] font-bold">{createdUser.tempPass}</p>
                      <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-emerald-500/10 text-emerald-600" onClick={() => copyToClipboard(createdUser.tempPass)}>
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
                <p className="text-[9px] font-medium text-emerald-700 italic leading-tight">
                  Security flag set: User must re-authenticate with a custom passphrase upon initial gateway entry.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2">
          <DataTable
            title="Professional Access Register"
            data={users}
            columns={columns as any}
            loading={usersLoading}
            searchPlaceholder="Search identities..."
            actions={(item) => (
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleResetPassword(item.id)}
                  className="h-8 text-[9px] font-bold uppercase tracking-widest border-primary/20 hover:bg-primary/5 hover:text-primary transition-all group"
                  title="Reset to default temporary password"
                >
                  <RefreshCw className="w-3 h-3 mr-2 group-hover:rotate-180 transition-transform duration-500" />
                  Reset Access
                </Button>
              </div>
            )}
          />
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
