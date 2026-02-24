import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ArrowLeft, Printer, Calendar, Utensils, Plus, Minus, CheckCircle2, Receipt, User, Loader2, Search, ListPlus, X } from 'lucide-react';

import { useRestaurantInventory } from '@/hooks/useRestaurantInventory';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { StaffSelector } from '@/components/shared/StaffSelector';
import { InventoryItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency } from '@/utils/formatters';
import { SkeletonCard } from '@/components/ui/LoadingSpinner';
import { useRestaurantMasterItemsQuery } from '@/hooks/use-restaurant-master-items-query';

interface RestaurantManagementProps {
  onBack?: () => void;
}

const RestaurantManagement: React.FC<RestaurantManagementProps> = ({ onBack }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Drive selectedDate from URL search parameter
  const selectedDate = searchParams.get('date') || new Date().toISOString().substring(0, 10);

  const setSelectedDate = (date: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('date', date);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const [selectedMonth] = useState(() => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  });
  
  const [inventoryInputs, setInventoryInputs] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [filterUserId, setFilterUserId] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const { data: masterItems, isLoading: masterItemsLoading } = useRestaurantMasterItemsQuery();
  const { showSuccess, showError } = useToast();
  const { isManager } = useRoleGuard();
  
  const { inventory: dbRecords, loading: dbLoading, addInventoryItem, error: dbError } = useRestaurantInventory(selectedMonth, filterUserId);

  useEffect(() => {
    if (dbError) {
      showError('Error loading inventory', dbError);
    }
  }, [dbError, showError]);

  useEffect(() => {
    if (masterItemsLoading) return;
    if (!masterItems || masterItems.length === 0) {
      setInventoryInputs([]); 
      return;
    }

    const initialInputs = masterItems.map(item => ({
      master_item_id: item.id,
      item_name: item.name,
      quantity: '',
      price: item.default_unit_price ? String(item.default_unit_price) : '',
    }));
    setInventoryInputs(initialInputs);
  }, [masterItems, masterItemsLoading]);

  // Persist Input Forms (Drafts)
  useEffect(() => {
    if (inventoryInputs.length === 0) return;
    const timer = setTimeout(() => {
      localStorage.setItem(`restaurant_inputs_${selectedDate}`, JSON.stringify(inventoryInputs));
    }, 1000);
    return () => clearTimeout(timer);
  }, [inventoryInputs, selectedDate]);



  const handleChange = (index: number, field: 'quantity' | 'price', value: string) => {
    setInventoryInputs(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const adjustQuantity = (index: number, delta: number) => {
    const currentQty = parseFloat(inventoryInputs[index].quantity) || 0;
    const newQty = Math.max(0, currentQty + delta);
    handleChange(index, 'quantity', newQty.toString());
  };

  const handleAddCustomItem = () => {
    if (!newItemName.trim()) {
      showError('Error', 'Item name cannot be empty.');
      return;
    }
    if (inventoryInputs.some(item => item.item_name.toLowerCase() === newItemName.toLowerCase())) {
      showError('Error', 'Item already exists in the list.');
      setNewItemName('');
      return;
    }

    setInventoryInputs(prev => [{
      master_item_id: `custom-${Date.now()}`, // Unique ID for custom items
      item_name: newItemName,
      quantity: '',
      price: ''
    }, ...prev]);
    setNewItemName('');
    showSuccess('Item Added', `${newItemName} added to inventory.`);
  };

  const removeItemFromList = (index: number) => {
    setInventoryInputs(prev => prev.filter((_, i) => i !== index));
  };

  const handleRecordItem = async (index: number) => {
    const item = inventoryInputs[index];
    if (!item.quantity || !item.price) return;

    try {
      setSubmittingId(item.item_name);

      await addInventoryItem({
        sale_date: selectedDate,
        master_item_id: item.master_item_id,
        name: item.item_name,
        quantity: parseFloat(item.quantity),
        unitPrice: parseFloat(item.price),
        totalValue: parseFloat(item.quantity) * parseFloat(item.price),
        expenses: parseFloat(item.quantity) * parseFloat(item.price),
      });

      // Clear input after success
      setInventoryInputs(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], quantity: '', price: '' };
        return updated;
      });

      showSuccess('Saved', `${item.item_name} recorded successfully`);
    } catch (error) {
      showError('Error', 'Failed to save record. Please try again.');
    } finally {
      setSubmittingId(null);
    }
  };

  const totalCost = dbRecords.reduce((sum, record) => sum + (Number(record.total_amount) || 0), 0);

  const filteredInputs = React.useMemo(() => {
    if (!searchTerm) return inventoryInputs;
    return inventoryInputs.filter(i => i.item_name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [inventoryInputs, searchTerm]);

  if (dbLoading && !inventoryInputs.length) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-10 w-64 bg-muted animate-pulse rounded-lg" />
        </div>
        <div className="h-20 w-full bg-muted/10 animate-pulse rounded-xl" />
        <SkeletonCard count={12} />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Branded Header - Print Only */}
      <div className="hidden print:block text-center border-b-4 border-primary pb-4 mb-8">
        <h1 className="text-4xl font-black tracking-tighter text-primary">KISUMU ART HOUSE</h1>
        <p className="text-sm font-bold uppercase tracking-[0.3em]">Restaurant Inventory & Expenses</p>
        <p className="text-xs mt-2 font-medium">Record Date: {selectedDate}</p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center space-x-2">
          {onBack && (
            <Button type="button" variant="outline" size="sm" onClick={onBack} className="rounded-full h-10 px-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-primary uppercase">Daily Inventory</h1>
            <p className="text-sm text-muted-foreground italic">Kitchen Asset & Resource Logs</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-end md:items-center gap-3">
          {/* RBAC Staff Filter */}
          {isManager() && (
            <div className="w-64">
              <StaffSelector 
                value={filterUserId} 
                onChange={setFilterUserId} 
                className="w-full bg-background/50 backdrop-blur-sm"
              />
            </div>
          )}

          <div className="flex items-center gap-3 bg-muted/20 p-2 rounded-2xl border border-primary/5">
            <div className="flex items-center gap-2 px-3 border-r border-primary/10">
              <Calendar className="h-4 w-4 text-primary opacity-70" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent border-none font-bold h-8 w-32 focus-visible:ring-0 shadow-none p-0 text-xs"
              />
            </div>
            <div className="flex items-center gap-2 px-2">
               <span className="flex items-center text-[9px] font-black text-success uppercase tracking-widest">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Live Database
               </span>
            </div>
          </div>
        </div>
      </div>

      {/* Expense Summary Banner */}
      <Card className="bg-slate-900 text-white shadow-2xl border-none overflow-hidden relative group rounded-3xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
          <Receipt className="h-32 w-32 rotate-12" />
        </div>
        <CardContent className="p-10 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-center md:text-left space-y-2">
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <Badge className="bg-primary/20 text-primary border-none font-black text-[10px] tracking-widest px-3">TOTAL EXPENDITURE</Badge>
                <span className="text-[10px] font-black uppercase text-slate-500">{dbRecords.length} Items Recorded</span>
              </div>
              <h3 className="text-6xl font-black tracking-tighter text-primary">{formatCurrency(totalCost)}</h3>
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400">Total Value for {selectedMonth}</p>
            </div>
            <div className="flex gap-4">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => window.print()} 
                className="h-11 px-10 font-black uppercase tracking-widest text-xs rounded-xl border-white/10 hover:bg-white hover:text-black transition-all shadow-2xl"
              >
                <Printer className="h-5 w-5 mr-3" /> Print Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Quick Add */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:hidden">
        <div className="relative group">
          <Label htmlFor="search" className="block text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1 mb-2">Search Catalog</Label>
          <Search className="absolute left-4 top-11 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
          <Input 
            id="search"
            placeholder="Search items..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-11 bg-muted/30 border-none rounded-2xl font-bold w-full"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="newItem" className="block text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Quick Add Item</Label>
          <div className="flex gap-3">
            <Input 
              id="newItem"
              placeholder="Add new item name..." 
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCustomItem()}
              className="h-11 bg-muted/30 border-none rounded-2xl flex-1 font-bold pl-6"
            />
            <Button type="button" onClick={handleAddCustomItem} className="h-11 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20">
              <ListPlus className="h-4 w-4 mr-2" /> Add
            </Button>
          </div>
        </div>
      </div>

      {/* Inventory Grid - Input Area */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 print:hidden">
        {filteredInputs.map((item, index) => {
          const hasData = item.quantity && item.price;
          const isSubmitting = submittingId === item.item_name;
          
          return (
            <Card key={`${item.master_item_id}-${index}`} className={`overflow-hidden transition-all duration-500 border-none group relative ${
              hasData ? 'ring-2 ring-primary bg-primary/5 shadow-xl scale-[1.02]' : 'hover:shadow-lg bg-card'
            }`}>
              <div className="p-5 space-y-5">
                <div className="flex items-center justify-between border-b pb-3 border-primary/5">
                  <div className="flex items-center space-x-2 min-w-0">
                    <Utensils className={`h-4 w-4 transition-colors ${hasData ? 'text-primary' : 'text-muted-foreground opacity-40'}`} />
                    <h4 className={`text-sm font-black truncate uppercase tracking-tight text-foreground`}>{item.item_name}</h4>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeItemFromList(index)} className="h-6 w-6 text-destructive/40 hover:text-destructive hover:bg-destructive/10" aria-label="Remove Item">
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Qty</label>
                      <div className="flex gap-1">
                        <button onClick={() => adjustQuantity(index, -1)} className="h-5 w-5 flex items-center justify-center rounded bg-muted hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors">
                          <Minus className="h-2.5 w-2.5" />
                        </button>
                        <button onClick={() => adjustQuantity(index, 1)} className="h-5 w-5 flex items-center justify-center rounded bg-muted hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors">
                          <Plus className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    </div>
                    <Input
                      value={item.quantity}
                      onChange={(e) => handleChange(index, 'quantity', e.target.value)}
                      className="h-10 text-xs font-black bg-muted/20 border-none text-center rounded-xl"
                      placeholder="0"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest block">Unit Price</label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={item.price}
                        onChange={(e) => handleChange(index, 'price', e.target.value)}
                        className="h-10 text-xs font-black text-success bg-muted/20 border-none pr-8 rounded-xl"
                        placeholder="0"
                        disabled={isSubmitting}
                      />
                      <span className="absolute right-2 top-3 text-[8px] font-black text-success/40 uppercase">Ksh</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Button 
                    type="button"
                    onClick={() => handleRecordItem(index)}
                    disabled={!hasData || isSubmitting}
                    variant={hasData ? "default" : "outline"}
                    className={`w-full h-10 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all ${
                      hasData ? 'shadow-md shadow-primary/10' : 'opacity-40'
                    }`}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      hasData ? 'Save to Record' : 'Enter Details'
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Transaction History (Cloud Records) */}
      <Card className="border-none shadow-xl bg-card/50 backdrop-blur">
        <CardHeader className="border-b border-primary/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Receipt className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">Transaction History</CardTitle>
                <CardDescription>Live database records for {selectedMonth}</CardDescription>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-primary">{formatCurrency(totalCost)}</p>
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Total</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-wider text-muted-foreground">Date</th>
                  <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-wider text-muted-foreground">Staff Member</th>
                  <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-wider text-muted-foreground">Item</th>
                  <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-wider text-muted-foreground text-center">Qty</th>
                  <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-wider text-muted-foreground text-right">Unit Price</th>
                  <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-wider text-muted-foreground text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {dbLoading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Loading records...</span>
                      </div>
                    </td>
                  </tr>
                ) : dbRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">No records found for this period.</td>
                  </tr>
                ) : (
                  dbRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4 font-medium whitespace-nowrap">{record.sale_date}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium text-foreground">
                            {record.users ? `${record.users.first_name} ${record.users.last_name}` : 'Me'}
                          </span>
                          {record.users?.role && (
                             <Badge variant="outline" className="text-[10px] h-4 px-1">{record.users.role}</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium">{record.item_name}</td>
                      <td className="px-6 py-4 text-center">{record.quantity}</td>
                      <td className="px-6 py-4 text-right font-mono text-muted-foreground">
                        {Number(record.unit_price).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-primary">
                        {formatCurrency(record.total_amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Print Only Inventory Table */}
      <div className="hidden print:block">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-muted/50 border-b-2 border-black">
              <th className="py-2 text-left text-xs font-black uppercase">Item Particulars</th>
              <th className="py-2 text-center text-xs font-black uppercase w-32">Quantity</th>
              <th className="py-2 text-right text-xs font-black uppercase w-32">Unit Price</th>
              <th className="py-2 text-right text-xs font-black uppercase w-32">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {dbRecords.map((item, index) => (
              <tr key={index}>
                <td className="py-2 text-xs font-bold uppercase">{item.item_name}</td>
                <td className="py-2 text-xs text-center">{item.quantity}</td>
                <td className="py-2 text-xs text-right font-mono">{Number(item.unit_price).toLocaleString()}</td>
                <td className="py-2 text-xs text-right font-black font-mono">
                  {formatCurrency(item.total_amount)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-black font-black">
              <td colSpan={3} className="py-4 text-right text-sm uppercase tracking-widest">Total Expenses:</td>
              <td className="py-4 text-right text-base text-primary">{formatCurrency(totalCost)}</td>
            </tr>
          </tfoot>
        </table>
      </div>


    </div>
  );
};

export default React.memo(RestaurantManagement);
