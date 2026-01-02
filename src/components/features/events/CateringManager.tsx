'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Edit, Trash2, ArrowLeft, Save, DollarSign, CheckCircle, Clock, Database, X, Settings } from 'lucide-react';
import { useCateringItems } from '@/hooks/useCateringItems';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { logger } from '@/lib/logger';
import { formatCurrency } from '@/utils/formatters';

interface CateringManagerProps {
  onBack: () => void;
}

const DEFAULT_STRUCTURE = [
  { name: 'CUPS', key: 'cups', rows: Array.from({length: 3}, (_, i) => `cups_${i+1}`) },
  { name: 'PLATES', key: 'plates', rows: Array.from({length: 9}, (_, i) => `plates_${i+1}`) },
  { name: 'CUTLERIES', key: 'cutleries', rows: Array.from({length: 12}, (_, i) => `cutleries_${i+1}`) },
  { name: 'GLASSES', key: 'glasses', rows: Array.from({length: 6}, (_, i) => `glasses_${i+1}`) },
  { name: 'JUGS', key: 'jugs', rows: Array.from({length: 4}, (_, i) => `jugs_${i+1}`) },
  { name: 'BOWLS', key: 'bowls', rows: Array.from({length: 11}, (_, i) => `bowls_${i+1}`) },
  { name: 'DISPLAY STANDS', key: 'display_stands', rows: Array.from({length: 5}, (_, i) => `display_stands_${i+1}`) },
  { name: 'JUICE', key: 'juice', rows: Array.from({length: 3}, (_, i) => `juice_${i+1}`) },
  { name: 'GENERAL UTENSILS', key: 'general_utensils', rows: Array.from({length: 16}, (_, i) => `general_utensils_${i+1}`) },
  { name: 'CHAFFING DISHES', key: 'chaffing_dishes', rows: Array.from({length: 11}, (_, i) => `chaffing_dishes_${i+1}`) },
  { name: 'WASH UP', key: 'wash_up', rows: Array.from({length: 4}, (_, i) => `wash_up_${i+1}`) },
  { name: 'COOKING STUFFS', key: 'cooking_stuffs', rows: Array.from({length: 15}, (_, i) => `cooking_stuffs_${i+1}`) },
  { name: 'UNIFORMS', key: 'uniforms', rows: Array.from({length: 9}, (_, i) => `uniforms_${i+1}`) },
];

interface CateringItem {
  id: string;
  name: string;
  category: string;
  min_order: number;
  price_per_plate: number;
  description: string;
  available: boolean;
}

interface InventoryEntry {
  particular: string;
  good: string;
  repair: string;
}

interface InventoryData {
  [key: string]: InventoryEntry;
}

const CateringManager: React.FC<CateringManagerProps> = ({ onBack }) => {
  const { items, loading, addItem, updateItem, deleteItem, refetch: fetchItems } = useCateringItems();
  const [editingItem, setEditingItem] = useState<CateringItem | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isSavingInventory, setIsSavingInventory] = useState(false);

  const [structure, setStructure] = useState(DEFAULT_STRUCTURE);
  const [isManagingStructure, setIsManagingStructure] = useState(false);

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

  const [inventoryData, setInventoryData] = useState<InventoryData>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedCategory, setHighlightedCategory] = useState('');

  const parseDescription = (desc: string = '') => {
    const data: { 
      budget: number; 
      paid: number; 
      method: 'cash' | 'mpesa' | 'bank'; 
      status: 'deposit' | 'full'; 
      location: string; 
      notes: string; 
    } = { 
      budget: 0, 
      paid: 0, 
      method: 'cash', 
      status: 'deposit', 
      location: '-', 
      notes: '' 
    };
    
    try {
      const budgetMatch = desc.match(/Budget: (\d+)/);
      const paidMatch = desc.match(/Paid: (\d+)/);
      const methodMatch = desc.match(/Payment: (cash|mpesa|bank)/);
      const locMatch = desc.match(/Location: (.*?),/);
      
      if (budgetMatch) data.budget = Number(budgetMatch[1]);
      if (paidMatch) data.paid = Number(paidMatch[1]);
      if (methodMatch) data.method = methodMatch[1] as 'cash' | 'mpesa' | 'bank';
      if (locMatch) data.location = locMatch[1];
      data.notes = desc.split(', ').pop() || '';
    } catch (e) {}
    return data;
  };

  const handleInventoryChange = (key: string, field: keyof InventoryEntry, value: string) => {
    setInventoryData(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value }
    }));
  };

  const handleSearch = () => {
    const searchUpper = searchTerm.toUpperCase();
    const foundCategory = structure.find(cat => cat.name.includes(searchUpper));
    if (foundCategory) {
      setHighlightedCategory(foundCategory.name);
      setTimeout(() => setHighlightedCategory(''), 3000);
    }
  };

  const handleSaveInventoryToDatabase = async () => {
    setIsSavingInventory(true);
    try {
      await apiClient.post('/api/catering', {
        inventory_data: inventoryData,
        updated_at: new Date().toISOString()
      });
      alert('Inventory saved successfully!');
    } catch (error) {
      logger.error('Inventory save failed:', error);
    } finally {
      setIsSavingInventory(false);
    }
  };

  const handleAddRow = (categoryIndex: number) => {
    setStructure(prev => {
      const newStructure = [...prev];
      newStructure[categoryIndex].rows.push(`${newStructure[categoryIndex].key}_${Date.now()}`);
      return newStructure;
    });
  };

  const handleDeleteRow = (categoryIndex: number, rowKey: string) => {
    setStructure(prev => {
      const newStructure = [...prev];
      newStructure[categoryIndex].rows = newStructure[categoryIndex].rows.filter(key => key !== rowKey);
      return newStructure;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const itemData: any = {
        name: formData.item,
        category: formData.category,
        unit: 'pieces',
        price_per_plate: formData.unitPrice,
        min_order: formData.quantity,
        description: `Budget: ${formData.eventBudget}, Paid: ${formData.amountPaid}, Payment: ${formData.paymentMethod}, Status: ${formData.serviceStatus}, Location: ${formData.eventLocation}, ${formData.notes}`,
        available: true
      };

      if (editingItem) {
        await updateItem(editingItem.id, itemData);
      } else {
        await addItem(itemData);
      }

      setIsAdding(false);
      setEditingItem(null);
      setFormData({ item: '', quantity: 0, unitPrice: 0, category: '', notes: '', eventBudget: 0, amountPaid: 0, paymentMethod: 'cash', eventLocation: '', paymentStatus: 'deposit', serviceStatus: 'not-served' });
      await fetchItems();
    } catch (error) {
      logger.error('Failed to save item:', error);
    }
  };

  const handleEdit = (item: any) => {
    const parsed = parseDescription(item.description);
    setEditingItem(item);
    setFormData({
      item: item.name,
      category: item.category,
      quantity: item.min_order,
      unitPrice: item.price_per_plate,
      notes: parsed.notes,
      eventBudget: parsed.budget,
      amountPaid: parsed.paid,
      paymentMethod: parsed.method,
      eventLocation: parsed.location,
      paymentStatus: parsed.status,
      serviceStatus: item.description?.includes('Status: served') ? 'served' : 'not-served',
    });
    setIsAdding(true);
  };

  const totals = useMemo(() => {
    return items.reduce((acc, item: any) => {
      const parsed = parseDescription(item.description);
      acc.value += (item.price_per_plate * item.min_order);
      acc.budget += parsed.budget;
      acc.paid += parsed.paid;
      if (item.description?.includes('Status: served')) acc.served++;
      return acc;
    }, { value: 0, budget: 0, paid: 0, served: 0 });
  }, [items]);

  if (loading) return <LoadingSpinner text="Loading catering..." />;

  const renderInventoryForm = () => {
    return structure.map((category, catIndex) => {
      const isHighlighted = highlightedCategory === category.name;
      return (
        <div key={category.name} className="space-y-4">
          <div className={`flex items-center justify-between border-b pb-2 transition-colors ${isHighlighted ? 'border-primary' : 'border-muted'}`}>
            <h3 className={`text-lg font-black tracking-tight ${isHighlighted ? 'text-primary animate-pulse' : 'text-foreground'}`}>
              {category.name}
            </h3>
            {isManagingStructure && (
              <Button size="xs" variant="outline" onClick={() => handleAddRow(catIndex)}>
                <Plus className="h-3 w-3 mr-1" /> Add Slot
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {category.rows.map((rowKey) => (
              <Card key={rowKey} className="overflow-hidden border-muted hover:border-primary/30 transition-all duration-300 hover:shadow-sm">
                <div className="p-3 space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-1 block">Particulars</label>
                      <Input
                        value={(inventoryData as any)[rowKey]?.particular || ''}
                        onChange={(e) => handleInventoryChange(rowKey, 'particular', e.target.value)}
                        className="h-8 text-xs font-medium bg-background"
                        placeholder="Enter item name"
                      />
                    </div>
                    {isManagingStructure && (
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-6 w-6 text-destructive hover:bg-destructive/10" 
                        onClick={() => handleDeleteRow(catIndex, rowKey)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest block text-center">Good</label>
                      <Input
                        type="text"
                        value={(inventoryData as any)[rowKey]?.good || ''}
                        onChange={(e) => handleInventoryChange(rowKey, 'good', e.target.value)}
                        className="h-8 text-xs text-center font-bold bg-background"
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest block text-center">Repair</label>
                      <Input
                        type="text"
                        value={(inventoryData as any)[rowKey]?.repair || ''}
                        onChange={(e) => handleInventoryChange(rowKey, 'repair', e.target.value)}
                        className="h-8 text-xs text-center font-bold text-destructive bg-background"
                        placeholder="0"
                      />
                    </div>
                  </div>
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
          <h2 className="text-3xl font-bold tracking-tight">Catering Management</h2>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsAdding(true)} size="sm"><Plus className="h-4 w-4 mr-2" /> Add Service Item</Button>
          <Button variant="outline" onClick={() => fetchItems()} size="sm"><Database className="h-4 w-4 mr-2" /> Sync Data</Button>
        </div>
      </div>

      {/* Standardized Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-muted/20">
          <CardContent className="p-3">
            <div className="text-center">
              <div className="text-xl font-bold">{formatCurrency(totals.value)}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Inventory Value</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/20">
          <CardContent className="p-3">
            <div className="text-center">
              <div className="text-xl font-bold">{formatCurrency(totals.budget)}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Budget</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/20">
          <CardContent className="p-3">
            <div className="text-center">
              <div className="text-xl font-bold text-success">{formatCurrency(totals.paid)}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Amount Paid</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/20">
          <CardContent className="p-3">
            <div className="text-center">
              <div className="text-xl font-bold text-primary">{totals.served} / {items.length}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Service Progress</div>
            </div>
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

      {/* Catering Inventory Form Section */}
      <Card className="border-primary/10 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4 mb-6">
          <div>
            <CardTitle className="text-xl font-bold">Catering Stock Inventory</CardTitle>
            <CardDescription className="text-xs">Physical inventory tracking and maintenance records</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsManagingStructure(!isManagingStructure)}>
              {isManagingStructure ? 'Done' : 'Edit Structure'}
            </Button>
            <Button onClick={handleSaveInventoryToDatabase} size="sm">
              <Save className="h-4 w-4 mr-2" /> Save to DB
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-10">
          {renderInventoryForm()}
        </CardContent>
      </Card>

      <Card className="border-primary/10 shadow-sm">
        <CardHeader className="border-b pb-4 mb-6">
          <CardTitle className="text-xl font-bold">Service Items List</CardTitle>
          <CardDescription className="text-xs">Active catering services and billing status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((item: any) => {
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
                        <Badge variant={isServed ? 'success' : 'warning'} className="text-[10px] h-5">
                          {isServed ? 'SERVED' : 'PENDING'}
                        </Badge>
                        <Button variant="ghost" size="xs" onClick={() => handleEdit(item)} className="h-7 w-7 p-0">
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="xs" onClick={() => deleteItem(item.id)} className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 bg-muted/10 p-3 rounded-lg border">
                      <div className="space-y-0.5">
                        <label className="text-[9px] font-black uppercase text-muted-foreground tracking-tighter">Quantity</label>
                        <p className="text-sm font-bold">{item.min_order}</p>
                      </div>
                      <div className="space-y-0.5">
                        <label className="text-[9px] font-black uppercase text-muted-foreground tracking-tighter">Unit Price</label>
                        <p className="text-sm font-bold">{formatCurrency(item.price_per_plate)}</p>
                      </div>
                      <div className="space-y-0.5">
                        <label className="text-[9px] font-black uppercase text-muted-foreground tracking-tighter">Budget</label>
                        <p className="text-sm font-bold text-primary">{formatCurrency(parsed.budget)}</p>
                      </div>
                      <div className="space-y-0.5">
                        <label className="text-[9px] font-black uppercase text-muted-foreground tracking-tighter">Paid</label>
                        <p className="text-sm font-bold text-success">{formatCurrency(parsed.paid)}</p>
                      </div>
                    </div>
                    
                    {parsed.notes && (
                      <div className="px-1">
                        <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest block mb-1">Notes</label>
                        <p className="text-xs text-muted-foreground line-clamp-2 italic">"{parsed.notes}"</p>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
            {items.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/10 rounded-xl border-2 border-dashed">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">No service items recorded yet.</p>
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