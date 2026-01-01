'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Plus, Edit, Trash2, ArrowLeft, Save } from 'lucide-react';
import { 
  useSaunaBookingsQuery, 
  useCreateSaunaBookingMutation, 
  useDeleteSaunaBookingMutation
} from '@/hooks/use-sauna-api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatCurrency } from '@/utils/formatters';
import { logger } from '@/lib/logger';

interface SaunaManagementProps {
  onBack?: () => void;
}

const SaunaManagement: React.FC<SaunaManagementProps> = ({ onBack }) => {
  const { data: bookings, isLoading: bookingsLoading } = useSaunaBookingsQuery();
  const createBookingMutation = useCreateSaunaBookingMutation();
  const deleteBookingMutation = useDeleteSaunaBookingMutation();

  const [isAdding, setIsAdding] = useState(false);

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
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner text="Loading sauna data..." />
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
            <h2 className="text-3xl font-bold tracking-tight">Sauna Management</h2>
            <p className="text-muted-foreground">Manage wellness bookings</p>
          </div>
        </div>
        <Button onClick={() => setIsAdding(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Booking
        </Button>
      </div>

      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle>New Booking Entry</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Date</label>
                <Input 
                  type="date" 
                  value={formData.date} 
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })} 
                  required 
                />
              </div>
              <div>
                <label className="text-sm font-medium">Time</label>
                <Input 
                  type="time" 
                  value={formData.time} 
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })} 
                  required 
                />
              </div>
              <div>
                <label className="text-sm font-medium">Client</label>
                <Input 
                  type="text" 
                  value={formData.client} 
                  onChange={(e) => setFormData({ ...formData, client: e.target.value })} 
                  required 
                />
              </div>
              <div>
                <label className="text-sm font-medium">Amount</label>
                <Input 
                  type="number" 
                  value={formData.amount || ''} 
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })} 
                  required 
                />
              </div>
              <div className="md:col-span-2 flex justify-end space-x-2">
                <Button variant="outline" type="button" onClick={() => setIsAdding(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createBookingMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  {createBookingMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead>
                <tr className="bg-muted">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {bookings?.map((item: any) => (
                  <tr key={item.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4 text-sm">{item.date}</td>
                    <td className="px-6 py-4 text-sm font-medium">{item.client}</td>
                    <td className="px-6 py-4 text-sm">{formatCurrency(Number(item.amount))}</td>
                    <td className="px-6 py-4">
                      <Badge variant={item.status === 'completed' ? 'success' : 'warning'}>
                        {item.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} aria-label="Delete record">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {bookings?.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      No bookings found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default React.memo(SaunaManagement);
