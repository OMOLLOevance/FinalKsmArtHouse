'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Plus, Edit, Trash2, ArrowLeft, Save, DollarSign, Users, TrendingUp, Calendar, Mail, AlertTriangle, MessageCircle, Send, Waves } from 'lucide-react';
import { GymFinance, GymMember } from '@/types';
import { useGymMembersQuery, useCreateGymMemberMutation, useUpdateGymMemberMutation, useDeleteGymMemberMutation, useGymFinancesQuery, useCreateGymFinanceMutation, useUpdateGymFinanceMutation, useDeleteGymFinanceMutation } from '@/hooks/use-gym-api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { LoadingSpinner, SkeletonCard } from '@/components/ui/LoadingSpinner';

import { calculateMembershipEndDate } from '@/utils/calculations';
import { sanitizePhoneNumber, formatCurrency } from '@/utils/formatters';
import { useFinanceSummary } from '@/hooks/use-finance';
import { logger } from '@/lib/logger';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const MemberSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phoneNumber: z.string().min(10, "Phone number must be valid"),
  email: z.string().email("Invalid email address").optional().or(z.literal('')),
  packageType: z.enum(['weekly', 'monthly', 'three-months']),
  amountPaid: z.coerce.number().min(0, "Amount must be positive"),
  startDate: z.string().min(1, "Start date is required"),
});

type MemberFormValues = z.infer<typeof MemberSchema>;

interface GymManagementProps {
  onBack?: () => void;
}

const GymManagement: React.FC<GymManagementProps> = ({ onBack }) => {
  const { user } = useAuth();
  const { data: finances, isLoading: financesLoading, refetch: refetchFinances } = useGymFinancesQuery();
  const { data: members, isLoading: membersLoading, refetch: refetchMembers } = useGymMembersQuery();
  const [activeTab, setActiveTab] = useState<'finances' | 'members'>('finances');
  const [isAdding, setIsAdding] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [displayCount, setDisplayCount] = useState(12);
  const [editingFinance, setEditingFinance] = useState<GymFinance | null>(null);
  const [editingMember, setEditingMember] = useState<GymMember | null>(null);
  const [showQuickExpense, setShowQuickExpense] = useState(false);
  const [quickExpenseAmount, setQuickExpenseAmount] = useState('');
  const [quickExpenseDescription, setQuickExpenseDescription] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; id: string; type: 'finance' | 'member'; name?: string }>({ isOpen: false, id: '', type: 'finance' });

  // Role Permissions
  const isStaff = user?.role === 'staff';
  const isManager = user?.role === 'manager' || user?.role === 'admin' || user?.role === 'director';

  const form = useForm<MemberFormValues>({
    resolver: zodResolver(MemberSchema) as any,
    defaultValues: {
      name: '',
      phoneNumber: '',
      email: '',
      packageType: 'monthly',
      amountPaid: 0,
      startDate: new Date().toISOString().split('T')[0],
    },
  });

  const [financeFormData, setFinanceFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: 0,
    type: 'income' as 'income' | 'expense',
  });

  const [memberFormData, setMemberFormData] = useState({
    name: '',
    phoneNumber: '',
    email: '',
    packageType: 'monthly' as 'weekly' | 'monthly' | 'three-months',
    amountPaid: 0,
    startDate: new Date().toISOString().split('T')[0],
  });

  const monthlyFinances = useMemo(() => 
    finances?.filter(finance => finance.date.startsWith(selectedMonth)) || [],
    [finances, selectedMonth]
  );

  const { income, expenses, profit } = useFinanceSummary(monthlyFinances);

  const activeMembers = useMemo(() => 
    members?.filter(member => new Date(member.endDate) >= new Date())?.length || 0,
    [members]
  );

  const expiringMembers = useMemo(() => 
    members?.filter(member => {
      if (member.status !== 'active') return false;
      const endDate = new Date(member.endDate);
      const today = new Date();
      const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
    }) || [],
    [members]
  );

  const sendWhatsAppNotification = useCallback((member: GymMember, daysUntilExpiry: number) => {
    if (!member.phoneNumber) {
      alert('No phone number available for this member');
      return;
    }

    const phoneNumber = sanitizePhoneNumber(member.phoneNumber);
    const packageInfo = member.packageType.replace('-', ' ');
    const message = encodeURIComponent(
      `Hello ${member.name},

This is a reminder from KSM.ART HOUSE Gym.

Your ${packageInfo} membership package is expiring in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}.

Expiry Date: ${member.endDate}

Please renew your membership to continue enjoying our services.

Thank you for being part of our fitness community!`
    );

    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  }, []);

  const handleFinanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingFinance) {
        await updateFinanceMutation.mutateAsync({ id: editingFinance.id, data: financeFormData });
        showSuccess('Success', 'Finance record updated');
        setEditingFinance(null);
      } else {
        await addFinanceMutation.mutateAsync(financeFormData);
        showSuccess('Success', 'Finance record added');
        setIsAdding(false);
      }
      await refetchFinances();
      setFinanceFormData({
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: 0,
        type: 'income',
      });
    } catch (error) {
      logger.error('Error saving finance record:', error);
      showError('Error', 'Failed to save finance record');
    }
  };

  const onMemberSubmit = async (data: MemberFormValues) => {
    const endDate = calculateMembershipEndDate(data.startDate, data.packageType);
    const status = new Date(endDate) >= new Date() ? 'active' as const : 'expired' as const;
    const memberData = { ...data, endDate, status };

    try {
      if (editingMember) {
        await updateMemberMutation.mutateAsync({ id: editingMember.id, data: memberData });
        showSuccess('Success', 'Member updated successfully');
        setEditingMember(null);
      } else {
        await addMemberMutation.mutateAsync(memberData);
        showSuccess('Success', 'Member added successfully');
        setIsAdding(false);
      }
      await refetchMembers();
      form.reset({
        name: '', phoneNumber: '', email: '', packageType: 'monthly',
        amountPaid: 0, startDate: new Date().toISOString().split('T')[0],
      });
    } catch (error) {
      logger.error('Error saving member:', error);
      showError('Error', 'Failed to save gym member');
    }
  };

  const handleEditFinance = (finance: GymFinance) => {
    setEditingFinance(finance);
    setFinanceFormData({
      date: finance.date,
      description: finance.description,
      amount: finance.amount,
      type: finance.type,
    });
  };

  const handleEditMember = (member: GymMember) => {
    setEditingMember(member);
    form.reset({
      name: member.name,
      phoneNumber: member.phoneNumber,
      email: member.email || '',
      packageType: member.packageType,
      amountPaid: member.amountPaid,
      startDate: member.startDate,
    });
  };

  const handleDeleteFinance = async (id: string) => {
    try {
      await deleteFinanceMutation.mutateAsync(id);
      await refetchFinances();
      showSuccess('Deleted', 'Finance record deleted');
    } catch (error) {
      logger.error('Error deleting finance:', error);
      showError('Error', 'Failed to delete record');
    }
  };

  const handleDeleteMember = async (id: string) => {
    try {
      await deleteMemberMutation.mutateAsync(id);
      await refetchMembers();
      showSuccess('Deleted', 'Gym member deleted');
    } catch (error) {
      logger.error('Error deleting member:', error);
      showError('Error', 'Failed to delete member');
    }
  };

  const confirmDelete = async () => {
    const { id, type } = deleteDialog;
    if (type === 'finance') await handleDeleteFinance(id);
    else if (type === 'member') await handleDeleteMember(id);
    setDeleteDialog({ isOpen: false, id: '', type: 'finance' });
  };

  const handleQuickExpense = async () => {
    if (!quickExpenseAmount || !quickExpenseDescription) {
      showError('Error', 'Amount and description are required');
      return;
    }
    try {
      await addFinanceMutation.mutateAsync({
        date: new Date().toISOString().split('T')[0],
        description: quickExpenseDescription,
        amount: parseFloat(quickExpenseAmount),
        type: 'expense',
      });
      await refetchFinances();
      setQuickExpenseAmount('');
      setQuickExpenseDescription('');
      setShowQuickExpense(false);
      showSuccess('Success', 'Quick expense added');
    } catch (error) {
      logger.error('Error adding quick expense:', error);
      showError('Error', 'Failed to add expense');
    }
  };

  const renderFinanceCards = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
      {monthlyFinances.map((finance) => (
        <Card key={finance.id} className={`overflow-hidden border-l-4 ${finance.type === 'income' ? 'border-l-success' : 'border-l-destructive'} hover-lift glass-card transition-all duration-300`}>
          <div className="p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest opacity-60">{finance.date}</p>
                <h4 className="text-sm font-bold truncate max-w-[150px]">{finance.description}</h4>
              </div>
              <div className="flex space-x-1">
                <Button variant="ghost" size="xs" onClick={() => handleEditFinance(finance)} className="h-7 w-7 p-0 hover:bg-primary/10">
                  <Edit className="h-3.5 w-3.5 text-primary/70" />
                </Button>
                {!isStaff && (
                  <Button variant="ghost" size="xs" onClick={() => setDeleteDialog({ isOpen: true, id: finance.id, type: 'finance' })} className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
            <div className="bg-muted/30 p-2 rounded-lg border border-primary/5 shadow-inner">
              <p className={`text-lg font-black tracking-tighter ${finance.type === 'income' ? 'text-success' : 'text-destructive'}`}>
                {finance.type === 'income' ? '+' : '-'}{formatCurrency(finance.amount)}
              </p>
            </div>
          </div>
        </Card>
      ))}
      {monthlyFinances.length === 0 && (
        <div className="col-span-full py-16 text-center text-muted-foreground border-2 border-dashed rounded-2xl bg-muted/5">
          <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-10" />
          <p className="text-lg font-medium opacity-50">No finance records for this month.</p>
        </div>
      )}
    </div>
  );

  const renderMemberCards = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
      {members?.slice(0, displayCount).map((member) => {
        const isExpired = new Date(member.endDate) < new Date();
        return (
          <Card key={member.id} className={`overflow-hidden border-l-4 ${isExpired ? 'border-l-destructive' : 'border-l-primary'} hover-lift glass-card transition-all duration-300`}>
            <div className="p-4 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <h4 className="text-lg font-black text-foreground truncate leading-tight mb-1">{member.name}</h4>
                  <Badge variant={isExpired ? 'destructive' : 'success'} className="text-[8px] h-4 font-black uppercase tracking-widest px-1.5 border-none">
                    {isExpired ? 'Expired' : 'Active'}
                  </Badge>
                </div>
                <div className="flex items-center space-x-1 shrink-0 ml-2">
                  <Button variant="ghost" size="xs" onClick={() => handleEditMember(member)} className="h-7 w-7 p-0 hover:bg-primary/10">
                    <Edit className="h-3.5 w-3.5 text-primary/70" />
                  </Button>
                  <Button variant="ghost" size="xs" onClick={() => sendWhatsAppNotification(member, 7)} className="h-7 w-7 p-0 text-green-600 hover:bg-green-50">
                    <MessageCircle className="h-3.5 w-3.5" />
                  </Button>
                  {!isStaff && (
                    <Button variant="ghost" size="xs" onClick={() => setDeleteDialog({ isOpen: true, id: member.id, type: 'member' })} className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-muted/20 p-2.5 rounded-xl border border-primary/5">
                <div className="space-y-0.5">
                  <label className="text-[8px] font-black uppercase text-muted-foreground/70 tracking-widest block">Package</label>
                  <p className="text-[10px] font-bold capitalize text-primary">{member.packageType.replace('-', ' ')}</p>
                </div>
                <div className="space-y-0.5">
                  <label className="text-[8px] font-black uppercase text-muted-foreground/70 tracking-widest block text-right">Expires</label>
                  <p className={`text-[10px] font-bold text-right ${isExpired ? 'text-destructive' : 'text-foreground'}`}>{member.endDate}</p>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
      {members?.length === 0 && (
        <div className="col-span-full py-16 text-center text-muted-foreground border-2 border-dashed rounded-2xl bg-muted/5">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-10" />
          <p className="text-lg font-medium opacity-50">No gym members found.</p>
        </div>
      )}
    </div>
  );

  if (financesLoading || membersLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-10 w-64 bg-muted animate-pulse rounded-lg" />
          <div className="h-10 w-32 bg-muted animate-pulse rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="h-24 bg-muted/20 animate-pulse rounded-xl" />
          <div className="h-24 bg-muted/20 animate-pulse rounded-xl" />
          <div className="h-24 bg-muted/20 animate-pulse rounded-xl" />
          <div className="h-24 bg-muted/20 animate-pulse rounded-xl" />
        </div>
        <SkeletonCard count={12} />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between space-y-2">
        <div className="flex items-center space-x-2">
          {onBack && (
            <Button variant="outline" size="sm" onClick={onBack} className="flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Gym Management</h2>
            <p className="text-muted-foreground italic text-xs uppercase font-black tracking-widest opacity-70">Professional Operations</p>
          </div>
        </div>
        <Button onClick={() => setIsAdding(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add {activeTab === 'finances' ? 'Finance' : 'Member'}
        </Button>
      </div>

      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-end">
        <div className="flex-1">
          <label className="block text-xs sm:text-sm font-medium text-muted-foreground mb-2">
            Select Month
          </label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm w-full h-10"
          />
        </div>
        <Button
          onClick={() => setShowQuickExpense(!showQuickExpense)}
          variant="destructive"
          size="sm"
          className="flex items-center h-10 px-6 font-bold"
        >
          <DollarSign className="h-4 w-4 mr-2" />
          Quick Expense
        </Button>
      </div>

      {showQuickExpense && (
        <Card className="mb-6 border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center text-destructive">
              <DollarSign className="h-5 w-5 mr-2" />
              Quick Expense Entry
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <Input
                  type="text"
                  value={quickExpenseDescription}
                  onChange={(e) => setQuickExpenseDescription(e.target.value)}
                  placeholder="e.g., Equipment maintenance"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Amount (KSH)</label>
                <Input
                  type="number"
                  value={quickExpenseAmount}
                  onChange={(e) => setQuickExpenseAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <Button onClick={handleQuickExpense} variant="destructive">
                <Save className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
              <Button onClick={() => setShowQuickExpense(false)} variant="outline">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-muted/20 border-none shadow-none">
          <CardContent className="p-3">
            <div className="text-center">
              <div className="text-xl font-bold text-success">{formatCurrency(income)}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Monthly Income</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/20 border-none shadow-none">
          <CardContent className="p-3">
            <div className="text-center">
              <div className="text-xl font-bold text-destructive">{formatCurrency(expenses)}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Monthly Expenses</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/20 border-none shadow-none">
          <CardContent className="p-3">
            <div className="text-center">
              <div className={`text-xl font-bold ${profit >= 0 ? 'text-primary' : 'text-destructive'}`}>
                {formatCurrency(profit)}
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Monthly Profit</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/20 border-none shadow-none">
          <CardContent className="p-3">
            <div className="text-center">
              <div className="text-xl font-bold text-primary">{activeMembers}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Active Members</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {expiringMembers.length > 0 && (
        <Card className="mb-6 border-warning/30 bg-warning/10">
          <CardHeader className="p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-warning mr-2" />
              <CardTitle className="text-sm font-black uppercase text-warning tracking-widest">
                Expiring Members ({expiringMembers.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-1">
              {expiringMembers.slice(0, 3).map(member => (
                <p key={member.id} className="text-xs text-warning font-medium">
                  • {member.name} - expires on {member.endDate}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {(isAdding || editingFinance) && activeTab === 'finances' && (
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-lg font-semibold">{editingFinance ? 'Edit Finance Entry' : 'Add New Finance Entry'}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleFinanceSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-1">Date</label><Input type="date" value={financeFormData.date} onChange={(e) => setFinanceFormData({ ...financeFormData, date: e.target.value })} required /></div>
              <div><label className="block text-sm font-medium mb-1">Type</label><select value={financeFormData.type} onChange={(e) => setFinanceFormData({ ...financeFormData, type: e.target.value as 'income' | 'expense' })} className="w-full px-3 py-2 border rounded-md bg-background text-foreground" required><option value="income">Income</option><option value="expense">Expense</option></select></div>
              <div><label className="block text-sm font-medium mb-1">Amount (KSH)</label><Input type="number" value={financeFormData.amount} onChange={(e) => setFinanceFormData({ ...financeFormData, amount: parseFloat(e.target.value) || 0 })} required /></div>
              <div><label className="block text-sm font-medium mb-1">Description</label><Input type="text" value={financeFormData.description} onChange={(e) => setFinanceFormData({ ...financeFormData, description: e.target.value })} required /></div>
              <div className="md:col-span-2 flex justify-end space-x-2"><Button type="button" variant="outline" onClick={() => { setIsAdding(false); setEditingFinance(null); }}>Cancel</Button><Button type="submit"><Save className="h-4 w-4 mr-2" />{editingFinance ? 'Update' : 'Save'}</Button></div>
            </form>
          </CardContent>
        </Card>
      )}

      {(isAdding || editingMember) && activeTab === 'members' && (
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-lg font-semibold">{editingMember ? 'Edit Gym Member' : 'Add New Gym Member'}</CardTitle></CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onMemberSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="0712345678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="john@example.com" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="packageType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Package</FormLabel>
                      <FormControl>
                        <select {...field} className="w-full px-3 py-2 border rounded-md bg-background text-foreground h-10">
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                          <option value="three-months">3 Months</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="amountPaid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount Paid</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground mb-4 font-bold italic">
                    Calculated End Date: {calculateMembershipEndDate(form.watch('startDate'), form.watch('packageType'))}
                  </p>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => { setIsAdding(false); setEditingMember(null); }}>Cancel</Button>
                    <Button type="submit"><Save className="h-4 w-4 mr-2" />{editingMember ? 'Update' : 'Save'}</Button>
                  </div>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      <Card className="border-none shadow-sm overflow-hidden">
        <div className="flex border-b bg-muted/10">
          <Button variant={activeTab === 'finances' ? 'default' : 'ghost'} className="flex-1 rounded-none border-b-2 data-[state=active]:border-primary h-12 font-black uppercase tracking-widest text-[10px]" data-state={activeTab === 'finances' ? 'active' : ''} onClick={() => setActiveTab('finances')}><DollarSign className="h-4 w-4 mr-2" />Finances</Button>
          <Button variant={activeTab === 'members' ? 'default' : 'ghost'} className="flex-1 rounded-none border-b-2 data-[state=active]:border-primary h-12 font-black uppercase tracking-widest text-[10px]" data-state={activeTab === 'members' ? 'active' : ''} onClick={() => setActiveTab('members')}><Users className="h-4 w-4 mr-2" />Members</Button>
        </div>
        <CardContent className="p-0">
          {activeTab === 'finances' ? renderFinanceCards() : renderMemberCards()}
        </CardContent>
      </Card>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ ...deleteDialog, isOpen: false })}
        onConfirm={confirmDelete}
        title="Confirm Delete"
        message="Are you sure you want to delete this record?"
      />
    </div>
  );
};

export default React.memo(GymManagement);
