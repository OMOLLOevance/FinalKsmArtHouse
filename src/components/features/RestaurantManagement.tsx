'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ArrowLeft, Save, Printer, Database, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import ItemServingsManager from './ItemServingsManager';
import { useRestaurantInventory } from '@/hooks/useRestaurantInventory';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { calculateTotalCost } from '@/utils/calculations';
import { formatCurrency } from '@/utils/formatters';
import { logger } from '@/lib/logger';

interface RestaurantManagementProps {
  onBack?: () => void;
}

interface InventoryItem {
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
  const [showDatabasePanel, setShowDatabasePanel] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { showSuccess, showError } = useToast();

  const { addInventoryItem, refetch: fetchInventory } = useRestaurantInventory(selectedMonth);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center space-x-2">
          {onBack && (
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Restaurant Management</h2>
            <p className="text-muted-foreground">Inventory & Expenses</p>
          </div>
        </div>
      </div>

      <Card className="print:hidden border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <Button
            variant="ghost"
            onClick={() => setShowDatabasePanel(!showDatabasePanel)}
            className="w-full flex items-center justify-between p-0 h-auto"
          >
            <div className="flex items-center space-x-3 text-left">
              <Database className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-lg">Database Sync</CardTitle>
                <CardDescription>Save this day's records to cloud</CardDescription>
              </div>
            </div>
            {showDatabasePanel ? <ChevronUp /> : <ChevronDown />}
          </Button>
        </CardHeader>

        {showDatabasePanel && (
          <CardContent>
            <Button
              onClick={handleSaveToDatabase}
              disabled={isSaving}
              className="w-full"
            >
              {isSaving ? 'Syncing...' : 'Sync to Database'}
            </Button>
          </CardContent>
        )}
      </Card>

      <Card className="print:hidden">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daily Inventory</CardTitle>
          <CardDescription>{selectedDate}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead>
                <tr className="bg-muted">
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase w-1/3">Item</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase w-1/3">Qty</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase w-1/3">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {inventory.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 text-sm">{item.item}</td>
                    <td className="px-4 py-2">
                      <Input
                        value={item.quantity}
                        onChange={(e) => handleChange(index, 'quantity', e.target.value)}
                        className="h-8"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        type="number"
                        value={item.price}
                        onChange={(e) => handleChange(index, 'price', e.target.value)}
                        className="h-8"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 flex justify-between items-center border-t pt-4">
            <span className="text-xl font-bold">Total:</span>
            <span className="text-2xl font-bold text-success">{formatCurrency(totalCost)}</span>
          </div>

        </CardContent>
        <CardFooter className="flex gap-4 print:hidden">
          <Button onClick={handleSave} className="flex-1">
            <Save className="h-4 w-4 mr-2" /> Save Local
          </Button>
          <Button onClick={() => window.print()} variant="outline" className="flex-1">
            <Printer className="h-4 w-4 mr-2" /> Print
          </Button>
        </CardFooter>
      </Card>

      <ItemServingsManager />
    </div>
  );
};

export default React.memo(RestaurantManagement);
