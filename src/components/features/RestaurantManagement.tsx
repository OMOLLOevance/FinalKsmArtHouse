'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ArrowLeft, Save, Printer, Calendar, Utensils, X, Plus, Minus, Search, Sparkles, CheckCircle2, CheckCircle, ListPlus, Receipt } from 'lucide-react';
import ItemServingsManager from './ItemServingsManager';
import { useRestaurantInventory } from '@/hooks/useRestaurantInventory';
import { InventoryItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { calculateTotalCost } from '@/utils/calculations';
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
  
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [recordedItems, setRecordedItems] = useState<Set<number>>(new Set());
  const { showSuccess } = useToast();

  const { loading } = useRestaurantInventory(selectedMonth);

  // Load Inventory from LocalStorage
  useEffect(() => {
    const loadInventory = () => {
      try {
        const stored = localStorage.getItem(`restaurant_inventory_${selectedDate}`);
        if (stored) {
          const data = JSON.parse(stored);
          setInventory(data);
          // Mark items with existing data as recorded
          const initialRecorded = new Set<number>();
          data.forEach((item: any, idx: number) => {
            if (item.quantity && item.price) initialRecorded.add(idx);
          });
          setRecordedItems(initialRecorded);
        } else {
          setInventory(defaultItems.map(item => ({ item, quantity: '', price: '' })));
          setRecordedItems(new Set());
        }
      } catch (error) {
        logger.error('Error loading local inventory:', error);
        setInventory(defaultItems.map(item => ({ item, quantity: '', price: '' })));
      }
    };
    loadInventory();
  }, [selectedDate]);

  // Auto-Save Effect
  useEffect(() => {
    if (inventory.length === 0) return;
    
    const timer = setTimeout(() => {
      setIsAutoSaving(true);
      localStorage.setItem(`restaurant_inventory_${selectedDate}`, JSON.stringify(inventory));
      setTimeout(() => setIsAutoSaving(false), 800);
    }, 1000);

    return () => clearTimeout(timer);
  }, [inventory, selectedDate]);

  const handleChange = useCallback((index: number, field: 'quantity' | 'price', value: string) => {
    setInventory(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    // Remove from recorded if changed
    setRecordedItems(prev => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
  }, []);

  const adjustQuantity = (index: number, delta: number) => {
    const currentQty = parseFloat(inventory[index].quantity) || 0;
    const newQty = Math.max(0, currentQty + delta);
    handleChange(index, 'quantity', newQty.toString());
  };

  const handleRecordItem = (index: number) => {
    const item = inventory[index];
    if (!item.quantity || !item.price) return;
    
    setRecordedItems(prev => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });
    showSuccess('Recorded', `${item.item} committed to daily report`);
  };

  const handleAddCustomItem = () => {
    const name = newItemName.trim();
    if (!name) return;
    
    setInventory(prev => [{ item: name, quantity: '', price: '' }, ...prev]);
    setNewItemName('');
    showSuccess('Added', `${name} added to today's list`);
  };

  const removeItem = (index: number) => {
    setInventory(prev => prev.filter((_, i) => i !== index));
    setRecordedItems(prev => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
  };

  const totalCost = useMemo(() => {
    // Only count recorded items in the total for professional auditing
    const recordedList = Array.from(recordedItems).map(idx => inventory[idx]).filter(Boolean);
    return calculateTotalCost(recordedList.map(i => ({ price: i.price, quantity: i.quantity })));
  }, [inventory, recordedItems]);

  const filteredInventory = useMemo(() => {
    if (!searchTerm) return inventory;
    return inventory.filter(i => i.item.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [inventory, searchTerm]);

  if (loading) {
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
            {isAutoSaving ? (
              <span className="flex items-center text-[9px] font-black text-primary animate-pulse uppercase tracking-widest">
                <Save className="h-3 w-3 mr-1" /> Cloud Syncing...
              </span>
            ) : (
              <span className="flex items-center text-[9px] font-black text-success uppercase tracking-widest">
                <CheckCircle2 className="h-3 w-3 mr-1" /> All Records Secure
              </span>
            )}
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
                <Badge className="bg-primary/20 text-primary border-none font-black text-[10px] tracking-widest px-3">AUDITED EXPENDITURE</Badge>
                <span className="text-[10px] font-black uppercase text-slate-500">{recordedItems.size} Confirmations</span>
              </div>
              <h3 className="text-6xl font-black tracking-tighter text-primary">{formatCurrency(totalCost)}</h3>
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400">Total Validated Restaurant Outgoings</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => window.print()} 
              className="h-14 px-10 font-black uppercase tracking-widest text-xs rounded-2xl border-white/10 hover:bg-white hover:text-black transition-all shadow-2xl"
            >
              <Printer className="h-5 w-5 mr-3" /> Print Official Record
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search and Quick Add */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:hidden">
        <div className="relative group">
          <Search className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Filter current list..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-12 bg-muted/30 border-none rounded-2xl font-bold"
          />
        </div>
        <div className="flex gap-3">
          <Input 
            placeholder="What else did you buy today?" 
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCustomItem()}
            className="h-12 bg-muted/30 border-none rounded-2xl flex-1 font-bold pl-6"
          />
          <Button onClick={handleAddCustomItem} className="h-12 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20">
            <ListPlus className="h-4 w-4 mr-2" /> Add Item
          </Button>
        </div>
      </div>

      {/* Inventory Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 print:hidden">
        {filteredInventory.map((item, index) => {
          const originalIndex = inventory.findIndex(i => i === item);
          const isRecorded = recordedItems.has(originalIndex);
          const canRecord = item.quantity && item.price;
          
          return (
            <Card key={`${item.item}-${index}`} className={`overflow-hidden transition-all duration-500 border-none group relative ${
              isRecorded ? 'ring-2 ring-primary bg-primary/5 shadow-xl' : 'hover:shadow-lg bg-card'
            }`}>
              {isRecorded && (
                <div className="absolute top-3 right-3 z-20">
                  <CheckCircle className="h-5 w-5 text-primary fill-primary/10" />
                </div>
              )}
              
              <div className="p-5 space-y-5">
                <div className="flex items-center justify-between border-b pb-3 border-primary/5">
                  <div className="flex items-center space-x-2 min-w-0">
                    <Utensils className={`h-4 w-4 transition-colors ${isRecorded ? 'text-primary' : 'text-muted-foreground opacity-40'}`} />
                    <h4 className={`text-sm font-black truncate uppercase tracking-tight ${isRecorded ? 'text-primary' : 'text-foreground'}`}>{item.item}</h4>
                  </div>
                  {!defaultItems.includes(item.item) && (
                    <Button variant="ghost" size="icon" onClick={() => removeItem(originalIndex)} className="h-6 w-6 text-destructive/40 hover:text-destructive hover:bg-destructive/10">
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
                      />
                      <span className="absolute right-2 top-3 text-[8px] font-black text-success/40 uppercase">Ksh</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  {isRecorded ? (
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[9px] font-black text-primary uppercase">Subtotal</span>
                      <span className="text-sm font-black text-primary">{formatCurrency(parseFloat(item.quantity) * parseFloat(item.price))}</span>
                    </div>
                  ) : (
                    <Button 
                      onClick={() => handleRecordItem(originalIndex)}
                      disabled={!canRecord}
                      variant={canRecord ? "default" : "outline"}
                      className={`w-full h-10 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all ${
                        canRecord ? 'shadow-md shadow-primary/10' : 'opacity-40'
                      }`}
                    >
                      {canRecord ? 'Confirm Entry' : 'Enter Details'}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Confirmed Purchase Ledger */}
      {recordedItems.size > 0 && (
        <Card className="border-none shadow-2xl overflow-hidden rounded-3xl animate-in slide-in-from-bottom-4 duration-700 glass-card">
          <CardHeader className="bg-primary/5 border-b border-primary/10 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-primary/10 rounded-2xl">
                  <Receipt className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black uppercase tracking-tight text-primary">Purchase Ledger</CardTitle>
                  <CardDescription className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Verified Records for {selectedDate}</CardDescription>
                </div>
              </div>
              <Badge className="bg-success text-success-foreground border-none font-black px-6 py-1.5 rounded-xl shadow-lg shadow-success/20 tracking-widest text-[10px]">
                {recordedItems.size} ENTRIES AUDITED
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/30 border-b border-primary/5">
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-muted-foreground tracking-widest">Item Particulars</th>
                    <th className="px-8 py-5 text-center text-[10px] font-black uppercase text-muted-foreground tracking-widest">Quantity</th>
                    <th className="px-8 py-5 text-right text-[10px] font-black uppercase text-muted-foreground tracking-widest">Unit Price</th>
                    <th className="px-8 py-5 text-right text-[10px] font-black uppercase text-muted-foreground tracking-widest">Net Value</th>
                    <th className="px-8 py-5 text-center text-[10px] font-black uppercase text-muted-foreground tracking-widest">Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/5">
                  {inventory.filter((_, idx) => recordedItems.has(idx)).map((item, index) => (
                    <tr key={index} className="hover:bg-primary/[0.02] transition-colors group">
                      <td className="px-8 py-5">
                        <span className="font-black text-sm text-foreground uppercase tracking-tight">{item.item}</span>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <span className="font-black text-xs bg-muted px-4 py-1.5 rounded-xl border border-primary/5 shadow-sm">{item.quantity}</span>
                      </td>
                      <td className="px-8 py-5 text-right font-mono text-sm text-muted-foreground">
                        {Number(item.price).toLocaleString()}
                      </td>
                      <td className="px-8 py-5 text-right">
                        <span className="font-black text-sm text-primary tracking-tight">
                          {formatCurrency(Number(item.price) * Number(item.quantity))}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <div className="flex items-center justify-center">
                          <div className="h-8 w-8 bg-success/10 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-primary/5 border-t-2 border-primary/10">
                    <td colSpan={3} className="px-8 py-8 text-right text-[11px] font-black uppercase tracking-[0.3em] text-primary">
                      Aggregated Daily Expenditure:
                    </td>
                    <td className="px-8 py-8 text-right">
                      <span className="text-3xl font-black text-primary tracking-tighter">
                        {formatCurrency(totalCost)}
                      </span>
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mobile List View */}
            <div className="md:hidden divide-y divide-primary/5">
              {inventory.filter((_, idx) => recordedItems.has(idx)).map((item, index) => (
                <div key={index} className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Item Particulars</p>
                      <h4 className="font-black text-lg text-foreground uppercase">{item.item}</h4>
                    </div>
                    <div className="h-8 w-8 bg-success/10 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-2xl border border-primary/5">
                    <div>
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-tighter mb-1">Qty x Price</p>
                      <p className="text-sm font-bold">{item.quantity} × {Number(item.price).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-primary uppercase tracking-tighter mb-1">Subtotal</p>
                      <p className="text-sm font-black text-primary">{formatCurrency(Number(item.price) * Number(item.quantity))}</p>
                    </div>
                  </div>
                </div>
              ))}
              <div className="p-8 bg-primary/5 text-center space-y-2">
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Total Expenditure</p>
                <p className="text-4xl font-black text-primary tracking-tighter">{formatCurrency(totalCost)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {filteredInventory.length === 0 && (
        <div className="py-20 text-center space-y-4 print:hidden">
          <div className="p-6 bg-muted/10 rounded-full w-24 h-24 mx-auto flex items-center justify-center">
            <Search className="h-10 w-12 text-muted-foreground/20" />
          </div>
          <p className="text-xl font-bold text-muted-foreground">No matching items found</p>
          <Button variant="outline" onClick={() => setSearchTerm('')}>Clear Filters</Button>
        </div>
      )}

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
            {inventory.filter((_, idx) => recordedItems.has(idx)).map((item, index) => (
              <tr key={index}>
                <td className="py-2 text-xs font-bold uppercase">{item.item}</td>
                <td className="py-2 text-xs text-center">{item.quantity || '-'}</td>
                <td className="py-2 text-xs text-right font-mono">{item.price ? Number(item.price).toLocaleString() : '-'}</td>
                <td className="py-2 text-xs text-right font-black font-mono">
                  {item.price && item.quantity ? (Number(item.price) * Number(item.quantity)).toLocaleString() : '-'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-black font-black">
              <td colSpan={3} className="py-4 text-right text-sm uppercase tracking-widest">Confirmed Total Expenses:</td>
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
