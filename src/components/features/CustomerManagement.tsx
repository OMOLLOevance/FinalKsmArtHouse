'use client';

import React, { useState, useMemo } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Eye, RefreshCw, Printer, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog';
import { Badge } from '@/components/ui/Badge';
import { useCustomers } from '@/hooks/useCustomers';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  event_date: string;
  event_type: string;
  venue: string;
  guest_count: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  total_cost: number;
  notes: string;
}

interface MonthlyAllocation {
  id: string;
  date: string;
  location: string;
  customer_name: string;
  tent_size: string;
  table_count: number;
  seat_type: string;
  total_ksh: number;
}

interface DecorItem {
  id: string;
  customer_name: string;
  walkway_stands: number;
  arc: number;
  aisle_stands: number;
  photobooth: number;
  lecturn: number;
  stage_boards: number;
  backdrop_boards: number;
  dance_floor: number;
  walkway_boards: number;
  centerpieces: number;
  charger_plates: number;
  african_mats: number;
  napkin_holders: number;
  roof_top_decor: number;
  lighting_items: number;
  chandeliers: number;
  african_lampshades: number;
}

const CustomerManagement: React.FC = () => {
  const { customers, loading, createCustomer, updateCustomer, deleteCustomer, syncData } = useCustomers();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState<'customers' | 'allocation' | 'decor'>('customers');

  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '',
    email: '',
    phone: '',
    event_date: '',
    event_type: '',
    venue: '',
    guest_count: 0,
    status: 'pending',
    total_cost: 0,
    notes: ''
  });

  const filteredCustomers = useMemo(() => {
    return customers?.filter(customer => {
      const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
      return matchesSearch && matchesStatus;
    }) || [];
  }, [customers, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const totalCustomers = customers?.length || 0;
    const upcomingEvents = customers?.filter(c => c.status === 'confirmed' || c.status === 'pending').length || 0;
    const totalRevenue = customers?.reduce((sum, c) => sum + c.total_cost, 0) || 0;
    return { totalCustomers, upcomingEvents, totalRevenue };
  }, [customers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, formData);
        setEditingCustomer(null);
      } else {
        await createCustomer(formData as Customer);
      }
      setIsAddModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving customer:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      event_date: '',
      event_type: '',
      venue: '',
      guest_count: 0,
      status: 'pending',
      total_cost: 0,
      notes: ''
    });
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData(customer);
    setIsAddModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      await deleteCustomer(id);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'confirmed': return 'default';
      case 'pending': return 'secondary';
      case 'completed': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Customer Management</h2>
          <p className="text-muted-foreground">Manage event customers and allocations</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => syncData()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            🔄 Update All Devices
          </Button>
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setEditingCustomer(null); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add New Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <Input
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Event Date</label>
                  <Input
                    type="date"
                    value={formData.event_date || ''}
                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Event Type</label>
                  <select
                    className="w-full px-3 py-2 border border-input bg-background rounded-md"
                    value={formData.event_type || ''}
                    onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="Wedding">Wedding</option>
                    <option value="Corporate">Corporate</option>
                    <option value="Birthday">Birthday</option>
                    <option value="Anniversary">Anniversary</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Venue</label>
                  <Input
                    value={formData.venue || ''}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Guest Count</label>
                  <Input
                    type="number"
                    value={formData.guest_count || 0}
                    onChange={(e) => setFormData({ ...formData, guest_count: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <select
                    className="w-full px-3 py-2 border border-input bg-background rounded-md"
                    value={formData.status || 'pending'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Customer['status'] })}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Total Cost (KSH)</label>
                  <Input
                    type="number"
                    value={formData.total_cost || 0}
                    onChange={(e) => setFormData({ ...formData, total_cost: parseFloat(e.target.value) })}
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium">Notes</label>
                  <textarea
                    className="w-full px-3 py-2 border border-input bg-background rounded-md"
                    rows={3}
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
                <div className="col-span-2 flex justify-end space-x-2">
                  <Button variant="outline" type="button" onClick={() => setIsAddModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingCustomer ? 'Update Customer' : 'Save Customer'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingEvents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KSH {stats.totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        <Button
          variant={activeTab === 'customers' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('customers')}
          className="flex-1"
        >
          Customers
        </Button>
        <Button
          variant={activeTab === 'allocation' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('allocation')}
          className="flex-1"
        >
          Monthly Allocation
        </Button>
        <Button
          variant={activeTab === 'decor' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('decor')}
          className="flex-1"
        >
          Decor Items
        </Button>
      </div>

      {/* Customers Tab */}
      {activeTab === 'customers' && (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              className="px-3 py-2 border border-input bg-background rounded-md"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Main Table */}
          <Card>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Contact Info</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Event Details</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Total Cost</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {filteredCustomers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-muted/50">
                        <td className="px-6 py-4">
                          <button
                            className="text-sm font-medium text-primary hover:underline"
                            onClick={() => console.log('View details for:', customer.name)}
                          >
                            {customer.name}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div>{customer.email}</div>
                          <div className="text-muted-foreground">{customer.phone}</div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div>{customer.event_type}</div>
                          <div className="text-muted-foreground">{customer.event_date}</div>
                          <div className="text-muted-foreground">{customer.venue}</div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={getStatusBadgeVariant(customer.status)}>
                            {customer.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">
                          KSH {customer.total_cost.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <Button variant="ghost" size="icon" onClick={() => console.log('View details')}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(customer)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(customer.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {filteredCustomers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                          No customers found. Click "Add New Customer" to get started.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Monthly Allocation Tab */}
      {activeTab === 'allocation' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Monthly Customer Allocation - {monthNames[currentMonth]} {currentYear}</CardTitle>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Customer
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Location</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Tent Size</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Tables</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Seats</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Total KSH</th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {/* Editable rows would be rendered here */}
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                      No allocations for {monthNames[currentMonth]} {currentYear}. Click "Add Customer" to create entries.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Decor Items Tab */}
      {activeTab === 'decor' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Decor Items Management</CardTitle>
              <Button>
                <Printer className="h-4 w-4 mr-2" />
                Print Decor Items
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Customer</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Walkway Stands</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">ARC</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Aisle Stands</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Photobooth</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Lecturn</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Stage Boards</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Backdrop</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Dance Floor</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Walkway Boards</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Centerpieces</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Charger Plates</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">African Mats</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Napkin Holders</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Roof Top Decor</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Lighting</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Chandeliers</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Lampshades</th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  <tr>
                    <td colSpan={18} className="px-6 py-8 text-center text-muted-foreground">
                      No decor items configured. Add customers to manage their decor requirements.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CustomerManagement;