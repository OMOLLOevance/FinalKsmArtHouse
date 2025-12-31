import React, { useState } from 'react';
import { Plus, Edit, Trash2, ArrowLeft, Save, Calendar, Users, DollarSign, Waves, Sparkles, TrendingUp, Minus } from 'lucide-react';
import { SaunaBooking, SpaBooking, SaunaSpaFinance } from '@/types';
import { useSaunaBookings, useSpaBookings, useSaunaSpaFinances } from '@/hooks/useSaunaData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { ConfirmDialog, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';

interface SaunaManagementProps {
  onBack?: () => void;
}

const SaunaManagement: React.FC<SaunaManagementProps> = ({ onBack }) => {
  const { bookings, loading: bookingsLoading, addBooking, updateBooking, deleteBooking, refetch: refetchSaunaBookings } = useSaunaBookings();
  const { bookings: spaBookings, loading: spaLoading, addBooking: addSpaBooking, updateBooking: updateSpaBooking, deleteBooking: deleteSpaBooking, refetch: refetchSpaBookings } = useSpaBookings();
  const { finances, loading: financesLoading, addFinance, updateFinance, deleteFinance, refetch: refetchFinances } = useSaunaSpaFinances();
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState<'sauna' | 'spa' | 'finances'>('sauna');
  const [editingBooking, setEditingBooking] = useState<SaunaBooking | null>(null);
  const [editingSpaBooking, setEditingSpaBooking] = useState<SpaBooking | null>(null);
  const [editingFinance, setEditingFinance] = useState<SaunaSpaFinance | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; id: string; type: 'sauna' | 'spa' | 'finance'; name?: string }>({ isOpen: false, id: '', type: 'sauna' });

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    client: '',
    amount: 0,
    status: 'booked' as 'booked' | 'completed',
  });

  const [spaFormData, setSpaFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    client: '',
    service: '',
    duration: 60,
    amount: 0,
    status: 'booked' as 'booked' | 'completed',
  });

  const [financeFormData, setFinanceFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'sauna-profit' as 'sauna-profit' | 'spa-profit' | 'expense',
    description: '',
    amount: 0,
    category: 'sauna' as 'sauna' | 'spa' | 'general',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const bookingData = { ...formData, duration: 0 };

      if (editingBooking) {
        await updateBooking(editingBooking.id, bookingData);
        showSuccess(
          'Sauna Booking Updated!',
          `Successfully updated booking for ${formData.client} on ${formData.date} at ${formData.time}. Amount: KSH ${formData.amount.toLocaleString()}`
        );
        setEditingBooking(null);
      } else {
        const newBooking = await addBooking(bookingData);
        showSuccess(
          'Sauna Booking Confirmed!',
          `New sauna booking created for ${formData.client} on ${formData.date} at ${formData.time}. Transaction ID: ${newBooking?.id || 'Generated'}. Amount: KSH ${formData.amount.toLocaleString()}`
        );
        setIsAdding(false);
      }

      // Refresh data
      await refetchSaunaBookings();

      setFormData({
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        client: '',
        amount: 0,
        status: 'booked',
      });
    } catch (error) {
      console.error('Error saving sauna booking:', error);
      showError(
        'Booking Failed',
        'Failed to save sauna booking. Please try again or contact support.'
      );
    }
  };

  const handleSpaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSpaBooking) {
        await updateSpaBooking(editingSpaBooking.id, spaFormData);
        showSuccess(
          'Spa Booking Updated!',
          `Successfully updated ${spaFormData.service} booking for ${spaFormData.client} on ${spaFormData.date} at ${spaFormData.time}. Duration: ${spaFormData.duration} min. Amount: KSH ${spaFormData.amount.toLocaleString()}`
        );
        setEditingSpaBooking(null);
      } else {
        const newBooking = await addSpaBooking(spaFormData);
        showSuccess(
          'Spa Booking Confirmed!',
          `New ${spaFormData.service} booking created for ${spaFormData.client} on ${spaFormData.date} at ${spaFormData.time}. Transaction ID: ${newBooking?.id || 'Generated'}. Duration: ${spaFormData.duration} min. Amount: KSH ${spaFormData.amount.toLocaleString()}`
        );
        setIsAdding(false);
      }

      // Refresh data
      await refetchSpaBookings();

      setSpaFormData({
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        client: '',
        service: '',
        duration: 60,
        amount: 0,
        status: 'booked',
      });
    } catch (error) {
      console.error('Error saving spa booking:', error);
      showError(
        'Spa Booking Failed',
        'Failed to save spa booking. Please try again or contact support.'
      );
    }
  };

  const handleFinanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingFinance) {
        await updateFinance(editingFinance.id, financeFormData);
        showSuccess(
          'Finance Record Updated!',
          `Successfully updated ${financeFormData.type.replace('-', ' ')} record: ${financeFormData.description}. Amount: KSH ${financeFormData.amount.toLocaleString()}`
        );
        setEditingFinance(null);
      } else {
        const newRecord = await addFinance(financeFormData);
        showSuccess(
          'Finance Record Added!',
          `New ${financeFormData.type.replace('-', ' ')} record created: ${financeFormData.description}. Transaction ID: ${newRecord?.id || 'Generated'}. Amount: KSH ${financeFormData.amount.toLocaleString()}`
        );
        setIsAdding(false);
      }

      // Refresh data
      await refetchFinances();

      setFinanceFormData({
        date: new Date().toISOString().split('T')[0],
        type: 'sauna-profit',
        description: '',
        amount: 0,
        category: 'sauna',
      });
    } catch (error) {
      console.error('Error saving finance:', error);
      showError(
        'Finance Record Failed',
        'Failed to save finance record. Please try again or contact support.'
      );
    }
  };

  const handleEdit = (booking: SaunaBooking) => {
    setEditingBooking(booking);
    setFormData({
      date: booking.date,
      time: booking.time,
      client: booking.client,
      amount: booking.amount,
      status: booking.status,
    });
  };

  const handleEditSpa = (booking: SpaBooking) => {
    setEditingSpaBooking(booking);
    setSpaFormData({
      date: booking.date,
      time: booking.time,
      client: booking.client,
      service: booking.service,
      duration: booking.duration,
      amount: booking.amount,
      status: booking.status,
    });
  };

  const handleEditFinance = (finance: SaunaSpaFinance) => {
    setEditingFinance(finance);
    setFinanceFormData({
      date: finance.date,
      type: finance.type,
      description: finance.description,
      amount: finance.amount,
      category: finance.category,
    });
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteBooking(id);
      await refetchSaunaBookings();
      showSuccess(
        'Booking Deleted',
        'Sauna booking has been successfully removed from the system.'
      );
    } catch (error) {
      console.error('Error deleting sauna booking:', error);
      showError(
        'Delete Failed',
        'Failed to delete sauna booking. Please try again.'
      );
    }
  };

  const handleDeleteSpa = async (id: string) => {
    try {
      await deleteSpaBooking(id);
      await refetchSpaBookings();
      showSuccess(
        'Spa Booking Deleted',
        'Spa booking has been successfully removed from the system.'
      );
    } catch (error) {
      console.error('Error deleting spa booking:', error);
      showError(
        'Delete Failed',
        'Failed to delete spa booking. Please try again.'
      );
    }
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

  const confirmDelete = async () => {
    const { id, type } = deleteDialog;
    if (type === 'sauna') await handleDelete(id);
    else if (type === 'spa') await handleDeleteSpa(id);
    else if (type === 'finance') await handleDeleteFinance(id);
  };

  const toggleStatus = async (id: string) => {
    try {
      const booking = bookings.find(b => b.id === id);
      if (booking) {
        const newStatus = booking.status === 'booked' ? 'completed' : 'booked';
        await updateBooking(id, {
          status: newStatus
        });
        await refetchSaunaBookings();
        showSuccess(
          'Status Updated',
          `Sauna booking for ${booking.client} has been marked as ${newStatus}.`
        );
      }
    } catch (error) {
      console.error('Error updating sauna booking status:', error);
      showError(
        'Status Update Failed',
        'Failed to update booking status. Please try again.'
      );
    }
  };

  const toggleSpaStatus = async (id: string) => {
    try {
      const booking = spaBookings.find(b => b.id === id);
      if (booking) {
        const newStatus = booking.status === 'booked' ? 'completed' : 'booked';
        await updateSpaBooking(id, {
          status: newStatus
        });
        await refetchSpaBookings();
        showSuccess(
          'Status Updated',
          `Spa booking for ${booking.client} has been marked as ${newStatus}.`
        );
      }
    } catch (error) {
      console.error('Error updating spa booking status:', error);
      showError(
        'Status Update Failed',
        'Failed to update booking status. Please try again.'
      );
    }
  };

  const getMonthlyData = () => {
    const monthlyBookings = bookings.filter(booking => 
      booking.date.startsWith(selectedMonth)
    );
    
    const monthlySpaBookings = spaBookings.filter(booking => 
      booking.date.startsWith(selectedMonth)
    );
    
    const monthlyFinances = finances.filter(finance => 
      finance.date.startsWith(selectedMonth)
    );
    
    const totalRevenue = monthlyBookings
      .filter(booking => booking.status === 'completed')
      .reduce((sum, booking) => sum + booking.amount, 0);
    
    const spaRevenue = monthlySpaBookings
      .filter(booking => booking.status === 'completed')
      .reduce((sum, booking) => sum + booking.amount, 0);
    
    const profitFromFinances = monthlyFinances
      .filter(finance => finance.type === 'sauna-profit' || finance.type === 'spa-profit')
      .reduce((sum, finance) => sum + finance.amount, 0);
    
    const expensesFromFinances = monthlyFinances
      .filter(finance => finance.type === 'expense')
      .reduce((sum, finance) => sum + finance.amount, 0);
    
    const totalBookings = monthlyBookings.length;
    const totalSpaBookings = monthlySpaBookings.length;
    const completedBookings = monthlyBookings.filter(booking => booking.status === 'completed').length;
    const completedSpaBookings = monthlySpaBookings.filter(booking => booking.status === 'completed').length;
    
    return { 
      totalRevenue: totalRevenue + spaRevenue + profitFromFinances, 
      saunaRevenue: totalRevenue,
      spaRevenue,
      totalExpenses: expensesFromFinances,
      totalBookings, 
      totalSpaBookings,
      completedBookings,
      completedSpaBookings,
      bookings: monthlyBookings,
      spaBookings: monthlySpaBookings,
      finances: monthlyFinances
    };
  };

  const { 
    totalRevenue, 
    saunaRevenue, 
    spaRevenue, 
    totalExpenses,
    totalBookings, 
    totalSpaBookings,
    completedBookings,
    completedSpaBookings,
    bookings: monthlyBookings,
    spaBookings: monthlySpaBookings,
    finances: monthlyFinances
  } = getMonthlyData();

  if (bookingsLoading || spaLoading || financesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading sauna & spa data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between space-y-2">
        <div className="flex items-center space-x-2">
          {onBack && (
            <Button variant="outline" size="sm" onClick={onBack} className="flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          )}
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Sauna Management</h2>
            <p className="text-muted-foreground">Manage sauna bookings and track revenue</p>
          </div>
        </div>
        <Button onClick={() => setIsAdding(true)} className="flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Add {activeTab === 'sauna' ? 'Sauna' : activeTab === 'spa' ? 'Spa' : 'Finance'}
        </Button>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-muted-foreground mb-2">
          Select Month
        </label>
        <Input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="w-full sm:w-auto"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">KSH {totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sauna Revenue</CardTitle>
            <Waves className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">KSH {saunaRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Spa Revenue</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">KSH {spaRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalBookings + totalSpaBookings}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <Minus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">KSH {totalExpenses.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Forms */}
      {(isAdding || editingBooking) && activeTab === 'sauna' && (
        <Dialog open={true} onOpenChange={(open) => !open && (setIsAdding(false), setEditingBooking(null))}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingBooking ? 'Edit Sauna Booking' : 'Add New Sauna Booking'}</DialogTitle>
            </DialogHeader>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Time</label>
              <Input type="time" value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Client</label>
              <Input type="text" value={formData.client} onChange={(e) => setFormData({ ...formData, client: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount (KSH)</label>
              <Input type="number" value={formData.amount || ''} onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={formData.status} 
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'booked' | 'completed' })}
              >
                <option value="booked">Booked</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="md:col-span-2 flex justify-end space-x-2 mt-4">
              <Button variant="outline" type="button" onClick={() => { setIsAdding(false); setEditingBooking(null); }}>Cancel</Button>
              <Button type="submit"><Save className="h-4 w-4 mr-2" />{editingBooking ? 'Update' : 'Save'}</Button>
            </div>
          </form>
          </DialogContent>
        </Dialog>
      )}

      {(isAdding || editingSpaBooking) && activeTab === 'spa' && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editingSpaBooking ? 'Edit Spa Booking' : 'Add New Spa Booking'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSpaSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <Input type="date" value={spaFormData.date} onChange={(e) => setSpaFormData({ ...spaFormData, date: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Time</label>
                <Input type="time" value={spaFormData.time} onChange={(e) => setSpaFormData({ ...spaFormData, time: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Client</label>
                <Input type="text" value={spaFormData.client} onChange={(e) => setSpaFormData({ ...spaFormData, client: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Service</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={spaFormData.service} 
                  onChange={(e) => setSpaFormData({ ...spaFormData, service: e.target.value })} 
                  required
                >
                  <option value="">Select Service</option>
                  <option value="massage">Massage</option>
                  <option value="facial">Facial</option>
                  <option value="manicure">Manicure</option>
                  <option value="pedicure">Pedicure</option>
                  <option value="body-wrap">Body Wrap</option>
                  <option value="aromatherapy">Aromatherapy</option>
                  <option value="hot-stone">Hot Stone Therapy</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Duration (minutes)</label>
                <Input type="number" value={spaFormData.duration || ''} onChange={(e) => setSpaFormData({ ...spaFormData, duration: parseInt(e.target.value) || 60 })} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount (KSH)</label>
                <Input type="number" value={spaFormData.amount || ''} onChange={(e) => setSpaFormData({ ...spaFormData, amount: parseFloat(e.target.value) || 0 })} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={spaFormData.status} 
                  onChange={(e) => setSpaFormData({ ...spaFormData, status: e.target.value as 'booked' | 'completed' })}
                >
                  <option value="booked">Booked</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="md:col-span-2 flex justify-end space-x-2">
                <Button variant="outline" type="button" onClick={() => { setIsAdding(false); setEditingSpaBooking(null); }}>Cancel</Button>
                <Button type="submit"><Save className="h-4 w-4 mr-2" />{editingSpaBooking ? 'Update' : 'Save'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {(isAdding || editingFinance) && activeTab === 'finances' && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editingFinance ? 'Edit Finance Entry' : 'Add New Finance Entry'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFinanceSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <Input type="date" value={financeFormData.date} onChange={(e) => setFinanceFormData({ ...financeFormData, date: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={financeFormData.type} 
                  onChange={(e) => setFinanceFormData({ ...financeFormData, type: e.target.value as 'sauna-profit' | 'spa-profit' | 'expense' })} 
                  required
                >
                  <option value="sauna-profit">Sauna Profit</option>
                  <option value="spa-profit">Spa Profit</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={financeFormData.category} 
                  onChange={(e) => setFinanceFormData({ ...financeFormData, category: e.target.value as 'sauna' | 'spa' | 'general' })} 
                  required
                >
                  <option value="sauna">Sauna</option>
                  <option value="spa">Spa</option>
                  <option value="general">General</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount (KSH)</label>
                <Input type="number" value={financeFormData.amount || ''} onChange={(e) => setFinanceFormData({ ...financeFormData, amount: parseFloat(e.target.value) || 0 })} required />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input type="text" value={financeFormData.description} onChange={(e) => setFinanceFormData({ ...financeFormData, description: e.target.value })} required />
              </div>
              <div className="md:col-span-2 flex justify-end space-x-2">
                <Button variant="outline" type="button" onClick={() => { setIsAdding(false); setEditingFinance(null); }}>Cancel</Button>
                <Button type="submit"><Save className="h-4 w-4 mr-2" />{editingFinance ? 'Update' : 'Save'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tabs and Content */}
      <Card>
        <div className="border-b">
          <div className="flex">
            <Button
              variant={activeTab === 'sauna' ? 'default' : 'ghost'}
              className={`rounded-none border-b-2 ${activeTab === 'sauna' ? 'border-primary' : 'border-transparent'}`}
              onClick={() => setActiveTab('sauna')}
            >
              <Waves className="h-4 w-4 mr-2" />
              Sauna Bookings
            </Button>
            <Button
              variant={activeTab === 'spa' ? 'default' : 'ghost'}
              className={`rounded-none border-b-2 ${activeTab === 'spa' ? 'border-primary' : 'border-transparent'}`}
              onClick={() => setActiveTab('spa')}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Spa Bookings
            </Button>
            <Button
              variant={activeTab === 'finances' ? 'default' : 'ghost'}
              className={`rounded-none border-b-2 ${activeTab === 'finances' ? 'border-primary' : 'border-transparent'}`}
              onClick={() => setActiveTab('finances')}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Finances
            </Button>
          </div>
        </div>

        <CardContent className="pt-6">
          {activeTab === 'sauna' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Client</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {monthlyBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4 text-sm">{booking.date}</td>
                      <td className="px-6 py-4 text-sm">{booking.time}</td>
                      <td className="px-6 py-4 text-sm">{booking.client}</td>
                      <td className="px-6 py-4 text-sm font-medium">KSH {booking.amount.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <Button
                          variant="ghost"
                          className="h-auto p-0 hover:bg-transparent"
                          onClick={() => toggleStatus(booking.id)}
                        >
                          <Badge variant={booking.status === 'completed' ? 'success' : 'warning'}>
                            {booking.status}
                          </Badge>
                        </Button>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(booking)} className="mr-2">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteDialog({ isOpen: true, id: booking.id, type: 'sauna', name: booking.client })}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'spa' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Client</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Service</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {monthlySpaBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4 text-sm">{booking.date}</td>
                      <td className="px-6 py-4 text-sm">{booking.time}</td>
                      <td className="px-6 py-4 text-sm">{booking.client}</td>
                      <td className="px-6 py-4 text-sm capitalize">{booking.service}</td>
                      <td className="px-6 py-4 text-sm">{booking.duration} min</td>
                      <td className="px-6 py-4 text-sm font-medium">KSH {booking.amount.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <Button
                          variant="ghost"
                          className="h-auto p-0 hover:bg-transparent"
                          onClick={() => toggleSpaStatus(booking.id)}
                        >
                          <Badge variant={booking.status === 'completed' ? 'success' : 'warning'}>
                            {booking.status}
                          </Badge>
                        </Button>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Button variant="ghost" size="icon" onClick={() => handleEditSpa(booking)} className="mr-2">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteDialog({ isOpen: true, id: booking.id, type: 'spa', name: booking.client })}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'finances' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {monthlyFinances.map((finance) => (
                    <tr key={finance.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4 text-sm">{finance.date}</td>
                      <td className="px-6 py-4">
                        <Badge variant={
                          finance.type === 'expense' ? 'destructive' : 'success'
                        }>
                          {finance.type.replace('-', ' ')}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm capitalize">{finance.category}</td>
                      <td className="px-6 py-4 text-sm">{finance.description}</td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <span className={finance.type === 'expense' ? 'text-destructive' : 'text-green-600'}>
                          {finance.type === 'expense' ? '-' : '+'}KSH {finance.amount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Button variant="ghost" size="icon" onClick={() => handleEditFinance(finance)} className="mr-2">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteDialog({ isOpen: true, id: finance.id, type: 'finance', name: finance.description })}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, id: '', type: 'sauna' })}
        onConfirm={confirmDelete}
        title={`Delete ${deleteDialog.type === 'sauna' ? 'Sauna Booking' : deleteDialog.type === 'spa' ? 'Spa Booking' : 'Finance Record'}`}
        message={`Are you sure you want to delete this ${deleteDialog.type === 'finance' ? 'finance record' : 'booking'}${deleteDialog.name ? ` for ${deleteDialog.name}` : ''}? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default SaunaManagement;