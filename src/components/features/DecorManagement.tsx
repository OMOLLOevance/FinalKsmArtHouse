'use client';

import React, { useState } from 'react';
import { ArrowLeft, Plus, Package, TrendingUp, TrendingDown, AlertTriangle, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatCurrency } from '@/utils/formatters';
import { useCustomersQuery } from '@/hooks/use-customer-api';
import { useAddItemToCustomerMutation } from '@/hooks/useCustomerRequirements';
import { 
  useDecorInventoryQuery, 
  useDecorCategoriesQuery, 
  useDecorActionMutation, 
  useUpdateDecorInventoryMutation,
  useAddDecorItemMutation,
  DecorInventoryItem 
} from '@/hooks/useDecorInventory';

interface DecorManagementProps {
  onBack: () => void;
}

const DecorManagement: React.FC<DecorManagementProps> = ({ onBack }) => {
  const { data: items = [], isLoading } = useDecorInventoryQuery();
  const { data: categories = [] } = useDecorCategoriesQuery();
  const { data: customers = [] } = useCustomersQuery();
  const actionMutation = useDecorActionMutation();
  const addItemMutation = useAddDecorItemMutation();
  const updateMutation = useUpdateDecorInventoryMutation();
  const addToCustomerMutation = useAddItemToCustomerMutation();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DecorInventoryItem | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCell, setEditingCell] = useState<{id: string, field: string} | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [newItem, setNewItem] = useState({
    category: '',
    item_name: '',
    in_store: 0,
    price: 0
  });

  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.item_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCellEdit = (id: string, field: string, currentValue: any) => {
    setEditingCell({ id, field });
    setEditValue(currentValue?.toString() || '');
  };

  const handleCellSave = async () => {
    if (!editingCell) return;

    try {
      setSaving(true);
      const { id, field } = editingCell;
      
      let value: any = editValue;
      if (['in_store', 'hired', 'damaged', 'price'].includes(field)) {
        value = isNaN(parseFloat(editValue)) ? 0 : parseFloat(editValue);
      }

      await updateMutation.mutateAsync({ 
        id, 
        updates: { [field]: value } 
      });

      setEditingCell(null);
      setEditValue('');
    } catch (error) {
      console.error('Error updating item:', error);
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

  const renderEditableCell = (item: DecorInventoryItem, field: string, className = '') => {
    const value = item[field as keyof DecorInventoryItem];
    const isEditing = editingCell?.id === item.id && editingCell?.field === field;
    
    if (isEditing) {
      return (
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyPress}
          onBlur={handleCellSave}
          className={`h-7 text-xs ${className}`}
          autoFocus
          disabled={saving}
        />
      );
    }
    
    return (
      <div 
        className={`cursor-pointer hover:bg-muted/50 p-1 min-h-[24px] flex items-center text-xs ${className}`}
        onClick={() => handleCellEdit(item.id, field, value)}
      >
        {value || <span className="text-gray-400 italic">0</span>}
      </div>
    );
  };

  const handleItemClick = (item: DecorInventoryItem) => {
    setSelectedItem(item);
    setShowCustomerDialog(true);
  };

  const handleAddToCustomer = () => {
    if (!selectedItem || !selectedCustomerId) return;
    
    addToCustomerMutation.mutate({
      customerId: selectedCustomerId,
      decorItemId: selectedItem.id,
      quantity: 1
    }, {
      onSuccess: () => {
        setShowCustomerDialog(false);
        setSelectedItem(null);
        setSelectedCustomerId('');
      }
    });
  };

  const handleAction = (id: string, action: 'hire' | 'return' | 'damage' | 'repair') => {
    handleActionSilent(id, action);
  };

  const handleActionSilent = async (id: string, action: 'hire' | 'return' | 'damage' | 'repair') => {
    try {
      await actionMutation.mutateAsync({ id, action });
    } catch (error) {
      console.error('Action failed:', error);
    }
  };

  const handleAddItem = () => {
    if (!newItem.category || !newItem.item_name) return;
    
    addItemMutation.mutate(newItem, {
      onSuccess: () => {
        setShowAddDialog(false);
        setNewItem({ category: '', item_name: '', in_store: 0, price: 0 });
      }
    });
  };

  // Calculate overview metrics
  const totalInStore = items.reduce((sum, item) => sum + item.in_store, 0);
  const totalHired = items.reduce((sum, item) => sum + item.hired, 0);
  const totalDamaged = items.reduce((sum, item) => sum + item.damaged, 0);
  const totalItems = totalInStore + totalHired + totalDamaged;

  if (isLoading) return <LoadingSpinner text="Loading Decor Inventory..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">Decor Management</h2>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setShowAddDialog(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" /> Add Item
          </Button>
        </div>
      </div>

      {/* Overview Cards - Refactored to match MonthlyAllocationTable style */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-muted/20">
          <CardContent className="p-3">
            <div className="text-center">
              <div className="text-xl font-bold">{totalItems}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Total Items</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-muted/20">
          <CardContent className="p-3">
            <div className="text-center">
              <div className="text-xl font-bold text-primary">{totalInStore}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">In Store</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-muted/20">
          <CardContent className="p-3">
            <div className="text-center">
              <div className="text-xl font-bold text-secondary">{totalHired}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Currently Hired</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-muted/20">
          <CardContent className="p-3">
            <div className="text-center">
              <div className="text-xl font-bold text-destructive">{totalDamaged}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Damaged</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex space-x-4 w-full md:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Category: {selectedCategory === 'all' ? 'All' : selectedCategory.replace('_', ' ')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSelectedCategory('all')}>
                All Categories
              </DropdownMenuItem>
              {categories.map(category => (
                <DropdownMenuItem key={category} onClick={() => setSelectedCategory(category)}>
                  {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Input
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm h-9"
          />
        </div>
        <p className="text-xs text-muted-foreground italic">
          Showing {filteredItems.length} items
        </p>
      </div>

      {/* Inventory Form List */}
      <div className="space-y-4">
        {filteredItems.map((item) => (
          <Card key={item.id} className="overflow-hidden border-l-4 border-l-primary/40 hover:shadow-md transition-shadow">
            <div className="p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-2">
                <div>
                  <h3 className="text-lg font-bold text-primary flex items-center">
                    <Package className="h-4 w-4 mr-2 opacity-70" />
                    {item.item_name}
                  </h3>
                  <span className="text-[10px] font-bold bg-muted px-2 py-0.5 rounded uppercase text-muted-foreground tracking-wider">
                    {item.category.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => handleAction(item.id, 'hire')}
                    disabled={item.in_store === 0 || actionMutation.isPending}
                    className="h-7 px-3 border-primary/20 hover:bg-primary hover:text-white"
                  >
                    Hire
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => handleAction(item.id, 'return')}
                    disabled={item.hired === 0 || actionMutation.isPending}
                    className="h-7 px-3 border-secondary/20 hover:bg-secondary hover:text-white"
                  >
                    Return
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => handleAction(item.id, 'damage')}
                    disabled={item.in_store === 0 || actionMutation.isPending}
                    className="h-7 px-3 border-destructive/20 hover:bg-destructive hover:text-white"
                  >
                    Damage
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => handleAction(item.id, 'repair')}
                    disabled={item.damaged === 0 || actionMutation.isPending}
                    className="h-7 px-3 border-green-200 hover:bg-green-600 hover:text-white"
                  >
                    Repair
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => handleItemClick(item)}
                    className="h-7 w-7 p-0"
                    title="Assign to Customer"
                  >
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-muted/10 p-3 rounded-lg border">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">In Store</label>
                  <div className="bg-white rounded border">
                    {renderEditableCell(item, 'in_store', 'text-center font-bold text-lg')}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Hired</label>
                  <div className="bg-white rounded border">
                    {renderEditableCell(item, 'hired', 'text-center font-bold text-lg text-secondary')}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Damaged</label>
                  <div className="bg-white rounded border">
                    {renderEditableCell(item, 'damaged', 'text-center font-bold text-lg text-destructive')}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Price</label>
                  <div className="bg-white rounded border">
                    {renderEditableCell(item, 'price', 'text-right font-black text-lg text-green-600')}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}

        {filteredItems.length === 0 && (
          <Card className="p-12 text-center text-muted-foreground bg-muted/10">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">No items found matching your criteria.</p>
            <Button variant="link" onClick={() => {setSearchTerm(''); setSelectedCategory('all');}}>
              Clear all filters
            </Button>
          </Card>
        )}
      </div>

      {/* Customer Selection Dialog */}
      <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Item to Customer Requirements</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Selected Item: <span className="font-medium">{selectedItem?.item_name}</span>
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Select Customer:</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    {selectedCustomerId ? 
                      customers.find(c => c.id === selectedCustomerId)?.name || 'Select Customer' : 
                      'Select Customer'
                    }
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full">
                  {customers.map(customer => (
                    <DropdownMenuItem 
                      key={customer.id} 
                      onClick={() => setSelectedCustomerId(customer.id)}
                    >
                      <div>
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {customer.eventType} - {customer.eventDate}
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                  {customers.length === 0 && (
                    <DropdownMenuItem disabled>
                      No customers available
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustomerDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddToCustomer}
              disabled={!selectedCustomerId || addToCustomerMutation.isPending}
            >
              {addToCustomerMutation.isPending ? 'Adding...' : 'Add to Requirements'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Decor Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Category:</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    {newItem.category || 'Select Category'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full">
                  {categories.map(category => (
                    <DropdownMenuItem 
                      key={category} 
                      onClick={() => setNewItem({ ...newItem, category, item_name: '' })}
                    >
                      {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div>
              <label className="text-sm font-medium">Item Name:</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-start" disabled={!newItem.category}>
                    {newItem.item_name || (newItem.category ? 'Select Item' : 'Select Category First')}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full">
                  {items
                    .filter(item => item.category === newItem.category)
                    .map(item => (
                      <DropdownMenuItem 
                        key={item.id} 
                        onClick={() => setNewItem({ ...newItem, item_name: item.item_name, price: item.price })}
                      >
                        {item.item_name}
                      </DropdownMenuItem>
                    ))}
                  {newItem.category && items.filter(item => item.category === newItem.category).length === 0 && (
                    <DropdownMenuItem disabled>
                      No items in this category
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Input
              placeholder="Initial quantity"
              type="number"
              value={newItem.in_store}
              onChange={(e) => setNewItem({ ...newItem, in_store: parseInt(e.target.value) || 0 })}
            />
            <Input
              placeholder="Price (KSH)"
              type="number"
              value={newItem.price}
              onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddItem}
              disabled={!newItem.category || !newItem.item_name || addItemMutation.isPending}
            >
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DecorManagement;