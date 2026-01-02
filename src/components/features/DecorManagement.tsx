'use client';

import React, { useState } from 'react';
import { ArrowLeft, Plus, Package, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatCurrency } from '@/utils/formatters';
import { 
  useDecorInventoryQuery, 
  useDecorCategoriesQuery, 
  useDecorActionMutation, 
  useAddDecorItemMutation,
  DecorInventoryItem 
} from '@/hooks/useDecorInventory';

interface DecorManagementProps {
  onBack: () => void;
}

const DecorManagement: React.FC<DecorManagementProps> = ({ onBack }) => {
  const { data: items = [], isLoading } = useDecorInventoryQuery();
  const { data: categories = [] } = useDecorCategoriesQuery();
  const actionMutation = useDecorActionMutation();
  const addItemMutation = useAddDecorItemMutation();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
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

  const handleAction = (id: string, action: 'hire' | 'return' | 'damage' | 'repair') => {
    actionMutation.mutate({ id, action });
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
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Item
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Store</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalInStore}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Currently Hired</CardTitle>
            <TrendingDown className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{totalHired}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Damaged</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{totalDamaged}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
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
          className="max-w-sm"
        />
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Items Inventory</CardTitle>
          <CardDescription>Manage your decor items and availability</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead>
                <tr className="bg-muted">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Item Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">In Store</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Hired</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Damaged</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 text-sm font-medium cursor-pointer hover:text-primary">
                      {item.item_name}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                        {item.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">{item.in_store}</td>
                    <td className="px-6 py-4 text-sm">{item.hired}</td>
                    <td className="px-6 py-4 text-sm">{item.damaged}</td>
                    <td className="px-6 py-4 text-sm">{formatCurrency(item.price)}</td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction(item.id, 'hire')}
                        disabled={item.in_store === 0 || actionMutation.isPending}
                      >
                        Hire
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction(item.id, 'return')}
                        disabled={item.hired === 0 || actionMutation.isPending}
                      >
                        Return
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction(item.id, 'damage')}
                        disabled={item.in_store === 0 || actionMutation.isPending}
                      >
                        Damage
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction(item.id, 'repair')}
                        disabled={item.damaged === 0 || actionMutation.isPending}
                      >
                        Repair
                      </Button>
                    </td>
                  </tr>
                ))}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                      No items found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Item Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Decor Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Category (e.g., table_clothes)"
              value={newItem.category}
              onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
            />
            <Input
              placeholder="Item name"
              value={newItem.item_name}
              onChange={(e) => setNewItem({ ...newItem, item_name: e.target.value })}
            />
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