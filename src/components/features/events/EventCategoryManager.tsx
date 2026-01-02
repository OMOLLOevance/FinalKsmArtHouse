'use client';

import React, { useState } from 'react';
import { ArrowLeft, Plus, Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { useEventItemsQuery } from '@/hooks/use-event-api';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatCurrency } from '@/utils/formatters';

interface ManagerProps {
  onBack: () => void;
  category: string;
  title: string;
}

const EventCategoryManager: React.FC<ManagerProps> = ({ onBack, category, title }) => {
  const { data: items, isLoading } = useEventItemsQuery();
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  const filteredItems = items?.filter(item => item.category === category) || [];

  if (isLoading) return <LoadingSpinner text={`Loading ${title}...`} />;

  return (
    <div className="space-y-6">
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New {category} Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Item name" />
            <Input placeholder="Quantity" type="number" />
            <Input placeholder="Price (KSH)" type="number" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={() => setShowAddDialog(false)}>Add Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventCategoryManager;
