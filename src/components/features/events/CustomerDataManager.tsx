'use client';

import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Eye, 
  Save, 
  X, 
  ClipboardList,
  Calendar,
  MapPin,
  User,
  MoreVertical
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/Select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/Dialog';
import { useDataPersistence } from '@/hooks/useDataPersistence';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CustomerDataRecord {
  id: string;
  createdAt: string;
  date: string;
  location: string;
  customLocation?: string;
  clientName: string;
  // Numeric quantities
  doubleTent: number;
  singleTent: number;
  gazeboTent: number;
  frameTent: number;
  blineTent: number;
  pergulaTent: number;
  roundTable: number;
  longTent: number;
  chavaraiSeat: number;
  luxeSeat: number;
  metalicSeat: number;
  glassCharger: number;
  plasticSeat: number;
  banquetSeat: number;
  crBackSeat: number;
}

interface CustomerDataManagerProps {
  onBack: () => void;
}

const LOCATIONS = [
  "Baringo", "Bomet", "Bungoma", "Busia", "Elgeyo/Marakwet", "Embu", "Garissa", "Homa Bay", 
  "Isiolo", "Kajiado", "Kakamega", "Kericho", "Kiambu", "Kilifi", "Kirinyaga", "Kisii", 
  "Kisumu", "Kitui", "Kwale", "Laikipia", "Lamu", "Machakos", "Makueni", "Mandera", 
  "Marsabit", "Meru", "Migori", "Mombasa", "Murang'a", "Nairobi", "Nakuru", "Nandi", 
  "Narok", "Nyamira", "Nyandarua", "Nyeri", "Samburu", "Siaya", "Taita/Taveta", 
  "Tana River", "Tharaka-Nithi", "Trans Nzoia", "Turkana", "Uasin Gishu", "Vihiga", 
  "Wajir", "West Pokot", "Other"
];

const INITIAL_FORM_STATE: Omit<CustomerDataRecord, 'id' | 'createdAt'> = {
  date: '',
  location: 'Kisumu',
  customLocation: '',
  clientName: '',
  doubleTent: 0,
  singleTent: 0,
  gazeboTent: 0,
  frameTent: 0,
  blineTent: 0,
  pergulaTent: 0,
  roundTable: 0,
  longTent: 0,
  chavaraiSeat: 0,
  luxeSeat: 0,
  metalicSeat: 0,
  glassCharger: 0,
  plasticSeat: 0,
  banquetSeat: 0,
  crBackSeat: 0,
};

const CustomerDataManager: React.FC<CustomerDataManagerProps> = ({ onBack }) => {
  const [records, setRecords] = useDataPersistence<CustomerDataRecord[]>('customer-data-records', []);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingRecord, setViewingRecord] = useState<CustomerDataRecord | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  const recentClients = useMemo(() => {
    const clients = Array.from(new Set(records.map(r => r.clientName)));
    return clients.slice(0, 10);
  }, [records]);

  const filteredRecords = useMemo(() => {
    return records.filter(record => 
      record.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (record.customLocation && record.customLocation.toLowerCase().includes(searchQuery.toLowerCase()))
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [records, searchQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Math.max(0, parseInt(value) || 0) : value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM_STATE);
    setEditingId(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.date || !formData.location || !formData.clientName) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Check for duplicate client name (case-insensitive)
    const isDuplicate = records.some(r => 
      r.clientName.toLowerCase() === formData.clientName.toLowerCase() && r.id !== editingId
    );

    if (isDuplicate) {
      toast.error('Client name already exists. Please use a unique name or edit the existing record.');
      return;
    }

    if (formData.location === 'Other' && !formData.customLocation) {
      toast.error('Please specify the custom location');
      return;
    }

    if (editingId) {
      setRecords(records.map(r => r.id === editingId ? {
        ...r,
        ...formData,
      } : r));
      toast.success('Record updated successfully');
    } else {
      const newRecord: CustomerDataRecord = {
        ...formData,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      setRecords([...records, newRecord]);
      toast.success('Customer data saved successfully');
    }
    
    resetForm();
  };

  const handleEdit = (record: CustomerDataRecord) => {
    const { id, createdAt, ...rest } = record;
    setFormData(rest);
    setEditingId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = () => {
    if (isDeletingId) {
      setRecords(records.filter(r => r.id !== isDeletingId));
      setIsDeletingId(null);
      toast.success('Record deleted');
    }
  };

  const getTotalItems = (record: CustomerDataRecord) => {
    return (
      record.doubleTent + record.singleTent + record.gazeboTent + 
      record.frameTent + record.blineTent + record.pergulaTent + 
      record.roundTable + record.longTent + record.chavaraiSeat + 
      record.luxeSeat + record.metalicSeat + record.glassCharger + 
      record.plasticSeat + record.banquetSeat + record.crBackSeat
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={onBack} className="rounded-full h-10 w-10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-3xl font-black tracking-tighter text-foreground uppercase flex items-center gap-2">
              <ClipboardList className="h-8 w-8 text-primary" />
              Customer Data
            </h2>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground opacity-70">
              Manage setup specifications and logistics
            </p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <Card className="border-primary/10 shadow-2xl overflow-hidden glass-card">
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-indigo-600 to-teal-500" />
        <CardHeader>
          <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
            {editingId ? <Edit2 className="h-5 w-5 text-amber-500" /> : <Plus className="h-5 w-5 text-primary" />}
            {editingId ? 'Edit Record' : 'Capture New Setup Data'}
          </CardTitle>
          <CardDescription className="text-xs uppercase font-bold tracking-widest opacity-60">
            Log specific inventory requirements for this event
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-8">
            {/* Core Info Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Event Date *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="date" 
                    name="date" 
                    value={formData.date} 
                    onChange={handleInputChange} 
                    className="pl-10 h-11 font-bold rounded-xl bg-background/50 border-primary/10 focus:border-primary/30"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Client Name *</Label>
                <div className="space-y-2">
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Enter client name" 
                      name="clientName" 
                      value={formData.clientName} 
                      onChange={handleInputChange} 
                      className="pl-10 h-11 font-bold rounded-xl bg-background/50 border-primary/10 focus:border-primary/30"
                      required
                    />
                  </div>
                  {recentClients.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      <p className="text-[9px] font-bold uppercase text-muted-foreground w-full">Recent Clients:</p>
                      {recentClients.map(client => (
                        <Button 
                          key={client} 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-2 text-[9px] font-black uppercase rounded-full bg-primary/5 hover:bg-primary/10"
                          onClick={() => handleSelectChange('clientName', client)}
                        >
                          {client}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Location *</Label>
                <div className="space-y-2">
                  <Select value={formData.location} onValueChange={(val) => handleSelectChange('location', val)}>
                    <SelectTrigger className="h-11 font-bold rounded-xl bg-background/50 border-primary/10">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {LOCATIONS.map(loc => (
                        <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {formData.location === 'Other' && (
                    <div className="relative animate-in slide-in-from-top-1 duration-200">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Specify custom location" 
                        name="customLocation" 
                        value={formData.customLocation} 
                        onChange={handleInputChange} 
                        className="pl-10 h-11 font-bold rounded-xl bg-background/50 border-primary/10 focus:border-primary/30"
                        required
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Inventory Section */}
            <div className="space-y-4 pt-4 border-t border-primary/5">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Inventory Specifications</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {[
                  { id: 'doubleTent', label: 'Double Tent' },
                  { id: 'singleTent', label: 'Single Tent' },
                  { id: 'gazeboTent', label: 'Gazebo Tent' },
                  { id: 'frameTent', label: 'Frame Tent' },
                  { id: 'blineTent', label: 'B-Line Tent' },
                  { id: 'pergulaTent', label: 'Pergola Tent' },
                  { id: 'longTent', label: 'Long Tent' },
                  { id: 'roundTable', label: 'Round Table' },
                  { id: 'chavaraiSeat', label: 'Chavarai Seat' },
                  { id: 'luxeSeat', label: 'Luxe Seat' },
                  { id: 'metalicSeat', label: 'Metalic Seat' },
                  { id: 'glassCharger', label: 'Glass Charger' },
                  { id: 'plasticSeat', label: 'Plastic Seat' },
                  { id: 'banquetSeat', label: 'Banquet Seat' },
                  { id: 'crBackSeat', label: 'CR Back Seat' },
                ].map((item) => (
                  <div key={item.id} className="space-y-1.5">
                    <Label className="text-[9px] font-bold text-muted-foreground uppercase ml-1">{item.label}</Label>
                    <Input 
                      type="number" 
                      name={item.id} 
                      value={formData[item.id as keyof typeof formData]} 
                      onChange={handleInputChange} 
                      className="h-10 font-bold rounded-xl bg-muted/20 border-transparent focus:bg-background focus:border-primary/20"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-6">
              <Button type="button" variant="outline" onClick={resetForm} className="w-full sm:w-auto h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[10px]">
                <X className="h-4 w-4 mr-2" />
                Discard
              </Button>
              <Button type="submit" className="w-full sm:w-auto h-12 px-12 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20">
                <Save className="h-4 w-4 mr-2" />
                {editingId ? 'Update Record' : 'Save Customer Data'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* List Card */}
      <Card className="border-primary/5 shadow-xl glass-card overflow-hidden">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6">
          <div>
            <CardTitle className="text-xl font-black uppercase tracking-tight">Saved Specifications</CardTitle>
            <CardDescription className="text-xs uppercase font-bold tracking-widest opacity-60">History of captured customer event data</CardDescription>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by client or venue..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 font-bold rounded-xl bg-background/50 border-primary/10"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Date</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Client Name</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Location</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Total Items</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3 opacity-40">
                        <ClipboardList className="h-12 w-12" />
                        <p className="text-[10px] font-black uppercase tracking-widest">No records found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecords.map((record) => (
                    <TableRow key={record.id} className="hover:bg-primary/[0.02] transition-colors">
                      <TableCell className="font-bold text-xs">{record.date}</TableCell>
                      <TableCell className="font-black text-sm uppercase">{record.clientName}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-xs">
                            {record.location === 'Other' ? record.customLocation : record.location}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-black text-[10px]">
                          {getTotalItems(record)} ITEMS
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => setViewingRecord(record)} className="h-8 w-8 hover:text-primary">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(record)} className="h-8 w-8 hover:text-amber-600">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setIsDeletingId(record.id)} className="h-8 w-8 hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={!!viewingRecord} onOpenChange={() => setViewingRecord(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Event Setup Details</DialogTitle>
            <DialogDescription className="text-xs uppercase font-bold tracking-widest text-primary">
              Specifications for {viewingRecord?.clientName}
            </DialogDescription>
          </DialogHeader>
          
          {viewingRecord && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-muted/30 border border-primary/5">
                <div>
                  <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Date</p>
                  <p className="font-bold">{viewingRecord.date}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Location</p>
                  <p className="font-bold">
                    {viewingRecord.location === 'Other' ? viewingRecord.customLocation : viewingRecord.location}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary border-b border-primary/10 pb-2">Inventory Breakdown</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-6 gap-x-4">
                  {[
                    { id: 'doubleTent', label: 'Double Tent' },
                    { id: 'singleTent', label: 'Single Tent' },
                    { id: 'gazeboTent', label: 'Gazebo Tent' },
                    { id: 'frameTent', label: 'Frame Tent' },
                    { id: 'blineTent', label: 'B-Line Tent' },
                    { id: 'pergulaTent', label: 'Pergola Tent' },
                    { id: 'longTent', label: 'Long Tent' },
                    { id: 'roundTable', label: 'Round Table' },
                    { id: 'chavaraiSeat', label: 'Chavarai Seat' },
                    { id: 'luxeSeat', label: 'Luxe Seat' },
                    { id: 'metalicSeat', label: 'Metalic Seat' },
                    { id: 'glassCharger', label: 'Glass Charger' },
                    { id: 'plasticSeat', label: 'Plastic Seat' },
                    { id: 'banquetSeat', label: 'Banquet Seat' },
                    { id: 'crBackSeat', label: 'CR Back Seat' },
                  ].map((item) => {
                    const value = viewingRecord[item.id as keyof CustomerDataRecord];
                    if (typeof value !== 'number' || value === 0) return null;
                    return (
                      <div key={item.id} className="flex flex-col">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase">{item.label}</span>
                        <span className="font-black text-xl">{value}</span>
                      </div>
                    );
                  })}
                  <div className="flex flex-col p-3 rounded-xl bg-primary/10 text-primary border border-primary/10 col-span-full">
                    <span className="text-[9px] font-black uppercase tracking-widest">Total Items</span>
                    <span className="font-black text-2xl">{getTotalItems(viewingRecord)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setViewingRecord(null)} className="font-black uppercase tracking-widest text-[10px] px-8 rounded-xl h-11">
              Close Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!isDeletingId} onOpenChange={() => setIsDeletingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tight">Confirm Deletion</DialogTitle>
            <DialogDescription className="font-bold text-sm">
              Are you absolutely sure you want to remove this record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDeletingId(null)} className="font-black uppercase tracking-widest text-[10px] rounded-xl">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} className="font-black uppercase tracking-widest text-[10px] rounded-xl">
              Delete Forever
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerDataManager;