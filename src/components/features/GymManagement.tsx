'use client';

import React, { useState } from 'react';
import { Plus, Edit, Trash2, ArrowLeft, Save, DollarSign, Users, TrendingUp, Calendar, Mail, AlertTriangle, MessageCircle, Send } from 'lucide-react';
import { GymFinance, GymMember } from '@/types';
import { useGymMembers, useGymFinances } from '@/hooks/useGymData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui/Dialog';

interface GymManagementProps {
  onBack?: () => void;
}

const GymManagement: React.FC<GymManagementProps> = ({ onBack }) => {
  const { finances, loading: financesLoading, addFinance, updateFinance, deleteFinance, refetch: refetchFinances } = useGymFinances();
  const { members, loading: membersLoading, addMember, updateMember, deleteMember, refetch: refetchMembers } = useGymMembers();
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

  const calculateEndDate = (startDate: string, packageType: 'weekly' | 'monthly' | 'three-months'): string => {
    const start = new Date(startDate);
    switch (packageType) {
      case 'weekly':
        start.setDate(start.getDate() + 7);
        break;
      case 'monthly':
        start.setMonth(start.getMonth() + 1);
        break;
      case 'three-months':
        start.setMonth(start.getMonth() + 3);
        break;
    }
    return start.toISOString().split('T')[0];
  };

  const sendWhatsAppNotification = (member: GymMember, daysUntilExpiry: number) => {
    if (!member.phoneNumber) {
      alert('No phone number available for this member');
      return;
    }

    const cleanPhone = member.phoneNumber.replace(/\D/g, '');
    const phoneNumber = cleanPhone.startsWith('254') ? cleanPhone : cleanPhone.startsWith('0') ? '254' + cleanPhone.substring(1) : '254' + cleanPhone;

    const packageInfo = member.packageType.replace('-', ' ');
    const message = encodeURIComponent(
      `Hello ${member.name},\n\n` +
      `This is a reminder from KSM.ART HOUSE Gym.\n\n` +
      `Your ${packageInfo} membership package is expiring in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}.\n\n` +
      `Expiry Date: ${member.endDate}\n\n` +
      `Please renew your membership to continue enjoying our services.\n\n` +
      `Thank you for being part of our fitness community!`
    );

    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  const sendEmailNotification = (member: GymMember, daysUntilExpiry: number) => {
    if (!member.email) {
      alert('No email address available for this member');
      return;
    }

    const packageInfo = member.packageType.replace('-', ' ');
    const subject = encodeURIComponent('KSM.ART HOUSE Gym - Membership Expiry Reminder');
    const body = encodeURIComponent(
      `Hello ${member.name},\n\n` +
      `This is a reminder from KSM.ART HOUSE Gym.\n\n` +
      `Your ${packageInfo} membership package is expiring in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}.\n\n` +
      `Membership Details:\n` +
      `- Package: ${packageInfo}\n` +
      `- Start Date: ${member.startDate}\n` +
      `- Expiry Date: ${member.endDate}\n` +
      `- Amount Paid: KSH ${member.amountPaid.toLocaleString()}\n\n` +
      `Please visit us to renew your membership and continue enjoying our fitness services.\n\n` +
      `Best regards,\n` +
      `KSM.ART HOUSE Gym Team`
    );

    window.open(`mailto:${member.email}?subject=${subject}&body=${body}`, '_blank');
  };

  const sendSMSNotification = (member: GymMember, daysUntilExpiry: number) => {
    if (!member.phoneNumber) {
      alert('No phone number available for this member');
      return;
    }

    const cleanPhone = member.phoneNumber.replace(/\D/g, '');
    const phoneNumber = cleanPhone.startsWith('254') ? cleanPhone : cleanPhone.startsWith('0') ? '254' + cleanPhone.substring(1) : '254' + cleanPhone;

    const packageInfo = member.packageType.replace('-', ' ');
    const message = encodeURIComponent(
      `Hello ${member.name}, your ${packageInfo} gym membership expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''} (${member.endDate}). Please renew to continue. KSM.ART HOUSE Gym`
    );

    window.open(`sms:${phoneNumber}?body=${message}`, '_blank');
  };

  const handleLoadMore = () => {
    setDisplayCount(prev => prev + 20);
  };

  const handleFinanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('💾 Saving gym finance record to database...');

      if (editingFinance) {
        await updateFinance(editingFinance.id, financeFormData);
        console.log('✅ Gym finance record updated successfully in database');
        showSuccess(
          'Finance Record Updated!',
          `Successfully updated ${financeFormData.type} record: ${financeFormData.description}. Amount: KSH ${financeFormData.amount.toLocaleString()}`
        );
        setEditingFinance(null);
      } else {
        const newRecord = await addFinance(financeFormData);
        console.log('✅ Gym finance record saved successfully to database');
        showSuccess(
          'Finance Record Added!',
          `New ${financeFormData.type} record created: ${financeFormData.description}. Transaction ID: ${newRecord?.id || 'Generated'}. Amount: KSH ${financeFormData.amount.toLocaleString()}`
        );
        setIsAdding(false);
      }

      // Refresh data
      await refetchFinances();

      setFinanceFormData({
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: 0,
        type: 'income',
      });
    } catch (error) {
      console.error('❌ Error saving gym finance record to database:', error);
      showError(
        'Finance Record Failed',
        'Failed to save gym finance record to database: ' + (error instanceof Error ? error.message : 'Unknown error')
      );
    }
  };

  const handleMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const endDate = calculateEndDate(memberFormData.startDate, memberFormData.packageType);
    const status = new Date(endDate) >= new Date() ? 'active' as const : 'expired' as const;

    const memberData = {
      ...memberFormData,
      endDate,
      status,
    };

    try {
      console.log('💾 Saving gym member to database...');

      if (editingMember) {
        await updateMember(editingMember.id, memberData);
        console.log('✅ Gym member updated successfully in database');
        showSuccess(
          'Gym Member Updated!',
          `Successfully updated membership for ${memberFormData.name}. Package: ${memberFormData.packageType.replace('-', ' ')}. Amount: KSH ${memberFormData.amountPaid.toLocaleString()}. Valid until: ${endDate}`
        );
        setEditingMember(null);
      } else {
        const newMember = await addMember(memberData);
        console.log('✅ Gym member saved successfully to database');
        showSuccess(
          'Gym Membership Created!',
          `New membership created for ${memberFormData.name}. Member ID: ${newMember?.id || 'Generated'}. Package: ${memberFormData.packageType.replace('-', ' ')}. Amount: KSH ${memberFormData.amountPaid.toLocaleString()}. Valid until: ${endDate}`
        );
        setIsAdding(false);
      }

      // Refresh data
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
      console.error('❌ Error saving gym member to database:', error);
      showError(
        'Membership Failed',
        'Failed to save gym member to database: ' + (error instanceof Error ? error.message : 'Unknown error')
      );
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
      await deleteFinance(id);
      await refetchFinances();
      showSuccess(
        'Finance Record Deleted',
        'Finance record has been successfully removed from the system.'
      );
    } catch (error) {
      console.error('Error deleting finance:', error);
      showError(
        'Delete Failed',
        'Failed to delete finance record. Please try again.'
      );
    }
  };

  const handleDeleteMember = async (id: string) => {
    try {
      await deleteMember(id);
      await refetchMembers();
      showSuccess(
        'Gym Member Deleted',
        'Gym member has been successfully removed from the system.'
      );
    } catch (error) {
      console.error('Error deleting member:', error);
      showError(
        'Delete Failed',
        'Failed to delete gym member. Please try again.'
      );
    }
  };

  const confirmDelete = async () => {
    const { id, type } = deleteDialog;
    if (type === 'finance') await handleDeleteFinance(id);
    else if (type === 'member') await handleDeleteMember(id);
  };

  const handleQuickExpense = async () => {
    if (!quickExpenseAmount || !quickExpenseDescription) {
      showError(
        'Missing Information',
        'Please enter both amount and description for the expense.'
      );
      return;
    }

    try {
      const newRecord = await addFinance({
        date: new Date().toISOString().split('T')[0],
        description: quickExpenseDescription,
        amount: parseFloat(quickExpenseAmount),
        type: 'expense',
      });

      // Refresh data
      await refetchFinances();

      setQuickExpenseAmount('');
      setQuickExpenseDescription('');
      setShowQuickExpense(false);
      showSuccess(
        'Quick Expense Added!',
        `Expense recorded: ${quickExpenseDescription}. Transaction ID: ${newRecord?.id || 'Generated'}. Amount: KSH ${parseFloat(quickExpenseAmount).toLocaleString()}`
      );
    } catch (error) {
      console.error('Error adding expense:', error);
      showError(
        'Expense Failed',
        'Failed to add expense. Please try again.'
      );
    }
  };

  const getMonthlyData = () => {
    const monthlyFinances = finances.filter(finance => 
      finance.date.startsWith(selectedMonth)
    );
    
    const income = monthlyFinances
      .filter(finance => finance.type === 'income')
      .reduce((sum, finance) => sum + finance.amount, 0);
    
    const expenses = monthlyFinances
      .filter(finance => finance.type === 'expense')
      .reduce((sum, finance) => sum + finance.amount, 0);
    
    const activeMembers = members.filter(member => {
      const endDate = new Date(member.endDate);
      return endDate >= new Date();
    }).length;

    const expiringMembers = members.filter(member => {
      if (member.status !== 'active') return false;
      const endDate = new Date(member.endDate);
      const today = new Date();
      const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
    });
    
    return { income, expenses, profit: income - expenses, activeMembers, expiringMembers, finances: monthlyFinances };
  };

  const { income, expenses, profit, activeMembers, expiringMembers, finances: monthlyFinances } = getMonthlyData();

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
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
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

      {/* Quick Expense Entry Form */}
      {showQuickExpense && (
        <Card className="mb-6 border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center text-destructive">
              <DollarSign className="h-5 w-5 mr-2" />
              Quick Expense Entry for {new Date(selectedMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="quick-expense-description" className="block text-sm font-medium text-foreground mb-2">
                  Expense Description
                </label>
                <input
                  id="quick-expense-description"
                  type="text"
                  value={quickExpenseDescription}
                  onChange={(e) => setQuickExpenseDescription(e.target.value)}
                  placeholder="e.g., Equipment maintenance, Rent, Utilities"
                  className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label htmlFor="quick-expense-amount" className="block text-sm font-medium text-foreground mb-2">
                  Amount (KSH)
                </label>
                <input
                  id="quick-expense-amount"
                  type="number"
                  value={quickExpenseAmount}
                  onChange={(e) => setQuickExpenseAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <Button
                onClick={handleQuickExpense}
                variant="destructive"
                className="flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
              <Button
                onClick={() => {
                  setShowQuickExpense(false);
                  setQuickExpenseAmount('');
                  setQuickExpenseDescription('');
                }}
                variant="outline"
              >
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
            <div className="text-2xl font-bold text-emerald-500">KSH {income.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total earnings this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">KSH {expenses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total outflow this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${profit >= 0 ? 'text-primary' : 'text-destructive'}`}>
              KSH {profit.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Net profit/loss this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{activeMembers}</div>
            <p className="text-xs text-muted-foreground">
              Currently active gym members
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Expiring Members Alert */}
      {expiringMembers.length > 0 && (
        <Card className="mb-6 border-amber-500/30 bg-amber-500/10">
          <CardHeader>
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
              <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-400">
                {expiringMembers.length} member(s) expiring within 7 days
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {expiringMembers.slice(0, 3).map(member => (
                <p key={member.id} className="text-xs text-amber-700/80 dark:text-amber-400/80">
                  {member.name} - expires on {member.endDate}
                </p>
              ))}
              {expiringMembers.length > 3 && (
                <p className="text-xs text-amber-700/80 dark:text-amber-400/80">
                  ...and {expiringMembers.length - 3} more
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Finance Form */}
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
                <label className="block text-sm font-medium text-foreground mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={financeFormData.date}
                  onChange={(e) => setFinanceFormData({ ...financeFormData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Type
                </label>
                <select
                  value={financeFormData.type}
                  onChange={(e) => setFinanceFormData({ ...financeFormData, type: e.target.value as 'income' | 'expense' })}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Amount (KSH)
                </label>
                <input
                  type="number"
                  value={financeFormData.amount}
                  onChange={(e) => setFinanceFormData({ ...financeFormData, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={financeFormData.description}
                  onChange={(e) => setFinanceFormData({ ...financeFormData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div className="md:col-span-2 flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAdding(false);
                    setEditingFinance(null);
                    setFinanceFormData({
                      date: new Date().toISOString().split('T')[0],
                      description: '',
                      amount: 0,
                      type: 'income',
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex items-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {editingFinance ? 'Update' : 'Save'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Member Form */}
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
                <label className="block text-sm font-medium text-foreground mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={memberFormData.name}
                  onChange={(e) => setMemberFormData({ ...memberFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  inputMode="tel"
                  value={memberFormData.phoneNumber}
                  onChange={(e) => setMemberFormData({ ...memberFormData, phoneNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g., 0712345678"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={memberFormData.email}
                  onChange={(e) => setMemberFormData({ ...memberFormData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Package Type
                </label>
                <select
                  value={memberFormData.packageType}
                  onChange={(e) => setMemberFormData({ ...memberFormData, packageType: e.target.value as 'weekly' | 'monthly' | 'three-months' })}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="weekly">Weekly (KSH 1,200)</option>
                  <option value="monthly">Monthly (KSH 3,500)</option>
                  <option value="three-months">3 Months (KSH 9,000)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Amount Paid (KSH)
                </label>
                <input
                  type="number"
                  value={memberFormData.amountPaid}
                  onChange={(e) => setMemberFormData({ ...memberFormData, amountPaid: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={memberFormData.startDate}
                  onChange={(e) => setMemberFormData({ ...memberFormData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <div className="text-sm text-muted-foreground mb-4">
                  End Date: {calculateEndDate(memberFormData.startDate, memberFormData.packageType)}
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAdding(false);
                      setEditingMember(null);
                      setMemberFormData({
                        name: '',
                        phoneNumber: '',
                        email: '',
                        packageType: 'monthly',
                        amountPaid: 0,
                        startDate: new Date().toISOString().split('T')[0],
                      });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex items-center"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {editingMember ? 'Update' : 'Save'}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="mb-4 sm:mb-6">
        <div className="flex border-b">
          <Button
            variant={activeTab === 'finances' ? 'default' : 'ghost'}
            className={`rounded-none border-b-2 ${activeTab === 'finances' ? 'border-primary' : 'border-transparent'}`}
            onClick={() => setActiveTab('finances')}
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Finances
          </Button>
          <Button
            variant={activeTab === 'members' ? 'default' : 'ghost'}
            className={`rounded-none border-b-2 ${activeTab === 'members' ? 'border-primary' : 'border-transparent'}`}
            onClick={() => setActiveTab('members')}
          >
            <Users className="h-4 w-4 mr-2" />
            Members
          </Button>
        </div>
        
        {activeTab === 'finances' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {monthlyFinances.map((finance) => (
                  <tr key={finance.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {finance.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {finance.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={finance.type === 'income' ? 'success' : 'destructive'}>
                        {finance.type}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      <span className={finance.type === 'income' ? 'text-emerald-500 font-medium' : 'text-destructive font-medium'}>
                        {finance.type === 'income' ? '+' : '-'}KSH {finance.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditFinance(finance)}
                        className="mr-2"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteDialog({ isOpen: true, id: finance.id, type: 'finance', name: finance.description })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {activeTab === 'members' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Package
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Amount Paid
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Start Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    End Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {members.slice(0, displayCount).map((member) => {
                  const endDate = new Date(member.endDate);
                  const today = new Date();
                  const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  const isExpiringSoon = daysUntilExpiry <= 7 && daysUntilExpiry >= 0;

                  return (
                    <tr key={member.id} className={`hover:bg-muted/50 transition-colors ${isExpiringSoon ? 'bg-amber-500/5 hover:bg-amber-500/10' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                        {member.name}
                        {isExpiringSoon && (
                          <div className="text-xs text-amber-600 dark:text-amber-400 flex items-center mt-1">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Expires in {daysUntilExpiry} days
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        <div>{member.phoneNumber}</div>
                        <div className="text-xs text-gray-400">{member.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        <span className="capitalize">{member.packageType.replace('-', ' ')}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        KSH {member.amountPaid.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {member.startDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {member.endDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={member.status === 'active' ? 'success' : 'destructive'}>
                          {member.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditMember(member)}
                              title="Edit member"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteDialog({ isOpen: true, id: member.id, type: 'member', name: member.name })}
                              title="Delete member"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex items-center space-x-2 pt-1 border-t border-border mt-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => sendWhatsAppNotification(member, daysUntilExpiry)}
                              title="Send WhatsApp message"
                            >
                              <MessageCircle className="h-4 w-4 text-green-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => sendSMSNotification(member, daysUntilExpiry)}
                              title="Send SMS"
                            >
                              <Send className="h-4 w-4 text-primary" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => sendEmailNotification(member, daysUntilExpiry)}
                              title="Send email"
                            >
                              <Mail className="h-4 w-4 text-blue-500" />
                            </Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {displayCount < members.length && (
              <div className="text-center py-4 bg-muted">
                <Button
                  onClick={handleLoadMore}
                  variant="outline"
                >
                  Load More ({members.length - displayCount} remaining)
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, id: '', type: 'finance' })}
        onConfirm={confirmDelete}
        title={`Delete ${deleteDialog.type === 'finance' ? 'Finance Record' : 'Gym Member'}`}
        message={`Are you sure you want to delete this ${deleteDialog.type}${deleteDialog.name ? ` (${deleteDialog.name})` : ''}? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default GymManagement;
