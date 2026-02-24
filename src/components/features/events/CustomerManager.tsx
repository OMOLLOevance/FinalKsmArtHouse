'use client';

import React, { useState } from 'react';
import { Plus, ArrowLeft, Trash2, Edit, Calendar, Users } from 'lucide-react';
import { useCustomersQuery, useCreateCustomerMutation, useDeleteCustomerMutation } from '@/hooks/use-customer-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/contexts/AuthContext';
import { Customer } from '@/types';

interface CustomerManagerProps {
  onBack?: () => void;
}

const CustomerManager: React.FC<CustomerManagerProps> = ({ onBack }) => {
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  
  const { data: customers, isLoading: loading } = useCustomersQuery(selectedMonth, selectedYear);
  const createCustomerMutation = useCreateCustomerMutation();
  const deleteCustomerMutation = useDeleteCustomerMutation();
  
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    location: '',
    eventDate: new Date().toISOString().split('T')[0],
  });

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = [selectedYear - 1, selectedYear, selectedYear + 1];

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
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-muted/20 p-1.5 rounded-2xl border border-primary/5">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="bg-transparent border-none text-[10px] font-black uppercase focus:outline-none pr-4 pl-2 cursor-pointer hover:text-primary transition-colors"
            >
              <option value="all">All Months</option>
              {monthNames.map((name, index) => (
                <option key={index} value={index} className="bg-background text-foreground uppercase font-bold text-[10px]">{name}</option>
              ))}
            </select>
            
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="bg-transparent border-none text-[10px] font-black uppercase focus:outline-none pr-4 cursor-pointer hover:text-primary transition-colors"
            >
              {years.map(year => (
                <option key={year} value={year} className="bg-background text-foreground uppercase font-bold text-[10px]">{year}</option>
              ))}
            </select>
          </div>

          <Button onClick={() => setIsAdding(true)} className="h-10 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {customers?.map((customer: Customer) => (
              <Card key={customer.id} className="overflow-hidden border-none hover-lift glow-primary glass-card transition-all duration-500 rounded-3xl group relative">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-700">
                  <Users className="h-24 w-24 -rotate-12" />
                </div>
                
                <div className="p-6 space-y-5 relative z-10">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-xl text-foreground uppercase tracking-tight truncate leading-none mb-2" title={customer.name}>
                        {customer.name}
                      </h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest bg-primary/5 text-primary border-primary/10">
                          {customer.eventType || 'Event'}
                        </Badge>
                        <div className="flex items-center text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">
                          <Calendar className="h-3 w-3 mr-1" />
                          {customer.eventDate}
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(customer.id)} 
                      className="h-9 w-9 rounded-xl text-destructive/40 hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-3 bg-muted/20 p-4 rounded-2xl border border-primary/5 shadow-inner">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-muted-foreground/70 tracking-[0.2em] block ml-1">Contact Details</label>
                      <div className="bg-background/50 backdrop-blur-sm px-3 py-2 rounded-xl border border-primary/5 text-sm font-bold truncate">
                        {customer.contact || 'Not Provided'}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-muted-foreground/70 tracking-[0.2em] block ml-1">Venue Location</label>
                      <div className="bg-background/50 backdrop-blur-sm px-3 py-2 rounded-xl border border-primary/5 text-sm font-bold truncate">
                        {customer.location || 'Pending Selection'}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <Button variant="outline" className="flex-1 h-10 rounded-xl font-black uppercase tracking-widest text-[9px] border-primary/10 hover:bg-primary hover:text-white transition-all">
                      View Details
                    </Button>
                    <Button className="h-10 w-10 p-0 rounded-xl shadow-lg shadow-primary/10">
                      <Edit className="h-4 w-4" />
                    </Button>
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
