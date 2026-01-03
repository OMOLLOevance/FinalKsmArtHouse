'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ArrowLeft, Save, Printer, Calendar, Utensils, X, Plus, Minus, Search, Sparkles, CheckCircle2, CheckCircle, ListPlus, Receipt, Trash2, Edit2, Check } from 'lucide-react';
import ItemServingsManager from './ItemServingsManager';
import { useRestaurantInventory } from '@/hooks/useRestaurantInventory';
import { InventoryItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
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

interface LedgerEntry {
  id: string;
  item: string;
  quantity: string;
  price: string;
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
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [editingLedgerId, setEditingLedgerId] = useState<string | null>(null);
  const { showSuccess } = useToast();

  const { loading } = useRestaurantInventory(selectedMonth);

  // Load Inventory & Ledger from LocalStorage
  useEffect(() => {
    const loadData = () => {
      try {
        const storedInv = localStorage.getItem(`restaurant_inventory_${selectedDate}`);
        const storedLedger = localStorage.getItem(`restaurant_ledger_${selectedDate}`);
        
        if (storedInv) {
          setInventory(JSON.parse(storedInv));
        } else {
          setInventory(defaultItems.map(item => ({ item, quantity: '', price: '' })));
        }

        if (storedLedger) {
          setLedger(JSON.parse(storedLedger));
        } else {
          setLedger([]);
        }
      } catch (error) {
        logger.error('Error loading local data:', error);
        setInventory(defaultItems.map(item => ({ item, quantity: '', price: '' })));
        setLedger([]);
      }
    };
    loadData();
  }, [selectedDate]);

  // Auto-Save Effect
  useEffect(() => {
    if (inventory.length === 0 && ledger.length === 0) return;
    
    const timer = setTimeout(() => {
      setIsAutoSaving(true);
      localStorage.setItem(`restaurant_inventory_${selectedDate}`, JSON.stringify(inventory));
      localStorage.setItem(`restaurant_ledger_${selectedDate}`, JSON.stringify(ledger));
      setTimeout(() => setIsAutoSaving(false), 800);
    }, 1000);

    return () => clearTimeout(timer);
  }, [inventory, ledger, selectedDate]);

  const handleChange = useCallback((index: number, field: 'quantity' | 'price', value: string) => {
    setInventory(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
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
    
    // Add to ledger
    const newEntry: LedgerEntry = {
      id: Math.random().toString(36).substr(2, 9),
      item: item.item,
      quantity: item.quantity,
      price: item.price
    };
    
    setLedger(prev => [...prev, newEntry]);

    // Reset card inputs - Professional POS style
    setInventory(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], quantity: '', price: '' };
      return updated;
    });

    showSuccess('Recorded', `${item.item} committed to ledger`);
  };

  const handleUpdateLedger = (id: string, field: keyof LedgerEntry, value: string) => {
    setLedger(prev => prev.map(entry => 
      entry.id === id ? { ...entry, [field]: value } : entry
    ));
  };

  const handleRemoveLedgerEntry = (id: string) => {
    setLedger(prev => prev.filter(entry => entry.id !== id));
    showSuccess('Deleted', 'Entry removed from ledger');
  };

  const handleAddCustomItem = () => {
    const name = newItemName.trim();
    if (!name) return;
    
    setInventory(prev => [{ item: name, quantity: '', price: '' }, ...prev]);
    setNewItemName('');
    showSuccess('Added', `${name} added to entry list`);
  };

  const removeItemFromList = (index: number) => {
    setInventory(prev => prev.filter((_, i) => i !== index));
  };

  const totalCost = useMemo(() => {
    return calculateTotalCost(ledger.map(i => ({ price: i.price, quantity: i.quantity })));
  }, [ledger]);

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
                <span className="text-[10px] font-black uppercase text-slate-500">{ledger.length} Verified Entries</span>
              </div>
              <h3 className="text-6xl font-black tracking-tighter text-primary">{formatCurrency(totalCost)}</h3>
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400">Total Ledger Validated Restaurant Outgoings</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => window.print()} 
              className="h-14 px-10 font-black uppercase tracking-widest text-xs rounded-xl border-white/10 hover:bg-white hover:text-black transition-all shadow-2xl"
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
          const hasData = item.quantity && item.price;
          
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
                  <Button 
                    onClick={() => handleRecordItem(originalIndex)}
                    disabled={!hasData}
                    variant={hasData ? "default" : "outline"}
                    className={`w-full h-10 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all ${
                      hasData ? 'shadow-md shadow-primary/10' : 'opacity-40'
                    }`}
                  >
                    {hasData ? 'Confirm Entry' : 'Enter Details'}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Confirmed Purchase Ledger */}
      {ledger.length > 0 && (
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
                {ledger.length} ENTRIES VERIFIED
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
                    <th className="px-8 py-5 text-center text-[10px] font-black uppercase text-muted-foreground tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/5">
                  {ledger.map((item) => {
                    const isEditing = editingLedgerId === item.id;
                    return (
                      <tr key={item.id} className="hover:bg-primary/[0.02] transition-colors group">
                        <td className="px-8 py-5">
                          <span className="font-black text-sm text-foreground uppercase tracking-tight">{item.item}</span>
                        </td>
                        <td className="px-8 py-5 text-center">
                          {isEditing ? (
                            <Input 
                              value={item.quantity}
                              onChange={(e) => handleUpdateLedger(item.id, 'quantity', e.target.value)}
                              className="w-20 mx-auto h-9 text-xs font-black bg-muted border-none text-center rounded-lg"
                            />
                          ) : (
                            <span className="font-black text-xs bg-muted px-4 py-1.5 rounded-xl border border-primary/5 shadow-sm">{item.quantity}</span>
                          )}
                        </td>
                        <td className="px-8 py-5 text-right">
                          {isEditing ? (
                            <div className="relative inline-block w-32">
                              <Input 
                                type="number"
                                value={item.price}
                                onChange={(e) => handleUpdateLedger(item.id, 'price', e.target.value)}
                                className="w-full h-9 text-xs font-black text-success bg-muted border-none text-right pr-8 rounded-lg"
                              />
                              <span className="absolute right-2 top-2.5 text-[8px] font-black text-success/40">KSH</span>
                            </div>
                          ) : (
                            <span className="font-mono text-sm text-muted-foreground">{Number(item.price).toLocaleString()}</span>
                          )}
                        </td>
                        <td className="px-8 py-5 text-right">
                          <span className="font-black text-sm text-primary tracking-tight">
                            {formatCurrency(Number(item.price) * Number(item.quantity))}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            {isEditing ? (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => {
                                  setEditingLedgerId(null);
                                  showSuccess('Saved', 'Ledger entry updated');
                                }}
                                className="h-8 w-8 bg-success/10 text-success hover:bg-success hover:text-white rounded-full transition-all"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => setEditingLedgerId(item.id)}
                                className="h-8 w-8 text-primary/40 hover:text-primary hover:bg-primary/10 rounded-full transition-all"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleRemoveLedgerEntry(item.id)}
                              className="h-8 w-8 text-destructive/40 hover:text-destructive hover:bg-destructive/10 rounded-full transition-all"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
              {ledger.map((item) => {
                const isEditing = editingLedgerId === item.id;
                return (
                  <div key={item.id} className="p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Item Particulars</p>
                        <h4 className="font-black text-lg text-foreground uppercase">{item.item}</h4>
                      </div>
                      <div className="flex gap-2">
                        {isEditing ? (
                          <Button size="icon" variant="ghost" className="h-10 w-10 bg-success/10 text-success rounded-full" onClick={() => setEditingLedgerId(null)}>
                            <Check className="h-5 w-5" />
                          </Button>
                        ) : (
                          <Button size="icon" variant="ghost" className="h-10 w-10 bg-primary/5 text-primary rounded-full" onClick={() => setEditingLedgerId(item.id)}>
                            <Edit2 className="h-5 w-5" />
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" className="h-10 w-10 bg-destructive/5 text-destructive rounded-full" onClick={() => handleRemoveLedgerEntry(item.id)}>
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400">Qty</label>
                        {isEditing ? (
                          <Input 
                            value={item.quantity}
                            onChange={(e) => handleUpdateLedger(item.id, 'quantity', e.target.value)}
                            className="h-10 font-black bg-muted rounded-xl border-none"
                          />
                        ) : (
                          <p className="font-black text-sm">{item.quantity}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400">Price</label>
                        {isEditing ? (
                          <Input 
                            type="number"
                            value={item.price}
                            onChange={(e) => handleUpdateLedger(item.id, 'price', e.target.value)}
                            className="h-10 font-black bg-muted rounded-xl border-none text-success"
                          />
                        ) : (
                          <p className="font-black text-sm text-success">{formatCurrency(Number(item.price))}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center bg-primary/5 p-4 rounded-2xl border border-primary/5">
                      <p className="text-[9px] font-black text-primary uppercase tracking-tighter">Verified Total</p>
                      <p className="text-sm font-black text-primary">{formatCurrency(Number(item.price) * Number(item.quantity))}</p>
                    </div>
                  </div>
                );
              })}
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
            {ledger.map((item, index) => (
              <tr key={index}>
                <td className="py-2 text-xs font-bold uppercase">{item.item}</td>
                <td className="py-2 text-xs text-center">{item.quantity || '-'}</td>
                <td className="py-2 text-xs text-right font-mono">{item.price ? Number(item.price).toLocaleString() : '-'}</td>
                <td className="py-2 text-xs text-right font-black font-mono">
                  {formatCurrency(Number(item.price) * Number(item.quantity))}
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