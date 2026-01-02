'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Printer, Calendar, ChevronLeft, ChevronRight, Save, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useDecorAllocationsQuery, useUpsertDecorAllocationMutation } from '@/hooks/useDecorAllocations';
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
  const { data: decorData } = useDecorAllocationsQuery(currentMonth, currentYear);
  const upsertDecorMutation = useUpsertDecorAllocationMutation();
  
  // Initialize decorItems as empty array
  const [decorItems, setDecorItems] = useState<DecorItem[]>([]);

  // Load saved data when it changes
  useEffect(() => {
    const savedDecorAllocations = decorData || [];
    if (savedDecorAllocations.length > 0) {
      const newDecorItems = savedDecorAllocations.map(savedItem => ({
        id: savedItem.id,
        row_number: savedItem.row_number,
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
      }));
      setDecorItems(newDecorItems);
    } else {
      setDecorItems([]);
    }
  }, [decorData]);

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

  const handleCellSave = async () => {
    if (!editingCell) return;
    
    const { row, field } = editingCell;
    const item = decorItems[row];
    if (!item) return;

    try {
      const actualField = field.replace('decor_', '');
      const newValue = isNaN(Number(editValue)) ? editValue : Number(editValue);
      
      // Save to database immediately
      await upsertDecorMutation.mutateAsync({
        ...item,
        [actualField]: newValue,
        month: currentMonth + 1,
        year: currentYear
      });

      setEditingCell(null);
      setEditValue('');
    } catch (error) {
      console.error('Error saving cell:', error);
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

  const handleAddDecorItem = () => {
    setShowDecorForm(true);
  };

  const handleAddLightingItem = () => {
    setShowLightingForm(true);
  };

  const handleSaveDecorForm = async () => {
    if (!newDecorAllocation.customer_name.trim()) return;
    
    try {
      await upsertDecorMutation.mutateAsync({
        ...newDecorAllocation,
        month: currentMonth + 1,
        year: currentYear,
        row_number: decorItems.length + 1
      });
      
      setShowDecorForm(false);
      setShowLightingForm(false);
      setNewDecorAllocation({
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
    } catch (error) {
      console.error('Error adding decor item:', error);
    }
  };

  const handleSyncState = () => {
    // Re-fetch data from database
    window.location.reload();
  };

  const filledDecorRows = decorItems.length;

  const renderEditableCell = (value: any, row: number, field: string, placeholder?: string) => {
    const isEditing = editingCell?.row === row && editingCell?.field === field;
    
    if (isEditing) {
      return (
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyPress}
          onBlur={handleCellSave}
          className="w-full h-8 text-xs bg-background"
          autoFocus
          disabled={upsertDecorMutation.isPending}
        />
      );
    }
    
    return (
      <div 
        className="cursor-pointer hover:bg-muted/50 p-1 min-h-[24px] text-xs flex items-center"
        onClick={() => handleCellClick(row, field, value)}
      >
        {value || placeholder || '0'}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header removed */}

      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-lg font-medium">Week of {currentYear}-{String(currentMonth + 1).padStart(2, '0')}</span>
          <Button variant="outline" size="sm" onClick={handleSyncState}>🔄 Refresh & Sync</Button>
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

      <div className="text-center py-2">
        <p className="text-xs text-muted-foreground italic">
          {upsertDecorMutation.isPending ? 
            'Saving changes to cloud...' : 
            `Auto-save enabled • ${filledDecorRows} decor configurations saved`
          }
        </p>
      </div>

      {/* Monthly Allocation Table */}
      <MonthlyAllocationTable 
        month={currentMonth} 
        year={currentYear} 
        onAddCustomer={() => {}} 
      />

      {/* Decor Items Form Section */}
      <Card className="border-primary/10 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4 mb-6">
          <div>
            <CardTitle className="text-xl font-bold text-primary flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-primary/60" />
              Decor & Lighting Items
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {filledDecorRows} customers configured
            </p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={handleAddDecorItem} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Decor
            </Button>
            <Button onClick={handleAddLightingItem} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Lighting
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {decorItems.map((item, index) => (
            <Card key={item.id} className="overflow-hidden border-muted hover:border-primary/30 transition-all duration-300">
              <div className="bg-muted/30 px-4 py-2 border-b flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-full">#{item.row_number}</span>
                  <div className="min-w-[200px]">
                    {renderEditableCell(item.customer_name, index, 'decor_customer_name', 'Enter Customer Name')}
                  </div>
                </div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Custom Configuration
                </div>
              </div>
              
              <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Group 1: Stands & Boards */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase text-primary/70 tracking-widest border-b pb-1">Stands & Boards</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Walkway', field: 'walkway_stands' },
                      { label: 'Arc', field: 'arc' },
                      { label: 'Aisle', field: 'aisle_stands' },
                      { label: 'Photobooth', field: 'photobooth' },
                      { label: 'Lecturn', field: 'lecturn' },
                      { label: 'Stage', field: 'stage_boards' },
                      { label: 'Backdrop', field: 'backdrop_boards' },
                      { label: 'Walkway Bd', field: 'walkway_boards' },
                      { label: 'Dance Floor', field: 'dance_floor' },
                    ].map(group => (
                      <div key={group.field} className="space-y-0.5">
                        <label className="text-[9px] font-bold text-muted-foreground uppercase truncate block">{group.label}</label>
                        <div className="bg-background rounded border">
                          {renderEditableCell((item as any)[group.field], index, `decor_${group.field}`)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Group 2: Table & Decor */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase text-primary/70 tracking-widest border-b pb-1">Table & Decor</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'White Sticker', field: 'white_sticker' },
                      { label: 'Centerpiece', field: 'centerpieces' },
                      { label: 'Glass Plate', field: 'glass_charger_plates' },
                      { label: 'Melamine', field: 'melamine_charger_plates' },
                      { label: 'African Mats', field: 'african_mats' },
                      { label: 'Gold Napkin', field: 'gold_napkin_holders' },
                      { label: 'Silver Napkin', field: 'silver_napkin_holders' },
                      { label: 'Roof Top', field: 'roof_top_decor' },
                    ].map(group => (group &&
                      <div key={group.field} className="space-y-0.5">
                        <label className="text-[9px] font-bold text-muted-foreground uppercase truncate block">{group.label}</label>
                        <div className="bg-background rounded border">
                          {renderEditableCell((item as any)[group.field], index, `decor_${group.field}`)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Group 3: Lighting */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase text-primary/70 tracking-widest border-b pb-1">Lighting</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Parcan', field: 'parcan_lights' },
                      { label: 'Revolving', field: 'revolving_heads' },
                      { label: 'Fairy', field: 'fairy_lights' },
                      { label: 'Snake', field: 'snake_lights' },
                      { label: 'Neon', field: 'neon_lights' },
                      { label: 'Small Chan', field: 'small_chandeliers' },
                      { label: 'Large Chan', field: 'large_chandeliers' },
                      { label: 'African Lamp', field: 'african_lampshades' },
                    ].map(group => (
                      <div key={group.field} className="space-y-0.5">
                        <label className="text-[9px] font-bold text-muted-foreground uppercase truncate block">{group.label}</label>
                        <div className="bg-background rounded border">
                          {renderEditableCell((item as any)[group.field], index, `decor_${group.field}`)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {decorItems.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/5">
              <Sparkles className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
              <p className="text-sm text-muted-foreground italic">No decor configurations found for this month.</p>
              <div className="flex justify-center space-x-2 mt-4">
                <Button onClick={handleAddDecorItem} variant="outline" size="sm">Add Decor</Button>
                <Button onClick={handleAddLightingItem} variant="outline" size="sm">Add Lighting</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Decor Form Dialog */}
      {showDecorForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto text-card-foreground">
            <h3 className="text-lg font-semibold mb-4">Add Decor Items</h3>
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-1 text-muted-foreground">Customer Name *</label>
              <Input
                value={newDecorAllocation.customer_name}
                onChange={(e) => setNewDecorAllocation({...newDecorAllocation, customer_name: e.target.value})}
                placeholder="Enter customer name"
                className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <div className="mb-6">
              <h4 className="text-md font-medium mb-3 text-card-foreground">Decor Items</h4>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted-foreground">Walkway Stands</label>
                  <Input
                    type="number"
                    value={newDecorAllocation.walkway_stands}
                    onChange={(e) => setNewDecorAllocation({...newDecorAllocation, walkway_stands: parseInt(e.target.value) || 0})}
                    className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted-foreground">Arc</label>
                  <Input
                    type="number"
                    value={newDecorAllocation.arc}
                    onChange={(e) => setNewDecorAllocation({...newDecorAllocation, arc: parseInt(e.target.value) || 0})}
                    className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted-foreground">Aisle Stands</label>
                  <Input
                    type="number"
                    value={newDecorAllocation.aisle_stands}
                    onChange={(e) => setNewDecorAllocation({...newDecorAllocation, aisle_stands: parseInt(e.target.value) || 0})}
                    className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted-foreground">Photobooth</label>
                  <Input
                    type="number"
                    value={newDecorAllocation.photobooth}
                    onChange={(e) => setNewDecorAllocation({...newDecorAllocation, photobooth: parseInt(e.target.value) || 0})}
                    className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted-foreground">Lecturn</label>
                  <Input
                    type="number"
                    value={newDecorAllocation.lecturn}
                    onChange={(e) => setNewDecorAllocation({...newDecorAllocation, lecturn: parseInt(e.target.value) || 0})}
                    className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted-foreground">Stage Boards</label>
                  <Input
                    type="number"
                    value={newDecorAllocation.stage_boards}
                    onChange={(e) => setNewDecorAllocation({...newDecorAllocation, stage_boards: parseInt(e.target.value) || 0})}
                    className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted-foreground">Backdrop Boards</label>
                  <Input
                    type="number"
                    value={newDecorAllocation.backdrop_boards}
                    onChange={(e) => setNewDecorAllocation({...newDecorAllocation, backdrop_boards: parseInt(e.target.value) || 0})}
                    className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted-foreground">Dance Floor</label>
                  <Input
                    type="number"
                    value={newDecorAllocation.dance_floor}
                    onChange={(e) => setNewDecorAllocation({...newDecorAllocation, dance_floor: parseInt(e.target.value) || 0})}
                    className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted-foreground">Walkway Boards</label>
                  <Input
                    type="number"
                    value={newDecorAllocation.walkway_boards}
                    onChange={(e) => setNewDecorAllocation({...newDecorAllocation, walkway_boards: parseInt(e.target.value) || 0})}
                    className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted-foreground">White Sticker</label>
                  <Input
                    type="number"
                    value={newDecorAllocation.white_sticker}
                    onChange={(e) => setNewDecorAllocation({...newDecorAllocation, white_sticker: parseInt(e.target.value) || 0})}
                    className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted-foreground">Centerpieces</label>
                  <Input
                    type="number"
                    value={newDecorAllocation.centerpieces}
                    onChange={(e) => setNewDecorAllocation({...newDecorAllocation, centerpieces: parseInt(e.target.value) || 0})}
                    className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted-foreground">Glass Charger Plates</label>
                  <Input
                    type="number"
                    value={newDecorAllocation.glass_charger_plates}
                    onChange={(e) => setNewDecorAllocation({...newDecorAllocation, glass_charger_plates: parseInt(e.target.value) || 0})}
                    className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted-foreground">Melamine Charger Plates</label>
                  <Input
                    type="number"
                    value={newDecorAllocation.melamine_charger_plates}
                    onChange={(e) => setNewDecorAllocation({...newDecorAllocation, melamine_charger_plates: parseInt(e.target.value) || 0})}
                    className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted-foreground">African Mats</label>
                  <Input
                    type="number"
                    value={newDecorAllocation.african_mats}
                    onChange={(e) => setNewDecorAllocation({...newDecorAllocation, african_mats: parseInt(e.target.value) || 0})}
                    className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted-foreground">Gold Napkin Holders</label>
                  <Input
                    type="number"
                    value={newDecorAllocation.gold_napkin_holders}
                    onChange={(e) => setNewDecorAllocation({...newDecorAllocation, gold_napkin_holders: parseInt(e.target.value) || 0})}
                    className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted-foreground">Silver Napkin Holders</label>
                  <Input
                    type="number"
                    value={newDecorAllocation.silver_napkin_holders}
                    onChange={(e) => setNewDecorAllocation({...newDecorAllocation, silver_napkin_holders: parseInt(e.target.value) || 0})}
                    className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted-foreground">Roof Top Decor</label>
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
                className="hover:bg-muted"
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
          <div className="bg-card rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto text-card-foreground">
            <h3 className="text-lg font-semibold mb-4">Add Lighting Items</h3>
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-1 text-muted-foreground">Customer Name *</label>
              <Input
                value={newDecorAllocation.customer_name}
                onChange={(e) => setNewDecorAllocation({...newDecorAllocation, customer_name: e.target.value})}
                placeholder="Enter customer name"
                className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <div className="mb-6">
              <h4 className="text-md font-medium mb-3 text-card-foreground">Lighting Items</h4>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted-foreground">Parcan Lights</label>
                  <Input
                    type="number"
                    value={newDecorAllocation.parcan_lights}
                    onChange={(e) => setNewDecorAllocation({...newDecorAllocation, parcan_lights: parseInt(e.target.value) || 0})}
                    className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted-foreground">Revolving Heads</label>
                  <Input
                    type="number"
                    value={newDecorAllocation.revolving_heads}
                    onChange={(e) => setNewDecorAllocation({...newDecorAllocation, revolving_heads: parseInt(e.target.value) || 0})}
                    className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted-foreground">Fairy Lights</label>
                  <Input
                    type="number"
                    value={newDecorAllocation.fairy_lights}
                    onChange={(e) => setNewDecorAllocation({...newDecorAllocation, fairy_lights: parseInt(e.target.value) || 0})}
                    className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted-foreground">Snake Lights</label>
                  <Input
                    type="number"
                    value={newDecorAllocation.snake_lights}
                    onChange={(e) => setNewDecorAllocation({...newDecorAllocation, snake_lights: parseInt(e.target.value) || 0})}
                    className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted-foreground">Neon Lights</label>
                  <Input
                    type="number"
                    value={newDecorAllocation.neon_lights}
                    onChange={(e) => setNewDecorAllocation({...newDecorAllocation, neon_lights: parseInt(e.target.value) || 0})}
                    className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted-foreground">Small Chandeliers</label>
                  <Input
                    type="number"
                    value={newDecorAllocation.small_chandeliers}
                    onChange={(e) => setNewDecorAllocation({...newDecorAllocation, small_chandeliers: parseInt(e.target.value) || 0})}
                    className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted-foreground">Large Chandeliers</label>
                  <Input
                    type="number"
                    value={newDecorAllocation.large_chandeliers}
                    onChange={(e) => setNewDecorAllocation({...newDecorAllocation, large_chandeliers: parseInt(e.target.value) || 0})}
                    className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted-foreground">African Lampshades</label>
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
                className="hover:bg-muted"
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