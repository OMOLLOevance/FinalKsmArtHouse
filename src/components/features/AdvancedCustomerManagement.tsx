'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Printer, Calendar, ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useCustomers } from '@/hooks/useCustomers';
import { useDecorAllocationsQuery, useSaveDecorAllocationsMutation } from '@/hooks/useDecorAllocations';
import MonthlyAllocationTable from './MonthlyAllocationTable';

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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showDecorForm, setShowDecorForm] = useState(false);
  const [showLightingForm, setShowLightingForm] = useState(false);
  const [newDecorAllocation, setNewDecorAllocation] = useState({
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
  });
  
  // Database queries
  const { data: savedDecorAllocations = [], isLoading } = useDecorAllocationsQuery(currentMonth, currentYear);
  const saveDecorMutation = useSaveDecorAllocationsMutation();
  
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

  // Load saved data when it changes
  useEffect(() => {
    const newDecorItems = Array.from({ length: 25 }, (_, i) => {
      const savedItem = savedDecorAllocations.find(item => item.row_number === i + 1);
      return savedItem ? {
        id: `decor-row-${i + 1}`,
        row_number: i + 1,
        customer_name: savedItem.customer_name,
        walkway_stands: savedItem.walkway_stands,
        arc: savedItem.arc,
        aisle_stands: savedItem.aisle_stands,
        photobooth: savedItem.photobooth,
        lecturn: savedItem.lecturn,
        stage_boards: savedItem.stage_boards,
        backdrop_boards: savedItem.backdrop_boards,
        dance_floor: savedItem.dance_floor,
        walkway_boards: savedItem.walkway_boards,
        white_sticker: savedItem.white_sticker,
        centerpieces: savedItem.centerpieces,
        glass_charger_plates: savedItem.glass_charger_plates,
        melamine_charger_plates: savedItem.melamine_charger_plates,
        african_mats: savedItem.african_mats,
        gold_napkin_holders: savedItem.gold_napkin_holders,
        silver_napkin_holders: savedItem.silver_napkin_holders,
        roof_top_decor: savedItem.roof_top_decor,
        parcan_lights: savedItem.parcan_lights,
        revolving_heads: savedItem.revolving_heads,
        fairy_lights: savedItem.fairy_lights,
        snake_lights: savedItem.snake_lights,
        neon_lights: savedItem.neon_lights,
        small_chandeliers: savedItem.small_chandeliers,
        large_chandeliers: savedItem.large_chandeliers,
        african_lampshades: savedItem.african_lampshades
      } : {
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
      };
    });
    setDecorItems(newDecorItems);
    setHasUnsavedChanges(false);
  }, [savedDecorAllocations]);

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
      setHasUnsavedChanges(true);
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

  const handleAddDecorItem = () => {
    setShowDecorForm(true);
  };

  const handleAddLightingItem = () => {
    setShowLightingForm(true);
  };

  const handleSaveDecorForm = () => {
    if (!newDecorAllocation.customer_name.trim()) return;
    
    const nextEmptyRow = decorItems.findIndex(row => row.customer_name.trim() === '');
    if (nextEmptyRow !== -1) {
      setDecorItems(prev => prev.map((item, index) => 
        index === nextEmptyRow ? {
          ...item,
          ...newDecorAllocation
        } : item
      ));
      setHasUnsavedChanges(true);
      setShowDecorForm(false);
    }
  };

  const handleSaveDecorItems = () => {
    saveDecorMutation.mutate({
      allocations: decorItems.map(item => ({
        customer_name: item.customer_name,
        month: currentMonth + 1,
        year: currentYear,
        row_number: item.row_number,
        walkway_stands: item.walkway_stands,
        arc: item.arc,
        aisle_stands: item.aisle_stands,
        photobooth: item.photobooth,
        lecturn: item.lecturn,
        stage_boards: item.stage_boards,
        backdrop_boards: item.backdrop_boards,
        dance_floor: item.dance_floor,
        walkway_boards: item.walkway_boards,
        white_sticker: item.white_sticker,
        centerpieces: item.centerpieces,
        glass_charger_plates: item.glass_charger_plates,
        melamine_charger_plates: item.melamine_charger_plates,
        african_mats: item.african_mats,
        gold_napkin_holders: item.gold_napkin_holders,
        silver_napkin_holders: item.silver_napkin_holders,
        roof_top_decor: item.roof_top_decor,
        parcan_lights: item.parcan_lights,
        revolving_heads: item.revolving_heads,
        fairy_lights: item.fairy_lights,
        snake_lights: item.snake_lights,
        neon_lights: item.neon_lights,
        small_chandeliers: item.small_chandeliers,
        large_chandeliers: item.large_chandeliers,
        african_lampshades: item.african_lampshades
      })),
      month: currentMonth,
      year: currentYear
    });
  };

  const filledDecorRows = decorItems.filter(row => row.customer_name.trim() !== '').length;
  const filledRows = monthlyAllocations.filter(row => row.customer_name.trim() !== '').length;
  const servedCount = monthlyAllocations.filter(row => row.customer_name.trim() !== '' && row.total_ksh > 0).length;
  const pendingCount = monthlyAllocations.filter(row => row.customer_name.trim() !== '' && row.total_ksh === 0).length;

  const addCustomer = () => {
    const nextEmptyRow = monthlyAllocations.findIndex(row => row.customer_name.trim() === '');
    if (nextEmptyRow !== -1) {
      const customerNameField = document.querySelector(`[data-row="${nextEmptyRow}"][data-field="customer_name"]`) as HTMLElement;
      if (customerNameField) {
        customerNameField.click();
      } else {
        handleCellClick(nextEmptyRow, 'customer_name', '');
      }
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
          <Button onClick={handleAddDecorItem}>
            <Plus className="h-4 w-4 mr-2" />
            Add Decor
          </Button>
          <Button onClick={handleAddLightingItem}>
            <Plus className="h-4 w-4 mr-2" />
            Add Lighting
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
        <Button 
          onClick={handleSaveDecorItems} 
          disabled={saveDecorMutation.isPending || !hasUnsavedChanges}
          className="mb-4"
        >
          <Save className="h-4 w-4 mr-2" />
          {saveDecorMutation.isPending ? 'Saving...' : 'Save Decor Items to Database'}
        </Button>
        <p className="text-sm text-muted-foreground">
          {hasUnsavedChanges ? 
            `${filledDecorRows} decor items ready to save` : 
            `${filledDecorRows} decor items saved to database`
          }
        </p>
      </div>

      {/* Monthly Allocation Table */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Customer Allocation Table</CardTitle>
          <p className="text-sm text-muted-foreground">{filledRows} of 25 rows filled</p>
        </CardHeader>
        <CardContent>
          <MonthlyAllocationTable 
            month={currentMonth} 
            year={currentYear} 
            onAddCustomer={addCustomer}
          />
        </CardContent>
      </Card>

      {/* Decor Items Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Decor & Lighting Items</CardTitle>
              <p className="text-sm text-muted-foreground">
                {filledDecorRows} of 25 rows filled {hasUnsavedChanges && '(unsaved changes)'}
              </p>
            </div>
            <div className="flex space-x-2">
              <Button 
                onClick={handleSaveDecorItems} 
                disabled={saveDecorMutation.isPending || !hasUnsavedChanges}
                size="sm"
              >
                <Save className="h-4 w-4 mr-2" />
                {saveDecorMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
              <Button onClick={handleAddDecorItem} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Decor
              </Button>
              <Button onClick={handleAddLightingItem} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Lighting
              </Button>
              <Button variant="outline" size="sm">
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
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

      {/* Decor Form Dialog */}
      {showDecorForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Add Decor Items</h3>
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-1 text-gray-700">Customer Name *</label>
              <Input
                value={newDecorAllocation.customer_name}
                onChange={(e) => setNewDecorAllocation({...newDecorAllocation, customer_name: e.target.value})}
                placeholder="Enter customer name"
                className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <div className="mb-6">
              <h4 className="text-md font-medium mb-3 text-gray-800">Decor Items</h4>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Walkway Stands</label>
                  <Input
                    type="number"
                    value={newDecorAllocation.walkway_stands}
                    onChange={(e) => setNewDecorAllocation({...newDecorAllocation, walkway_stands: parseInt(e.target.value) || 0})}
                    className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Arc</label>
                  <Input
                    type="number"
                    value={newDecorAllocation.arc}
                    onChange={(e) => setNewDecorAllocation({...newDecorAllocation, arc: parseInt(e.target.value) || 0})}
                    className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Aisle Stands</label>
                  <Input
                    type="number"
                    value={newDecorAllocation.aisle_stands}
                    onChange={(e) => setNewDecorAllocation({...newDecorAllocation, aisle_stands: parseInt(e.target.value) || 0})}
                    className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Photobooth</label>
                  <Input
                    type="number"
                    value={newDecorAllocation.photobooth}
                    onChange={(e) => setNewDecorAllocation({...newDecorAllocation, photobooth: parseInt(e.target.value) || 0})}
                    className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Lecturn</label>
                  <Input
                    type="number"
                    value={newDecorAllocation.lecturn}
                    onChange={(e) => setNewDecorAllocation({...newDecorAllocation, lecturn: parseInt(e.target.value) || 0})}
                    className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Stage Boards</label>
                  <Input
                    type="number"
                    value={newDecorAllocation.stage_boards}
                    onChange={(e) => setNewDecorAllocation({...newDecorAllocation, stage_boards: parseInt(e.target.value) || 0})}
                    className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Backdrop Boards</label>
                  <Input
                    type="number"
                    value={newDecorAllocation.backdrop_boards}
                    onChange={(e) => setNewDecorAllocation({...newDecorAllocation, backdrop_boards: parseInt(e.target.value) || 0})}
                    className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Dance Floor</label>
                  <Input
                    type="number"
                    value={newDecorAllocation.dance_floor}
                    onChange={(e) => setNewDecorAllocation({...newDecorAllocation, dance_floor: parseInt(e.target.value) || 0})}
                    className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Walkway Boards</label>
                  <Input
                    type="number"
                    value={newDecorAllocation.walkway_boards}
                    onChange={(e) => setNewDecorAllocation({...newDecorAllocation, walkway_boards: parseInt(e.target.value) || 0})}
                    className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">White Sticker</label>
                  <Input
                    type="number"
                    value={newDecorAllocation.white_sticker}
                    onChange={(e) => setNewDecorAllocation({...newDecorAllocation, white_sticker: parseInt(e.target.value) || 0})}
                    className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Centerpieces</label>
                  <Input
                    type="number"
                    value={newDecorAllocation.centerpieces}
                    onChange={(e) => setNewDecorAllocation({...newDecorAllocation, centerpieces: parseInt(e.target.value) || 0})}
                    className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Glass Charger Plates</label>
                  <Input
                    type="number"
                    value={newDecorAllocation.glass_charger_plates}
                    onChange={(e) => setNewDecorAllocation({...newDecorAllocation, glass_charger_plates: parseInt(e.target.value) || 0})}
                    className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Melamine Charger Plates</label>
                  <Input
                    type="number"
                    value={newDecorAllocation.melamine_charger_plates}
                    onChange={(e) => setNewDecorAllocation({...newDecorAllocation, melamine_charger_plates: parseInt(e.target.value) || 0})}
                    className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">African Mats</label>
                  <Input
                    type="number"
                    value={newDecorAllocation.african_mats}
                    onChange={(e) => setNewDecorAllocation({...newDecorAllocation, african_mats: parseInt(e.target.value) || 0})}
                    className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Gold Napkin Holders</label>
                  <Input
                    type="number"
                    value={newDecorAllocation.gold_napkin_holders}
                    onChange={(e) => setNewDecorAllocation({...newDecorAllocation, gold_napkin_holders: parseInt(e.target.value) || 0})}
                    className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Silver Napkin Holders</label>
                  <Input
                    type="number"
                    value={newDecorAllocation.silver_napkin_holders}
                    onChange={(e) => setNewDecorAllocation({...newDecorAllocation, silver_napkin_holders: parseInt(e.target.value) || 0})}
                    className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Roof Top Decor</label>
                  <Input
                    type="number"
                    value={newDecorAllocation.roof_top_decor}
                    onChange={(e) => setNewDecorAllocation({...newDecorAllocation, roof_top_decor: parseInt(e.target.value) || 0})}
                    className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowDecorForm(false)}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveDecorForm}
                disabled={!newDecorAllocation.customer_name.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Add Decor Items
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Lighting Form Dialog */}
      {showLightingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Add Lighting Items</h3>
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-1 text-gray-700">Customer Name *</label>
              <Input
                value={newDecorAllocation.customer_name}
                onChange={(e) => setNewDecorAllocation({...newDecorAllocation, customer_name: e.target.value})}
                placeholder="Enter customer name"
                className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <div className="mb-6">
              <h4 className="text-md font-medium mb-3 text-gray-800">Lighting Items</h4>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Parcan Lights</label>
                  <Input
                    type="number"
                    value={newDecorAllocation.parcan_lights}
                    onChange={(e) => setNewDecorAllocation({...newDecorAllocation, parcan_lights: parseInt(e.target.value) || 0})}
                    className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Revolving Heads</label>
                  <Input
                    type="number"
                    value={newDecorAllocation.revolving_heads}
                    onChange={(e) => setNewDecorAllocation({...newDecorAllocation, revolving_heads: parseInt(e.target.value) || 0})}
                    className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Fairy Lights</label>
                  <Input
                    type="number"
                    value={newDecorAllocation.fairy_lights}
                    onChange={(e) => setNewDecorAllocation({...newDecorAllocation, fairy_lights: parseInt(e.target.value) || 0})}
                    className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Snake Lights</label>
                  <Input
                    type="number"
                    value={newDecorAllocation.snake_lights}
                    onChange={(e) => setNewDecorAllocation({...newDecorAllocation, snake_lights: parseInt(e.target.value) || 0})}
                    className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Neon Lights</label>
                  <Input
                    type="number"
                    value={newDecorAllocation.neon_lights}
                    onChange={(e) => setNewDecorAllocation({...newDecorAllocation, neon_lights: parseInt(e.target.value) || 0})}
                    className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Small Chandeliers</label>
                  <Input
                    type="number"
                    value={newDecorAllocation.small_chandeliers}
                    onChange={(e) => setNewDecorAllocation({...newDecorAllocation, small_chandeliers: parseInt(e.target.value) || 0})}
                    className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Large Chandeliers</label>
                  <Input
                    type="number"
                    value={newDecorAllocation.large_chandeliers}
                    onChange={(e) => setNewDecorAllocation({...newDecorAllocation, large_chandeliers: parseInt(e.target.value) || 0})}
                    className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">African Lampshades</label>
                  <Input
                    type="number"
                    value={newDecorAllocation.african_lampshades}
                    onChange={(e) => setNewDecorAllocation({...newDecorAllocation, african_lampshades: parseInt(e.target.value) || 0})}
                    className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowLightingForm(false)}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveDecorForm}
                disabled={!newDecorAllocation.customer_name.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Add Lighting Items
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedCustomerManagement;