'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Printer, Calendar, Save, Trash2, Edit3, Check, X, AlertCircle, Download, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Select, StatusBadge } from '@/components/ui/Select';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface MonthlyAllocation {
  id: string;
  customer_name: string;
  date: string;
  location: string;
  phone_number: string;
  event_type: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  month: number;
  year: number;
  event_date: string;
  // Tent totals
  tent_total: number;
  double_tent: number;
  single_tent: number;
  gazebo_tent: number;
  miluxe_tent: number;
  a_frame_tent: number;
  b_line_tent: number;
  pergola_tent: number;
  // Table totals
  table_total: number;
  round_table: number;
  long_table: number;
  bridal_table: number;
  // Seat totals
  seat_total: number;
  chavari_seats: number;
  luxe_seats: number;
  chameleon_seats: number;
  dior_seats: number;
  high_back_seat: number;
  plastic_seats: number;
  banquet_seats: number;
  cross_bar_seats: number;
  walkway_stands: number;
  // Financial
  total_ksh: number;
  deposit_paid: number;
  balance_due: number;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface MonthlyAllocationTableProps {
  month: number;
  year: number;
  onAddCustomer: () => void;
}

const MonthlyAllocationTable: React.FC<MonthlyAllocationTableProps> = ({ 
  month, 
  year, 
  onAddCustomer 
}) => {
  const { user } = useAuth();
  const [allocations, setAllocations] = useState<MonthlyAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingCell, setEditingCell] = useState<{id: string, field: string} | null>(null);
  const [editValue, setEditValue] = useState('');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    customer_name: '',
    date: '',
    location: '',
    phone_number: '',
    event_type: 'Wedding',
    status: 'pending',
    double_tent: 0,
    single_tent: 0,
    round_table: 0,
    chavari_seats: 0,
    total_ksh: 0,
    deposit_paid: 0
  });

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  // Fetch allocations for the selected month
  useEffect(() => {
    fetchAllocations();
  }, [month, year]);

  const fetchAllocations = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('monthly_allocations')
        .select('*')
        .eq('month', month + 1)
        .eq('year', year)
        .order('date', { ascending: true });
      
      if (error) throw error;

      // Calculate totals for each allocation
      const processedAllocations = (data || []).map(allocation => ({
        ...allocation,
        tent_total: (allocation.double_tent || 0) + (allocation.single_tent || 0) + 
                   (allocation.gazebo_tent || 0) + (allocation.miluxe_tent || 0) + 
                   (allocation.a_frame_tent || 0) + (allocation.b_line_tent || 0) + 
                   (allocation.pergola_tent || 0),
        table_total: (allocation.round_table || 0) + (allocation.long_table || 0) + 
                    (allocation.bridal_table || 0),
        seat_total: (allocation.chavari_seats || 0) + (allocation.luxe_seats || 0) + 
                   (allocation.chameleon_seats || 0) + (allocation.dior_seats || 0) + 
                   (allocation.high_back_seat || 0) + (allocation.plastic_seats || 0) + 
                   (allocation.banquet_seats || 0) + (allocation.cross_bar_seats || 0),
        balance_due: (allocation.total_ksh || 0) - (allocation.deposit_paid || 0)
      }));

      setAllocations(processedAllocations);
    } catch (error) {
      console.error('Error fetching allocations:', error);
      toast.error('Failed to load allocations');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = () => {
    if (!user) {
      toast.error('Please log in to add customers');
      return;
    }
    
    // Set default date to middle of selected month
    const defaultDate = new Date(year, month, 15).toISOString().split('T')[0];
    setNewCustomer({
      customer_name: '',
      date: defaultDate,
      location: '',
      phone_number: '',
      event_type: 'Wedding',
      status: 'pending',
      double_tent: 0,
      single_tent: 0,
      round_table: 0,
      chavari_seats: 0,
      total_ksh: 0,
      deposit_paid: 0
    });
    setShowAddDialog(true);
  };

  const handleSaveCustomer = async () => {
    if (!newCustomer.customer_name.trim()) {
      toast.error('Customer name is required');
      return;
    }
    
    try {
      setSaving(true);
      
      const insertData = {
        ...newCustomer,
        month: month + 1,
        year: year,
        event_date: newCustomer.date,
        status: 'pending',
        user_id: user?.id
      };
      
      const { error } = await supabase
        .from('monthly_allocations')
        .insert(insertData);

      if (error) throw error;

      await fetchAllocations();
      setShowAddDialog(false);
      toast.success('Customer added successfully');
    } catch (error) {
      console.error('Error adding customer:', error);
      toast.error(`Failed to add customer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCellEdit = (id: string, field: string, currentValue: any) => {
    setEditingCell({ id, field });
    setEditValue(currentValue?.toString() || '');
  };

  const handleCellSave = async () => {
    if (!editingCell) return;

    try {
      setSaving(true);
      const { id, field } = editingCell;
      
      // Convert value based on field type
      let value: any = editValue;
      if (['total_ksh', 'deposit_paid', 'double_tent', 'single_tent', 'gazebo_tent', 
           'miluxe_tent', 'a_frame_tent', 'b_line_tent', 'pergola_tent', 'round_table', 
           'long_table', 'bridal_table', 'chavari_seats', 'luxe_seats', 'chameleon_seats', 
           'dior_seats', 'high_back_seat', 'plastic_seats', 'banquet_seats', 'cross_bar_seats'].includes(field)) {
        value = parseInt(editValue) || 0;
      }

      const { error } = await supabase
        .from('monthly_allocations')
        .update({ 
          [field]: value,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      await fetchAllocations();
      setEditingCell(null);
      setEditValue('');
      toast.success('Updated successfully');
    } catch (error) {
      console.error('Error updating allocation:', error);
      toast.error(`Failed to update: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCellSave();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setEditValue('');
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedRows.size === 0) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('monthly_allocations')
        .delete()
        .in('id', Array.from(selectedRows));

      if (error) throw error;

      await fetchAllocations();
      setSelectedRows(new Set());
      toast.success(`Deleted ${selectedRows.size} allocation(s)`);
    } catch (error) {
      console.error('Error deleting allocations:', error);
      toast.error(`Failed to delete allocations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('monthly_allocations')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      await fetchAllocations();
      toast.success('Status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(`Failed to update status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const renderEditableCell = (allocation: MonthlyAllocation, field: string, className = '') => {
    const value = allocation[field as keyof MonthlyAllocation];
    const isEditing = editingCell?.id === allocation.id && editingCell?.field === field;
    
    if (isEditing) {
      return (
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyPress}
          onBlur={handleCellSave}
          className={`h-8 text-xs ${className}`}
          autoFocus
          disabled={saving}
        />
      );
    }
    
    return (
      <div 
        className={`cursor-pointer hover:bg-muted/50 p-2 min-h-[32px] flex items-center ${className}`}
        onClick={() => handleCellEdit(allocation.id, field, value)}
      >
        {value || <span className="text-gray-400 italic">Click to edit</span>}
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    return <StatusBadge status={status} />;
  };

  const handleExportData = () => {
    const csvData = allocations.map(allocation => ({
      Date: allocation.date,
      Customer: allocation.customer_name,
      Location: allocation.location,
      Phone: allocation.phone_number,
      Status: allocation.status,
      Tents: allocation.tent_total,
      Tables: allocation.table_total,
      Seats: allocation.seat_total,
      'Total KSH': allocation.total_ksh,
      'Deposit Paid': allocation.deposit_paid,
      'Balance Due': allocation.balance_due
    }));
    
    const csvContent = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `allocations-${monthNames[month]}-${year}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const printContent = `
      <html>
        <head>
          <title>Monthly Allocations - ${monthNames[month]} ${year}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .header { text-align: center; margin-bottom: 20px; }
            .summary { display: flex; justify-content: space-around; margin: 20px 0; }
            .summary div { text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Monthly Customer Allocations</h1>
            <h2>${monthNames[month]} ${year}</h2>
          </div>
          <div class="summary">
            <div><strong>Total Events:</strong> ${allocations.length}</div>
            <div><strong>Total Revenue:</strong> KSH ${totalRevenue.toLocaleString()}</div>
            <div><strong>Deposits Paid:</strong> KSH ${totalDeposits.toLocaleString()}</div>
            <div><strong>Balance Due:</strong> KSH ${totalBalance.toLocaleString()}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Customer</th>
                <th>Location</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Tents</th>
                <th>Tables</th>
                <th>Seats</th>
                <th>Total KSH</th>
                <th>Deposit</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              ${allocations.map(allocation => `
                <tr>
                  <td>${allocation.date}</td>
                  <td>${allocation.customer_name}</td>
                  <td>${allocation.location || '-'}</td>
                  <td>${allocation.phone_number || '-'}</td>
                  <td>${allocation.status}</td>
                  <td>${allocation.tent_total}</td>
                  <td>${allocation.table_total}</td>
                  <td>${allocation.seat_total}</td>
                  <td>${allocation.total_ksh.toLocaleString()}</td>
                  <td>${allocation.deposit_paid.toLocaleString()}</td>
                  <td>${allocation.balance_due.toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const totalRevenue = allocations.reduce((sum, allocation) => sum + (allocation.total_ksh || 0), 0);
  const totalDeposits = allocations.reduce((sum, allocation) => sum + (allocation.deposit_paid || 0), 0);
  const totalBalance = totalRevenue - totalDeposits;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading allocations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Monthly Customer Allocation - {monthNames[month]} {year}</h3>
          <p className="text-sm text-gray-600">{allocations.length} allocations found</p>
        </div>
        <div className="flex items-center space-x-2">
          {selectedRows.size > 0 && (
            <Button variant="destructive" size="sm" onClick={handleDeleteSelected} disabled={saving}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete ({selectedRows.size})
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleExportData}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button onClick={handleAddCustomer} disabled={saving}>
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Add Customer Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Add New Customer</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Customer Name *</label>
                <Input
                  value={newCustomer.customer_name}
                  onChange={(e) => setNewCustomer({...newCustomer, customer_name: e.target.value})}
                  placeholder="Enter customer name"
                  className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Event Date</label>
                <Input
                  type="date"
                  value={newCustomer.date}
                  onChange={(e) => setNewCustomer({...newCustomer, date: e.target.value})}
                  className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Location</label>
                <Input
                  value={newCustomer.location}
                  onChange={(e) => setNewCustomer({...newCustomer, location: e.target.value})}
                  placeholder="Event location"
                  className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Phone Number</label>
                <Input
                  value={newCustomer.phone_number}
                  onChange={(e) => setNewCustomer({...newCustomer, phone_number: e.target.value})}
                  placeholder="Phone number"
                  className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Event Type</label>
                <select
                  value={newCustomer.event_type}
                  onChange={(e) => setNewCustomer({...newCustomer, event_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Wedding">Wedding</option>
                  <option value="Corporate">Corporate</option>
                  <option value="Birthday">Birthday</option>
                  <option value="Anniversary">Anniversary</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Status</label>
                <select
                  value={newCustomer.status}
                  onChange={(e) => setNewCustomer({...newCustomer, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            
            <div className="mt-6">
              <h4 className="text-md font-medium mb-3 text-gray-800">Equipment Requirements</h4>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Double Tents</label>
                  <Input
                    type="number"
                    value={newCustomer.double_tent}
                    onChange={(e) => setNewCustomer({...newCustomer, double_tent: parseInt(e.target.value) || 0})}
                    placeholder="0"
                    className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Single Tents</label>
                  <Input
                    type="number"
                    value={newCustomer.single_tent}
                    onChange={(e) => setNewCustomer({...newCustomer, single_tent: parseInt(e.target.value) || 0})}
                    placeholder="0"
                    className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Round Tables</label>
                  <Input
                    type="number"
                    value={newCustomer.round_table}
                    onChange={(e) => setNewCustomer({...newCustomer, round_table: parseInt(e.target.value) || 0})}
                    placeholder="0"
                    className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Chavari Seats</label>
                  <Input
                    type="number"
                    value={newCustomer.chavari_seats}
                    onChange={(e) => setNewCustomer({...newCustomer, chavari_seats: parseInt(e.target.value) || 0})}
                    placeholder="0"
                    className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <h4 className="text-md font-medium mb-3 text-gray-800">Financial Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Total Amount (KSH)</label>
                  <Input
                    type="number"
                    value={newCustomer.total_ksh}
                    onChange={(e) => setNewCustomer({...newCustomer, total_ksh: parseInt(e.target.value) || 0})}
                    placeholder="0"
                    className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Deposit Paid (KSH)</label>
                  <Input
                    type="number"
                    value={newCustomer.deposit_paid}
                    onChange={(e) => setNewCustomer({...newCustomer, deposit_paid: parseInt(e.target.value) || 0})}
                    placeholder="0"
                    className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="mt-3 p-3 bg-gray-50 rounded-md">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Balance Due: </span>
                  <span className={`font-semibold ${(newCustomer.total_ksh - newCustomer.deposit_paid) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    KSH {(newCustomer.total_ksh - newCustomer.deposit_paid).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowAddDialog(false)}
                disabled={saving}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveCustomer}
                disabled={saving || !newCustomer.customer_name.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {saving ? 'Saving...' : 'Add Customer'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{allocations.length}</div>
              <div className="text-sm text-gray-600">Total Events</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">KSH {totalRevenue.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Revenue</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">KSH {totalDeposits.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Deposits Paid</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">KSH {totalBalance.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Balance Due</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Allocation Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedRows.size === allocations.length && allocations.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRows(new Set(allocations.map(a => a.id)));
                        } else {
                          setSelectedRows(new Set());
                        }
                      }}
                      className="rounded"
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-left font-medium">Customer</th>
                  <th className="px-4 py-3 text-left font-medium">Location</th>
                  <th className="px-4 py-3 text-left font-medium">Phone</th>
                  <th className="px-4 py-3 text-center font-medium">Status</th>
                  <th className="px-4 py-3 text-center font-medium">Tents</th>
                  <th className="px-4 py-3 text-center font-medium">Tables</th>
                  <th className="px-4 py-3 text-center font-medium">Seats</th>
                  <th className="px-4 py-3 text-right font-medium">Total KSH</th>
                  <th className="px-4 py-3 text-right font-medium">Deposit</th>
                  <th className="px-4 py-3 text-right font-medium">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {allocations.map((allocation) => (
                  <tr key={allocation.id}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(allocation.id)}
                        onChange={(e) => {
                          const newSelected = new Set(selectedRows);
                          if (e.target.checked) {
                            newSelected.add(allocation.id);
                          } else {
                            newSelected.delete(allocation.id);
                          }
                          setSelectedRows(newSelected);
                        }}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-3 border-r">
                      {renderEditableCell(allocation, 'date')}
                    </td>
                    <td className="px-4 py-3 border-r">
                      {renderEditableCell(allocation, 'customer_name', 'font-medium')}
                    </td>
                    <td className="px-4 py-3 border-r">
                      {renderEditableCell(allocation, 'location')}
                    </td>
                    <td className="px-4 py-3 border-r">
                      {renderEditableCell(allocation, 'phone_number')}
                    </td>
                    <td className="px-4 py-3 text-center border-r">
                      <Select
                        value={allocation.status}
                        onValueChange={(value) => handleStatusChange(allocation.id, value)}
                        className="w-28"
                        options={[
                          { value: 'pending', label: 'Pending' },
                          { value: 'confirmed', label: 'Confirmed' },
                          { value: 'completed', label: 'Completed' },
                          { value: 'cancelled', label: 'Cancelled' }
                        ]}
                      />
                    </td>
                    <td className="px-4 py-3 text-center border-r">
                      <span className="font-medium">{allocation.tent_total}</span>
                    </td>
                    <td className="px-4 py-3 text-center border-r">
                      <span className="font-medium">{allocation.table_total}</span>
                    </td>
                    <td className="px-4 py-3 text-center border-r">
                      <span className="font-medium">{allocation.seat_total}</span>
                    </td>
                    <td className="px-4 py-3 text-right border-r">
                      {renderEditableCell(allocation, 'total_ksh', 'text-right font-medium')}
                    </td>
                    <td className="px-4 py-3 text-right border-r">
                      {renderEditableCell(allocation, 'deposit_paid', 'text-right')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-medium ${allocation.balance_due > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {allocation.balance_due.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          
          {allocations.length === 0 && (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No allocations for {monthNames[month]} {year}</h3>
              <p className="text-gray-600 mb-4">Get started by adding your first customer allocation.</p>
              <Button onClick={handleAddCustomer}>
                <Plus className="h-4 w-4 mr-2" />
                Add Customer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MonthlyAllocationTable;