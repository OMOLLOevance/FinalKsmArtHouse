'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Printer, Calendar, Save, Trash2, Edit3, Check, X, AlertCircle, Download, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Select, StatusBadge } from '@/components/ui/Select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/utils/formatters';

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

  const handleCellEdit = (id: string, field: keyof MonthlyAllocation, currentValue: string | number) => {
    setEditingCell({ id, field });
    setEditValue(currentValue?.toString() || '');
  };

  const handleCellSave = async () => {
    if (!editingCell) return;

    try {
      setSaving(true);
      const { id, field } = editingCell;
      
      // Convert value based on field type
      let value: string | number = editValue;
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
        className={`cursor-pointer hover:bg-muted/50 p-1 min-h-[24px] flex items-center text-xs ${className}`}
        onClick={() => handleCellEdit(allocation.id, field as keyof MonthlyAllocation, value)}
      >
        {value || <span className="text-muted-foreground/50 italic text-[10px]">Click to edit</span>}
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
          <p className="text-muted-foreground">Loading allocations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-primary">Monthly Customer Allocation</h3>
          <p className="text-xs text-muted-foreground">{monthNames[month]} {year} • {allocations.length} allocations found</p>
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
          <Button onClick={handleAddCustomer} disabled={saving} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-muted/20 border-none shadow-none">
          <CardContent className="p-3">
            <div className="text-center">
              <div className="text-xl font-bold">{allocations.length}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Total Events</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/20 border-none shadow-none">
          <CardContent className="p-3">
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">KSH {totalRevenue.toLocaleString()}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Total Revenue</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/20 border-none shadow-none">
          <CardContent className="p-3">
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">KSH {totalDeposits.toLocaleString()}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Deposits Paid</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/20 border-none shadow-none">
          <CardContent className="p-3">
            <div className="text-center">
              <div className="text-xl font-bold text-red-600">KSH {totalBalance.toLocaleString()}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Balance Due</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Allocation Form List */}
      <div className="space-y-4">
        {allocations.map((allocation) => (
          <Card key={allocation.id} className="overflow-hidden border-l-4 border-l-primary/40 hover:shadow-md transition-all">
            <div className="p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-3">
                <div className="flex items-center space-x-3">
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
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <div>
                    <h4 className="font-bold text-lg text-primary">{allocation.customer_name}</h4>
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{allocation.event_type || 'General Event'}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Select
                    value={allocation.status}
                    onValueChange={(value) => handleStatusChange(allocation.id, value)}
                    className="w-32 h-8 text-xs font-bold"
                    options={[
                      { value: 'pending', label: 'Pending' },
                      { value: 'confirmed', label: 'Confirmed' },
                      { value: 'completed', label: 'Completed' },
                      { value: 'cancelled', label: 'Cancelled' }
                    ]}
                  />
                  <Button 
                    variant="ghost" 
                    size="xs" 
                    className="text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                    onClick={() => {
                      setSelectedRows(new Set([allocation.id]));
                      handleDeleteSelected();
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Event Info */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest ml-1">Event Details</label>
                  <div className="bg-muted/10 rounded-lg border p-2 space-y-2">
                    <div className="flex items-center text-xs">
                      <Calendar className="h-3 w-3 mr-2 text-muted-foreground" />
                      <div className="flex-1">{renderEditableCell(allocation, 'date', 'font-medium')}</div>
                    </div>
                    <div className="flex items-center text-xs">
                      <FileText className="h-3 w-3 mr-2 text-muted-foreground" />
                      <div className="flex-1">{renderEditableCell(allocation, 'location', 'italic')}</div>
                    </div>
                    <div className="flex items-center text-xs">
                      <Check className="h-3 w-3 mr-2 text-muted-foreground" />
                      <div className="flex-1">{renderEditableCell(allocation, 'phone_number')}</div>
                    </div>
                  </div>
                </div>

                {/* Equipment Summary */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest ml-1">Equipment Totals</label>
                  <div className="bg-muted/10 rounded-lg border p-2 grid grid-cols-3 gap-2">
                    <div className="text-center p-1 bg-background rounded border">
                      <p className="text-[8px] font-bold text-muted-foreground uppercase">Tents</p>
                      <p className="text-sm font-black text-primary">{allocation.tent_total}</p>
                    </div>
                    <div className="text-center p-1 bg-background rounded border">
                      <p className="text-[8px] font-bold text-muted-foreground uppercase">Tables</p>
                      <p className="text-sm font-black text-primary">{allocation.table_total}</p>
                    </div>
                    <div className="text-center p-1 bg-background rounded border">
                      <p className="text-[8px] font-bold text-muted-foreground uppercase">Seats</p>
                      <p className="text-sm font-black text-primary">{allocation.seat_total}</p>
                    </div>
                  </div>
                </div>

                {/* Financial Details */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest ml-1">Financial Status</label>
                  <div className="bg-muted/10 rounded-lg border p-2 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Total:</span>
                      <div className="w-24 text-right font-black">{renderEditableCell(allocation, 'total_ksh', 'text-right')}</div>
                    </div>
                    <div className="flex justify-between items-center text-xs border-t pt-1">
                      <span className="text-muted-foreground">Paid:</span>
                      <div className="w-24 text-right font-bold text-blue-600">{renderEditableCell(allocation, 'deposit_paid', 'text-right')}</div>
                    </div>
                    <div className="flex justify-between items-center text-xs border-t pt-1">
                      <span className="font-bold text-primary">Balance:</span>
                      <span className={`font-black ${allocation.balance_due > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(allocation.balance_due)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}

        {allocations.length === 0 && (
          <div className="text-center py-16 bg-muted/10 rounded-xl border-2 border-dashed">
            <AlertCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">No allocations for {monthNames[month]} {year}</h3>
            <Button onClick={handleAddCustomer} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add First Allocation
            </Button>
          </div>
        )}
      </div>

      {/* Add Customer Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight text-primary">
              Initialize Allocation
            </DialogTitle>
            <DialogDescription className="text-[10px] uppercase font-bold tracking-widest opacity-60">
              Register a new client event allocation for {monthNames[month]} {year}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-muted-foreground/70 tracking-widest ml-1">Customer Name</label>
                <Input 
                  placeholder="Enter customer name" 
                  value={newCustomer.customer_name} 
                  onChange={(e) => setNewCustomer({ ...newCustomer, customer_name: e.target.value })}
                  className="font-bold h-11"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-muted-foreground/70 tracking-widest ml-1">Event Date</label>
                <Input 
                  type="date"
                  value={newCustomer.date} 
                  onChange={(e) => setNewCustomer({ ...newCustomer, date: e.target.value })}
                  className="font-bold h-11"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-muted-foreground/70 tracking-widest ml-1">Location</label>
                <Input 
                  placeholder="Event location" 
                  value={newCustomer.location} 
                  onChange={(e) => setNewCustomer({ ...newCustomer, location: e.target.value })}
                  className="font-bold h-11"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-muted-foreground/70 tracking-widest ml-1">Phone Number</label>
                <Input 
                  placeholder="Contact number" 
                  value={newCustomer.phone_number} 
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone_number: e.target.value })}
                  className="font-bold h-11"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-muted-foreground/70 tracking-widest ml-1">Event Type</label>
                <select
                  value={newCustomer.event_type}
                  onChange={(e) => setNewCustomer({ ...newCustomer, event_type: e.target.value })}
                  className="w-full h-11 px-3 py-2 border border-input bg-background rounded-md text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                >
                  <option value="Wedding">Wedding</option>
                  <option value="Corporate">Corporate</option>
                  <option value="Birthday">Birthday</option>
                  <option value="Funeral">Funeral</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-muted-foreground/70 tracking-widest ml-1">Total Quote (KSH)</label>
                <Input 
                  type="number" 
                  placeholder="0.00" 
                  value={newCustomer.total_ksh || ''} 
                  onChange={(e) => setNewCustomer({ ...newCustomer, total_ksh: parseInt(e.target.value) || 0 })}
                  className="font-black h-11 text-success"
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-primary mb-4">Initial Equipment</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">Double Tents</label>
                  <Input type="number" value={newCustomer.double_tent || ''} onChange={(e) => setNewCustomer({...newCustomer, double_tent: parseInt(e.target.value) || 0})} className="h-9 text-center" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">Single Tents</label>
                  <Input type="number" value={newCustomer.single_tent || ''} onChange={(e) => setNewCustomer({...newCustomer, single_tent: parseInt(e.target.value) || 0})} className="h-9 text-center" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">Round Tables</label>
                  <Input type="number" value={newCustomer.round_table || ''} onChange={(e) => setNewCustomer({...newCustomer, round_table: parseInt(e.target.value) || 0})} className="h-9 text-center" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">Chavari Seats</label>
                  <Input type="number" value={newCustomer.chavari_seats || ''} onChange={(e) => setNewCustomer({...newCustomer, chavari_seats: parseInt(e.target.value) || 0})} className="h-9 text-center" />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-6 gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setShowAddDialog(false)}
              className="flex-1 sm:flex-none h-11 px-8 font-black uppercase tracking-widest text-[10px]"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveCustomer}
              disabled={saving}
              className="flex-1 sm:flex-none h-11 px-12 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20"
            >
              {saving ? 'Processing...' : 'Add Allocation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MonthlyAllocationTable;