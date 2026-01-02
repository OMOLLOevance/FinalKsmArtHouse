'use client';

import React, { useState } from 'react';
import { Plus, ArrowLeft, Trash2, Edit, Calendar, Users } from 'lucide-react';
import { useCustomersQuery, useCreateCustomerMutation, useDeleteCustomerMutation } from '@/hooks/use-customer-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';

interface CustomerManagerProps {
  onBack?: () => void;
}

const CustomerManager: React.FC<CustomerManagerProps> = ({ onBack }) => {
  const { data: customers, isLoading: loading } = useCustomersQuery();
  const createCustomerMutation = useCreateCustomerMutation();
  const deleteCustomerMutation = useDeleteCustomerMutation();
  
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    location: '',
    eventDate: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCustomerMutation.mutateAsync({
        name: formData.name,
        contact: formData.phoneNumber,
        location: formData.location,
        eventDate: formData.eventDate,
      });
      setIsAdding(false);
      setFormData({
        name: '',
        phoneNumber: '',
        location: '',
        eventDate: new Date().toISOString().split('T')[0],
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      await deleteCustomerMutation.mutateAsync(id);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading customers...</p>
        </div>
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
            <h2 className="text-3xl font-bold">Customer Management</h2>
            <p className="text-muted-foreground">Manage event customers</p>
          </div>
        </div>
        <Button onClick={() => setIsAdding(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Customer</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                  required 
                />
              </div>
              <div>
                <label className="text-sm font-medium">Phone Number</label>
                <Input 
                  type="tel" 
                  value={formData.phoneNumber} 
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })} 
                  required 
                />
              </div>
              <div>
                <label className="text-sm font-medium">Location</label>
                <Input 
                  type="text" 
                  value={formData.location} 
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })} 
                  required 
                />
              </div>
              <div>
                <label className="text-sm font-medium">Event Date</label>
                <Input 
                  type="date" 
                  value={formData.eventDate} 
                  onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })} 
                  required 
                />
              </div>
              <div className="md:col-span-2 flex justify-end space-x-2">
                <Button variant="outline" type="button" onClick={() => setIsAdding(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createCustomerMutation.isPending}>
                  {createCustomerMutation.isPending ? 'Saving...' : 'Save Customer'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="border-none shadow-none bg-transparent">
        <CardContent className="px-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {customers?.map((customer) => (
              <Card key={customer.id} className="overflow-hidden border-muted hover:border-primary/30 transition-all duration-300 hover:shadow-md border-l-4 border-l-primary/40">
                <div className="p-4 space-y-4">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-lg truncate" title={customer.name}>
                        {customer.name}
                      </h4>
                      <div className="flex items-center text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                        <Calendar className="h-3 w-3 mr-1 opacity-70" />
                        {customer.eventDate}
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="xs" 
                      onClick={() => handleDelete(customer.id)} 
                      className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-2 bg-muted/30 p-2 rounded-lg border">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground uppercase tracking-tighter font-bold text-[9px]">Contact</span>
                      <span className="font-medium">{customer.contact || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs border-t pt-1 border-muted">
                      <span className="text-muted-foreground uppercase tracking-tighter font-bold text-[9px]">Location</span>
                      <span className="font-medium truncate max-w-[120px]">{customer.location || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            {customers?.length === 0 && (
              <div className="col-span-full py-16 text-center text-muted-foreground bg-muted/5 border-2 border-dashed rounded-2xl">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">No customers found.</p>
                <Button variant="link" onClick={() => setIsAdding(true)}>Add your first customer</Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerManager;
