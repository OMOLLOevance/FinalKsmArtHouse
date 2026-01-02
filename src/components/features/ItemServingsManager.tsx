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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {calculations.map((item, idx) => (
            <Card key={idx} className="overflow-hidden border-muted hover:border-primary/30 transition-all duration-300">
              <div className="p-4 space-y-4">
                <div className="flex items-center space-x-2 border-b pb-2">
                  <UtensilsCrossed className="h-4 w-4 text-primary opacity-70" />
                  <h4 className="font-bold text-lg">{item.name}</h4>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-muted/10 p-3 rounded-lg border">
                  <div className="space-y-0.5">
                    <label className="text-[9px] font-black uppercase text-muted-foreground tracking-tighter">Portion / KG</label>
                    <p className="text-sm font-bold text-muted-foreground">{item.servingPerKg} pax</p>
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[9px] font-black uppercase text-muted-foreground tracking-tighter">Required Qty</label>
                    <p className="text-sm font-black text-primary">{item.requiredKg} KG</p>
                  </div>
                  <div className="space-y-0.5 col-span-2 border-t pt-2 mt-1">
                    <label className="text-[9px] font-black uppercase text-muted-foreground tracking-tighter">Estimated Cost</label>
                    <p className="text-lg font-black text-success">{formatCurrency(item.totalCost)}</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row justify-between items-center bg-primary/5 p-6 rounded-2xl border border-primary/20 gap-4">
          <div className="text-center sm:text-left">
            <span className="text-xs font-black text-primary uppercase tracking-[0.2em] block mb-1">Grand Total Estimate</span>
            <span className="text-4xl font-black text-primary tracking-tighter">{formatCurrency(grandTotal)}</span>
          </div>
          <div className="bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest text-center">Auto-Calculated based on guest count</p>
          </div>
        </div>

        <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-lg text-xs text-muted-foreground">
          <strong>Note:</strong> These calculations are automated estimates for planning purposes. Market prices and actual portion requirements may vary based on event type and preparation methods.
        </div>
      </CardContent>
    </Card>
  );
};

export default ItemServingsManager;
