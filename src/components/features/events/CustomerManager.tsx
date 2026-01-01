'use client';

import React, { useState } from 'react';
import { Plus, ArrowLeft, Trash2, Edit } from 'lucide-react';
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

      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Event Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {customers?.map((customer) => (
                  <tr key={customer.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4 text-sm font-medium">{customer.name}</td>
                    <td className="px-6 py-4 text-sm">{customer.contact}</td>
                    <td className="px-6 py-4 text-sm">{customer.location}</td>
                    <td className="px-6 py-4 text-sm">{customer.eventDate}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(customer.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {customers?.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                      No customers found. Click "Add Customer" to get started.
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

export default CustomerManager;
