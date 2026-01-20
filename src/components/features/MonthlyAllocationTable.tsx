'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Printer, Calendar, Save, Trash2, Edit3, Check, X, AlertCircle, Download, FileText, CheckCircle, Clock, User, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/utils/formatters';
import { useRoleGuard } from '@/hooks/useRoleGuard';

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
  users?: {
    first_name: string;
    last_name: string;
    email: string;
    role: string;
  };
}

interface MonthlyAllocationTableProps {
  month: number;
  year: number;
  onAddCustomer: () => void;
  filterUserId?: string | null;
}

const MonthlyAllocationTable: React.FC<MonthlyAllocationTableProps> = ({ 
  month, 
  year, 
  onAddCustomer,
  filterUserId
}) => {
  const { user } = useAuth();
  const { isStaff, canDeleteTransaction } = useRoleGuard();
  const [allocations, setAllocations] = useState<MonthlyAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
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
  const fetchAllocations = useCallback(async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('monthly_allocations')
        .select('*, users(first_name, last_name, email, role)')
        .eq('month', month + 1)
        .eq('year', year);

      // RBAC Filtering Logic
      if (isStaff()) {
        query = query.eq('user_id', user?.id);
      } else if (filterUserId) {
        query = query.eq('user_id', filterUserId);
      }
      
      const { data, error } = await query.order('date', { ascending: true });
      
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
  }, [month, year, user, filterUserId, isStaff]);

  useEffect(() => {
    fetchAllocations();
  }, [fetchAllocations]);

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
    // RBAC: Staff cannot edit others' data
    const allocation = allocations.find(a => a.id === id);
    if (isStaff() && allocation?.user_id !== user?.id) return;

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
    if (!canDeleteTransaction()) {
      toast.error('Forbidden: Only Directors can delete allocations');
      return;
    }

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
      setUpdatingId(id);
      const { error } = await supabase
        .from('monthly_allocations')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      await fetchAllocations();
      toast.success(`Job marked as ${status}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(`Failed to update status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusPercentage = (status: string) => {
    switch (status) {
      case 'pending': return 25;
      case 'confirmed': return 60;
      case 'completed': return 100;
      case 'cancelled': return 0;
      default: return 0;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning';
      case 'confirmed': return 'bg-blue-500';
      case 'completed': return 'bg-success';
      case 'cancelled': return 'bg-destructive';
      default: return 'bg-muted';
    }
  };

  const getStaffName = (allocation: MonthlyAllocation) => {
    if (!allocation.users) return 'Me';
    const { first_name, last_name, email } = allocation.users;
    if (first_name || last_name) return `${first_name || ''} ${last_name || ''}`.trim();
    return email || 'Unknown';
  };

  const renderEditableCell = (allocation: MonthlyAllocation, field: keyof MonthlyAllocation, className = '') => {
    const value = allocation[field];
    
    // Only allow editing if the value is a string or number
    if (typeof value !== 'string' && typeof value !== 'number') return null;

    const isEditing = editingCell?.id === allocation.id && editingCell?.field === field;
    const isReadOnly = isStaff() && allocation.user_id !== user?.id;
    
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
        className={`p-1 min-h-[24px] flex items-center text-xs ${className} ${!isReadOnly ? 'cursor-pointer hover:bg-muted/50' : 'opacity-80'}`}
        onClick={() => !isReadOnly && handleCellEdit(allocation.id, field, value)}
      >
        {value || <span className="text-muted-foreground/50 italic text-[10px]">0</span>}
      </div>
    );
  };

  const totalRevenue = allocations.reduce((sum, allocation) => sum + (allocation.total_ksh || 0), 0);
  const totalDeposits = allocations.reduce((sum, allocation) => sum + (allocation.deposit_paid || 0), 0);
  const totalBalance = totalRevenue - totalDeposits;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading allocations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-primary uppercase">Weekly Customer Allocations</h3>
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest opacity-60">
            {monthNames[month]} {year} • {allocations.length} records found
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {selectedRows.size > 0 && canDeleteTransaction() && (
            <Button variant="destructive" size="sm" onClick={handleDeleteSelected} disabled={saving} className="h-9 px-4 font-black uppercase text-[10px] tracking-widest rounded-xl">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete ({selectedRows.size})
            </Button>
          )}
          <Button onClick={handleAddCustomer} disabled={saving} size="sm" className="h-9 px-6 font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4 mr-2" />
            New Allocation
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Events', value: allocations.length, color: 'text-foreground' },
          { label: 'Total Revenue', value: formatCurrency(totalRevenue), color: 'text-success' },
          { label: 'Deposits Paid', value: formatCurrency(totalDeposits), color: 'text-blue-600' },
          { label: 'Balance Due', value: formatCurrency(totalBalance), color: 'text-destructive' }
        ].map(stat => (
          <Card key={stat.label} className="bg-muted/20 border-none shadow-none overflow-hidden relative">
            <CardContent className="p-4 text-center">
              <div className={`text-xl font-black ${stat.color} tracking-tighter`}>{stat.value}</div>
              <div className="text-[9px] text-muted-foreground uppercase tracking-widest font-black opacity-60">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Allocation Form List */}
      <div className="space-y-4">
        {allocations.map((allocation) => (
          <Card key={allocation.id} className="overflow-hidden border-l-4 border-l-primary/40 hover-lift glow-primary glass-card transition-all duration-500">
            <div className="p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedRows.has(allocation.id)}
                    onChange={(e) => {
                      const newSelected = new Set(selectedRows);
                      if (e.target.checked) newSelected.add(allocation.id);
                      else newSelected.delete(allocation.id);
                      setSelectedRows(newSelected);
                    }}
                    className="h-5 w-5 rounded-lg border-primary/20 text-primary focus:ring-primary"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-xl text-foreground tracking-tight uppercase">{allocation.customer_name}</h4>
                      <Badge variant="outline" className="text-[9px] h-4 font-black uppercase tracking-tighter">{allocation.event_type || 'General'}</Badge>
                    </div>
                    <div className="flex items-center text-[10px] text-muted-foreground font-medium mt-1">
                      <User className="h-2.5 w-2.5 mr-1" />
                      Assigned to: <span className="text-primary font-bold ml-1">{getStaffName(allocation)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <Select
                      value={allocation.status}
                      onValueChange={(value) => handleStatusChange(allocation.id, value)}
                    >
                      <SelectTrigger className="w-36 h-9 text-xs font-black uppercase tracking-widest bg-background/50">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">PENDING</SelectItem>
                        <SelectItem value="confirmed">CONFIRMED</SelectItem>
                        <SelectItem value="completed">COMPLETED</SelectItem>
                        <SelectItem value="cancelled">CANCELLED</SelectItem>
                      </SelectContent>
                    </Select>
                    {allocation.status === 'pending' && (
                      <Button 
                        size="sm" 
                        onClick={() => handleStatusChange(allocation.id, 'confirmed')} 
                        disabled={updatingId === allocation.id}
                        className="h-9 px-4 bg-green-600 hover:bg-green-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-green-600/20"
                      >
                        {updatingId === allocation.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3 mr-1.5" />}
                        Approve
                      </Button>
                    )}
                  </div>
                  
                  {/* Job Status Bar */}
                  <div className="w-48 space-y-1.5">
                    <div className="flex justify-between items-end">
                      <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Progress</span>
                      <span className="text-[10px] font-black text-primary">{getStatusPercentage(allocation.status)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ease-out ${getStatusColor(allocation.status)}`} 
                        style={{ width: `${getStatusPercentage(allocation.status)}%` }} 
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Event Info */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-1">Logistics Details</label>
                  <div className="bg-muted/20 rounded-2xl border border-primary/5 p-3 space-y-2 shadow-inner">
                    <div className="flex items-center text-xs">
                      <Calendar className="h-3.5 w-3.5 mr-2 text-primary opacity-50" />
                      <div className="flex-1 font-bold">{renderEditableCell(allocation, 'date')}</div>
                    </div>
                    <div className="flex items-center text-xs">
                      <FileText className="h-3.5 w-3.5 mr-2 text-primary opacity-50" />
                      <div className="flex-1 font-medium italic">{renderEditableCell(allocation, 'location')}</div>
                    </div>
                  </div>
                </div>

                {/* Equipment Summary */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-1">Asset Allocation</label>
                  <div className="bg-muted/20 rounded-2xl border border-primary/5 p-3 grid grid-cols-3 gap-2 shadow-inner">
                    {[
                      { label: 'Tents', val: allocation.tent_total },
                      { label: 'Tables', val: allocation.table_total },
                      { label: 'Seats', val: allocation.seat_total }
                    ].map(asset => (
                      <div key={asset.label} className="text-center p-2 bg-background rounded-xl border border-primary/5 shadow-sm">
                        <p className="text-[8px] font-black text-muted-foreground uppercase tracking-tighter">{asset.label}</p>
                        <p className="text-base font-black text-primary tracking-tighter">{asset.val}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financial Details */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-1">Revenue Audit</label>
                  <div className="bg-muted/20 rounded-2xl border border-primary/5 p-3 space-y-2 shadow-inner">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Total Quote</span>
                      <div className="w-24 text-right font-black">{renderEditableCell(allocation, 'total_ksh', 'text-right text-foreground')}</div>
                    </div>
                    <div className="flex justify-between items-center text-xs border-t border-primary/5 pt-1.5">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Remitted</span>
                      <div className="w-24 text-right font-black text-blue-600">{renderEditableCell(allocation, 'deposit_paid', 'text-right')}</div>
                    </div>
                    <div className="flex justify-between items-center text-xs border-t border-primary/5 pt-1.5">
                      <span className="text-[10px] font-black text-primary uppercase">Outstanding</span>
                      <span className={`font-black text-sm ${allocation.balance_due > 0 ? 'text-destructive' : 'text-success'}`}>
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
          <div className="text-center py-20 bg-muted/10 rounded-3xl border-2 border-dashed border-primary/10">
            <AlertCircle className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-muted-foreground mb-2 uppercase tracking-tight">No allocations registered</h3>
            <p className="text-sm text-muted-foreground/60 mb-6 max-w-xs mx-auto">Start by adding your first client event allocation for this month.</p>
            <Button onClick={handleAddCustomer} variant="outline" className="h-11 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest border-primary/20">
              <Plus className="h-4 w-4 mr-2" />
              Add First Allocation
            </Button>
          </div>
        )}
      </div>

      {/* Add Customer Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto rounded-3xl p-0 border-none shadow-2xl">
          <div className="h-1.5 w-full bg-gradient-to-r from-primary to-orange-600" />
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-2xl font-black uppercase tracking-tight text-primary">
              Initialize Allocation
            </DialogTitle>
            <DialogDescription className="text-[10px] uppercase font-bold tracking-widest opacity-60">
              Register a new client event allocation for {monthNames[month]} {year}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="px-6 py-4 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-muted-foreground/70 tracking-widest ml-1">Customer Name</label>
                <Input 
                  placeholder="Enter customer name" 
                  value={newCustomer.customer_name} 
                  onChange={(e) => setNewCustomer({ ...newCustomer, customer_name: e.target.value })}
                  className="font-bold h-11 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-muted-foreground/70 tracking-widest ml-1">Event Date</label>
                <Input 
                  type="date"
                  value={newCustomer.date} 
                  onChange={(e) => setNewCustomer({ ...newCustomer, date: e.target.value })}
                  className="font-bold h-11 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-muted-foreground/70 tracking-widest ml-1">Location</label>
                <Input 
                  placeholder="Event location" 
                  value={newCustomer.location} 
                  onChange={(e) => setNewCustomer({ ...newCustomer, location: e.target.value })}
                  className="font-bold h-11 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-muted-foreground/70 tracking-widest ml-1">Phone Number</label>
                <Input 
                  placeholder="Contact number" 
                  value={newCustomer.phone_number} 
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone_number: e.target.value })}
                  className="font-bold h-11 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-muted-foreground/70 tracking-widest ml-1">Event Type</label>
                <select
                  value={newCustomer.event_type}
                  onChange={(e) => setNewCustomer({ ...newCustomer, event_type: e.target.value })}
                  className="w-full h-11 px-3 py-2 border border-input bg-background rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                >
                  <option value="Wedding">Wedding</option>
                  <option value="Corporate">Corporate</option>
                  <option value="Birthday">Birthday</option>
                  <option value="Funeral">Funeral</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-muted-foreground/70 tracking-widest ml-1 text-success">Total Quote (KSH)</label>
                <Input 
                  type="number" 
                  placeholder="0.00" 
                  value={newCustomer.total_ksh || ''} 
                  onChange={(e) => setNewCustomer({ ...newCustomer, total_ksh: parseInt(e.target.value) || 0 })}
                  className="font-black h-11 text-success rounded-xl"
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-4 ml-1">Initial Equipment Allocation</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase ml-1">Double Tents</label>
                  <Input type="number" value={newCustomer.double_tent || ''} onChange={(e) => setNewCustomer({...newCustomer, double_tent: parseInt(e.target.value) || 0})} className="h-10 text-center rounded-xl font-bold" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase ml-1">Single Tents</label>
                  <Input type="number" value={newCustomer.single_tent || ''} onChange={(e) => setNewCustomer({...newCustomer, single_tent: parseInt(e.target.value) || 0})} className="h-10 text-center rounded-xl font-bold" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase ml-1">Round Tables</label>
                  <Input type="number" value={newCustomer.round_table || ''} onChange={(e) => setNewCustomer({...newCustomer, round_table: parseInt(e.target.value) || 0})} className="h-10 text-center rounded-xl font-bold" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase ml-1">Chavari Seats</label>
                  <Input type="number" value={newCustomer.chavari_seats || ''} onChange={(e) => setNewCustomer({...newCustomer, chavari_seats: parseInt(e.target.value) || 0})} className="h-10 text-center rounded-xl font-bold" />
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 pt-2 flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowAddDialog(false)}
              className="flex-1 h-12 font-black uppercase tracking-widest text-[10px] rounded-xl"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveCustomer}
              disabled={saving}
              className="flex-1 h-12 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 rounded-xl"
            >
              {saving ? 'Processing...' : 'Add Allocation'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MonthlyAllocationTable;