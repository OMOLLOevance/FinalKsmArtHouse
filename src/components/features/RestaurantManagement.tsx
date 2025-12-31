'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Printer, Database, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import ItemServingsManager from './ItemServingsManager';
import { useRestaurantInventory } from '@/hooks/useRestaurantInventory';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';

interface RestaurantManagementProps {
  onBack?: () => void;
}

interface InventoryItem {
  item: string;
  quantity: string;
  price: string;
}

const defaultItems = [
  'Onions',
  'Ginger',
  'Hoho',
  'Beans',
  'Njugu',
  'Carrots',
  'Mboga Kienyeji',
  'Kuku Kienyeji',
  'Bananas',
  'Lemon',
  'Matumbo',
  'Beef',
  'Eggs',
  'Fruits',
  'Cabbage',
  'Dania',
  'Fish',
  'Charcoal',
  'Tomatoes (kg)',
  'Potatoes (kg)',
  'Melon (pieces)',
  'Mangoes (kg)',
  'Tomato Sauce (litres)',
  'Garlic (kg)',
  'Crisps (grams/kg)',
  'Transport',
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

  const { inventory: dbInventory, loading, addInventoryItem, refetch: fetchInventory } = useRestaurantInventory(selectedMonth);

  useEffect(() => {
    loadInventory();
  }, [selectedDate]);

  const loadInventory = () => {
    try {
      const stored = localStorage.getItem(`restaurant_inventory_${selectedDate}`);
      if (stored) {
        setInventory(JSON.parse(stored));
      } else {
        setInventory(defaultItems.map(item => ({ item, quantity: '', price: '' })));
      }
    } catch (error) {
      console.error('Error loading inventory:', error);
      setInventory(defaultItems.map(item => ({ item, quantity: '', price: '' })));
    }
  };

  const handleChange = (index: number, field: 'quantity' | 'price', value: string) => {
    const updated = [...inventory];
    updated[index][field] = value;
    setInventory(updated);
  };

  const handleSaveToDatabase = async () => {
    setIsSaving(true);
    try {
      let savedCount = 0;

      for (const item of inventory) {
        if (item.quantity && item.price) {
          const quantity = parseFloat(item.quantity) || 0;
          const unitPrice = parseFloat(item.price) || 0;
          const totalCost = quantity * unitPrice;

          await addInventoryItem({
            name: item.item,
            category: 'general',
            quantity: quantity,
            unit: 'pieces',
            unitPrice: unitPrice,
            totalValue: quantity * unitPrice,
            lastUpdated: new Date().toISOString()
          } as any);

          savedCount++;
        }
      }

      localStorage.setItem(`restaurant_inventory_${selectedDate}`, JSON.stringify(inventory));

      // Refresh data
      await fetchInventory();

      showSuccess(
        'Restaurant Inventory Saved!',
        `Successfully saved ${savedCount} items to database for ${new Date(selectedDate).toLocaleDateString()}. Total value: KSH ${calculateTotal().toLocaleString()}. Admin can now see your restaurant data.`
      );
    } catch (error: any) {
      console.error('Error saving to database:', error);
      showError(
        'Database Save Failed',
        'Failed to save to database: ' + error.message
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = () => {
    try {
      localStorage.setItem(`restaurant_inventory_${selectedDate}`, JSON.stringify(inventory));
      showSuccess(
        'Inventory Saved Locally!',
        `Inventory saved to local storage for ${new Date(selectedDate).toLocaleDateString()}. Total value: KSH ${calculateTotal().toLocaleString()}. Click "Save to Database" button to sync with admin.`
      );
    } catch (error) {
      console.error('Error saving inventory:', error);
      showError(
        'Save Failed',
        'Error saving inventory to local storage. Please try again.'
      );
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const calculateTotal = () => {
    return inventory.reduce((total, item) => {
      const price = parseFloat(item.price) || 0;
      return total + price;
    }, 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center space-x-2">
          {onBack && (
            <Button variant="outline" size="sm" onClick={onBack} className="flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          )}
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Restaurant Management</h2>
            <p className="text-muted-foreground">Monthly Inventory & Expenses</p>
          </div>
        </div>
      </div>

      {/* Collapsible Database Save Panel */}
      <Card className="print:hidden border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <Button
            variant="ghost"
            onClick={() => setShowDatabasePanel(!showDatabasePanel)}
            className="w-full flex items-center justify-between hover:bg-primary/10 p-0 h-auto"
          >
            <div className="flex items-center space-x-3 text-left">
              <div className="p-2 bg-primary/20 rounded-full">
                <Database className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg text-primary">Save to Database</CardTitle>
                <CardDescription className="text-muted-foreground">Click to save restaurant inventory to database for admin</CardDescription>
              </div>
            </div>
            {showDatabasePanel ? (
              <ChevronUp className="h-5 w-5 text-primary" />
            ) : (
              <ChevronDown className="h-5 w-5 text-primary" />
            )}
          </Button>
        </CardHeader>

        {showDatabasePanel && (
          <CardContent className="pt-2">
            <div className="space-y-4">
              <div className="bg-blue-500/10 border-l-4 border-blue-500 p-4 rounded-md">
                <h4 className="font-semibold text-blue-600 mb-2 text-sm">What this does:</h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                  <li>Saves all inventory items with quantities and prices to Supabase database</li>
                  <li>Makes data visible to admin on all devices</li>
                  <li>Ensures data never gets lost</li>
                  <li>Enables cross-device synchronization</li>
                  <li>Keeps local backup in browser storage</li>
                </ul>
              </div>

              <Button
                onClick={handleSaveToDatabase}
                disabled={isSaving}
                className={`w-full h-12 text-lg ${isSaving ? 'opacity-70 cursor-not-allowed' : 'bg-primary hover:bg-primary/90 text-primary-foreground'}`}
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground mr-2"></div>
                    Saving to Database...
                  </>
                ) : (
                  <>
                    <Database className="h-5 w-5 mr-2" />
                    Save Restaurant Inventory to Database
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                <strong>Note:</strong> Filled items with both quantity and price will be saved to database
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Date Selection */}
      <Card className="print:hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center">
            <Calendar className="mr-2 h-4 w-4" />
            Select Date for Stock Taking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full sm:w-auto text-base"
            />
            <p className="text-sm text-muted-foreground">Select any date to view or create stock records for that day</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="print:block text-center pb-2">
          <CardTitle className="text-xl print:text-2xl">
            Inventory & Expenses
          </CardTitle>
          <CardDescription>
            {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground uppercase w-1/3">
                    Items
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground uppercase w-1/3">
                    Quantities
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground uppercase w-1/3">
                    Price (KSH)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {inventory.map((item, index) => (
                  <tr key={index} className="hover:bg-muted/30">
                    <td className="px-4 py-2 text-sm font-medium text-foreground">
                      {item.item}
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        type="text"
                        value={item.quantity}
                        onChange={(e) => handleChange(index, 'quantity', e.target.value)}
                        className="h-8 print:border-0 print:p-0 print:bg-transparent print:h-auto"
                        placeholder="e.g., 10kg"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        type="number"
                        step="0.01"
                        value={item.price}
                        onChange={(e) => handleChange(index, 'price', e.target.value)}
                        className="h-8 print:border-0 print:p-0 print:bg-transparent print:h-auto"
                        placeholder="0.00"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-between items-center border-t pt-4">
            <div className="text-xl font-bold">
              Total:
            </div>
            <div className="text-2xl font-bold text-emerald-500">
              KSH {calculateTotal().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex gap-4 print:hidden pt-0 pb-6 px-6">
          <Button
            onClick={handleSave}
            className="flex-1"
            variant="default" // Using default (primary) color for Save
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button
            onClick={handlePrint}
            className="flex-1"
            variant="outline"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </CardFooter>
      </Card>

      <ItemServingsManager />

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .bg-white, .bg-white * {
            visibility: visible;
          }
          .bg-white { // Targeting the Card specifically if it has this class, or we might need a specific print class
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            box-shadow: none;
            border-radius: 0;
            border: none;
          }
          // Override global print hide for the card content
          .space-y-6 > .rounded-lg { 
             visibility: visible;
             position: absolute;
             top: 0;
             left: 0;
             width: 100%;
          }
          
          input {
            border: none !important;
            padding: 0 !important;
            background: transparent !important;
            font-size: 13px !important;
            box-shadow: none !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          th, td {
            border: 1px solid #ddd !important;
            padding: 8px !important;
            text-align: left;
          }
          .card-content {
             padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default RestaurantManagement;