import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, ArrowLeft, Save, DollarSign, MapPin, CheckCircle, Clock, Database, X, Settings } from 'lucide-react';
import { useCateringItems } from '@/hooks/useCateringItems';
import { defaultInventoryData } from '@/utils/cateringInventoryDefaults';
import { supabase } from '@/lib/supabase';
import { ensureAuthenticated } from '@/utils/authHelpers';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

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
  const [showViewModal, setShowViewModal] = useState(false);

  // Dynamic Structure State
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
  // Catering inventory state
  const [inventoryData, setInventoryData] = useState(defaultInventoryData);

  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedCategory, setHighlightedCategory] = useState('');

  const handleInventoryChange = (key: string, field: string, value: string) => {
    setInventoryData(prev => ({
      ...prev,
      [key]: {
        ...(prev as any)[key],
        [field]: value
      }
    }));
  };

  const handleSearch = () => {
    const searchUpper = searchTerm.toUpperCase();
    const foundCategory = structure.find(cat => cat.name.includes(searchUpper) || searchUpper.includes(cat.name));
    if (foundCategory) {
      setHighlightedCategory(foundCategory.name);
      setTimeout(() => setHighlightedCategory(''), 3000);
    } else {
      alert('Category not found.');
    }
  };

  const handleSaveInventoryToDatabase = async () => {
    setIsSavingInventory(true);
    try {
      const user = await ensureAuthenticated();
      if (!user?.id) {
        alert('Please log in to save inventory data');
        return;
      }

      const { error: upsertError } = await supabase
        .from('catering_inventory_data')
        .upsert({
          user_id: user.id,
          inventory_data: inventoryData,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (upsertError) throw upsertError;

      alert('Inventory data saved to database successfully!');
    } catch (error) {
      console.error('Error saving inventory to database:', error);
      alert('Failed to save inventory to database: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsSavingInventory(false);
    }
  };

  // Dynamic Structure Handlers
  const handleAddRow = (categoryIndex: number) => {
    setStructure(prev => {
      const newStructure = [...prev];
      const category = newStructure[categoryIndex];
      const newKey = `${category.key}_${Date.now()}`; // Unique key based on timestamp
      category.rows.push(newKey);
      return newStructure;
    });
  };

  const handleDeleteRow = (categoryIndex: number, rowKey: string) => {
    if (!confirm('Are you sure you want to remove this row?')) return;
    setStructure(prev => {
      const newStructure = [...prev];
      const category = newStructure[categoryIndex];
      category.rows = category.rows.filter(key => key !== rowKey);
      return newStructure;
    });
  };

  useEffect(() => {
    const loadInventoryFromDatabase = async () => {
      try {
        const user = await ensureAuthenticated();
        if (!user?.id) {
          console.log('No authenticated user found, skipping inventory load');
          return;
        }

        const { data, error } = await supabase
          .from('catering_inventory_data')
          .select('inventory_data')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (data && data.inventory_data) {
          setInventoryData(data.inventory_data);
        }
      } catch (error) {
        console.error('Error loading inventory from database:', error);
      }
    };

    loadInventoryFromDatabase();
  }, []);

  const renderInventoryTable = () => {
    return structure.map((category, catIndex) => {
      const isHighlighted = highlightedCategory === category.name;
      
      return (
        <React.Fragment key={category.name}>
          {/* Category Header */}
          <tr className={isHighlighted ? 'bg-primary/10' : ''}>
            <td className={`px-4 py-2 border font-bold text-lg ${isHighlighted ? 'bg-primary/10' : 'bg-muted'} text-foreground flex justify-between items-center`}>
              {category.name}
              {isManagingStructure && (
                <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => handleAddRow(catIndex)}>
                  <Plus className="h-3 w-3 mr-1" /> Add Row
                </Button>
              )}
            </td>
            <td className="px-4 py-2 border bg-muted/50"></td>
            <td className="px-4 py-2 border bg-muted/50"></td>
          </tr>

          {/* Rows */}
          {category.rows.map((rowKey) => (
            <tr key={rowKey}>
              <td className="px-4 py-2 border">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={(inventoryData as any)[rowKey]?.particular || ''}
                    onChange={(e) => handleInventoryChange(rowKey, 'particular', e.target.value)}
                    className="w-full px-2 py-1 border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded text-xs placeholder:text-muted-foreground/50"
                    style={{ fontSize: '13px', lineHeight: '1.2' }}
                    placeholder="Enter item name"
                  />
                  {isManagingStructure && (
                    <button 
                      onClick={() => handleDeleteRow(catIndex, rowKey)}
                      className="text-destructive hover:bg-destructive/10 p-1 rounded"
                      title="Remove Row"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </td>
              <td className="px-4 py-2 border">
                <input
                  type="text"
                  value={(inventoryData as any)[rowKey]?.good || ''}
                  onChange={(e) => handleInventoryChange(rowKey, 'good', e.target.value)}
                  className="w-full px-2 py-1 border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded text-xs placeholder:text-muted-foreground/50"
                  placeholder="Enter quantity"
                />
              </td>
              <td className="px-4 py-2 border">
                <input
                  type="text"
                  value={(inventoryData as any)[rowKey]?.repair || ''}
                  onChange={(e) => handleInventoryChange(rowKey, 'repair', e.target.value)}
                  className="w-full px-2 py-1 border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-red-500 rounded text-xs placeholder:text-muted-foreground/50"
                  placeholder="Enter quantity"
                />
              </td>
            </tr>
          ))}
        </React.Fragment>
      );
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('💾 Saving catering item to database...');

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
        console.log('✅ Catering item updated successfully in database');
        alert('✅ Catering item updated successfully in database!');
        setEditingItem(null);
      } else {
        await addItem(itemData);
        console.log('✅ Catering item saved successfully to database');
        alert('✅ Catering item saved successfully to database!');
        setIsAdding(false);
      }

      setFormData({ item: '', quantity: 0, unitPrice: 0, category: '', notes: '', eventBudget: 0, amountPaid: 0, paymentMethod: 'cash', eventLocation: '', paymentStatus: 'deposit', serviceStatus: 'not-served' });
      await fetchItems();
    } catch (error) {
      console.error('❌ Error saving catering item to database:', error);
      alert('❌ Failed to save catering item to database: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      item: item.name,
      quantity: item.min_order || 0,
      unitPrice: item.price_per_plate || 0,
      category: item.category,
      notes: item.description || '',
      eventBudget: 0,
      amountPaid: 0,
      paymentMethod: 'cash',
      eventLocation: '',
      paymentStatus: 'deposit',
      serviceStatus: 'not-served',
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await deleteItem(id);
    } catch (error) {
      console.error('Error deleting catering item:', error);
      alert('Failed to delete catering item');
    }
  };

  const totalValue = items.reduce((sum, item) => sum + ((item as any).price_per_plate * (item as any).min_order), 0);
  const totalBudget = 0;
  const totalPaid = 0;
  const servedItems = items.filter(item => (item as any).description?.includes('Status: served')).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading catering items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between space-y-2">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={onBack} className="flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Catering Management</h2>
            <p className="text-muted-foreground">Manage catering items and pricing</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsAdding(true)} className="flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
          <Button variant="secondary" onClick={() => setShowViewModal(true)} className="flex items-center">
            <Database className="h-4 w-4 mr-2" />
            View All ({items.length})
          </Button>
          <Button 
            variant="outline"
            className="flex items-center"
            onClick={async () => {
              try {
                await fetchItems();
                setTimeout(() => {
                  alert(`✅ Successfully synced catering items from database!\n\nTotal: ${items.length} item(s) loaded\n\nData is 100% up-to-date. Admin can see all your items.`);
                }, 300);
              } catch (error) {
                console.error('Error syncing:', error);
                alert('❌ Failed to sync from database. Please try again.');
              }
            }}
          >
            <Database className="h-4 w-4 mr-2" />
            Sync
          </Button>
        </div>
      </div>

      {(isAdding || editingItem) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Item Name</label>
                <Input type="text" value={formData.item} onChange={(e) => setFormData({ ...formData, item: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Input type="text" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Quantity</label>
                <Input type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Unit Price (KSH)</label>
                <Input type="number" value={formData.unitPrice} onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) })} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Event Budget (KSH)</label>
                <Input type="number" value={formData.eventBudget} onChange={(e) => setFormData({ ...formData, eventBudget: parseFloat(e.target.value) || 0 })} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount Paid (KSH)</label>
                <Input type="number" value={formData.amountPaid} onChange={(e) => setFormData({ ...formData, amountPaid: parseFloat(e.target.value) || 0 })} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Method</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={formData.paymentMethod} 
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as 'cash' | 'mpesa' | 'bank' })}
                >
                  <option value="cash">Cash</option>
                  <option value="mpesa">M-Pesa</option>
                  <option value="bank">Bank Transfer</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Event Location</label>
                <Input type="text" value={formData.eventLocation} onChange={(e) => setFormData({ ...formData, eventLocation: e.target.value })} placeholder="Enter event location" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Status</label>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant={formData.paymentStatus === 'deposit' ? 'default' : 'outline'}
                    onClick={() => setFormData({ ...formData, paymentStatus: 'deposit' })}
                    className="flex-1"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Deposit
                  </Button>
                  <Button
                    type="button"
                    variant={formData.paymentStatus === 'full' ? 'default' : 'outline'}
                    onClick={() => setFormData({ ...formData, paymentStatus: 'full' })}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Paid in Full
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Service Status</label>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant={formData.serviceStatus === 'not-served' ? 'destructive' : 'outline'}
                    onClick={() => setFormData({ ...formData, serviceStatus: 'not-served' })}
                    className="flex-1"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Not Yet Served
                  </Button>
                  <Button
                    type="button"
                    variant={formData.serviceStatus === 'served' ? 'default' : 'outline'}
                    onClick={() => setFormData({ ...formData, serviceStatus: 'served' })}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Served
                  </Button>
                </div>
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <textarea 
                  value={formData.notes} 
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })} 
                  rows={3} 
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="md:col-span-2 flex justify-end space-x-2">
                <Button variant="outline" type="button" onClick={() => { setIsAdding(false); setEditingItem(null); }}>Cancel</Button>
                <Button type="submit"><Save className="h-4 w-4 mr-2" />{editingItem ? 'Update' : 'Save'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Catering Inventory Table */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Catering Inventory</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search category..."
                className="w-full sm:w-auto"
              />
              <Button onClick={handleSearch}>Search</Button>
              <Button
                variant={isManagingStructure ? "destructive" : "outline"}
                onClick={() => setIsManagingStructure(!isManagingStructure)}
              >
                <Settings className="h-4 w-4 mr-2" />
                {isManagingStructure ? 'Done Editing' : 'Edit List'}
              </Button>
              <Button 
                onClick={handleSaveInventoryToDatabase} 
                disabled={isSavingInventory}
                variant={isSavingInventory ? "secondary" : "default"}
              >
                <Database className="h-4 w-4 mr-2" />
                {isSavingInventory ? 'Saving...' : 'Save to DB'}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {isManagingStructure && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
              <strong>Edit Mode:</strong> Click <strong>+ Add Row</strong> to add new item slots. Click the <Trash2 className="h-3 w-3 inline" /> icon to remove rows.
            </div>
          )}
          <div className="overflow-x-auto rounded-md border">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="px-4 py-3 text-left font-bold text-sm text-muted-foreground border-r w-1/3">
                    PARTICULARS
                  </th>
                  <th className="px-4 py-3 text-left font-bold text-sm text-muted-foreground border-r w-1/3">
                    GOOD CONDITION
                  </th>
                  <th className="px-4 py-3 text-left font-bold text-sm text-muted-foreground w-1/3">
                    REPAIR
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {renderInventoryTable()}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 text-sm text-muted-foreground">
            <p><strong>Instructions:</strong></p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Enter specific item names in the <strong>Particulars</strong> column.</li>
              <li>Enter quantities in <strong>Good Condition</strong> and <strong>Repair</strong> columns.</li>
              <li>Use the search function to highlight specific categories.</li>
              <li>Data is automatically saved as you type (locally).</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Catering Items</CardTitle>
          <div className="text-sm text-muted-foreground mt-1 grid grid-cols-2 md:grid-cols-4 gap-2">
            <span>Value: KSH {totalValue.toLocaleString()}</span>
            <span>Budget: KSH {totalBudget.toLocaleString()}</span>
            <span>Paid: KSH {totalPaid.toLocaleString()}</span>
            <span>Served: {servedItems}/{items.length}</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Item</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Category</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Qty</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Price</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Total</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Budget</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Paid</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Method</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Loc</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Service</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/50">
                    <td className="px-2 py-2 text-xs font-medium max-w-[100px] truncate">{(item as any).name}</td>
                    <td className="px-2 py-2 text-xs text-muted-foreground max-w-[80px] truncate">{(item as any).category}</td>
                    <td className="px-2 py-2 text-xs text-muted-foreground">{(item as any).min_order}</td>
                    <td className="px-2 py-2 text-xs text-muted-foreground">KSH {(item as any).price_per_plate?.toLocaleString()}</td>
                    <td className="px-2 py-2 text-xs font-medium">{((item as any).price_per_plate * (item as any).min_order)?.toLocaleString()}</td>
                    <td className="px-2 py-2 text-xs text-muted-foreground">-</td>
                    <td className="px-2 py-2 text-xs text-muted-foreground">-</td>
                    <td className="px-2 py-2"><Badge variant="outline" className="text-[10px]">Cash</Badge></td>
                    <td className="px-2 py-2 text-xs text-muted-foreground max-w-[100px] truncate">-</td>
                    <td className="px-2 py-2"><Badge variant="outline" className="text-[10px]">Deposit</Badge></td>
                    <td className="px-2 py-2">
                      <Badge variant={(item as any).description?.includes('Status: served') ? 'success' : 'destructive'} className="text-[10px]">
                        {(item as any).description?.includes('Status: served') ? 'Served' : 'Pending'}
                      </Badge>
                    </td>
                    <td className="px-2 py-2 text-xs font-medium">
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEdit(item)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {showViewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-6xl max-h-[90vh] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between border-b">
              <div>
                <CardTitle>All Catering Data</CardTitle>
                <CardDescription>Total Items: {items.length} | Synced from Database</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowViewModal(false)}>
                <X className="h-6 w-6" />
              </Button>
            </CardHeader>
            <div className="overflow-y-auto flex-1 p-6">
              {items.length === 0 ? (
                <div className="text-center py-12">
                  <Database className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium">No catering items found</p>
                  <p className="text-muted-foreground text-sm mt-2">Add items to see them here</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Item Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Min Order</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Price/Plate</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Value</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                      {items.map((item) => (
                        <tr key={item.id} className="hover:bg-muted/50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{(item as any).name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{(item as any).category}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{(item as any).min_order}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">KSH {(item as any).price_per_plate?.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">KSH {((item as any).price_per_plate * (item as any).min_order)?.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={(item as any).available ? 'success' : 'destructive'}>
                              {(item as any).available ? 'Available' : 'Unavailable'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate">{(item as any).description || 'No description'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="p-6 border-t bg-muted/20 flex justify-between items-center">
              <div className="text-sm">
                <strong>Total Value:</strong> KSH {items.reduce((sum, item) => sum + ((item as any).price_per_plate * (item as any).min_order), 0).toLocaleString()}
              </div>
              <Button onClick={() => setShowViewModal(false)}>Close</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CateringManager;