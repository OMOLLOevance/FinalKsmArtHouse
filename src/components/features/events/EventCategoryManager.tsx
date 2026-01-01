'use client';

import React from 'react';
import { ArrowLeft, Plus, Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useEventItemsQuery } from '@/hooks/use-event-api';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatCurrency } from '@/utils/formatters';

interface ManagerProps {
  onBack: () => void;
  category: string;
  title: string;
}

const EventCategoryManager: React.FC<ManagerProps> = ({ onBack, category, title }) => {
  const { data: items, isLoading } = useEventItemsQuery();
  
  const filteredItems = items?.filter(item => item.category === category) || [];

  if (isLoading) return <LoadingSpinner text={`Loading ${title}...`} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" /> Add Item
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory List</CardTitle>
          <CardDescription>Manage your {category} items and availability</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead>
                <tr className="bg-muted">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 text-sm font-medium">{item.name}</td>
                    <td className="px-6 py-4 text-sm">{item.quantityAvailable} {item.unit}</td>
                    <td className="px-6 py-4 text-sm">{formatCurrency(item.price)}</td>
                    <td className="px-6 py-4 text-sm capitalize">{item.status}</td>
                  </tr>
                ))}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                      No items found in this category.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EventCategoryManager;
