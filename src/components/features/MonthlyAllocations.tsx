'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useMonthlyAllocations, CustomerAllocation, InventoryLimits } from '@/hooks/useMonthlyAllocations';

const MonthlyAllocations: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [editingCell, setEditingCell] = useState<{customerId: string, field: string} | null>(null);
  const [editValue, setEditValue] = useState('');

  const { allocations, inventoryLimits, loading, updateAllocation, isUpdating } = useMonthlyAllocations(currentMonth, currentYear);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const decorColumns = [
    { key: 'walkway_stands', label: 'Walkway Stands' },
    { key: 'arc', label: 'Arc' },
    { key: 'aisle_stands', label: 'Aisle Stands' },
    { key: 'photobooth', label: 'Photobooth' },
    { key: 'lecturn', label: 'Lecturn' },
    { key: 'stage_boards', label: 'Stage Boards' },
    { key: 'backdrop_boards', label: 'Backdrop Boards' },
    { key: 'dance_floor', label: 'Dance Floor' },
    { key: 'walkway_boards', label: 'Walkway Boards' },
    { key: 'white_sticker', label: 'White Sticker' },
    { key: 'centerpieces', label: 'Centerpieces' },
    { key: 'glass_charger_plates', label: 'Glass Charger Plates' },
    { key: 'melamine_charger_plates', label: 'Melamine Charger Plates' },
    { key: 'african_mats', label: 'African Mats' },
    { key: 'gold_napkin_holders', label: 'Gold Napkin Holders' },
    { key: 'silver_napkin_holders', label: 'Silver Napkin Holders' },
    { key: 'roof_top_decor', label: 'Roof Top Decor' },
    { key: 'parcan_lights', label: 'Parcan Lights' },
    { key: 'revolving_heads', label: 'Revolving Heads' },
    { key: 'fairy_lights', label: 'Fairy Lights' },
    { key: 'snake_lights', label: 'Snake Lights' },
    { key: 'neon_lights', label: 'Neon Lights' },
    { key: 'small_chandeliers', label: 'Small Chandeliers' },
    { key: 'large_chandeliers', label: 'Large Chandeliers' },
    { key: 'african_lampshades', label: 'African Lampshades' },
  ];

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const calculateColumnTotal = (field: string): number => {
    return allocations.reduce((sum, allocation) => {
      return sum + (allocation[field as keyof CustomerAllocation] as number || 0);
    }, 0);
  };

  const isOverbooked = (field: string): boolean => {
    if (!inventoryLimits) return false;
    const totalBooked = calculateColumnTotal(field);
    const totalInStore = inventoryLimits[field as keyof InventoryLimits] || 0;
    return totalBooked > totalInStore;
  };

  const handleCellClick = (customerId: string, field: string, currentValue: number) => {
    setEditingCell({ customerId, field });
    setEditValue(currentValue.toString());
  };

  const handleCellSave = async () => {
    if (!editingCell) return;
    
    const { customerId, field } = editingCell;
    const value = parseInt(editValue) || 0;
    
    try {
      await updateAllocation({ customerId, field, value });
      setEditingCell(null);
      setEditValue('');
    } catch (error) {
      console.error('Error updating allocation:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCellSave();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setEditValue('');
    }
  };

  const renderEditableCell = (allocation: CustomerAllocation, field: string) => {
    const value = allocation[field as keyof CustomerAllocation] as number || 0;
    const isEditing = editingCell?.customerId === allocation.customer_id && editingCell?.field === field;
    const isFieldOverbooked = isOverbooked(field);
    
    if (isEditing) {
      return (
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyPress}
          onBlur={handleCellSave}
          className="w-16 h-8 text-xs text-center"
          autoFocus
          disabled={isUpdating}
        />
      );
    }
    
    return (
      <div 
        className={`cursor-pointer hover:bg-gray-100 p-2 text-center text-xs min-h-[32px] flex items-center justify-center ${
          isFieldOverbooked && value > 0 ? 'bg-red-100 text-red-800 border border-red-300' : ''
        }`}
        onClick={() => handleCellClick(allocation.customer_id, field, value)}
      >
        {value || '0'}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading monthly allocations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Monthly Customer Allocation</h2>
          <p className="text-gray-600">Reservation dashboard for {monthNames[currentMonth]} {currentYear}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-lg font-medium text-gray-900 min-w-[140px] text-center">
            {monthNames[currentMonth]} {currentYear}
          </span>
          <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{allocations.length}</div>
              <div className="text-sm text-gray-600">Events This Month</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {decorColumns.filter(col => isOverbooked(col.key)).length}
              </div>
              <div className="text-sm text-gray-600">Overbooked Items</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {decorColumns.reduce((sum, col) => sum + calculateColumnTotal(col.key), 0)}
              </div>
              <div className="text-sm text-gray-600">Total Items Booked</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Allocation Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>Allocation Matrix</span>
            {decorColumns.some(col => isOverbooked(col.key)) && (
              <div className="flex items-center space-x-1 text-red-600">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">Overbooking detected</span>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="sticky left-0 bg-gray-50 px-4 py-3 text-left font-medium text-gray-900 border-r border-gray-200 min-w-[200px]">
                    Customer / Event Date
                  </th>
                  {decorColumns.map((column) => (
                    <th 
                      key={column.key} 
                      className={`px-2 py-3 text-center font-medium border-r border-gray-200 min-w-[80px] ${
                        isOverbooked(column.key) ? 'bg-red-50 text-red-800' : 'text-gray-900'
                      }`}
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allocations.map((allocation) => (
                  <tr key={allocation.customer_id} className="hover:bg-gray-50">
                    <td className="sticky left-0 bg-white px-4 py-3 border-r border-gray-200">
                      <div className="font-medium text-gray-900">{allocation.customer_name}</div>
                      <div className="text-gray-500 text-xs">{allocation.event_date}</div>
                    </td>
                    {decorColumns.map((column) => (
                      <td key={column.key} className="border-r border-gray-200">
                        {renderEditableCell(allocation, column.key)}
                      </td>
                    ))}
                  </tr>
                ))}
                
                {/* Totals Row */}
                <tr className="bg-gray-50 font-medium">
                  <td className="sticky left-0 bg-gray-50 px-4 py-3 border-r border-gray-200 font-bold text-gray-900">
                    TOTALS (Booked vs In Store)
                  </td>
                  {decorColumns.map((column) => {
                    const totalBooked = calculateColumnTotal(column.key);
                    const totalInStore = inventoryLimits?.[column.key as keyof InventoryLimits] || 0;
                    const isOver = totalBooked > totalInStore;
                    
                    return (
                      <td 
                        key={column.key} 
                        className={`px-2 py-3 text-center border-r border-gray-200 ${
                          isOver ? 'bg-red-100 text-red-800 font-bold' : 'text-gray-900'
                        }`}
                      >
                        <div className="text-xs">
                          <div className={isOver ? 'text-red-800 font-bold' : ''}>{totalBooked}</div>
                          <div className="text-gray-500">/ {totalInStore}</div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
          
          {allocations.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No events scheduled for {monthNames[currentMonth]} {currentYear}
            </div>
          )}
          
          <div className="mt-4 text-sm text-gray-600 space-y-1">
            <p><strong>Instructions:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Click any cell to edit the quantity for that customer and item</li>
              <li>Press Enter to save, Escape to cancel</li>
              <li><span className="bg-red-100 text-red-800 px-1 rounded">Red cells</span> indicate overbooking - more items booked than available in store</li>
              <li>The totals row shows "Booked / In Store" for each item</li>
              <li>Use month navigation to view different months</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MonthlyAllocations;