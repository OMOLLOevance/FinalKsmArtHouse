'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ArrowLeft, Save, Printer, Database, ChevronDown, ChevronUp, Calendar, Utensils, X } from 'lucide-react';
import ItemServingsManager from './ItemServingsManager';
import { useRestaurantInventory } from '@/hooks/useRestaurantInventory';
import { InventoryItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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
  const [showDatabasePanel, setShowDatabasePanel] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { showSuccess, showError } = useToast();

  const { addInventoryItem, loading, refetch: fetchInventory } = useRestaurantInventory(selectedMonth);

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

  const handleChange = useCallback((index: number, field: 'quantity' | 'price', value: string) => {
    setInventory(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  const totalCost = useMemo(() => {
    return calculateTotalCost(inventory.map(i => ({ price: i.price, quantity: 1 })));
  }, [inventory]);

  const handleSaveToDatabase = async () => {
    setIsSaving(true);
    try {
      const itemsToSave = inventory.filter(item => item.quantity && item.price);
      logger.info('Syncing restaurant inventory to database...', { date: selectedDate, count: itemsToSave.length });
      
      await Promise.all(itemsToSave.map(item => {
        const quantity = parseFloat(item.quantity) || 0;
        const unitPrice = parseFloat(item.price) || 0;

        return addInventoryItem({
          name: item.item,
          category: 'general',
          quantity: quantity,
          unit: 'pieces',
          unitPrice: unitPrice,
          totalValue: quantity * unitPrice,
          lastUpdated: new Date().toISOString()
        } as any);
      }));

      localStorage.setItem(`restaurant_inventory_${selectedDate}`, JSON.stringify(inventory));
      await fetchInventory();

      showSuccess('Success', `Synced ${itemsToSave.length} items to database`);
    } catch (error: any) {
      logger.error('Database sync failed:', error);
      showError('Sync Failed', error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = () => {
    try {
      localStorage.setItem(`restaurant_inventory_${selectedDate}`, JSON.stringify(inventory));
      showSuccess('Saved', 'Inventory saved locally');
    } catch (error) {
      logger.error('Local save failed:', error);
      showError('Error', 'Failed to save locally');
    }
  };

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
    <div className="space-y-6">
      {/* Branded Header - Print Only */}
      <div className="hidden print:block text-center border-b-4 border-primary pb-4 mb-8">
        <h1 className="text-4xl font-black tracking-tighter text-primary">KISUMU ART HOUSE</h1>
        <p className="text-sm font-bold uppercase tracking-[0.3em]">Restaurant Inventory & Expenses</p>
        <p className="text-xs mt-2 font-medium">Record Date: {selectedDate}</p>
      </div>

      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center space-x-2">
          {onBack && (
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-primary">Restaurant Management</h2>
            <p className="text-muted-foreground italic text-xs uppercase font-black tracking-widest opacity-70">Inventory & Expenses</p>
          </div>
        </div>
      </div>

      <Card className="print:hidden border-primary/20 bg-primary/5 shadow-none glass-card glow-primary">
        <CardHeader className="pb-2">
          <Button
            variant="ghost"
            onClick={() => setShowDatabasePanel(!showDatabasePanel)}
            className="w-full flex items-center justify-between p-0 h-auto hover:bg-transparent"
          >
            <div className="flex items-center space-x-3 text-left">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Database className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Database Sync</CardTitle>
                <CardDescription>Save this day's records to cloud</CardDescription>
              </div>
            </div>
            {showDatabasePanel ? <ChevronUp /> : <ChevronDown />}
          </Button>
        </CardHeader>

        {showDatabasePanel && (
          <CardContent className="pt-4">
            <Button
              onClick={handleSaveToDatabase}
              disabled={isSaving}
              className="w-full h-11 font-bold shadow-lg shadow-primary/20"
            >
              {isSaving ? 'Syncing...' : 'Sync to Database'}
            </Button>
          </CardContent>
        )}
      </Card>

      <Card className="print:hidden glass-card">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Calendar className="h-5 w-5 text-primary opacity-70" />
            <div className="flex-1 max-w-[200px]">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest block mb-1">Select Date</label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-background font-bold h-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/10 shadow-sm print:shadow-none print:border-none glass-card">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4 mb-6 print:hidden">
          <div>
            <CardTitle className="text-xl font-bold">Daily Inventory</CardTitle>
            <CardDescription className="text-xs">{selectedDate}</CardDescription>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Total Expenses</p>
            <p className="text-xl font-black text-success tracking-tighter">{formatCurrency(totalCost)}</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 print:hidden">
            {inventory.map((item, index) => (
              <Card key={index} className="overflow-hidden border-muted hover:border-primary/30 hover-lift transition-all duration-300">
                <div className="p-3 space-y-3">
                  <div className="flex items-center space-x-2 border-b pb-2 border-primary/5">
                    <Utensils className="h-3.5 w-3.5 text-primary opacity-70" />
                    <h4 className="text-sm font-bold truncate">{item.item}</h4>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-muted-foreground/70 tracking-tighter">Qty</label>
                      <Input
                        value={item.quantity}
                        onChange={(e) => handleChange(index, 'quantity', e.target.value)}
                        className="h-8 text-xs font-bold bg-background border-none shadow-inner"
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-muted-foreground/70 tracking-tighter">Price (KSH)</label>
                      <Input
                        type="number"
                        value={item.price}
                        onChange={(e) => handleChange(index, 'price', e.target.value)}
                        className="h-8 text-xs font-bold text-success bg-background border-none shadow-inner"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

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
                      {item.price && item.quantity ? (Number(item.price) * 1).toLocaleString() : '-'}
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

          <div className="mt-8 flex flex-col sm:flex-row justify-between items-center bg-muted/20 p-4 rounded-xl border border-primary/10 gap-4 print:hidden">
            <div className="text-center sm:text-left">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] block mb-1">Accumulated Cost</span>
              <span className="text-3xl font-black text-primary tracking-tighter">{formatCurrency(totalCost)}</span>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <Button onClick={handleSave} className="flex-1 sm:flex-none h-11 px-8 font-bold shadow-lg">
                <Save className="h-4 w-4 mr-2" /> Save Local
              </Button>
              <Button onClick={() => window.print()} variant="outline" className="flex-1 sm:flex-none h-11 px-8 font-bold">
                <Printer className="h-4 w-4 mr-2" /> Print
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="print:break-before-page">
        <ItemServingsManager />
      </div>
    </div>
  );
};

export default React.memo(RestaurantManagement);