'use client';

import React, { useState, useMemo } from 'react';
import { Plus, Printer, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useCustomers } from '@/hooks/useCustomers';
import MonthlyAllocations from './MonthlyAllocations';

interface MonthlyAllocation {
  id: string;
  row_number: number;
  date: string;
  location: string;
  customer_name: string;
  phone_number: string;
  double_tent: number;
  single_tent: number;
  gazebo_tent: number;
  miluxe_tent: number;
  a_frame_tent: number;
  b_line_tent: number;
  pergola_tent: number;
  round_table: number;
  long_table: number;
  bridal_table: number;
  chavari_seats: number;
  luxe_seats: number;
  chameleon_seats: number;
  dior_seats: number;
  high_back_seat: number;
  plastic_seats: number;
  banquet_seats: number;
  cross_bar_seats: number;
  total_ksh: number;
}

interface DecorItem {
  id: string;
  row_number: number;
  customer_name: string;
  walkway_stands: number;
  arc: number;
  aisle_stands: number;
  photobooth: number;
  lecturn: number;
  stage_boards: number;
  backdrop_boards: number;
  dance_floor: number;
  walkway_boards: number;
  white_sticker: number;
  centerpieces: number;
  glass_charger_plates: number;
  melamine_charger_plates: number;
  african_mats: number;
  gold_napkin_holders: number;
  silver_napkin_holders: number;
  roof_top_decor: number;
  parcan_lights: number;
  revolving_heads: number;
  fairy_lights: number;
  snake_lights: number;
  neon_lights: number;
  small_chandeliers: number;
  large_chandeliers: number;
  african_lampshades: number;
}

const AdvancedCustomerManagement: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [editingCell, setEditingCell] = useState<{row: number, field: string} | null>(null);
  const [editValue, setEditValue] = useState('');
  
  // Initialize 25 empty rows for monthly allocations
  const [monthlyAllocations, setMonthlyAllocations] = useState<MonthlyAllocation[]>(
    Array.from({ length: 25 }, (_, i) => ({
      id: `row-${i + 1}`,
      row_number: i + 1,
      date: '',
      location: '',
      customer_name: '',
      phone_number: '',
      double_tent: 0,
      single_tent: 0,
      gazebo_tent: 0,
      miluxe_tent: 0,
      a_frame_tent: 0,
      b_line_tent: 0,
      pergola_tent: 0,
      round_table: 0,
      long_table: 0,
      bridal_table: 0,
      chavari_seats: 0,
      luxe_seats: 0,
      chameleon_seats: 0,
      dior_seats: 0,
      high_back_seat: 0,
      plastic_seats: 0,
      banquet_seats: 0,
      cross_bar_seats: 0,
      total_ksh: 0
    }))
  );
  
  // Initialize 25 empty rows for decor items
  const [decorItems, setDecorItems] = useState<DecorItem[]>(
    Array.from({ length: 25 }, (_, i) => ({
      id: `decor-row-${i + 1}`,
      row_number: i + 1,
      customer_name: '',
      walkway_stands: 0,
      arc: 0,
      aisle_stands: 0,
      photobooth: 0,
      lecturn: 0,
      stage_boards: 0,
      backdrop_boards: 0,
      dance_floor: 0,
      walkway_boards: 0,
      white_sticker: 0,
      centerpieces: 0,
      glass_charger_plates: 0,
      melamine_charger_plates: 0,
      african_mats: 0,
      gold_napkin_holders: 0,
      silver_napkin_holders: 0,
      roof_top_decor: 0,
      parcan_lights: 0,
      revolving_heads: 0,
      fairy_lights: 0,
      snake_lights: 0,
      neon_lights: 0,
      small_chandeliers: 0,
      large_chandeliers: 0,
      african_lampshades: 0
    }))
  );

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

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

  const handleCellClick = (row: number, field: string, currentValue: any) => {
    setEditingCell({ row, field });
    setEditValue(currentValue.toString());
  };

  const handleCellSave = () => {
    if (!editingCell) return;
    
    const { row, field } = editingCell;
    
    if (field.includes('allocation_')) {
      const actualField = field.replace('allocation_', '');
      setMonthlyAllocations(prev => prev.map((item, index) => 
        index === row ? { ...item, [actualField]: isNaN(Number(editValue)) ? editValue : Number(editValue) } : item
      ));
    } else if (field.includes('decor_')) {
      const actualField = field.replace('decor_', '');
      setDecorItems(prev => prev.map((item, index) => 
        index === row ? { ...item, [actualField]: isNaN(Number(editValue)) ? editValue : Number(editValue) } : item
      ));
    }
    
    setEditingCell(null);
    setEditValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCellSave();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setEditValue('');
    }
  };

  const filledRows = monthlyAllocations.filter(row => row.customer_name.trim() !== '').length;
  const servedCount = monthlyAllocations.filter(row => row.customer_name.trim() !== '' && row.total_ksh > 0).length;
  const pendingCount = monthlyAllocations.filter(row => row.customer_name.trim() !== '' && row.total_ksh === 0).length;

  const addCustomer = () => {
    const nextEmptyRow = monthlyAllocations.findIndex(row => row.customer_name.trim() === '');
    if (nextEmptyRow !== -1) {
      handleCellClick(nextEmptyRow, 'allocation_customer_name', '');
    }
  };

  const renderEditableCell = (value: any, row: number, field: string, placeholder?: string) => {
    const isEditing = editingCell?.row === row && editingCell?.field === field;
    
    if (isEditing) {
      return (
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyPress}
          onBlur={handleCellSave}
          className="w-full h-8 text-xs"
          autoFocus
        />
      );
    }
    
    return (
      <div 
        className="cursor-pointer hover:bg-muted/50 p-1 min-h-[24px] text-xs"
        onClick={() => handleCellClick(row, field, value)}
      >
        {value || placeholder || '0'}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Customer Management</h2>
          <p className="text-muted-foreground">Monthly customer allocation and equipment tracking</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button onClick={addCustomer}>
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-lg font-medium">Week of {currentYear}-{String(currentMonth + 1).padStart(2, '0')}</span>
          <Button variant="outline" size="sm" onClick={() => console.log('Sync data')}>🔄 Update All Devices</Button>
        </div>
        <div className="flex space-x-1">
          {monthNames.map((month, index) => (
            <Button
              key={month}
              variant={index === currentMonth ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentMonth(index)}
              className="text-xs"
            >
              {month}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{filledRows}/25</div>
              <div className="text-sm text-muted-foreground">Customers This Month</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{servedCount}</div>
              <div className="text-sm text-muted-foreground">Served</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{pendingCount}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <Button className="mb-4">Save to Database</Button>
        <p className="text-sm text-muted-foreground">Click to sync {filledRows} customers to database for admin</p>
      </div>

      {/* Monthly Allocation Table */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Customer Allocation Table</CardTitle>
          <p className="text-sm text-muted-foreground">{filledRows} of 25 rows filled</p>
        </CardHeader>
        <CardContent>
          <MonthlyAllocations />
        </CardContent>
      </Card>

      {/* Decor Items Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Decor & Lighting Items</CardTitle>
            <Button>
              <Printer className="h-4 w-4 mr-2" />
              Print Decor Items
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs border-collapse">
              <thead>
                <tr className="bg-muted/50">
                  <th className="border p-1 w-8">#</th>
                  <th className="border p-1 w-32">CUSTOMER NAME</th>
                  <th className="border p-1 w-16">WALKWAY STANDS</th>
                  <th className="border p-1 w-16">ARC</th>
                  <th className="border p-1 w-16">AISLE STANDS</th>
                  <th className="border p-1 w-16">PHOTOBOOTH</th>
                  <th className="border p-1 w-16">LECTURN</th>
                  <th className="border p-1 w-16">STAGE BOARDS</th>
                  <th className="border p-1 w-16">BACKDROP BOARDS</th>
                  <th className="border p-1 w-16">DANCE FLOOR</th>
                  <th className="border p-1 w-16">WALKWAY BOARDS</th>
                  <th className="border p-1 w-16">WHITE STICKER</th>
                  <th className="border p-1 w-16">CENTERPIECES</th>
                  <th className="border p-1 w-20">GLASS CHARGER PLATES</th>
                  <th className="border p-1 w-20">MELAMINE CHARGER PLATES</th>
                  <th className="border p-1 w-16">AFRICAN MATS</th>
                  <th className="border p-1 w-20">GOLD NAPKIN HOLDERS</th>
                  <th className="border p-1 w-20">SILVER NAPKIN HOLDERS</th>
                  <th className="border p-1 w-16">ROOF TOP DECOR</th>
                  <th className="border p-1 w-16">PARCAN LIGHTS</th>
                  <th className="border p-1 w-16">REVOLVING HEADS</th>
                  <th className="border p-1 w-16">FAIRY LIGHTS</th>
                  <th className="border p-1 w-16">SNAKE LIGHTS</th>
                  <th className="border p-1 w-16">NEON LIGHTS</th>
                  <th className="border p-1 w-20">SMALL CHANDELIERS</th>
                  <th className="border p-1 w-20">LARGE CHANDELIERS</th>
                  <th className="border p-1 w-20">AFRICAN LAMPSHADES</th>
                </tr>
              </thead>
              <tbody>
                {decorItems.map((row, index) => (
                  <tr key={row.id}>
                    <td className="border p-1 text-center">{row.row_number}</td>
                    <td className="border p-1">{renderEditableCell(row.customer_name, index, 'decor_customer_name', 'Click to add name')}</td>
                    <td className="border p-1 text-center">{renderEditableCell(row.walkway_stands, index, 'decor_walkway_stands')}</td>
                    <td className="border p-1 text-center">{renderEditableCell(row.arc, index, 'decor_arc')}</td>
                    <td className="border p-1 text-center">{renderEditableCell(row.aisle_stands, index, 'decor_aisle_stands')}</td>
                    <td className="border p-1 text-center">{renderEditableCell(row.photobooth, index, 'decor_photobooth')}</td>
                    <td className="border p-1 text-center">{renderEditableCell(row.lecturn, index, 'decor_lecturn')}</td>
                    <td className="border p-1 text-center">{renderEditableCell(row.stage_boards, index, 'decor_stage_boards')}</td>
                    <td className="border p-1 text-center">{renderEditableCell(row.backdrop_boards, index, 'decor_backdrop_boards')}</td>
                    <td className="border p-1 text-center">{renderEditableCell(row.dance_floor, index, 'decor_dance_floor')}</td>
                    <td className="border p-1 text-center">{renderEditableCell(row.walkway_boards, index, 'decor_walkway_boards')}</td>
                    <td className="border p-1 text-center">{renderEditableCell(row.white_sticker, index, 'decor_white_sticker')}</td>
                    <td className="border p-1 text-center">{renderEditableCell(row.centerpieces, index, 'decor_centerpieces')}</td>
                    <td className="border p-1 text-center">{renderEditableCell(row.glass_charger_plates, index, 'decor_glass_charger_plates')}</td>
                    <td className="border p-1 text-center">{renderEditableCell(row.melamine_charger_plates, index, 'decor_melamine_charger_plates')}</td>
                    <td className="border p-1 text-center">{renderEditableCell(row.african_mats, index, 'decor_african_mats')}</td>
                    <td className="border p-1 text-center">{renderEditableCell(row.gold_napkin_holders, index, 'decor_gold_napkin_holders')}</td>
                    <td className="border p-1 text-center">{renderEditableCell(row.silver_napkin_holders, index, 'decor_silver_napkin_holders')}</td>
                    <td className="border p-1 text-center">{renderEditableCell(row.roof_top_decor, index, 'decor_roof_top_decor')}</td>
                    <td className="border p-1 text-center">{renderEditableCell(row.parcan_lights, index, 'decor_parcan_lights')}</td>
                    <td className="border p-1 text-center">{renderEditableCell(row.revolving_heads, index, 'decor_revolving_heads')}</td>
                    <td className="border p-1 text-center">{renderEditableCell(row.fairy_lights, index, 'decor_fairy_lights')}</td>
                    <td className="border p-1 text-center">{renderEditableCell(row.snake_lights, index, 'decor_snake_lights')}</td>
                    <td className="border p-1 text-center">{renderEditableCell(row.neon_lights, index, 'decor_neon_lights')}</td>
                    <td className="border p-1 text-center">{renderEditableCell(row.small_chandeliers, index, 'decor_small_chandeliers')}</td>
                    <td className="border p-1 text-center">{renderEditableCell(row.large_chandeliers, index, 'decor_large_chandeliers')}</td>
                    <td className="border p-1 text-center">{renderEditableCell(row.african_lampshades, index, 'decor_african_lampshades')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedCustomerManagement;