'use client';

import React, { useState, useMemo } from 'react';
import { ArrowLeft, Plus, Package, TrendingUp, TrendingDown, AlertTriangle, Users, ChevronDown, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatCurrency } from '@/utils/formatters';
import { useCustomersQuery } from '@/hooks/use-customer-api';
import { useAddItemToCustomerMutation } from '@/hooks/useCustomerRequirements';
import { StaffSelector } from '@/components/shared/StaffSelector';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { Customer } from '@/types';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import { toast } from 'sonner';
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

const DEFAULT_DECOR_CATEGORIES = [
  'TABLE CLOTHES', 'SATIN TABLE CLOTHES', 'RUNNERS', 'ELASTIC TIEBACKS',
  'SHEER CURTAINS', 'SPANDEX', 'DROPS', 'TRADITIONAL ITEMS',
  'CHARGER PLATES', 'TABLE MIRRORS', 'HOLDERS', 'ARTIFICIAL FLOWERS',
  'HANGING FLOWERS', 'CENTREPIECES'
];

const DecorManagement: React.FC<DecorManagementProps> = ({ onBack }) => {
  const { isOperationsManager, isDirectorOrInvestor, canDeleteTransaction } = useRoleGuard();
  const [filterUserId, setFilterUserId] = useState<string | null>(null);

  const { data: items = [], isLoading } = useDecorInventoryQuery(filterUserId);
  const { data: dbCategories = [] } = useDecorCategoriesQuery();
  const { data: customers = [] } = useCustomersQuery();
  const actionMutation = useDecorActionMutation();
  const addItemMutation = useAddDecorItemMutation();
  const updateMutation = useUpdateDecorInventoryMutation();
  const addToCustomerMutation = useAddItemToCustomerMutation();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DecorInventoryItem | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Transaction State
  const [transactionDialog, setTransactionDialog] = useState<{
    isOpen: boolean;
    type: 'hire' | 'return' | 'damage' | 'repair' | null;
    item: DecorInventoryItem | null;
  }>({ isOpen: false, type: null, item: null });
  const [transactionQty, setTransactionQty] = useState<number>(1);

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

  const categories = useMemo(() => {
    return [...new Set([...DEFAULT_DECOR_CATEGORIES, ...dbCategories])].sort();
  }, [dbCategories]);

  const categoryOptions = useMemo(() => {
    return categories.map(cat => ({ value: cat, label: cat }));
  }, [categories]);

  const categoriesWithNew = useMemo(() => {
    return [
      { value: "NEW_CATEGORY", label: "➕ ADD NEW CATEGORY..." },
      ...categoryOptions
    ];
  }, [categoryOptions]);

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
    
    const isReadOnly = filterUserId !== null && !isOperationsManager() && !isDirectorOrInvestor();

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
        className={`cursor-pointer hover:bg-muted/50 p-1 min-h-[24px] flex items-center text-xs ${className} ${isReadOnly ? 'pointer-events-none opacity-80' : ''}`}
        onClick={() => !isReadOnly && handleCellEdit(item.id, field, value)}
      >
        {value || <span className="text-muted-foreground/50 italic">0</span>}
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

  const openTransactionDialog = (item: DecorInventoryItem, type: 'hire' | 'return' | 'damage' | 'repair') => {
    setTransactionDialog({ isOpen: true, type, item });
    setTransactionQty(1);
  };

  const handleTransactionSubmit = async () => {
    const { item, type } = transactionDialog;
    if (!item || !type) return;

    try {
      await actionMutation.mutateAsync({ id: item.id, action: type, quantity: transactionQty });
      setTransactionDialog({ isOpen: false, type: null, item: null });
    } catch (error) {
      console.error('Action failed:', error);
    }
  };

  const handleAddItem = () => {
    if (!newItem.category || !newItem.item_name) {
      toast.error('Category and Item Name are required');
      return;
    }
    
    addItemMutation.mutate(newItem, {
      onSuccess: () => {
        setShowAddDialog(false);
        setNewItem({ category: '', item_name: '', in_store: 0, price: 0 });
        setIsNewCategory(false);
      }
    });
  };

  const totalInStore = items.reduce((sum, item) => sum + item.in_store, 0);
  const totalHired = items.reduce((sum, item) => sum + item.hired, 0);
  const totalDamaged = items.reduce((sum, item) => sum + item.damaged, 0);
  const totalItems = totalInStore + totalHired + totalDamaged;

  if (isLoading) return <LoadingSpinner text="Loading Decor Inventory..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Button type="button" variant="outline" size="sm" onClick={onBack} className="rounded-full h-10 px-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-primary uppercase">Decor Management</h1>
            <p className="text-muted-foreground italic text-xs uppercase font-black tracking-widest opacity-70">Aesthetics & Setups</p>
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-3">
          {(isOperationsManager() || isDirectorOrInvestor()) && (
            <div className="w-full md:w-64">
              <StaffSelector 
                value={filterUserId} 
                onChange={setFilterUserId} 
                className="bg-background/50 backdrop-blur-sm"
              />
            </div>
          )}
          <Button type="button" onClick={() => { setIsNewCategory(false); setShowAddDialog(true); }} size="sm" className="h-10 px-6 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20 rounded-xl">
            <Plus className="h-4 w-4 mr-2" /> Add Item
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-muted/20 border-none shadow-none">
          <CardContent className="p-3 text-center">
            <div className="text-xl font-bold">{totalItems}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Total Assets</div>
          </CardContent>
        </Card>
        
        <Card className="bg-muted/20 border-none shadow-none">
          <CardContent className="p-3 text-center">
            <div className="text-xl font-bold text-primary">{totalInStore}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">In Store</div>
          </CardContent>
        </Card>
        
        <Card className="bg-muted/20 border-none shadow-none">
          <CardContent className="p-3 text-center">
            <div className="text-xl font-bold text-secondary">{totalHired}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">On Hire</div>
          </CardContent>
        </Card>
        
        <Card className="bg-muted/20 border-none shadow-none">
          <CardContent className="p-3 text-center">
            <div className="text-xl font-bold text-destructive">{totalDamaged}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Damaged</div>
          </CardContent>
        </Card>
      </div>

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
            id="searchItems"
            name="searchItems"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm h-9 bg-muted/20 border-none rounded-xl"
          />
        </div>
        <p className="text-xs text-muted-foreground italic">
          Showing {filteredItems.length} items
        </p>
      </div>

      <div className="space-y-4">
        {filteredItems.map((item) => (
          <Card key={item.id} className="overflow-hidden border-l-4 border-l-primary/40 hover-lift glow-primary glass-card transition-all duration-500">
            <div className="p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-primary/10 rounded-2xl">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-foreground tracking-tight leading-none mb-1 uppercase">
                      {item.item_name}
                    </h3>
                    <Badge variant="secondary" className="text-[8px] font-black uppercase tracking-widest px-2 py-0 border-none bg-muted/50">
                      {item.category.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center space-x-1 bg-muted/30 p-1 rounded-xl border">
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => openTransactionDialog(item, 'hire')}
                    disabled={item.in_store === 0 || actionMutation.isPending}
                    className="h-8 px-4 font-bold text-[10px] uppercase tracking-widest hover:bg-primary hover:text-white rounded-lg transition-all"
                  >
                    Hire
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => openTransactionDialog(item, 'return')}
                    disabled={item.hired === 0 || actionMutation.isPending}
                    className="h-8 px-4 font-bold text-[10px] uppercase tracking-widest hover:bg-secondary hover:text-white rounded-lg transition-all"
                  >
                    Return
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => openTransactionDialog(item, 'damage')}
                    disabled={item.in_store === 0 || actionMutation.isPending}
                    className="h-8 px-4 font-bold text-[10px] uppercase tracking-widest hover:bg-destructive hover:text-white rounded-lg transition-all"
                  >
                    Damage
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => openTransactionDialog(item, 'repair')}
                    disabled={item.damaged === 0 || actionMutation.isPending}
                    className="h-8 px-4 font-bold text-[10px] uppercase tracking-widest hover:bg-green-600 hover:text-white rounded-lg transition-all"
                  >
                    Repair
                  </Button>
                  <Separator orientation="vertical" className="h-4 mx-1" />
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => handleItemClick(item)}
                    className="h-8 w-8 p-0 hover:bg-primary/10 rounded-lg"
                    title="Assign to Customer"
                  >
                    <Users className="h-4 w-4 text-primary/70" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-muted/20 p-4 rounded-2xl border border-primary/5 shadow-inner">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-muted-foreground/70 tracking-[0.2em] block ml-1">In Store</label>
                  <div className="bg-background rounded-xl border border-primary/5 shadow-sm">
                    {renderEditableCell(item, 'in_store', 'text-center font-black text-xl')}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-muted-foreground/70 tracking-[0.2em] block ml-1 text-secondary">Hired</label>
                  <div className="bg-background rounded-xl border border-primary/5 shadow-sm">
                    {renderEditableCell(item, 'hired', 'text-center font-black text-xl text-secondary')}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-muted-foreground/70 tracking-[0.2em] block ml-1 text-destructive">Damaged</label>
                  <div className="bg-background rounded-xl border border-primary/5 shadow-sm">
                    {renderEditableCell(item, 'damaged', 'text-center font-black text-xl text-destructive')}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-muted-foreground/70 tracking-[0.2em] block ml-1 text-green-600">Rate (KSH)</label>
                  <div className="bg-background rounded-xl border border-primary/5 shadow-sm">
                    {renderEditableCell(item, 'price', 'text-right font-black text-xl text-green-600')}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      {/* Transaction Dialog */}
      <Dialog 
        open={transactionDialog.isOpen} 
        onOpenChange={(open) => { 
          if (!open) setTransactionDialog({ isOpen: false, type: null, item: null }); 
        }}
      >
        <DialogContent className="w-[95vw] max-w-[400px] rounded-3xl p-0 border-none shadow-2xl">
          <div className={`h-1.5 w-full bg-gradient-to-r ${
            transactionDialog.type === 'hire' ? 'from-primary to-blue-600' :
            transactionDialog.type === 'return' ? 'from-secondary to-purple-600' :
            transactionDialog.type === 'damage' ? 'from-destructive to-red-600' :
            'from-green-600 to-emerald-400'
          }`} />
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-xl font-black uppercase tracking-tight">
              {transactionDialog.type} Item
            </DialogTitle>
            <DialogDescription className="text-[10px] uppercase font-bold tracking-widest opacity-60">
              {transactionDialog.item?.item_name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="px-6 py-4 space-y-4">
            <div className="space-y-2">
              <label htmlFor="transactionQty" className="text-[10px] font-black uppercase text-muted-foreground/70 tracking-widest ml-1">Quantity</label>
              <Input 
                id="transactionQty"
                name="transactionQty"
                type="number" 
                value={transactionQty} 
                onChange={(e) => setTransactionQty(Math.max(1, parseInt(e.target.value) || 0))}
                min={1}
                className="font-black text-3xl text-center h-16 rounded-2xl bg-muted/20 border-none"
                autoFocus
              />
              <p className="text-[10px] text-center text-muted-foreground">
                 Available: {transactionDialog.type === 'hire' || transactionDialog.type === 'damage' 
                   ? transactionDialog.item?.in_store 
                   : transactionDialog.type === 'return' 
                     ? transactionDialog.item?.hired 
                     : transactionDialog.item?.damaged}
              </p>
            </div>
            
            <div className="flex gap-3 pt-2">
              <Button 
                variant="outline" 
                onClick={() => setTransactionDialog({ isOpen: false, type: null, item: null })}
                className="flex-1 h-12 font-black uppercase tracking-widest text-[10px] rounded-xl"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleTransactionSubmit}
                disabled={actionMutation.isPending}
                className={`flex-1 h-12 font-black uppercase tracking-widest text-[10px] shadow-lg rounded-xl ${
                   transactionDialog.type === 'hire' ? 'bg-primary hover:bg-primary/90 shadow-primary/20' :
                   transactionDialog.type === 'return' ? 'bg-secondary hover:bg-secondary/90 shadow-secondary/20' :
                   transactionDialog.type === 'damage' ? 'bg-destructive hover:bg-destructive/90 shadow-destructive/20' :
                   'bg-green-600 hover:bg-green-700 shadow-green-600/20'
                }`}
              >
                {actionMutation.isPending ? 'Processing...' : 'Confirm'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto rounded-3xl p-0 border-none shadow-2xl">
          <div className="h-1.5 w-full bg-gradient-to-r from-primary to-blue-600" />
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-2xl font-black uppercase tracking-tight text-primary">
              Initialize Decor Asset
            </DialogTitle>
            <DialogDescription className="text-[10px] uppercase font-bold tracking-widest opacity-60">
              Register a new physical asset or restock existing inventory.
            </DialogDescription>
          </DialogHeader>
          
          <div className="px-6 py-4 space-y-6">
            <div className="space-y-4">
              {/* Asset Classification */}
              <div className="space-y-2">
                <label htmlFor="newItemCategory" className="text-[10px] font-black uppercase text-muted-foreground/70 tracking-widest ml-1">Asset Classification</label>
                
                {!isNewCategory ? (
                  <div className="flex gap-2">
                    <Select
                      value={newItem.category}
                      onValueChange={(val) => {
                        if (val === "NEW_CATEGORY") {
                          setIsNewCategory(true);
                          setNewItem({ ...newItem, category: '' });
                        } else {
                          setNewItem({ ...newItem, category: val });
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
                      id="newCategoryName"
                      name="newCategoryName"
                      placeholder="Enter new category name..." 
                      value={newItem.category} 
                      onChange={(e) => setNewItem({ ...newItem, category: e.target.value.toUpperCase() })}
                      className="font-black h-11 border-primary/20 focus:border-primary uppercase rounded-xl flex-1"
                      autoFocus
                    />
                    <Button 
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
                  {!isNewCategory ? "Choose from existing list or select 'ADD NEW' to create" : "Manual entry mode active. Enter name then register asset."}
                </p>
              </div>

              {/* Asset Name */}
              <div className="space-y-2">
                <label htmlFor="newItemName" className="text-[10px] font-black uppercase text-muted-foreground/70 tracking-widest ml-1">Asset Name / Particulars</label>
                <Input 
                  id="newItemName"
                  name="newItemName"
                  placeholder="e.g. Gold Satin Runner" 
                  value={newItem.item_name} 
                  onChange={(e) => setNewItem({ ...newItem, item_name: e.target.value })}
                  className="font-bold h-11 border-primary/10 focus:border-primary rounded-xl"
                />
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="initialStock" className="text-[10px] font-black uppercase text-muted-foreground/70 tracking-widest ml-1">Initial Stock</label>
                  <Input 
                    id="initialStock"
                    name="initialStock"
                    type="number" 
                    placeholder="0" 
                    value={newItem.in_store || ''} 
                    onChange={(e) => setNewItem({ ...newItem, in_store: parseInt(e.target.value) || 0 })}
                    className="font-black h-11 text-center bg-muted/20 border-none rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="unitPrice" className="text-[10px] font-black uppercase text-muted-foreground/70 tracking-widest ml-1 text-success">Unit Price (KSH)</label>
                  <div className="relative">
                    <Input 
                      id="unitPrice"
                      name="unitPrice"
                      type="number" 
                      placeholder="0.00" 
                      value={newItem.price || ''} 
                      onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) || 0 })}
                      className="font-black h-11 text-right text-success bg-muted/20 border-none rounded-xl pr-10"
                    />
                    <span className="absolute right-3 top-3.5 text-[8px] font-black text-success/40">KSH</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 pt-2 flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowAddDialog(false)}
              className="flex-1 h-12 font-black uppercase tracking-widest text-[10px] rounded-xl border-primary/10"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddItem}
              disabled={!newItem.category || !newItem.item_name || addItemMutation.isPending}
              className="flex-1 h-12 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 rounded-xl"
            >
              {addItemMutation.isPending ? 'Processing...' : 'Register Asset'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Customer Selection Dialog */}
      <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
        <DialogContent className="w-[95vw] max-w-[400px] rounded-3xl p-6 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase">Assign Asset</DialogTitle>
            <DialogDescription className="text-xs font-medium">Assign this item to a specific customer for event tracking.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1 font-bold uppercase">Item Selected</p>
              <p className="text-lg font-black text-primary">{selectedItem?.item_name}</p>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest">Target Customer</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between h-11 rounded-xl">
                    <span className="truncate">{selectedCustomerId ? customers.find((c: Customer) => c.id === selectedCustomerId)?.name : 'Select Customer'}</span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[350px] max-h-[300px] overflow-y-auto rounded-xl">
                  {customers.map((customer: Customer) => (
                    <DropdownMenuItem key={customer.id} onClick={() => setSelectedCustomerId(customer.id)} className="flex flex-col items-start p-3">
                      <span className="font-bold">{customer.name}</span>
                      <span className="text-[10px] opacity-60 uppercase">{customer.eventType} • {customer.eventDate}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCustomerDialog(false)} className="rounded-xl flex-1">Cancel</Button>
            <Button onClick={handleAddToCustomer} disabled={!selectedCustomerId || addToCustomerMutation.isPending} className="rounded-xl flex-1">Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DecorManagement;
