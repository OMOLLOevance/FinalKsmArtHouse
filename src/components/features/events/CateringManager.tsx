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
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { logger } from '@/lib/logger';
import { formatCurrency } from '@/utils/formatters';
import { CateringItem } from '@/types';
import { toast } from 'sonner';

interface CateringManagerProps {
  onBack: () => void;
}

const DEFAULT_CATEGORIES = [
  'CUPS', 'PLATES', 'CUTLERIES', 'GLASSES', 'JUGS', 'BOWLS', 
  'DISPLAY STANDS', 'JUICE', 'GENERAL UTENSILS', 'CHAFFING DISHES', 
  'WASH UP', 'COOKING STUFFS', 'UNIFORMS'
];

const CateringManager: React.FC<CateringManagerProps> = ({ onBack }) => {
  const { items: serviceItems, loading: servicesLoading, addItem, updateItem, deleteItem, refetch: fetchServices } = useCateringItems();
  
  // Inventory Hooks
  const { data: inventoryItems = [], isLoading: inventoryLoading } = useCateringInventoryQuery();
  const upsertInventory = useUpsertCateringInventoryMutation();
  const deleteInventory = useDeleteCateringInventoryMutation();

  const [editingItem, setEditingItem] = useState<CateringItem | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  // Track local changes for existing items
  const [localInventory, setLocalInventory] = useState<Record<string, Partial<CateringInventoryItem>>>({});
  
  // Track new pending items that aren't in the database yet
  const [pendingItems, setPendingItems] = useState<CateringInventoryItem[]>([]);

  const categories = useMemo(() => {
    const dbCategories = [...new Set(inventoryItems.map(item => item.category))];
    const pendingCategories = [...new Set(pendingItems.map(item => item.category))];
    return [...new Set([...DEFAULT_CATEGORIES, ...dbCategories, ...pendingCategories])].sort();
  }, [inventoryItems, pendingItems]);

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
    } catch (error) {
      logger.error('Failed to save item:', error);
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

      return (
        <div key={categoryName} className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2 border-primary/20">
            <h3 className="text-lg font-black tracking-tight text-foreground">{categoryName}</h3>
            <Button size="xs" variant="outline" onClick={() => handleAddSlot(categoryName)}>
              <Plus className="h-3 w-3 mr-1" /> Add Item to {categoryName}
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Pending New Items */}
            {categoryPendingItems.map((item) => (
              <Card key={item.id} className="overflow-hidden border-primary bg-primary/5 shadow-md border-dashed">
                <div className="p-3 space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <label className="text-[9px] font-black uppercase text-primary tracking-widest mb-1 block">New Particulars</label>
                      <Input
                        value={item.particular}
                        onChange={(e) => handleInventoryFieldChange(item.id, 'particular', e.target.value, true)}
                        className="h-8 text-xs font-bold bg-background"
                        placeholder="Enter item name..."
                        autoFocus
                      />
                    </div>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setPendingItems(prev => prev.filter(p => p.id !== item.id))}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-muted-foreground block text-center">Good</label>
                      <Input
                        type="number"
                        value={item.good_condition}
                        onChange={(e) => handleInventoryFieldChange(item.id, 'good_condition', e.target.value, true)}
                        className="h-8 text-xs text-center font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-muted-foreground block text-center">Repair</label>
                      <Input
                        type="number"
                        value={item.repair_needed}
                        onChange={(e) => handleInventoryFieldChange(item.id, 'repair_needed', e.target.value, true)}
                        className="h-8 text-xs text-center font-bold"
                      />
                    </div>
                  </div>
                  <Button className="w-full h-8 text-[10px] font-black uppercase" size="sm" onClick={() => handleSaveItem(item, true)}>
                    <Save className="h-3 w-3 mr-2" /> Add to {categoryName}
                  </Button>
                </div>
              </Card>
            ))}

            {/* Existing DB Items */}
            {categoryDbItems.map((item) => (
              <Card key={item.id} className="overflow-hidden border-muted hover:border-primary/30 transition-all border-l-4 border-l-primary/40">
                <div className="p-3 space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-1 block">Particulars</label>
                      <Input
                        value={localInventory[item.id]?.particular ?? item.particular}
                        onChange={(e) => handleInventoryFieldChange(item.id, 'particular', e.target.value, false)}
                        className="h-8 text-xs font-medium bg-background"
                      />
                    </div>
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive/50 hover:text-destructive hover:bg-destructive/10" onClick={() => deleteInventory.mutate(item.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-muted-foreground block text-center">Good</label>
                      <Input
                        type="number"
                        value={localInventory[item.id]?.good_condition ?? item.good_condition}
                        onChange={(e) => handleInventoryFieldChange(item.id, 'good_condition', e.target.value, false)}
                        className="h-8 text-xs text-center font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-muted-foreground block text-center">Repair</label>
                      <Input
                        type="number"
                        value={localInventory[item.id]?.repair_needed ?? item.repair_needed}
                        onChange={(e) => handleInventoryFieldChange(item.id, 'repair_needed', e.target.value, false)}
                        className="h-8 text-xs text-center font-bold text-destructive"
                      />
                    </div>
                  </div>
                  {localInventory[item.id] && (
                    <Button variant="outline" className="w-full h-7 text-[9px] font-black uppercase border-primary/30 text-primary hover:bg-primary hover:text-white" onClick={() => handleSaveItem(item, false)}>
                      <Save className="h-3 w-3 mr-2" /> Save Changes
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Catering</h2>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsAdding(true)} size="sm"><Plus className="h-4 w-4 mr-2" /> Add Service Item</Button>
          <Button variant="outline" onClick={() => fetchServices()} size="sm"><Database className="h-4 w-4 mr-2" /> Sync</Button>
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

      {(isAdding || editingItem) && (
        <Card>
          <CardHeader><CardTitle>{editingItem ? 'Edit' : 'Add'} Item</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input placeholder="Item Name" value={formData.item} onChange={(e) => setFormData({ ...formData, item: e.target.value })} required />
              <Input placeholder="Category" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required />
              <Input type="number" placeholder="Quantity" value={formData.quantity || ''} onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })} required />
              <Input type="number" placeholder="Price (KSH)" value={formData.unitPrice || ''} onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) })} required />
              <Input type="number" placeholder="Budget (KSH)" value={formData.eventBudget || ''} onChange={(e) => setFormData({ ...formData, eventBudget: Number(e.target.value) })} />
              <Input type="number" placeholder="Paid (KSH)" value={formData.amountPaid || ''} onChange={(e) => setFormData({ ...formData, amountPaid: Number(e.target.value) })} />
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => { setIsAdding(false); setEditingItem(null); }}>Cancel</Button>
                <Button type="submit" className="flex-1">Save</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Inventory Section */}
      <Card className="border-primary/10 shadow-sm bg-transparent border-none shadow-none">
        <CardHeader className="flex flex-row items-center justify-between px-0 pb-4 mb-6 border-b border-primary/10">
          <div>
            <CardTitle className="text-2xl font-bold">Stock Inventory</CardTitle>
            <CardDescription className="text-xs font-black uppercase tracking-widest opacity-70">Physical asset tracking</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleAddCategory}>
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
          <CardTitle className="text-2xl font-bold text-primary">Service Items List</CardTitle>
          <CardDescription className="text-xs font-black uppercase tracking-widest opacity-70">Client billing items</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {serviceItems.map((item: CateringItem) => {
              const parsed = parseDescription(item.description);
              const isServed = item.description?.includes('Status: served');
              return (
                <Card key={item.id} className={`overflow-hidden transition-all duration-300 hover:shadow-md border-l-4 ${isServed ? 'border-l-success' : 'border-l-warning'}`}>
                  <div className="p-4 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-lg text-primary">{item.name}</h4>
                        <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{item.category}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Badge variant={isServed ? 'success' : 'warning'} className="text-[10px] h-5">{isServed ? 'SERVED' : 'PENDING'}</Badge>
                        <Button variant="ghost" size="xs" onClick={() => handleEdit(item)} className="h-7 w-7 p-0"><Edit className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="xs" onClick={() => deleteItem(item.id)} className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 bg-muted/10 p-3 rounded-lg border">
                      <div className="space-y-0.5"><label className="text-[9px] font-black uppercase text-muted-foreground tracking-tighter">Quantity</label><p className="text-sm font-bold">{item.min_order}</p></div>
                      <div className="space-y-0.5"><label className="text-[9px] font-black uppercase text-muted-foreground tracking-tighter">Unit Price</label><p className="text-sm font-bold">{formatCurrency(item.price_per_plate)}</p></div>
                      <div className="space-y-0.5"><label className="text-[9px] font-black uppercase text-muted-foreground tracking-tighter">Budget</label><p className="text-sm font-bold text-primary">{formatCurrency(parsed.budget)}</p></div>
                      <div className="space-y-0.5"><label className="text-[9px] font-black uppercase text-muted-foreground tracking-tighter">Paid</label><p className="text-sm font-bold text-success">{formatCurrency(parsed.paid)}</p></div>
                    </div>
                    {parsed.notes && <div className="px-1"><label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest block mb-1">Notes</label><p className="text-xs text-muted-foreground line-clamp-2 italic">"{parsed.notes}"</p></div>}
                  </div>
                </Card>
              );
            })}
            {serviceItems.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/10 rounded-xl border-2 border-dashed">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-20" /><p className="text-lg font-medium">No service items recorded yet.</p>
                <Button variant="link" onClick={() => setIsAdding(true)}>Add your first service item</Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CateringManager;