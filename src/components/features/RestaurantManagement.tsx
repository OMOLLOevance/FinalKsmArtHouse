'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ArrowLeft, Save, Printer, Database, ChevronDown, ChevronUp, Calendar, Utensils, X, Plus, Minus, Search, Sparkles, CheckCircle2 } from 'lucide-react';
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
  const { showSuccess, showError } = useToast();

  const { loading, refetch: fetchInventory } = useRestaurantInventory(selectedMonth);

  // Load Inventory
  useEffect(() => {
    const loadInventory = () => {
      try {
        const stored = localStorage.getItem(`restaurant_inventory_${selectedDate}`);
        if (stored) {
          setInventory(JSON.parse(stored));
        } else {
          setInventory(defaultItems.map(item => ({ item, quantity: '', price: '' })));
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
  }, []);

  const adjustQuantity = (index: number, delta: number) => {
    const currentQty = parseFloat(inventory[index].quantity) || 0;
    const newQty = Math.max(0, currentQty + delta);
    handleChange(index, 'quantity', newQty.toString());
  };

  const handleAddCustomItem = () => {
    if (!newItemName.trim()) return;
    setInventory(prev => [{ item: newItemName.trim(), quantity: '', price: '' }, ...prev]);
    setNewItemName('');
    showSuccess('Added', `${newItemName} added to today's list`);
  };

  const removeItem = (index: number) => {
    setInventory(prev => prev.filter((_, i) => i !== index));
  };

  const totalCost = useMemo(() => {
    return calculateTotalCost(inventory.map(i => ({ price: i.price, quantity: i.quantity })));
  }, [inventory]);

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
            <h2 className="text-3xl font-black tracking-tight text-primary uppercase">Restaurant</h2>
            <p className="text-muted-foreground italic text-[10px] uppercase font-black tracking-[0.2em] opacity-70">Strategic Asset & Expense Control</p>
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
                <Save className="h-3 w-3 mr-1" /> Auto-Saving...
              </span>
            ) : (
              <span className="flex items-center text-[9px] font-black text-success uppercase tracking-widest">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Records Synced
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Expense Summary Banner */}
      <Card className="bg-primary text-primary-foreground shadow-2xl border-none overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
          <Utensils className="h-32 w-32 rotate-12" />
        </div>
        <CardContent className="p-8 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-70">Accumulated Daily Expenditure</p>
              <h3 className="text-5xl font-black tracking-tighter">{formatCurrency(totalCost)}</h3>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="secondary" 
                onClick={() => window.print()} 
                className="h-12 px-8 font-black uppercase tracking-widest text-xs rounded-xl shadow-xl"
              >
                <Printer className="h-4 w-4 mr-2" /> Generate Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Quick Add */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:hidden">
        <div className="relative group">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search inventory..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 bg-background border-primary/10 rounded-xl"
          />
        </div>
        <div className="flex gap-2">
          <Input 
            placeholder="Add new custom item (e.g. Napkins)..." 
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCustomItem()}
            className="h-11 bg-background border-primary/10 rounded-xl flex-1"
          />
          <Button onClick={handleAddCustomItem} className="h-11 px-6 rounded-xl font-black uppercase tracking-widest text-[10px]">
            <Plus className="h-4 w-4 mr-2" /> Quick Add
          </Button>
        </div>
      </div>

      {/* Inventory Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 print:hidden">
        {filteredInventory.map((item, index) => {
          const originalIndex = inventory.findIndex(i => i === item);
          const hasData = item.quantity || item.price;
          
          return (
            <Card key={`${item.item}-${index}`} className={`overflow-hidden transition-all duration-500 border-l-4 group ${
              hasData ? 'border-l-primary bg-primary/5 shadow-md scale-[1.02]' : 'border-l-muted hover:border-l-primary/40'
            }`}>
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between border-b pb-2 border-primary/5">
                  <div className="flex items-center space-x-2 min-w-0">
                    <Utensils className={`h-3.5 w-3.5 transition-colors ${hasData ? 'text-primary' : 'text-muted-foreground opacity-40'}`} />
                    <h4 className="text-sm font-black truncate uppercase tracking-tight">{item.item}</h4>
                  </div>
                  {!defaultItems.includes(item.item) && (
                    <Button variant="ghost" size="icon" onClick={() => removeItem(originalIndex)} className="h-6 w-6 text-destructive/40 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Quantity</label>
                      <div className="flex gap-1">
                        <button onClick={() => adjustQuantity(originalIndex, -1)} className="h-4 w-4 flex items-center justify-center rounded bg-muted hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors">
                          <Minus className="h-2 w-2" />
                        </button>
                        <button onClick={() => adjustQuantity(originalIndex, 1)} className="h-4 w-4 flex items-center justify-center rounded bg-muted hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors">
                          <Plus className="h-2 w-2" />
                        </button>
                      </div>
                    </div>
                    <Input
                      value={item.quantity}
                      onChange={(e) => handleChange(originalIndex, 'quantity', e.target.value)}
                      className="h-9 text-xs font-black bg-background border-primary/5 shadow-sm text-center"
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black uppercase text-muted-foreground tracking-widest block">Unit Price</label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={item.price}
                        onChange={(e) => handleChange(originalIndex, 'price', e.target.value)}
                        className="h-9 text-xs font-black text-success bg-background border-primary/5 shadow-sm pr-6"
                        placeholder="0"
                      />
                      <span className="absolute right-2 top-2.5 text-[8px] font-black text-success/40">KSH</span>
                    </div>
                  </div>
                </div>

                {parseFloat(item.quantity) > 0 && parseFloat(item.price) > 0 && (
                  <div className="flex justify-between items-center pt-2 mt-1 border-t border-primary/5 animate-in fade-in slide-in-from-top-1">
                    <span className="text-[8px] font-black text-muted-foreground uppercase">Subtotal</span>
                    <span className="text-xs font-black text-primary">{formatCurrency(parseFloat(item.quantity) * parseFloat(item.price))}</span>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

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
            {inventory.filter(i => i.quantity || i.price).map((item, index) => (
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
              <td colSpan={3} className="py-4 text-right text-sm uppercase tracking-widest">Grand Total:</td>
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
