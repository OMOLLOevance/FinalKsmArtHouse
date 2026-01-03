'use client';

import React, { useState } from 'react';
import { ArrowLeft, Plus, Database, Trash2, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { useEventItemsQuery, useCreateEventItemMutation, useDeleteEventItemMutation } from '@/hooks/use-event-api';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatCurrency } from '@/utils/formatters';
import { toast } from 'sonner';

interface ManagerProps {
  onBack: () => void;
  category: string;
  title: string;
}

const EventCategoryManager: React.FC<ManagerProps> = ({ onBack, category, title }) => {
  const { data: items, isLoading, refetch } = useEventItemsQuery();
  const createItemMutation = useCreateEventItemMutation();
  const deleteItemMutation = useDeleteEventItemMutation();
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    quantityAvailable: 0,
    price: 0,
    unit: 'pieces',
    status: 'available'
  });

  const filteredItems = items?.filter(item => item.category === category) || [];

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Item name is required');
      return;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        category: category,
        quantityAvailable: Number(formData.quantityAvailable) || 0,
        price: Number(formData.price) || 0,
        unit: formData.unit || 'pieces',
        status: 'available'
      };

      await createItemMutation.mutateAsync(payload);
      setShowAddDialog(false);
      setFormData({ name: '', quantityAvailable: 0, price: 0, unit: 'pieces', status: 'available' });
      await refetch();
    } catch (error) {
      // Handled by mutation
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteItemMutation.mutateAsync(id);
        await refetch();
      } catch (error) {}
    }
  };

  if (isLoading) return <LoadingSpinner text={`Loading ${title}...`} />;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Item
        </Button>
      </div>

      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0 pb-4">
          <CardTitle className="text-xl font-bold text-primary">Inventory List</CardTitle>
          <CardDescription className="text-xs uppercase tracking-widest font-black opacity-70">
            Manage your {category} items and availability
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map((item) => (
              <Card key={item.id} className="overflow-hidden border-muted hover:border-primary/30 transition-all duration-300 hover:shadow-md border-l-4 border-l-primary/40">
                <div className="p-4 space-y-4">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-base truncate" title={item.name}>
                        {item.name}
                      </h4>
                      <Badge variant={item.status === 'available' ? 'success' : 'secondary'} className="text-[9px] h-4 font-black uppercase tracking-tighter">
                        {item.status}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="xs" onClick={() => handleDelete(item.id)} className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-muted/30 p-2 rounded-lg border">
                    <div className="space-y-0.5">
                      <label className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Stock</label>
                      <p className="text-xs font-bold">{item.quantityAvailable} {item.unit}</p>
                    </div>
                    <div className="space-y-0.5">
                      <label className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Unit Price</label>
                      <p className="text-xs font-bold text-success">{formatCurrency(item.price)}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            {filteredItems.length === 0 && (
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
              <Input 
                placeholder="e.g. Hand Sanitizer" 
                value={formData.name} 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                required 
              />
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
              <Button type="submit" disabled={createItemMutation.isPending}>
                {createItemMutation.isPending ? 'Saving...' : 'Add Item'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventCategoryManager;
