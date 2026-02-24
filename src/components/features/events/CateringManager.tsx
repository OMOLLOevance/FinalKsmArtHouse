'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Edit, Trash2, ArrowLeft, Save, DollarSign, CheckCircle, Clock, Database, X, Settings, Utensils } from 'lucide-react';
import { useCateringItems } from '@/hooks/useCateringItems';
import { 
  useCateringInventoryQuery, 
  useUpsertCateringInventoryMutation, 
  useDeleteCateringInventoryMutation,
  CateringInventoryItem
} from '@/hooks/useCateringInventory';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogDescription, DialogFooter 
} from '@/components/ui/Dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { logger } from '@/lib/logger';
import { formatCurrency } from '@/utils/formatters';
import { CateringItem } from '@/types';
import { toast } from 'sonner';
import { StaffSelector } from '@/components/shared/StaffSelector';
import { useRoleGuard } from '@/hooks/useRoleGuard';

interface CateringManagerProps {
  onBack: () => void;
}

const DEFAULT_CATEGORIES = [
  'CUPS', 'PLATES', 'CUTLERIES', 'GLASSES', 'JUGS', 'BOWLS', 
  'DISPLAY STANDS', 'JUICE', 'GENERAL UTENSILS', 'CHAFFING DISHES', 
  'WASH UP', 'COOKING STUFFS', 'UNIFORMS'
];

const CateringManager: React.FC<CateringManagerProps> = ({ onBack }) => {
  const { isManager } = useRoleGuard();
  const [filterUserId, setFilterUserId] = useState<string | null>(null);

  const { items: serviceItems, loading: servicesLoading, error: servicesError, addItem, updateItem, deleteItem, refetch: fetchServices } = useCateringItems(filterUserId);
  
  // Inventory Hooks
  const { data: inventoryItems = [], isLoading: inventoryLoading, error: inventoryError } = useCateringInventoryQuery(filterUserId);
  const upsertInventory = useUpsertCateringInventoryMutation();
  const deleteInventory = useDeleteCateringInventoryMutation();

  const [editingItem, setEditingItem] = useState<CateringItem | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isNewCategory, setIsNewCategory] = useState(false);
  
  // Track local changes for existing items
  const [localInventory, setLocalInventory] = useState<Record<string, Partial<CateringInventoryItem>>>({});
  
  // Track new pending items that aren't in the database yet
  const [pendingItems, setPendingItems] = useState<CateringInventoryItem[]>([]);

  const categories = useMemo(() => {
    const dbCategories = [...new Set(inventoryItems.map(item => item.category))];
    const pendingCategories = [...new Set(pendingItems.map(item => item.category))];
    // Combine with defaults but prioritize existing DB categories
    return [...new Set([...DEFAULT_CATEGORIES, ...dbCategories, ...pendingCategories])].sort();
  }, [inventoryItems, pendingItems]);

  const categoryOptions = useMemo(() => {
    return categories.map(cat => ({ value: cat, label: cat }));
  }, [categories]);

  const categoriesWithNew = useMemo(() => {
    return [
      { value: "NEW_CATEGORY", label: "➕ ADD NEW CATEGORY..." },
      ...categoryOptions
    ];
  }, [categoryOptions]);

  const [formData, setFormData] = useState({
    item: '',
    quantity: 0,
    unitPrice: 0,
    category: '',
    notes: '',
    eventBudget: 0,
    amountPaid: 0,
    paymentMethod: 'cash' as 'cash' | 'mpesa' | 'bank',
    eventLocation: '',
    paymentStatus: 'deposit' as 'deposit' | 'full',
    serviceStatus: 'not-served' as 'served' | 'not-served',
  });

  const parseDescription = (desc: string = '') => {
    const data: { 
      budget: number; 
      paid: number; 
      method: 'cash' | 'mpesa' | 'bank'; 
      status: 'deposit' | 'full'; 
      location: string; 
      notes: string; 
    } = { 
      budget: 0, paid: 0, method: 'cash', status: 'deposit', location: '-', notes: '' 
    };
    try {
      const budgetMatch = desc.match(/Budget: (\d+)/);
      const paidMatch = desc.match(/Paid: (\d+)/);
      const methodMatch = desc.match(/Payment: (cash|mpesa|bank)/);
      const locMatch = desc.match(/Location: (.*?),/);
      if (budgetMatch) data.budget = Number(budgetMatch[1]);
      if (paidMatch) data.paid = Number(paidMatch[1]);
      if (methodMatch) data.method = methodMatch[1] as any;
      if (locMatch) data.location = locMatch[1];
      data.notes = desc.split(', ').pop() || '';
    } catch (e) {}
    return data;
  };

  const handleInventoryFieldChange = (id: string, field: string, value: string | number, isPending: boolean) => {
    if (isPending) {
      setPendingItems(prev => prev.map(item => 
        item.id === id ? { ...item, [field]: field === 'particular' ? value : Number(value) } : item
      ));
    } else {
      setLocalInventory(prev => ({
        ...prev,
        [id]: { ...prev[id], [field]: field === 'particular' ? value : Number(value) }
      }));
    }
  };

  const handleAddSlot = (category: string) => {
    const newItem: CateringInventoryItem = {
      id: crypto.randomUUID(),
      category,
      particular: '',
      good_condition: 0,
      repair_needed: 0,
      user_id: '' // Will be set by hook
    };
    setPendingItems(prev => [...prev, newItem]);
  };

  const handleSaveItem = async (item: Partial<CateringInventoryItem>, isPending: boolean) => {
    if (!item.particular?.trim()) {
      toast.error('Item name is required');
      return;
    }

    try {
      const localData = isPending ? {} : (localInventory[item.id!] || {});
      const dataToSave = { ...item, ...localData };
      
      // Remove user_id from the data since the hook will set it
      delete dataToSave.user_id;
      
      await upsertInventory.mutateAsync(dataToSave);
      toast.success('Inventory updated');
      
      if (isPending) {
        setPendingItems(prev => prev.filter(p => p.id !== item.id));
      } else {
        setLocalInventory(prev => {
          const next = { ...prev };
          delete next[item.id!];
          return next;
        });
      }
    } catch (error) {
      toast.error('Failed to save item');
    }
  };

  const handleAddCategory = () => {
    const name = prompt('Enter new category name:');
    if (name) {
      handleAddSlot(name.toUpperCase());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const itemData = {
        name: formData.item,
        category: formData.category,
        price_per_plate: formData.unitPrice,
        min_order: formData.quantity,
        description: `Budget: ${formData.eventBudget}, Paid: ${formData.amountPaid}, Payment: ${formData.paymentMethod}, Status: ${formData.serviceStatus}, Location: ${formData.eventLocation}, ${formData.notes}`,
        available: true,
        unit: 'pieces'
      };
      if (editingItem) await updateItem(editingItem.id, itemData);
      else await addItem(itemData as any);
      setIsAdding(false);
      setEditingItem(null);
      setFormData({ item: '', quantity: 0, unitPrice: 0, category: '', notes: '', eventBudget: 0, amountPaid: 0, paymentMethod: 'cash', eventLocation: '', paymentStatus: 'deposit', serviceStatus: 'not-served' });
      await fetchServices();
    } catch (error: any) {
      logger.error('Failed to save item:', error);
      toast.error(`Failed to save item: ${error.message || 'Unknown error'}`);
    }
  };

  const handleEdit = (item: CateringItem) => {
    const parsed = parseDescription(item.description);
    setEditingItem(item);
    setFormData({
      item: item.name, category: item.category, quantity: item.min_order,
      unitPrice: item.price_per_plate, notes: parsed.notes, eventBudget: parsed.budget,
      amountPaid: parsed.paid, paymentMethod: parsed.method, eventLocation: parsed.location,
      paymentStatus: parsed.status, serviceStatus: item.description?.includes('Status: served') ? 'served' : 'not-served',
    });
    setIsAdding(true);
  };

  const totals = useMemo(() => {
    return serviceItems.reduce((acc, item: CateringItem) => {
      const parsed = parseDescription(item.description);
      acc.value += (item.price_per_plate * item.min_order);
      acc.budget += parsed.budget;
      acc.paid += parsed.paid;
      if (item.description?.includes('Status: served')) acc.served++;
      return acc;
    }, { value: 0, budget: 0, paid: 0, served: 0 });
  }, [serviceItems]);

  if (servicesLoading || inventoryLoading) return <LoadingSpinner text="Loading catering data..." />;

  const renderInventoryForm = () => {
    return categories.map((categoryName) => {
      const categoryDbItems = inventoryItems.filter(i => i.category === categoryName);
      const categoryPendingItems = pendingItems.filter(i => i.category === categoryName);

      if (categoryDbItems.length === 0 && categoryPendingItems.length === 0) {
        return (
          <div key={categoryName} className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2 border-primary/20">
              <h3 className="text-lg font-black tracking-tight text-foreground uppercase tracking-widest opacity-80">{categoryName}</h3>
              <Button size="xs" variant="outline" onClick={() => handleAddSlot(categoryName)} className="h-8 text-[10px] font-black uppercase tracking-widest border-primary/20">
                <Plus className="h-3 w-3 mr-1" /> Initialize {categoryName}
              </Button>
            </div>
            <div className="py-8 text-center text-muted-foreground bg-muted/5 border border-dashed rounded-2xl">
              <p className="text-xs font-bold uppercase tracking-widest opacity-40">No records found in this classification</p>
            </div>
          </div>
        );
      }

      return (
        <div key={categoryName} className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2 border-primary/20">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-6 bg-primary rounded-full" />
              <h3 className="text-lg font-black tracking-tight text-foreground uppercase tracking-widest">{categoryName}</h3>
            </div>
            <Button size="xs" variant="outline" onClick={() => handleAddSlot(categoryName)} className="h-8 text-[10px] font-black uppercase tracking-widest border-primary/20 hover:bg-primary hover:text-white transition-all">
              <Plus className="h-3 w-3 mr-1" /> Add New {categoryName}
            </Button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-primary/5 shadow-xl glass-card">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/30 border-b border-primary/5">
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest">Item Particulars</th>
                  <th className="px-6 py-4 text-center text-[10px] font-black uppercase text-muted-foreground tracking-widest w-32">Good Condition</th>
                  <th className="px-6 py-4 text-center text-[10px] font-black uppercase text-muted-foreground tracking-widest w-32">Needs Repair</th>
                  <th className="px-6 py-4 text-right text-[10px] font-black uppercase text-muted-foreground tracking-widest w-40">Operational Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                {/* Pending New Items */}
                {categoryPendingItems.map((item) => (
                  <tr key={item.id} className="bg-warning/[0.05] animate-in fade-in slide-in-from-left-2 duration-300 border-l-4 border-l-warning">
                    <td className="px-6 py-3">
                      <div className="space-y-1">
                        <Input
                          value={item.particular}
                          onChange={(e) => handleInventoryFieldChange(item.id, 'particular', e.target.value, true)}
                          className="h-9 text-sm font-bold bg-background border-warning/20 shadow-sm rounded-lg focus-visible:ring-warning"
                          placeholder="New Item Name..."
                          autoFocus
                        />
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[9px] h-4 bg-warning/10 text-warning border-warning/20">DRAFT ENTRY</Badge>
                          <div className="h-1 w-24 bg-warning/10 rounded-full overflow-hidden">
                            <div className="h-full bg-warning animate-pulse w-[60%]" />
                          </div>
                          <span className="text-[9px] text-muted-foreground font-medium">Pending Approval</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3 align-top">
                      <Input
                        type="number"
                        value={item.good_condition}
                        onChange={(e) => handleInventoryFieldChange(item.id, 'good_condition', e.target.value, true)}
                        className="h-9 text-sm text-center font-bold bg-background border-warning/20 rounded-lg"
                      />
                    </td>
                    <td className="px-6 py-3 align-top">
                      <Input
                        type="number"
                        value={item.repair_needed}
                        onChange={(e) => handleInventoryFieldChange(item.id, 'repair_needed', e.target.value, true)}
                        className="h-9 text-sm text-center font-bold bg-background border-warning/20 rounded-lg text-destructive"
                      />
                    </td>
                    <td className="px-6 py-3 text-right align-top">
                      <div className="flex items-center justify-end space-x-2">
                        <Button size="sm" onClick={() => handleSaveItem(item, true)} className="h-9 px-4 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg bg-green-600 hover:bg-green-700 text-white transition-all hover:scale-105">
                          <CheckCircle className="h-3.5 w-3.5 mr-2" /> Approve
                        </Button>
                        <Button size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground hover:text-destructive rounded-xl hover:bg-destructive/10" onClick={() => setPendingItems(prev => prev.filter(p => p.id !== item.id))} aria-label="Remove Pending Item">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}

                {/* Existing DB Items */}
                {categoryDbItems.map((item) => {
                  const hasChanges = !!localInventory[item.id];
                  return (
                    <tr key={item.id} className="hover:bg-primary/[0.01] transition-colors group">
                      <td className="px-6 py-4">
                        <Input
                          value={localInventory[item.id]?.particular ?? item.particular}
                          onChange={(e) => handleInventoryFieldChange(item.id, 'particular', e.target.value, false)}
                          className="h-10 text-sm font-bold bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary/20 rounded-xl transition-all"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <Input
                          type="number"
                          value={localInventory[item.id]?.good_condition ?? item.good_condition}
                          onChange={(e) => handleInventoryFieldChange(item.id, 'good_condition', e.target.value, false)}
                          className="h-10 text-sm text-center font-black bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary/20 rounded-xl"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <Input
                          type="number"
                          value={localInventory[item.id]?.repair_needed ?? item.repair_needed}
                          onChange={(e) => handleInventoryFieldChange(item.id, 'repair_needed', e.target.value, false)}
                          className="h-10 text-sm text-center font-black bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary/20 rounded-xl text-destructive"
                        />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {hasChanges && (
                            <Button size="sm" variant="outline" onClick={() => handleSaveItem(item, false)} className="h-9 px-4 text-[10px] font-black uppercase tracking-widest border-primary/30 text-primary hover:bg-primary hover:text-white rounded-xl shadow-sm animate-in zoom-in-95">
                              <Save className="h-3.5 w-3.5 mr-2" /> Commit
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" className="h-9 w-9 text-destructive/40 hover:text-destructive hover:bg-destructive/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deleteInventory.mutate(item.id)} aria-label="Delete Item">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      );
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {(servicesError || inventoryError) && (
        <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-xl flex items-center justify-between text-destructive text-sm font-bold animate-in zoom-in-95 duration-300">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>Failed to synchronize some data. Database might be initializing.</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => { fetchServices(); }} className="h-8 border-destructive/30 hover:bg-destructive/10 text-destructive">
            Retry Sync
          </Button>
        </div>
      )}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          {onBack && (
            <Button type="button" variant="outline" size="sm" onClick={onBack} className="rounded-full h-10 px-4" aria-label="Back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <h1 className="text-3xl font-black tracking-tight text-primary uppercase">Catering Management</h1>
        </div>
        <div className="flex items-center gap-2">
          {isManager() && (
            <div className="w-full md:w-64">
              <StaffSelector 
                value={filterUserId} 
                onChange={setFilterUserId} 
                className="bg-background/50 backdrop-blur-sm"
              />
            </div>
          )}
          <Button type="button" onClick={() => setIsAdding(true)} className="h-10 px-6 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4 mr-2" /> 
            Add Service Item
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-muted/20 border-none shadow-none">
          <CardContent className="p-3 text-center">
            <div className="text-xl font-bold">{formatCurrency(totals.value)}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Inventory Value</div>
          </CardContent>
        </Card>
        <Card className="bg-muted/20 border-none shadow-none">
          <CardContent className="p-3 text-center">
            <div className="text-xl font-bold">{formatCurrency(totals.budget)}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Total Budget</div>
          </CardContent>
        </Card>
        <Card className="bg-muted/20 border-none shadow-none">
          <CardContent className="p-3 text-center">
            <div className="text-xl font-bold text-success">{formatCurrency(totals.paid)}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Amount Paid</div>
          </CardContent>
        </Card>
        <Card className="bg-muted/20 border-none shadow-none">
          <CardContent className="p-3 text-center">
            <div className="text-xl font-bold text-primary">{totals.served} / {serviceItems.length}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Service Progress</div>
          </CardContent>
        </Card>
      </div>

      <Dialog 
        open={isAdding || !!editingItem} 
        onOpenChange={(open) => {
          if (!open) {
            setIsAdding(false);
            setEditingItem(null);
          }
        }}
      >
        <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto rounded-3xl p-0 border-none shadow-2xl">
          <div className="h-1.5 w-full bg-gradient-to-r from-primary to-green-600" />
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-2xl font-black uppercase tracking-tight text-primary">
              {editingItem ? 'Update' : 'Initialize'} Service Item
            </DialogTitle>
            <DialogDescription className="text-[10px] uppercase font-bold tracking-widest opacity-60">
              {editingItem ? 'Modify existing professional billing record' : 'Register a new professional catering service item'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-muted-foreground/70 tracking-widest ml-1">Item Particulars</label>
                <Input placeholder="e.g. Premium Buffet" value={formData.item} onChange={(e) => setFormData({ ...formData, item: e.target.value })} required className="font-bold rounded-xl h-11" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-muted-foreground/70 tracking-widest ml-1">Classification</label>
                {!isNewCategory ? (
                  <div className="flex gap-2">
                    <Select
                      value={formData.category}
                      onValueChange={(val) => {
                        if (val === "NEW_CATEGORY") {
                          setIsNewCategory(true);
                          setFormData({ ...formData, category: '' });
                        } else {
                          setFormData({ ...formData, category: val });
                        }
                      }}
                    >
                      <SelectTrigger className="flex-1 rounded-xl">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoriesWithNew.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="flex gap-2 animate-in slide-in-from-right-2 duration-300">
                    <Input 
                      placeholder="Enter new category name..." 
                      value={formData.category} 
                      onChange={(e) => setFormData({ ...formData, category: e.target.value.toUpperCase() })}
                      className="font-black h-11 border-primary/20 focus:border-primary uppercase rounded-xl flex-1"
                      autoFocus
                    />
                    <Button 
                      type="button"
                      variant="ghost" 
                      onClick={() => setIsNewCategory(false)}
                      className="h-11 w-11 p-0 rounded-xl hover:bg-muted"
                      title="Back to List"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                 <p className="text-[8px] text-muted-foreground ml-1">
                    {!isNewCategory ? "Choose from existing list or select 'ADD NEW' to create" : "Manual entry mode active."}
                  </p>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-muted-foreground/70 tracking-widest ml-1">Quantity / Servings</label>
                <Input type="number" placeholder="0" value={formData.quantity || ''} onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })} required className="font-bold rounded-xl h-11" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-muted-foreground/70 tracking-widest ml-1">Unit Price (KSH)</label>
                <Input type="number" placeholder="0.00" value={formData.unitPrice || ''} onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) })} required className="font-bold text-success rounded-xl h-11" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-muted-foreground/70 tracking-widest ml-1">Allocated Budget (KSH)</label>
                <Input type="number" placeholder="0.00" value={formData.eventBudget || ''} onChange={(e) => setFormData({ ...formData, eventBudget: Number(e.target.value) })} className="font-bold text-primary rounded-xl h-11" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-muted-foreground/70 tracking-widest ml-1 text-success">Amount Remitted (KSH)</label>
                <Input type="number" placeholder="0.00" value={formData.amountPaid || ''} onChange={(e) => setFormData({ ...formData, amountPaid: Number(e.target.value) })} className="font-bold text-success rounded-xl h-11" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-muted-foreground/70 tracking-widest ml-1">Operational Notes</label>
              <Input placeholder="Enter details..." value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="font-medium rounded-xl h-11" />
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <Button type="button" variant="outline" className="flex-1 h-12 font-black uppercase tracking-widest text-[10px] rounded-xl" onClick={() => { setIsAdding(false); setEditingItem(null); }}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1 h-12 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 rounded-xl">
                {editingItem ? 'Update Entry' : 'Register Item'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Inventory Section */}
      <Card className="border-primary/10 shadow-sm bg-transparent border-none shadow-none">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between px-0 pb-4 mb-6 border-b border-primary/10 gap-4">
          <div>
            <h2 className="text-2xl font-bold uppercase tracking-tight text-foreground">Stock Inventory</h2>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Physical asset tracking</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={handleAddCategory} className="h-9 px-4 font-black uppercase text-[10px] tracking-widest rounded-xl border-primary/20">
            <Plus className="h-4 w-4 mr-2" /> New Category
          </Button>
        </CardHeader>
        <CardContent className="space-y-12 px-0">
          {renderInventoryForm()}
        </CardContent>
      </Card>

      {/* Service List Section */}
      <Card className="border-primary/10 shadow-sm bg-transparent border-none shadow-none">
        <CardHeader className="px-0 border-b border-primary/10 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-primary uppercase tracking-tight">Service Items List</h2>
          <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Client billing items</p>
        </CardHeader>
        <CardContent className="px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {serviceItems.map((item: CateringItem) => {
              const parsed = parseDescription(item.description);
              const isServed = item.description?.includes('Status: served');
              return (
                <Card key={item.id} className={`overflow-hidden border-none hover-lift glow-primary glass-card transition-all duration-500 rounded-3xl group relative ${isServed ? 'border-l-4 border-l-success' : 'border-l-4 border-l-warning'}`}>
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-700">
                    <Utensils className="h-24 w-24 rotate-12" />
                  </div>
                  
                  <div className="p-6 space-y-5 relative z-10">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-black text-xl text-primary uppercase tracking-tight leading-none mb-2">{item.name}</h4>
                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest bg-muted/50 border-none">
                          {item.category}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Badge variant={isServed ? 'success' : 'warning'} className="text-[9px] h-5 font-black uppercase tracking-widest">
                          {isServed ? 'SERVED' : 'PENDING'}
                        </Badge>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} className="h-8 w-8 rounded-xl hover:bg-primary/10 transition-all"><Edit className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteItem(item.id)} className="h-8 w-8 rounded-xl text-destructive/40 hover:text-destructive hover:bg-destructive/10 transition-all"><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 bg-muted/20 p-4 rounded-2xl border border-primary/5 shadow-inner">
                      <div className="space-y-0.5">
                        <label className="text-[9px] font-black uppercase text-muted-foreground/70 tracking-widest">Quantity</label>
                        <p className="text-base font-black">{item.min_order} pax</p>
                      </div>
                      <div className="space-y-0.5 text-right">
                        <label className="text-[9px] font-black uppercase text-muted-foreground/70 tracking-widest">Unit Price</label>
                        <p className="text-base font-black text-success">{formatCurrency(item.price_per_plate)}</p>
                      </div>
                      <div className="space-y-0.5 col-span-2 border-t border-primary/5 pt-2 mt-1">
                        <div className="flex justify-between items-center">
                          <label className="text-[9px] font-black uppercase text-muted-foreground/70 tracking-widest">Paid / Budget</label>
                          <p className="text-sm font-black">
                            <span className="text-success">{formatCurrency(parsed.paid)}</span>
                            <span className="mx-1 opacity-20">/</span>
                            <span className="text-primary">{formatCurrency(parsed.budget)}</span>
                          </p>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full mt-2 overflow-hidden">
                          <div 
                            className="h-full bg-success transition-all duration-1000" 
                            style={{ width: `${Math.min(100, (parsed.paid / (parsed.budget || 1)) * 100)}%` }} 
                          />
                        </div>
                      </div>
                    </div>

                    {parsed.notes && (
                      <div className="px-1">
                        <label className="text-[9px] font-black uppercase text-muted-foreground/70 tracking-widest block mb-1">Operational Notes</label>
                        <p className="text-xs text-muted-foreground font-medium italic line-clamp-2">&quot;{parsed.notes}&quot;</p>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
            {serviceItems.length === 0 && (
              <div className="col-span-full py-16 text-center text-muted-foreground bg-muted/5 rounded-2xl border-2 border-dashed border-primary/10">
                <Utensils className="h-12 w-12 mx-auto mb-4 opacity-20 text-primary" />
                <p className="text-xl font-bold text-foreground">No Service Items Found</p>
                <p className="text-sm mb-6 max-w-xs mx-auto">Create your first client billing item to track event pricing and budgets.</p>
                <Button variant="default" onClick={() => setIsAdding(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Add Your First Item
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CateringManager;