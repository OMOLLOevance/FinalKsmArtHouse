'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Plus, Edit, Trash2, ArrowLeft, Save, DollarSign, Users, TrendingUp, Calendar, Mail, AlertTriangle, MessageCircle, Send } from 'lucide-react';
import { GymFinance, GymMember } from '@/types';
import { useGymMembersQuery, useCreateGymMemberMutation, useUpdateGymMemberMutation, useDeleteGymMemberMutation, useGymFinancesQuery, useCreateGymFinanceMutation, useUpdateGymFinanceMutation, useDeleteGymFinanceMutation } from '@/hooks/use-gym-api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui/Dialog';


import { calculateMembershipEndDate } from '@/utils/calculations';
import { sanitizePhoneNumber, formatCurrency } from '@/utils/formatters';
import { useFinanceSummary } from '@/hooks/use-finance';
import { logger } from '@/lib/logger';

interface GymManagementProps {
  onBack?: () => void;
}

const GymManagement: React.FC<GymManagementProps> = ({ onBack }) => {
  const { data: finances, isLoading: financesLoading, refetch: refetchFinances } = useGymFinancesQuery();
  const { data: members, isLoading: membersLoading, refetch: refetchMembers } = useGymMembersQuery();
  const addFinanceMutation = useCreateGymFinanceMutation();
  const updateFinanceMutation = useUpdateGymFinanceMutation();
  const deleteFinanceMutation = useDeleteGymFinanceMutation();
  const addMemberMutation = useCreateGymMemberMutation();
  const updateMemberMutation = useUpdateGymMemberMutation();
  const deleteMemberMutation = useDeleteGymMemberMutation();
  const { showSuccess, showError } = useToast();
  
  const [activeTab, setActiveTab] = useState<'finances' | 'members'>('finances');
  const [displayCount, setDisplayCount] = useState(20);
  const [editingFinance, setEditingFinance] = useState<GymFinance | null>(null);
  const [editingMember, setEditingMember] = useState<GymMember | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [showQuickExpense, setShowQuickExpense] = useState(false);
  const [quickExpenseAmount, setQuickExpenseAmount] = useState('');
  const [quickExpenseDescription, setQuickExpenseDescription] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; id: string; type: 'finance' | 'member'; name?: string }>({ isOpen: false, id: '', type: 'finance' });

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

` +
      `This is a reminder from KSM.ART HOUSE Gym.

` +
      `Your ${packageInfo} membership package is expiring in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}.

` +
      `Expiry Date: ${member.endDate}

` +
      `Please renew your membership to continue enjoying our services.

` +
      `Thank you for being part of our fitness community!`
    );

    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  }, []);

  const sendEmailNotification = useCallback((member: GymMember, daysUntilExpiry: number) => {
    if (!member.email) {
      alert('No email address available for this member');
      return;
    }

    const packageInfo = member.packageType.replace('-', ' ');
    const subject = encodeURIComponent('KSM.ART HOUSE Gym - Membership Expiry Reminder');
    const body = encodeURIComponent(
      `Hello ${member.name},

` +
      `This is a reminder from KSM.ART HOUSE Gym.

` +
      `Your ${packageInfo} membership package is expiring in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}.

` +
      `Membership Details:
` +
      `- Package: ${packageInfo}
` +
      `- Start Date: ${member.startDate}
` +
      `- Expiry Date: ${member.endDate}
` +
      `- Amount Paid: KSH ${member.amountPaid.toLocaleString()}

` +
      `Please visit us to renew your membership and continue enjoying our fitness services.

` +
      `Best regards,
` +
      `KSM.ART HOUSE Gym Team`
    );

    window.open(`mailto:${member.email}?subject=${subject}&body=${body}`, '_blank');
  }, []);

  const sendSMSNotification = useCallback((member: GymMember, daysUntilExpiry: number) => {
    if (!member.phoneNumber) {
      alert('No phone number available for this member');
      return;
    }

    const phoneNumber = sanitizePhoneNumber(member.phoneNumber);
    const packageInfo = member.packageType.replace('-', ' ');
    const message = encodeURIComponent(
      `Hello ${member.name}, your ${packageInfo} gym membership expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''} (${member.endDate}). Please renew to continue. KSM.ART HOUSE Gym`
    );

    window.open(`sms:${phoneNumber}?body=${message}`, '_blank');
  }, []);

  const handleFinanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      logger.info('Saving gym finance record...', financeFormData);

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

  const handleMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const endDate = calculateMembershipEndDate(memberFormData.startDate, memberFormData.packageType);
    const status = new Date(endDate) >= new Date() ? 'active' as const : 'expired' as const;

    const memberData = {
      ...memberFormData,
      endDate,
      status,
    };

    try {
      logger.info('Saving gym member...', memberData);

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
      setMemberFormData({
        name: '',
        phoneNumber: '',
        email: '',
        packageType: 'monthly',
        amountPaid: 0,
        startDate: new Date().toISOString().split('T')[0],
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
    setMemberFormData({
      name: member.name,
      phoneNumber: member.phoneNumber,
      email: member.email,
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

  if (financesLoading || membersLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading gym data...</p>
        </div>
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
              Back to Dashboard
            </Button>
          )}
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Gym Management</h2>
            <p className="text-muted-foreground">Manage gym finances and member activities</p>
          </div>
        </div>
        <Button onClick={() => setIsAdding(true)} className="flex items-center">
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
            className="px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm w-full"
          />
        </div>
        <Button
          onClick={() => setShowQuickExpense(!showQuickExpense)}
          variant="destructive"
          className="flex items-center"
        >
          <DollarSign className="h-4 w-4 mr-2" />
          Quick Expense Entry
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatCurrency(income)}</div>
          </CardContent>
        </Card>


        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(expenses)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${profit >= 0 ? 'text-primary' : 'text-destructive'}`}>
              {formatCurrency(profit)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{activeMembers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Expiring Members Alert */}
      {expiringMembers.length > 0 && (
        <Card className="mb-6 border-warning/30 bg-warning/10">
          <CardHeader>
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-warning mr-2" />
              <CardTitle className="text-sm font-medium text-warning-foreground">
                {expiringMembers.length} member(s) expiring within 7 days
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {expiringMembers.slice(0, 3).map(member => (
                <p key={member.id} className="text-xs text-warning-foreground opacity-80">
                  {member.name} - expires on {member.endDate}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {(isAdding || editingFinance) && activeTab === 'finances' && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              {editingFinance ? 'Edit Finance Entry' : 'Add New Finance Entry'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFinanceSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <Input
                  type="date"
                  value={financeFormData.date}
                  onChange={(e) => setFinanceFormData({ ...financeFormData, date: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={financeFormData.type}
                  onChange={(e) => setFinanceFormData({ ...financeFormData, type: e.target.value as 'income' | 'expense' })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount (KSH)</label>
                <Input
                  type="number"
                  value={financeFormData.amount}
                  onChange={(e) => setFinanceFormData({ ...financeFormData, amount: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Input
                  type="text"
                  value={financeFormData.description}
                  onChange={(e) => setFinanceFormData({ ...financeFormData, description: e.target.value })}
                  required
                />
              </div>
              <div className="md:col-span-2 flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => { setIsAdding(false); setEditingFinance(null); }}>
                  Cancel
                </Button>
                <Button type="submit">
                  <Save className="h-4 w-4 mr-2" />
                  {editingFinance ? 'Update' : 'Save'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {(isAdding || editingMember) && activeTab === 'members' && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              {editingMember ? 'Edit Gym Member' : 'Add New Gym Member'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleMemberSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <Input
                  type="text"
                  value={memberFormData.name}
                  onChange={(e) => setMemberFormData({ ...memberFormData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone Number</label>
                <Input
                  type="tel"
                  value={memberFormData.phoneNumber}
                  onChange={(e) => setMemberFormData({ ...memberFormData, phoneNumber: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input
                  type="email"
                  value={memberFormData.email}
                  onChange={(e) => setMemberFormData({ ...memberFormData, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Package</label>
                <select
                  value={memberFormData.packageType}
                  onChange={(e) => setMemberFormData({ ...memberFormData, packageType: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="three-months">3 Months</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount Paid</label>
                <Input
                  type="number"
                  value={memberFormData.amountPaid}
                  onChange={(e) => setMemberFormData({ ...memberFormData, amountPaid: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <Input
                  type="date"
                  value={memberFormData.startDate}
                  onChange={(e) => setMemberFormData({ ...memberFormData, startDate: e.target.value })}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground mb-4">
                  End Date: {calculateMembershipEndDate(memberFormData.startDate, memberFormData.packageType)}
                </p>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => { setIsAdding(false); setEditingMember(null); }}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    <Save className="h-4 w-4 mr-2" />
                    {editingMember ? 'Update' : 'Save'}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <div className="flex border-b">
          <Button
            variant={activeTab === 'finances' ? 'default' : 'ghost'}
            className="rounded-none border-b-2 data-[state=active]:border-primary"
            data-state={activeTab === 'finances' ? 'active' : ''}
            onClick={() => setActiveTab('finances')}
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Finances
          </Button>
          <Button
            variant={activeTab === 'members' ? 'default' : 'ghost'}
            className="rounded-none border-b-2 data-[state=active]:border-primary"
            data-state={activeTab === 'members' ? 'active' : ''}
            onClick={() => setActiveTab('members')}
          >
            <Users className="h-4 w-4 mr-2" />
            Members
          </Button>
        </div>
        
        {activeTab === 'finances' ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead>
                <tr className="bg-muted">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {monthlyFinances.map((finance) => (
                  <tr key={finance.id}>
                    <td className="px-6 py-4 text-sm">{finance.date}</td>
                    <td className="px-6 py-4 text-sm">{finance.description}</td>
                    <td className="px-6 py-4 text-sm font-medium">
                      {formatCurrency(finance.amount)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Button variant="ghost" size="icon" onClick={() => handleEditFinance(finance)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteDialog({ isOpen: true, id: finance.id, type: 'finance' })}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead>
                <tr className="bg-muted">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Package</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">End Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {members?.slice(0, displayCount).map((member) => (
                  <tr key={member.id}>
                    <td className="px-6 py-4 text-sm font-medium">{member.name}</td>
                    <td className="px-6 py-4 text-sm capitalize">{member.packageType}</td>
                    <td className="px-6 py-4 text-sm">{member.endDate}</td>
                    <td className="px-6 py-4 text-sm space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEditMember(member)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => sendWhatsAppNotification(member, 7)}>
                        <MessageCircle className="h-4 w-4 text-green-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteDialog({ isOpen: true, id: member.id, type: 'member' })}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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