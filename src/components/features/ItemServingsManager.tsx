'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Calculator, UtensilsCrossed, Users } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

interface FoodItem {
  name: string;
  servingPerKg: number;
  costPerKg: number;
}

const COMMON_ITEMS: FoodItem[] = [
  { name: 'Beef (Boneless)', servingPerKg: 8, costPerKg: 650 },
  { name: 'Chicken (Kienyeji)', servingPerKg: 6, costPerKg: 800 },
  { name: 'Rice', servingPerKg: 10, costPerKg: 180 },
  { name: 'Beans', servingPerKg: 12, costPerKg: 150 },
  { name: 'Potatoes (Waru)', servingPerKg: 5, costPerKg: 100 },
  { name: 'Cabbage/Greens', servingPerKg: 15, costPerKg: 60 },
];

/**
 * ItemServingsManager
 * A professional tool for restaurant managers to calculate required quantities 
 * and costs based on guest counts.
 */
const ItemServingsManager: React.FC = () => {
  const [guests, setGuests] = useState<number>(50);
  const [customItems, setCustomItems] = useState<FoodItem[]>(COMMON_ITEMS);

  const calculations = useMemo(() => {
    return customItems.map(item => {
      const requiredKg = Math.ceil((guests / item.servingPerKg) * 10) / 10;
      const totalCost = requiredKg * item.costPerKg;
      return {
        ...item,
        requiredKg,
        totalCost
      };
    });
  }, [guests, customItems]);

  const grandTotal = calculations.reduce((sum, item) => sum + item.totalCost, 0);

  return (
    <Card className="border-primary/10 shadow-lg">
      <CardHeader className="bg-primary/5 border-b border-primary/10">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Calculator className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl">Servings & Portion Estimator</CardTitle>
            <CardDescription>Calculate required stock quantities based on guest count</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-end gap-4 bg-muted/30 p-4 rounded-xl">
          <div className="flex-1 space-y-2">
            <label className="text-sm font-bold flex items-center">
              <Users className="h-4 w-4 mr-2 text-primary" />
              Number of Guests / Servings
            </label>
            <Input 
              type="number" 
              value={guests} 
              onChange={(e) => setGuests(Number(e.target.value))}
              className="bg-card text-lg font-bold"
              min={1}
            />
          </div>
          <div className="hidden sm:block text-muted-foreground pb-3 italic text-xs">
            Estimates are based on standard professional portion sizes
          </div>
        </div>

        <div className="overflow-x-auto border rounded-xl">
          <table className="min-w-full divide-y divide-border">
            <thead>
              <tr className="bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Food Item</th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider">Portion / KG</th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider">Required Qty</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider">Estimated Cost</th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {calculations.map((item, idx) => (
                <tr key={idx} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium flex items-center">
                    <UtensilsCrossed className="h-3 w-3 mr-2 text-muted-foreground opacity-50" />
                    {item.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-center text-muted-foreground">
                    {item.servingPerKg} pax
                  </td>
                  <td className="px-4 py-3 text-sm text-center font-bold text-primary">
                    {item.requiredKg} KG
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-mono">
                    {formatCurrency(item.totalCost)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-primary/5 font-bold">
                <td colSpan={3} className="px-4 py-4 text-right text-sm uppercase">Total Estimated Food Cost:</td>
                <td className="px-4 py-4 text-right text-lg text-primary">{formatCurrency(grandTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-lg text-xs text-muted-foreground">
          <strong>Note:</strong> These calculations are automated estimates for planning purposes. Market prices and actual portion requirements may vary based on event type and preparation methods.
        </div>
      </CardContent>
    </Card>
  );
};

export default ItemServingsManager;
