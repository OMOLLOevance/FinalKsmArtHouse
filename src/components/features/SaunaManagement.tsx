
'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Plus, Edit, Trash2, ArrowLeft, Save, Waves, X, Search, Calendar, Package } from 'lucide-react';
import { 
  useSaunaBookingsQuery, 
  useCreateSaunaBookingMutation, 
  useDeleteSaunaBookingMutation
} from '@/hooks/use-sauna-api';
import { useAuth } from '@/contexts/AuthContext';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { SaunaBooking } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/Dialog';
import { LoadingSpinner, SkeletonCard } from '@/components/ui/LoadingSpinner';
import { StaffSelector } from '@/components/shared/StaffSelector';
import { formatCurrency } from '@/utils/formatters';
import { logger } from '@/lib/logger';
import { useToast } from '@/components/ui/Toast';
import { SAUNA_INVENTORY_ITEMS } from '@/config/sauna';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';

interface SaunaManagementProps {
  onBack?: () => void;
}

const SaunaManagement: React.FC<SaunaManagementProps> = ({ onBack }) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  
  // RBAC
  const { canDeleteTransaction, isOperationsManager, isDirectorOrInvestor } = useRoleGuard();
  const [filterUserId, setFilterUserId] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const { 
    data: bookings, 
    isLoading: bookingsLoading,
    isError: isBookingsError,
    error: bookingsError
  } = useSaunaBookingsQuery(filterUserId);

  useEffect(() => {
    if (isBookingsError && bookingsError) {
      showError('Error loading sauna bookings', bookingsError.message);
    }
  }, [isBookingsError, bookingsError, showError]);

  const createBookingMutation = useCreateSaunaBookingMutation();
  const deleteBookingMutation = useDeleteSaunaBookingMutation();

  const [isAdding, setIsAdding] = useState(false);
  const [isInventoryOpen, setInventoryOpen] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<string>('');
  const [sessionInventory, setSessionInventory] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    client: '',
    amount: 0,
    status: 'booked' as 'booked' | 'completed',
  });

  const filteredBookings = useMemo(() => {
    if (!bookings) return [];
    return bookings.filter((booking: any) => {
      const matchesSearch = booking.client.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDate = booking.date.startsWith(selectedMonth);
      return matchesSearch && matchesDate;
    });
  }, [bookings, searchTerm, selectedMonth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      logger.info('Creating sauna booking...', formData);
      await createBookingMutation.mutateAsync({ ...formData, duration: 60 });
      setIsAdding(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        client: '',
        amount: 0,
        status: 'booked',
      });
    } catch (error) {
      logger.error('Failed to create sauna booking:', error);
    }
  };

  const handleDelete = useCallback(async (id: string) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await deleteBookingMutation.mutateAsync(id);
      } catch (error) {
        logger.error('Delete failed:', error);
      }
    }
  }, [deleteBookingMutation]);

  const handleAddInventoryItem = () => {
    if (selectedInventoryItem && !sessionInventory.includes(selectedInventoryItem)) {
      setSessionInventory([...sessionInventory, selectedInventoryItem]);
    }
  };

  const handleRemoveInventoryItem = (itemToRemove: string) => {
    setSessionInventory(sessionInventory.filter(item => item !== itemToRemove));
  };


  if (bookingsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-10 w-48 bg-muted animate-pulse rounded-lg" />
          <div className="h-10 w-32 bg-muted animate-pulse rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="h-24 bg-muted/20 animate-pulse rounded-xl" />
          <div className="h-24 bg-muted/20 animate-pulse rounded-xl" />
          <div className="h-24 bg-muted/20 animate-pulse rounded-xl" />
        </div>
        <SkeletonCard count={8} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          {onBack && (
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-primary">Sauna Management</h2>
            <p className="text-muted-foreground italic text-xs uppercase font-black tracking-widest opacity-70">Wellness Operations</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3 items-end md:items-center">
          {(isOperationsManager() || isDirectorOrInvestor()) && (
            <div className="w-64">
              <StaffSelector 
                value={filterUserId} 
                onChange={setFilterUserId} 
                className="w-full bg-background/50 backdrop-blur-sm"
              />
            </div>
          )}

          <Button onClick={() => setInventoryOpen(true)} size="sm" variant="outline">
            <Package className="h-4 w-4 mr-2" />
            Manage Inventory
          </Button>

          <Button onClick={() => setIsAdding(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Booking
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
         <div className="flex-1 relative group">
          <Search className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search clients..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-11 bg-muted/30 border-none rounded-2xl font-bold"
          />
        </div>
        <div className="flex items-center gap-2 bg-muted/20 p-1.5 rounded-2xl border border-primary/5">
          <div className="p-2 bg-primary/10 rounded-xl">
            <Calendar className="h-4 w-4 text-primary opacity-70" />
          </div>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-transparent border-none font-bold h-8 text-sm focus:outline-none w-32"
          />
        </div>
      </div>

      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto rounded-3xl p-0 border-none shadow-2xl">
          <div className="h-1.5 w-full bg-gradient-to-r from-primary to-blue-600" />
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-2xl font-black uppercase tracking-tight text-primary">
              New Booking Entry
            </DialogTitle>
            <DialogDescription className="text-[10px] uppercase font-bold tracking-widest opacity-60">
              Register a new sauna session
            </DialogDescription>
          </DialogHeader>
          
          <div className="px-6 py-4">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-muted-foreground/70 tracking-widest ml-1">Date</label>
                  <Input 
                    type="date" 
                    value={formData.date} 
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })} 
                    required 
                    className="font-bold rounded-xl h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-muted-foreground/70 tracking-widest ml-1">Time</label>
                  <Input 
                    type="time" 
                    value={formData.time} 
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })} 
                    required 
                    className="font-bold rounded-xl h-11"
                  />
                </div>
                <div className="col-span-full space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-muted-foreground/70 tracking-widest ml-1">Client Name</label>
                  <Input 
                    type="text" 
                    value={formData.client} 
                    onChange={(e) => setFormData({ ...formData, client: e.target.value })} 
                    placeholder="Enter client name"
                    required 
                    className="font-bold rounded-xl h-11"
                  />
                </div>
                <div className="col-span-full space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-muted-foreground/70 tracking-widest ml-1">Amount (KSH)</label>
                  <Input 
                    type="number" 
                    value={formData.amount || ''} 
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })} 
                    placeholder="0.00"
                    required 
                    className="font-black text-right rounded-xl h-11"
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Button variant="outline" type="button" onClick={() => setIsAdding(false)} className="flex-1 h-12 font-black uppercase tracking-widest text-[10px] rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" disabled={createBookingMutation.isPending} className="flex-1 h-12 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 rounded-xl">
                  <Save className="h-4 w-4 mr-2" />
                  {createBookingMutation.isPending ? 'Saving...' : 'Save Booking'}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isInventoryOpen} onOpenChange={setInventoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sauna Inventory</DialogTitle>
            <DialogDescription>Manage inventory items for sauna sessions.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Select onValueChange={setSelectedInventoryItem}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an item" />
                </SelectTrigger>
                <SelectContent>
                  {SAUNA_INVENTORY_ITEMS.map(item => (
                    <SelectItem key={item} value={item}>{item}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleAddInventoryItem}>Add</Button>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Selected Items:</h4>
              <ul className="space-y-1">
                {sessionInventory.map(item => (
                  <li key={item} className="flex justify-between items-center">
                    <span>{item}</span>
                    <Button variant="ghost" size="xs" onClick={() => handleRemoveInventoryItem(item)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Standardized Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-muted/20 border-none shadow-none">
          <CardContent className="p-3">
            <div className="text-center">
              <div className="text-xl font-bold">{filteredBookings?.length || 0}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Total Bookings</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/20 border-none shadow-none">
          <CardContent className="p-3">
            <div className="text-center">
              <div className="text-xl font-bold text-success">
                {formatCurrency(filteredBookings?.reduce((sum: number, b: any) => sum + Number(b.amount), 0) || 0)}
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Total Revenue</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/20 border-none shadow-none">
          <CardContent className="p-3">
            <div className="text-center">
              <div className="text-xl font-bold text-primary">
                {filteredBookings?.filter((b: any) => b.status === 'booked').length || 0}
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Upcoming</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm bg-transparent">
        <CardHeader className="px-0 pb-4">
          <CardTitle className="text-xl font-bold">Recent Bookings</CardTitle>
          <CardDescription className="text-xs uppercase tracking-[0.2em] font-black opacity-60">History of wellness sessions</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredBookings?.map((item: any) => (
              <Card key={item.id} className={`overflow-hidden border-l-4 ${item.status === 'completed' ? 'border-l-success' : 'border-l-warning'} hover-lift glass-card transition-all duration-300`}>
                <div className="p-4 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-[0.2em] mb-1">{item.date}</p>
                      <h4 className="text-lg font-black text-foreground truncate" title={item.client}>{item.client}</h4>
                    </div>
                    <div className="flex items-center space-x-1 ml-2">
                      <Badge variant={item.status === 'completed' ? 'success' : 'warning'} className="text-[8px] h-4 font-black uppercase tracking-widest px-1.5 border-none">
                        {item.status}
                      </Badge>
                      {canDeleteTransaction() && (
                        <Button variant="ghost" size="xs" onClick={() => handleDelete(item.id)} className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="bg-muted/20 p-3 rounded-xl border border-primary/5 shadow-inner flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Waves className="h-3.5 w-3.5 text-primary opacity-50" />
                      <span className="text-[10px] font-black uppercase text-muted-foreground/70 tracking-widest">Amount Paid</span>
                    </div>
                    <p className="text-base font-black text-success tracking-tighter">{formatCurrency(Number(item.amount))}</p>
                  </div>
                </div>
              </Card>
            ))}
            {filteredBookings?.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-xl bg-muted/5">
                <Waves className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium opacity-50">No bookings found matching filters.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default React.memo(SaunaManagement);
