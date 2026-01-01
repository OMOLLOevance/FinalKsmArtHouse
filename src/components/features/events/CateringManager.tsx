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

const CateringManager: React.FC<CateringManagerProps> = ({ onBack }) => {
  const { items, loading, addItem, updateItem, deleteItem, refetch: fetchItems } = useCateringItems();
  const [editingItem, setEditingItem] = useState<any | null>(null);
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

  const [inventoryData, setInventoryData] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedCategory, setHighlightedCategory] = useState('');

  const parseDescription = (desc: string = '') => {
    const data: any = { budget: 0, paid: 0, method: 'cash', status: 'deposit', location: '-', notes: '' };
    try {
      const budgetMatch = desc.match(/Budget: (\d+)/);
      const paidMatch = desc.match(/Paid: (\d+)/);
      const methodMatch = desc.match(/Payment: (cash|mpesa|bank)/);
      const locMatch = desc.match(/Location: (.*?),/);
      
      if (budgetMatch) data.budget = Number(budgetMatch[1]);
      if (paidMatch) data.paid = Number(paidMatch[1]);
      if (methodMatch) data.method = methodMatch[1];
      if (locMatch) data.location = locMatch[1];
      data.notes = desc.split(', ').pop() || '';
    } catch (e) {}
    return data;
  };

  const handleInventoryChange = (key: string, field: string, value: string) => {
    setInventoryData(prev => ({
      ...prev,
      [key]: { ...(prev as any)[key], [field]: value }
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

  const renderInventoryTable = () => {
    return structure.map((category, catIndex) => {
      const isHighlighted = highlightedCategory === category.name;
      return (
        <React.Fragment key={category.name}>
          <tr className={isHighlighted ? 'bg-primary/10' : ''}>
            <td className={`px-4 py-2 border font-bold text-lg ${isHighlighted ? 'bg-primary/10' : 'bg-muted'} flex justify-between items-center`}>
              {category.name}
              {isManagingStructure && (
                <Button size="sm" variant="ghost" onClick={() => handleAddRow(catIndex)}>+ Add Row</Button>
              )}
            </td>
            <td className="px-4 py-2 border bg-muted/50"></td>
            <td className="px-4 py-2 border bg-muted/50"></td>
          </tr>
          {category.rows.map((rowKey) => (
            <tr key={rowKey}>
              <td className="px-4 py-2 border">
                <input
                  type="text"
                  value={(inventoryData as any)[rowKey]?.particular || ''}
                  onChange={(e) => handleInventoryChange(rowKey, 'particular', e.target.value)}
                  className="w-full bg-transparent border-0 focus:ring-0 text-sm"
                  placeholder="Enter item name"
                />
              </td>
              <td className="px-4 py-2 border">
                <input
                  type="text"
                  value={(inventoryData as any)[rowKey]?.good || ''}
                  onChange={(e) => handleInventoryChange(rowKey, 'good', e.target.value)}
                  className="w-full bg-transparent border-0 focus:ring-0 text-sm text-center"
                  placeholder="0"
                />
              </td>
              <td className="px-4 py-2 border">
                <input
                  type="text"
                  value={(inventoryData as any)[rowKey]?.repair || ''}
                  onChange={(e) => handleInventoryChange(rowKey, 'repair', e.target.value)}
                  className="w-full bg-transparent border-0 focus:ring-0 text-sm text-center"
                  placeholder="0"
                />
              </td>
            </tr>
          ))}
        </React.Fragment>
      );
    });
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>
          <h2 className="text-3xl font-bold tracking-tight">Catering</h2>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsAdding(true)}><Plus className="h-4 w-4 mr-2" /> Add Item</Button>
          <Button variant="outline" onClick={() => fetchItems()}><Database className="h-4 w-4 mr-2" /> Sync</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-primary/5">
          <p className="text-xs font-bold text-muted-foreground uppercase">Inventory Value</p>
          <p className="text-xl font-black">{formatCurrency(totals.value)}</p>
        </Card>
        <Card className="p-4 bg-secondary/5">
          <p className="text-xs font-bold text-muted-foreground uppercase">Total Budget</p>
          <p className="text-xl font-black">{formatCurrency(totals.budget)}</p>
        </Card>
        <Card className="p-4 bg-success/5">
          <p className="text-xs font-bold text-muted-foreground uppercase">Amount Paid</p>
          <p className="text-xl font-black">{formatCurrency(totals.paid)}</p>
        </Card>
        <Card className="p-4 bg-accent/5">
          <p className="text-xs font-bold text-muted-foreground uppercase">Service Progress</p>
          <p className="text-xl font-black">{totals.served} / {items.length}</p>
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

      {/* Catering Inventory Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Catering Stock Inventory</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsManagingStructure(!isManagingStructure)}>
              {isManagingStructure ? 'Done' : 'Edit Structure'}
            </Button>
            <Button onClick={handleSaveInventoryToDatabase}>Save to DB</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto border rounded-xl">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="px-4 py-2 text-left font-bold text-xs uppercase border-r w-1/2">Particulars</th>
                  <th className="px-4 py-2 text-center font-bold text-xs uppercase border-r">Good</th>
                  <th className="px-4 py-2 text-center font-bold text-xs uppercase">Repair</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {renderInventoryTable()}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Service Items List</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead>
                <tr className="bg-muted text-[10px] font-black uppercase">
                  <th className="px-3 py-3 text-left">Item</th>
                  <th className="px-3 py-3 text-left">Qty</th>
                  <th className="px-3 py-3 text-left">Price</th>
                  <th className="px-3 py-3 text-left">Budget</th>
                  <th className="px-3 py-3 text-left">Paid</th>
                  <th className="px-3 py-3 text-left">Status</th>
                  <th className="px-3 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y text-xs">
                {items.map((item: any) => {
                  const parsed = parseDescription(item.description);
                  return (
                    <tr key={item.id} className="hover:bg-muted/50">
                      <td className="px-3 py-3 font-medium">{item.name}</td>
                      <td className="px-3 py-3">{item.min_order}</td>
                      <td className="px-3 py-3">{formatCurrency(item.price_per_plate)}</td>
                      <td className="px-3 py-3">{formatCurrency(parsed.budget)}</td>
                      <td className="px-3 py-3 text-success font-bold">{formatCurrency(parsed.paid)}</td>
                      <td className="px-3 py-3">
                        <Badge variant={item.description?.includes('Status: served') ? 'success' : 'outline'}>
                          {item.description?.includes('Status: served') ? 'SERVED' : 'PENDING'}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}><Edit className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteItem(item.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CateringManager;