'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Plus, Database, Trash2, X, User, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';

import { useEventItemsQuery, useCreateEventItemMutation, useDeleteEventItemMutation } from '@/hooks/use-event-api';
import { useEntertainmentItems } from '@/hooks/useEntertainmentItems';
import { useSanitationItems } from '@/hooks/useSanitationItems';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { StaffSelector } from '@/components/shared/StaffSelector';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatCurrency } from '@/utils/formatters';
import { toast } from 'sonner';

interface ManagerProps {
  onBack: () => void;
  category: string;
  title: string;
}

const EventCategoryManager: React.FC<ManagerProps> = ({ onBack, category, title }) => {
  const { canDeleteTransaction, isOperationsManager, isDirectorOrInvestor } = useRoleGuard();
  const [filterUserId, setFilterUserId] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isNewItem, setIsNewItem] = useState(false);

  // Hook 1: General Event Items
  const eventItems = useEventItemsQuery(filterUserId);
  const createEventItem = useCreateEventItemMutation();
  const deleteEventItem = useDeleteEventItemMutation();

  // Hook 2: Entertainment Equipment
  const entertainment = useEntertainmentItems(filterUserId);

  // Hook 3: Sanitation Items
  const sanitation = useSanitationItems(filterUserId);

  // Determine which data source to use
  const isSpecialCategory = category === 'entertainment' || category === 'sanitation';
  
  const currentData = useMemo(() => {
    let source: any;
    let mapItem: (item: any) => any;
    let addItemFn: any;
    let deleteItemFn: any;

    if (category === 'entertainment') {
      source = entertainment;
      addItemFn = entertainment.addItem;
      deleteItemFn = entertainment.deleteItem;
      mapItem = (item: any) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity_available,
        price: item.price,
        unit: 'unit',
        status: 'available',
        users: item.users
      });
    } else if (category === 'sanitation') {
      source = sanitation;
      addItemFn = sanitation.addItem;
      deleteItemFn = sanitation.deleteItem;
      mapItem = (item: any) => ({
        id: item.id,
        name: item.name || item.item_name || 'Item',
        quantity: item.quantity,
        price: item.price,
        unit: item.unit,
        status: item.status,
        users: item.users
      });
    } else {
      source = eventItems;
      addItemFn = createEventItem.mutateAsync;
      deleteItemFn = deleteEventItem.mutateAsync;
      mapItem = (item: any) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantityAvailable,
        price: item.price,
        unit: item.unit,
        status: item.status,
        users: item.users
      });
    }

    const rawItems = category === 'entertainment' || category === 'sanitation' 
      ? source.items 
      : (source.data || []).filter((item: any) => item.category === category);

    return {
      items: rawItems.map(mapItem),
      loading: source.loading || source.isLoading,
      error: source.error?.message || source.error,
      addItem: addItemFn,
      deleteItem: deleteItemFn,
      refetch: source.refetch
    };
  }, [category, entertainment, sanitation, eventItems, createEventItem, deleteEventItem]);

  const itemOptions: SelectOption[] = useMemo(() => {
    const names = [...new Set(currentData.items.map((item: any) => String(item.name || '')))].sort();
    return names.filter(Boolean).map(name => ({ value: String(name), label: String(name) }));
  }, [currentData.items]);

  const itemsWithNew: SelectOption[] = useMemo(() => {
    return [
      { value: "ADD_NEW_ITEM", label: "➕ ADD NEW ITEM..." },
      ...itemOptions
    ];
  }, [itemOptions]);

  const [formData, setFormData] = useState({
    name: '',
    quantityAvailable: 0,
    price: 0,
    unit: 'pieces'
  });

  useEffect(() => {
    if (currentData.error) {
      toast.error(`Error: ${currentData.error}`);
    }
  }, [currentData.error]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Item name is required');
      return;
    }

    try {
      if (category === 'entertainment') {
        await entertainment.addItem({
          name: formData.name.trim(),
          category: 'entertainment',
          quantity_available: Number(formData.quantityAvailable) || 0,
          price: Number(formData.price) || 0
        });
      } else if (category === 'sanitation') {
        await sanitation.addItem({
          name: formData.name.trim(),
          category: 'sanitation',
          quantity: Number(formData.quantityAvailable) || 0,
          unit: formData.unit || 'pieces',
          price: Number(formData.price) || 0,
          status: 'in-store'
        });
      } else {
        await createEventItem.mutateAsync({
          name: formData.name.trim(),
          category: category,
          quantityAvailable: Number(formData.quantityAvailable) || 0,
          price: Number(formData.price) || 0,
          unit: formData.unit || 'pieces',
          status: 'available'
        });
      }
      
      setShowAddDialog(false);
      setFormData({ name: '', quantityAvailable: 0, price: 0, unit: 'pieces' });
      await currentData.refetch();
      toast.success('Item added successfully');
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await currentData.deleteItem(id);
        await currentData.refetch();
        toast.success('Item deleted');
      } catch (error) {
        console.error(error);
      }
    }
  };

  const getStaffName = (item: any) => {
    if (!item.users) return 'Me';
    const { first_name, last_name, email } = item.users;
    if (first_name || last_name) return `${first_name || ''} ${last_name || ''}`.trim();
    return email || 'Unknown';
  };

  if (currentData.loading) return <LoadingSpinner text={`Loading ${title}...`} />;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
        </div>

        <div className="flex items-center gap-3">
          {(isOperationsManager() || isDirectorOrInvestor()) && (
            <div className="w-64">
              <StaffSelector 
                value={filterUserId} 
                onChange={setFilterUserId} 
                className="bg-background/50"
              />
            </div>
          )}
          <Button onClick={() => { setIsNewItem(false); setShowAddDialog(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Add Item
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0 pb-4">
          <CardTitle className="text-xl font-bold text-primary">Inventory List</CardTitle>
          <CardDescription className="text-xs uppercase tracking-widest font-black opacity-70">
            Manage your {category} items from {isSpecialCategory ? `the specialized ${category} table` : 'the event items table'}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {currentData.items.map((item: any) => (
              <Card key={item.id} className="overflow-hidden border-muted hover:border-primary/30 transition-all duration-300 hover:shadow-md border-l-4 border-l-primary/40">
                <div className="p-4 space-y-4">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-base truncate" title={item.name}>
                        {item.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={item.status === 'available' || item.status === 'in-store' ? 'success' : 'secondary'} className="text-[9px] h-4 font-black uppercase tracking-tighter">
                          {item.status}
                        </Badge>
                        <div className="flex items-center text-[10px] text-muted-foreground font-medium">
                          <User className="h-2.5 w-2.5 mr-1" />
                          {getStaffName(item)}
                        </div>
                      </div>
                    </div>
                    {canDeleteTransaction() && (
                      <Button variant="ghost" size="xs" onClick={() => handleDelete(item.id)} className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-muted/30 p-2 rounded-lg border">
                    <div className="space-y-0.5">
                      <label className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Stock</label>
                      <p className="text-xs font-bold">{item.quantity} {item.unit}</p>
                    </div>
                    <div className="space-y-0.5">
                      <label className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Unit Price</label>
                      <p className="text-xs font-bold text-success">{formatCurrency(item.price)}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            {currentData.items.length === 0 && (
              <div className="col-span-full py-16 text-center text-muted-foreground bg-muted/5 border-2 border-dashed rounded-2xl">
                <Database className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">No items found in this category.</p>
                <Button variant="link" onClick={() => setShowAddDialog(true)}>Add your first item</Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight text-primary">Add New {category} Item</DialogTitle>
            <DialogDescription className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest opacity-60">Register new equipment or services for {category} management.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddItem} className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-muted-foreground/70 tracking-widest ml-1">Item Name</label>
              
              {!isNewItem ? (
                <div className="flex gap-2">
                  <Select
                    value={formData.name}
                    onValueChange={(val) => {
                      if (val === "ADD_NEW_ITEM") {
                        setIsNewItem(true);
                        setFormData({ ...formData, name: '' });
                      } else {
                        setFormData({ ...formData, name: val });
                      }
                    }}
                  >
                    <SelectTrigger className="flex-1 rounded-xl">
                      <SelectValue placeholder="Select Item" />
                    </SelectTrigger>
                    <SelectContent>
                      {itemsWithNew.map((option) => (
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
                    placeholder="Enter new item name..." 
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="font-black h-11 border-primary/20 focus:border-primary uppercase rounded-xl flex-1"
                    autoFocus
                  />
                  <Button 
                    type="button"
                    variant="ghost" 
                    onClick={() => setIsNewItem(false)}
                    className="h-11 w-11 p-0 rounded-xl hover:bg-muted"
                    title="Back to List"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <p className="text-[8px] text-muted-foreground ml-1">
                {!isNewItem ? "Choose from existing list or select 'ADD NEW' to create" : "Manual entry mode active."}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-muted-foreground/70 tracking-widest ml-1">Stock Quantity</label>
                <Input 
                  type="number" 
                  placeholder="0" 
                  value={formData.quantityAvailable || ''} 
                  onChange={(e) => setFormData({ ...formData, quantityAvailable: parseInt(e.target.value) || 0 })} 
                  required 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-muted-foreground/70 tracking-widest ml-1">Price (KSH)</label>
                <Input 
                  type="number" 
                  placeholder="0.00" 
                  value={formData.price || ''} 
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })} 
                  required 
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-muted-foreground/70 tracking-widest ml-1">Unit</label>
              <Input 
                placeholder="e.g. Litres, Pieces" 
                value={formData.unit} 
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })} 
              />
            </div>
            <DialogFooter className="pt-6">
              <Button variant="outline" type="button" onClick={() => setShowAddDialog(false)}>Cancel</Button>
              <Button type="submit">
                Add Item
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventCategoryManager;
