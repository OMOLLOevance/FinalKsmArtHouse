'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Plus, Edit, Trash2, ArrowLeft, Save, Waves, X } from 'lucide-react';
import { 
  useSaunaBookingsQuery, 
  useCreateSaunaBookingMutation, 
  useDeleteSaunaBookingMutation
} from '@/hooks/use-sauna-api';
import { useAuth } from '@/contexts/AuthContext';
import { SaunaBooking } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner, SkeletonCard } from '@/components/ui/LoadingSpinner';
import { formatCurrency } from '@/utils/formatters';
import { logger } from '@/lib/logger';

interface SaunaManagementProps {
  onBack?: () => void;
}

const SaunaManagement: React.FC<SaunaManagementProps> = ({ onBack }) => {
  const { user } = useAuth();
  const { data: bookings, isLoading: bookingsLoading } = useSaunaBookingsQuery();
  const createBookingMutation = useCreateSaunaBookingMutation();
  const deleteBookingMutation = useDeleteSaunaBookingMutation();

  const [isAdding, setIsAdding] = useState(false);

  // Role Permissions
  const isStaff = user?.role === 'staff';

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    client: '',
    amount: 0,
    status: 'booked' as 'booked' | 'completed',
  });

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
      <div className="flex items-center justify-between">
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
        <Button onClick={() => setIsAdding(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Booking
        </Button>
      </div>

      {isAdding && (
        <Card className="glass-card glow-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>New Booking Entry</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setIsAdding(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-muted-foreground tracking-widest">Date</label>
                <Input 
                  type="date" 
                  value={formData.date} 
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-muted-foreground tracking-widest">Time</label>
                <Input 
                  type="time" 
                  value={formData.time} 
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-muted-foreground tracking-widest">Client Name</label>
                <Input 
                  type="text" 
                  value={formData.client} 
                  onChange={(e) => setFormData({ ...formData, client: e.target.value })} 
                  placeholder="Enter client name"
                  required 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-muted-foreground tracking-widest">Amount (KSH)</label>
                <Input 
                  type="number" 
                  value={formData.amount || ''} 
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })} 
                  placeholder="0.00"
                  required 
                />
              </div>
              <div className="md:col-span-2 flex justify-end space-x-2 pt-4">
                <Button variant="outline" type="button" onClick={() => setIsAdding(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createBookingMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  {createBookingMutation.isPending ? 'Saving...' : 'Save Booking'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Standardized Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-muted/20 border-none shadow-none">
          <CardContent className="p-3">
            <div className="text-center">
              <div className="text-xl font-bold">{bookings?.length || 0}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Total Bookings</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/20 border-none shadow-none">
          <CardContent className="p-3">
            <div className="text-center">
              <div className="text-xl font-bold text-success">
                {formatCurrency(bookings?.reduce((sum: number, b: any) => sum + Number(b.amount), 0) || 0)}
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Total Revenue</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/20 border-none shadow-none">
          <CardContent className="p-3">
            <div className="text-center">
              <div className="text-xl font-bold text-primary">
                {bookings?.filter((b: any) => b.status === 'booked').length || 0}
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
            {bookings?.map((item: any) => (
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
                      {!isStaff && (
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
            {bookings?.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-xl bg-muted/5">
                <Waves className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium opacity-50">No bookings recorded yet.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default React.memo(SaunaManagement);