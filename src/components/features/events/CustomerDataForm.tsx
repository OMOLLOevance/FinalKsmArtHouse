'use client';

import React, { useState } from 'react';
import { ArrowLeft, ClipboardList, Save, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface CustomerDataFormProps {
  onBack: () => void;
}

const CustomerDataForm: React.FC<CustomerDataFormProps> = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    location: '',
    clientName: '',
    // Tents / Structures
    doubleTent: 0,
    singleTent: 0,
    gazeboTent: 0,
    frameTent: 0,
    blineTent: 0,
    pergulaTent: 0,
    longTent: 0,
    // Tables / Seating / Extras
    roundTable: 0,
    chavaraiSeat: 0,
    luxeSeat: 0,
    metalicSeat: 0,
    plasticSeat: 0,
    banquetSeat: 0,
    crBackSeat: 0,
    glassCharger: 0,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? Math.max(0, parseInt(value) || 0) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.date || !formData.location || !formData.clientName) {
      toast.error('Please fill in all required fields: Date, Location, and Client Name');
      return;
    }

    setLoading(true);
    console.log('Customer Data Payload:', formData);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast.success('Customer event data captured successfully!');
      onBack();
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={onBack} className="flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground uppercase">Customer Data</h2>
            <p className="text-xs font-black uppercase text-muted-foreground tracking-widest opacity-60">Capture event setup specifications</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card className="border-primary/10 shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-primary via-indigo-600 to-teal-500" />
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2 text-primary font-black uppercase tracking-tight">
              <ClipboardList className="h-5 w-5" />
              Event Core Information
            </CardTitle>
            <CardDescription className="text-[10px] uppercase font-bold tracking-widest opacity-60">Required logistics and client identity</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Event Date *</Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleInputChange}
                required
                className="h-11 font-bold bg-background/50 border-primary/5 focus:border-primary/20 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientName" className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Client Name *</Label>
              <Input
                id="clientName"
                name="clientName"
                placeholder="Enter client or organization name"
                value={formData.clientName}
                onChange={handleInputChange}
                required
                className="h-11 font-bold bg-background/50 border-primary/5 focus:border-primary/20 rounded-xl"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="location" className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Event Location *</Label>
              <Input
                id="location"
                name="location"
                placeholder="Specific venue or address"
                value={formData.location}
                onChange={handleInputChange}
                required
                className="h-11 font-bold bg-background/50 border-primary/5 focus:border-primary/20 rounded-xl"
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Tents Section */}
          <Card className="border-primary/10 shadow-lg bg-card/50 backdrop-blur-sm hover-glow transition-all duration-500">
            <CardHeader className="border-b border-primary/5 pb-4">
              <CardTitle className="text-lg font-black uppercase tracking-tight text-primary">Tents & Structures</CardTitle>
              <CardDescription className="text-[9px] uppercase font-bold tracking-widest opacity-60">Specify the quantity for each structure type</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-6">
              {[
                { id: 'doubleTent', label: 'Double Tent' },
                { id: 'singleTent', label: 'Single Tent' },
                { id: 'gazeboTent', label: 'Gazebo Tent' },
                { id: 'frameTent', label: 'Frame Tent' },
                { id: 'blineTent', label: 'B-Line Tent' },
                { id: 'pergulaTent', label: 'Pergola Tent' },
                { id: 'longTent', label: 'Long Tent' },
              ].map((field) => (
                <div key={field.id} className="space-y-1.5">
                  <Label htmlFor={field.id} className="text-[9px] font-bold text-muted-foreground uppercase ml-1">{field.label}</Label>
                  <Input
                    id={field.id}
                    name={field.id}
                    type="number"
                    min="0"
                    value={formData[field.id as keyof typeof formData]}
                    onChange={handleInputChange}
                    className="h-10 font-bold bg-muted/10 border-primary/5 focus:border-primary/20 rounded-xl"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Tables & Seating Section */}
          <Card className="border-primary/10 shadow-lg bg-card/50 backdrop-blur-sm hover-glow transition-all duration-500">
            <CardHeader className="border-b border-primary/5 pb-4">
              <CardTitle className="text-lg font-black uppercase tracking-tight text-primary">Tables, Seating & Extras</CardTitle>
              <CardDescription className="text-[9px] uppercase font-bold tracking-widest opacity-60">Specify counts for guest comfort and decor</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-6">
              {[
                { id: 'roundTable', label: 'Round Table' },
                { id: 'chavaraiSeat', label: 'Chavari Seat' },
                { id: 'luxeSeat', label: 'Luxe Seat' },
                { id: 'metalicSeat', label: 'Metallic Seat' },
                { id: 'plasticSeat', label: 'Plastic Seat' },
                { id: 'banquetSeat', label: 'Banquet Seat' },
                { id: 'crBackSeat', label: 'CR Back Seat' },
                { id: 'glassCharger', label: 'Glass Charger' },
              ].map((field) => (
                <div key={field.id} className="space-y-1.5">
                  <Label htmlFor={field.id} className="text-[9px] font-bold text-muted-foreground uppercase ml-1">{field.label}</Label>
                  <Input
                    id={field.id}
                    name={field.id}
                    type="number"
                    min="0"
                    value={formData[field.id as keyof typeof formData]}
                    onChange={handleInputChange}
                    className="h-10 font-bold bg-muted/10 border-primary/5 focus:border-primary/20 rounded-xl"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-6">
          <Button type="button" variant="outline" onClick={onBack} size="lg" className="w-full sm:w-auto h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[10px]">
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button type="submit" disabled={loading} size="lg" className="w-full sm:w-auto h-12 px-12 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20">
            {loading ? (
              'Saving...'
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Customer Data
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CustomerDataForm;
