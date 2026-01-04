'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ArrowLeft, Save, Printer, Calendar, Utensils, X, Plus, Minus, Search, Sparkles, CheckCircle2, CheckCircle, ListPlus, Receipt, Trash2, Edit2, Check, Cloud, User, Loader2 } from 'lucide-react';
import ItemServingsManager from './ItemServingsManager';
import { useRestaurantInventory } from '@/hooks/useRestaurantInventory';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { StaffSelector } from '@/components/shared/StaffSelector';
import { InventoryItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency } from '@/utils/formatters';
import { logger } from '@/lib/logger';
import { SkeletonCard } from '@/components/ui/LoadingSpinner';

interface RestaurantManagementProps {
  onBack?: () => void;
}

const defaultItems = [
  'Onions', 'Ginger', 'Hoho', 'Beans', 'Njugu', 'Carrots',
  'Mboga Kienyeji', 'Kuku Kienyeji', 'Bananas', 'Lemon',
  'Matumbo', 'Beef', 'Eggs', 'Fruits', 'Cabbage', 'Dania',
  'Fish', 'Charcoal', 'Tomatoes (kg)', 'Potatoes (kg)',
  'Melon (pieces)', 'Mangoes (kg)', 'Tomato Sauce (litres)',
  'Garlic (kg)', 'Crisps (grams/kg)', 'Transport',
];

const RestaurantManagement: React.FC<RestaurantManagementProps> = ({ onBack }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().substring(0, 10));
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  });
  
  const [inventoryInputs, setInventoryInputs] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [filterUserId, setFilterUserId] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const { showSuccess, showError } = useToast();
  const { isOperationsManager, isDirectorOrInvestor } = useRoleGuard();
  
  // Pass filterUserId to the hook
  const { inventory: dbRecords, loading: dbLoading, addInventoryItem, refetch } = useRestaurantInventory(selectedMonth, filterUserId);

  // Initialize Input Forms
  useEffect(() => {
    const loadInputs = () => {
      try {
        const storedInputs = localStorage.getItem(`restaurant_inputs_${selectedDate}`);
        if (storedInputs) {
          setInventoryInputs(JSON.parse(storedInputs));
        } else {
          setInventoryInputs(defaultItems.map(item => ({ item, quantity: '', price: '' })));
        }
      } catch (error) {
        setInventoryInputs(defaultItems.map(item => ({ item, quantity: '', price: '' })));
      }
    };
    loadInputs();
  }, [selectedDate]);

  // Persist Input Forms (Drafts)
  useEffect(() => {
    if (inventoryInputs.length === 0) return;
    const timer = setTimeout(() => {
      localStorage.setItem(`restaurant_inputs_${selectedDate}`, JSON.stringify(inventoryInputs));
    }, 1000);
    return () => clearTimeout(timer);
  }, [inventoryInputs, selectedDate]);


  const handleChange = useCallback((index: number, field: 'quantity' | 'price', value: string) => {
    setInventoryInputs(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  const adjustQuantity = (index: number, delta: number) => {
    const currentQty = parseFloat(inventoryInputs[index].quantity) || 0;
    const newQty = Math.max(0, currentQty + delta);
    handleChange(index, 'quantity', newQty.toString());
  };

  const handleRecordItem = async (index: number) => {
    const item = inventoryInputs[index];
    if (!item.quantity || !item.price) return;
    
    try {
      setSubmittingId(item.item); // Use item name as temp ID for loading state
      
      await addInventoryItem({
        sale_date: selectedDate,
        name: item.item,
        quantity: parseFloat(item.quantity),
        unitPrice: parseFloat(item.price),
        totalValue: parseFloat(item.quantity) * parseFloat(item.price),
        expenses: parseFloat(item.quantity) * parseFloat(item.price)
      });

      // Clear input after success
      setInventoryInputs(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], quantity: '', price: '' };
        return updated;
      });

      showSuccess('Saved', `${item.item} recorded successfully`);
    } catch (error) {
      console.error(error);
      showError('Error', 'Failed to save record. Please try again.');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleAddCustomItem = () => {
    const name = newItemName.trim();
    if (!name) return;
    
    setInventoryInputs(prev => [{ item: name, quantity: '', price: '' }, ...prev]);
    setNewItemName('');
    showSuccess('Added', `${name} added to list`);
  };

  const removeItemFromList = (index: number) => {
    setInventoryInputs(prev => prev.filter((_, i) => i !== index));
  };

  // Calculate totals from DB records
  const totalCost = useMemo(() => {
    return dbRecords.reduce((sum, record) => sum + (Number(record.total_amount) || 0), 0);
  }, [dbRecords]);

  const filteredInputs = useMemo(() => {
    if (!searchTerm) return inventoryInputs;
    return inventoryInputs.filter(i => i.item.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [inventoryInputs, searchTerm]);

  const getStaffName = (record: any) => {
    if (!record.users) return 'Me';
    const { first_name, last_name, email } = record.users;
    if (first_name && last_name) return `${first_name} ${last_name}`;
    return email || 'Unknown';
  };

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
            <Button variant="outline" size="sm" onClick={onBack} className="rounded-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <div>
            <h2 className="text-3xl font-black tracking-tight text-primary uppercase">Daily Inventory</h2>
            <p className="text-muted-foreground italic text-[10px] uppercase font-black tracking-[0.2em] opacity-70">Kitchen Asset & Resource Logs</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-end md:items-center gap-3">
          {/* RBAC Staff Filter */}
          {(isOperationsManager() || isDirectorOrInvestor()) && (
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
                variant="outline" 
                onClick={() => window.print()} 
                className="h-14 px-10 font-black uppercase tracking-widest text-xs rounded-xl border-white/10 hover:bg-white hover:text-black transition-all shadow-2xl"
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
          <Search className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search items..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-12 bg-muted/30 border-none rounded-2xl font-bold"
          />
        </div>
        <div className="flex gap-3">
          <Input 
            placeholder="Add new item name..." 
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCustomItem()}
            className="h-12 bg-muted/30 border-none rounded-2xl flex-1 font-bold pl-6"
          />
          <Button onClick={handleAddCustomItem} className="h-12 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20">
            <ListPlus className="h-4 w-4 mr-2" /> Add
          </Button>
        </div>
      </div>

      {/* Inventory Grid - Input Area */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 print:hidden">
        {filteredInputs.map((item, index) => {
          const originalIndex = inventoryInputs.findIndex(i => i === item);
          const hasData = item.quantity && item.price;
          const isSubmitting = submittingId === item.item;
          
          return (
            <Card key={`${item.item}-${index}`} className={`overflow-hidden transition-all duration-500 border-none group relative ${
              hasData ? 'ring-2 ring-primary bg-primary/5 shadow-xl scale-[1.02]' : 'hover:shadow-lg bg-card'
            }`}>
              <div className="p-5 space-y-5">
                <div className="flex items-center justify-between border-b pb-3 border-primary/5">
                  <div className="flex items-center space-x-2 min-w-0">
                    <Utensils className={`h-4 w-4 transition-colors ${hasData ? 'text-primary' : 'text-muted-foreground opacity-40'}`} />
                    <h4 className={`text-sm font-black truncate uppercase tracking-tight text-foreground`}>{item.item}</h4>
                  </div>
                  {!defaultItems.includes(item.item) && (
                    <Button variant="ghost" size="icon" onClick={() => removeItemFromList(originalIndex)} className="h-6 w-6 text-destructive/40 hover:text-destructive hover:bg-destructive/10">
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Qty</label>
                      <div className="flex gap-1">
                        <button onClick={() => adjustQuantity(originalIndex, -1)} className="h-5 w-5 flex items-center justify-center rounded bg-muted hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors">
                          <Minus className="h-2.5 w-2.5" />
                        </button>
                        <button onClick={() => adjustQuantity(originalIndex, 1)} className="h-5 w-5 flex items-center justify-center rounded bg-muted hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors">
                          <Plus className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    </div>
                    <Input
                      value={item.quantity}
                      onChange={(e) => handleChange(originalIndex, 'quantity', e.target.value)}
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
                        onChange={(e) => handleChange(originalIndex, 'price', e.target.value)}
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
                    onClick={() => handleRecordItem(originalIndex)}
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
                          <span className="font-medium text-foreground">{getStaffName(record)}</span>
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

      <div className="print:break-before-page">
        <ItemServingsManager />
      </div>
    </div>
  );
};

export default React.memo(RestaurantManagement);
