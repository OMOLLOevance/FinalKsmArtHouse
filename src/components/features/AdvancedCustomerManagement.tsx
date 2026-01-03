'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Printer, Calendar, ChevronLeft, ChevronRight, Save, Sparkles, FileText, Check, Settings, Lightbulb, Package, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';
import { useDecorAllocationsQuery, useUpsertDecorAllocationMutation } from '@/hooks/useDecorAllocations';
import MonthlyAllocationTable from './MonthlyAllocationTable';
import { toast } from 'sonner';

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

interface AdvancedCustomerManagementProps {
  onBack?: () => void;
}

const AdvancedCustomerManagement: React.FC<AdvancedCustomerManagementProps> = ({ onBack }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [editingCell, setEditingCell] = useState<{row: number, field: string} | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [activeConfigTab, setActiveConfigTab] = useState<'decor' | 'lighting'>('decor');
  const [newDecorAllocation, setNewDecorAllocation] = useState<Omit<DecorItem, 'id' | 'row_number'>>({
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
  
  const { data: decorData } = useDecorAllocationsQuery(currentMonth, currentYear);
  const upsertDecorMutation = useUpsertDecorAllocationMutation();
  const [decorItems, setDecorItems] = useState<DecorItem[]>([]);

  useEffect(() => {
    const savedDecorAllocations = decorData || [];
    if (savedDecorAllocations.length > 0) {
      setDecorItems(savedDecorAllocations as DecorItem[]);
    } else {
      setDecorItems([]);
    }
  }, [decorData]);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const handleCellClick = (row: number, field: string, currentValue: string | number) => {
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
      
      const updatedItem = { ...item, [actualField]: newValue };
      
      await upsertDecorMutation.mutateAsync({
        ...updatedItem,
        month: currentMonth + 1,
        year: currentYear
      });

      setEditingCell(null);
      setEditValue('');
      toast.success('Field updated successfully');
    } catch (error: any) {
      console.error('Error saving cell:', error);
      toast.error(`Failed to update field: ${error.response?.data?.error || error.message}`);
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

  const handleSaveDecorForm = async () => {
    if (!newDecorAllocation.customer_name.trim()) {
      toast.error('Customer name is required');
      return;
    }
    
    try {
      await upsertDecorMutation.mutateAsync({
        ...newDecorAllocation,
        month: currentMonth + 1,
        year: currentYear,
        row_number: decorItems.length + 1
      });
      
      setIsConfigOpen(false);
      setNewDecorAllocation({
        customer_name: '', walkway_stands: 0, arc: 0, aisle_stands: 0, photobooth: 0,
        lecturn: 0, stage_boards: 0, backdrop_boards: 0, dance_floor: 0, walkway_boards: 0,
        white_sticker: 0, centerpieces: 0, glass_charger_plates: 0, melamine_charger_plates: 0,
        african_mats: 0, gold_napkin_holders: 0, silver_napkin_holders: 0, roof_top_decor: 0,
        parcan_lights: 0, revolving_heads: 0, fairy_lights: 0, snake_lights: 0, neon_lights: 0,
        small_chandeliers: 0, large_chandeliers: 0, african_lampshades: 0
      });
      toast.success('Configuration added successfully');
    } catch (error: any) {
      console.error('Error adding decor item:', error);
      toast.error(`Failed to add configuration: ${error.response?.data?.error || error.message}`);
    }
  };

  const renderEditableCell = (value: string | number, row: number, field: string, placeholder?: string) => {
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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {onBack && (
            <Button variant="outline" size="sm" onClick={onBack} className="flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <span className="text-lg font-medium">Week of {currentYear}-{String(currentMonth + 1).padStart(2, '0')}</span>
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
          {upsertDecorMutation.isPending ? 'Saving changes to cloud...' : `Auto-save enabled • ${decorItems.length} decor configurations saved`}
        </p>
      </div>

      <MonthlyAllocationTable month={currentMonth} year={currentYear} onAddCustomer={() => {}} />

      <Card className="border-primary/10 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4 mb-6">
          <div>
            <CardTitle className="text-xl font-bold text-primary flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-primary/60" />
              Decor & Lighting Items
            </CardTitle>
            <p className="text-xs text-muted-foreground">{decorItems.length} customers configured</p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={() => { setActiveConfigTab('decor'); setIsConfigOpen(true); }} size="sm" variant="outline">
              <Package className="h-4 w-4 mr-2" /> Configure Decor
            </Button>
            <Button onClick={() => { setActiveConfigTab('lighting'); setIsConfigOpen(true); }} size="sm" variant="outline">
              <Lightbulb className="h-4 w-4 mr-2" /> Configure Lighting
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
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Custom Configuration</div>
              </div>
              
              <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase text-primary/70 tracking-widest border-b pb-1">Stands & Boards</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Walkway', field: 'walkway_stands' }, { label: 'Arc', field: 'arc' },
                      { label: 'Aisle', field: 'aisle_stands' }, { label: 'Photobooth', field: 'photobooth' },
                      { label: 'Lecturn', field: 'lecturn' }, { label: 'Stage', field: 'stage_boards' },
                      { label: 'Backdrop', field: 'backdrop_boards' }, { label: 'Walkway Bd', field: 'walkway_boards' },
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

                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase text-primary/70 tracking-widest border-b pb-1">Table & Decor</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'White Sticker', field: 'white_sticker' }, { label: 'Centerpiece', field: 'centerpieces' },
                      { label: 'Glass Plate', field: 'glass_charger_plates' }, { label: 'Melamine', field: 'melamine_charger_plates' },
                      { label: 'African Mats', field: 'african_mats' }, { label: 'Gold Napkin', field: 'gold_napkin_holders' },
                      { label: 'Silver Napkin', field: 'silver_napkin_holders' }, { label: 'Roof Top', field: 'roof_top_decor' },
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

                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase text-primary/70 tracking-widest border-b pb-1">Lighting</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Parcan', field: 'parcan_lights' }, { label: 'Revolving', field: 'revolving_heads' },
                      { label: 'Fairy', field: 'fairy_lights' }, { label: 'Snake', field: 'snake_lights' },
                      { label: 'Neon', field: 'neon_lights' }, { label: 'Small Chan', field: 'small_chandeliers' },
                      { label: 'Large Chan', field: 'large_chandeliers' }, { label: 'African Lamp', field: 'african_lampshades' },
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unified Asset Configuration Dialog */}
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight text-primary flex items-center">
              <Settings className="h-6 w-6 mr-2 text-primary/60" />
              Client Asset Configuration
            </DialogTitle>
            <DialogDescription className="text-[10px] uppercase font-bold tracking-widest opacity-60">
              Allocating professional equipment for {monthNames[currentMonth]} {currentYear}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {/* Identity Section */}
            <div className="bg-muted/20 p-4 rounded-xl border border-primary/5">
              <label className="text-[10px] font-black uppercase text-muted-foreground/70 tracking-widest ml-1 block mb-1.5">Target Client Identity</label>
              <Input 
                placeholder="Enter client or organization name" 
                value={newDecorAllocation.customer_name} 
                onChange={(e) => setNewDecorAllocation({...newDecorAllocation, customer_name: e.target.value})} 
                className="font-black h-11 border-primary/10 focus:border-primary uppercase"
              />
            </div>

            {/* Category Toggles */}
            <div className="flex bg-muted/30 p-1 rounded-xl border border-primary/5">
              <Button 
                variant={activeConfigTab === 'decor' ? 'default' : 'ghost'} 
                className={`flex-1 h-10 font-black uppercase tracking-widest text-[10px] rounded-lg transition-all ${activeConfigTab === 'decor' ? 'shadow-md' : ''}`}
                onClick={() => setActiveConfigTab('decor')}
              >
                <Package className="h-3 w-3 mr-2" /> Decor Specifications
              </Button>
              <Button 
                variant={activeConfigTab === 'lighting' ? 'default' : 'ghost'} 
                className={`flex-1 h-10 font-black uppercase tracking-widest text-[10px] rounded-lg transition-all ${activeConfigTab === 'lighting' ? 'shadow-md' : ''}`}
                onClick={() => setActiveConfigTab('lighting')}
              >
                <Lightbulb className="h-3 w-3 mr-2" /> Lighting Specs
              </Button>
            </div>

            {/* Field Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
              {activeConfigTab === 'decor' ? 
                // Decor Fields
                ['walkway_stands', 'arc', 'aisle_stands', 'photobooth', 'lecturn', 'stage_boards', 'backdrop_boards', 'dance_floor', 'walkway_boards', 'white_sticker', 'centerpieces', 'glass_charger_plates', 'melamine_charger_plates', 'african_mats', 'gold_napkin_holders', 'silver_napkin_holders', 'roof_top_decor'].map(field => (
                  <div key={field} className="space-y-1">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase truncate block ml-1">{field.replace(/_/g, ' ')}</label>
                    <Input 
                      type="number" 
                      value={(newDecorAllocation as any)[field] || ''} 
                      onChange={(e) => setNewDecorAllocation({...newDecorAllocation, [field]: parseInt(e.target.value) || 0})} 
                      className="h-9 font-bold bg-muted/10 border-primary/5 focus:border-primary/20"
                      placeholder="0"
                    />
                  </div>
                ))
               : 
                // Lighting Fields
                ['parcan_lights', 'revolving_heads', 'fairy_lights', 'snake_lights', 'neon_lights', 'small_chandeliers', 'large_chandeliers', 'african_lampshades'].map(field => (
                  <div key={field} className="space-y-1">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase truncate block ml-1">{field.replace(/_/g, ' ')}</label>
                    <Input 
                      type="number" 
                      value={(newDecorAllocation as any)[field] || ''} 
                      onChange={(e) => setNewDecorAllocation({...newDecorAllocation, [field]: parseInt(e.target.value) || 0})} 
                      className="h-9 font-bold bg-muted/10 border-primary/5 focus:border-primary/20"
                      placeholder="0"
                    />
                  </div>
                ))
              }
            </div>
          </div>

          <DialogFooter className="pt-8 gap-2 sm:gap-0 border-t mt-4">
            <Button 
              variant="outline" 
              onClick={() => { setIsConfigOpen(false); }}
              className="flex-1 sm:flex-none h-11 px-8 font-black uppercase tracking-widest text-[10px]"
            >
              Discard
            </Button>
            <Button 
              onClick={handleSaveDecorForm} 
              disabled={upsertDecorMutation.isPending}
              className="flex-1 sm:flex-none h-11 px-12 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20"
            >
              {upsertDecorMutation.isPending ? 'Processing...' : 'Commit Asset Allocation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdvancedCustomerManagement;