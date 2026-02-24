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
  User
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
import { useCustomerDataSync } from '@/hooks/useCustomerDataSync';
import { useAuth } from '@/contexts/AuthContext';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { toast } from 'sonner';
import { PageLoader } from '@/components/ui/LoadingSpinner';

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

const INITIAL_FORM_STATE = {
  date: '',
  location: 'Kisumu',
  customLocation: '',
  clientName: '',
  doubleTent: 0,
  singleTent: 0,
  gazeboTent: 0,
  frameTent: 0,
  bLineTent: 0,
  pergolaTent: 0,
  roundTable: 0,
  longTent: 0,
  chavaraiSeat: 0,
  luxeSeat: 0,
  metallicSeat: 0,
  glassCharger: 0,
  plasticSeat: 0,
  banquetSeat: 0,
  crBackSeat: 0,
};

const CustomerDataManager: React.FC<CustomerDataManagerProps> = ({ onBack }) => {
  const { isOperationsManager, isDirectorOrInvestor } = useRoleGuard();
  const isManager = isOperationsManager() || isDirectorOrInvestor();
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  
  const { 
    records, 
    isLoading, 
    createRecord, 
    updateRecord, 
    deleteRecord,
    isSaving 
  } = useCustomerDataSync(selectedMonth, selectedYear);

  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingRecord, setViewingRecord] = useState<any | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  const recentClients = useMemo(() => {
    const clients = Array.from(new Set(records.map(r => r.name)));
    return clients.slice(0, 10);
  }, [records]);

  const filteredRecords = useMemo(() => {
    return records.filter(record => 
      record.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.location.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.date || !formData.location || !formData.clientName) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.location === 'Other' && !formData.customLocation) {
      toast.error('Please specify the custom location');
      return;
    }

    const requirements = {
      doubleTent: formData.doubleTent,
      singleTent: formData.singleTent,
      gazeboTent: formData.gazeboTent,
      frameTent: formData.frameTent,
      bLineTent: formData.bLineTent,
      pergolaTent: formData.pergolaTent,
      roundTable: formData.roundTable,
      longTent: formData.longTent,
      chavaraiSeat: formData.chavaraiSeat,
      luxeSeat: formData.luxeSeat,
      metallicSeat: formData.metallicSeat,
      glassCharger: formData.glassCharger,
      plasticSeat: formData.plasticSeat,
      banquetSeat: formData.banquetSeat,
      crBackSeat: formData.crBackSeat,
    };

    const recordData = {
      name: formData.clientName,
      event_date: formData.date,
      location: formData.location === 'Other' ? formData.customLocation! : formData.location,
      requirements
    };

    try {
      if (editingId) {
        await updateRecord({ id: editingId, ...recordData });
      } else {
        await createRecord(recordData);
      }
      resetForm();
    } catch (err) {
      // Error handled in hook
    }
  };

  const handleEdit = (record: any) => {
    setFormData({
      date: record.event_date || '',
      location: LOCATIONS.includes(record.location) ? record.location : 'Other',
      customLocation: LOCATIONS.includes(record.location) ? '' : record.location,
      clientName: record.name,
      doubleTent: record.requirements?.doubleTent || 0,
      singleTent: record.requirements?.singleTent || 0,
      gazeboTent: record.requirements?.gazeboTent || 0,
      frameTent: record.requirements?.frameTent || 0,
      bLineTent: record.requirements?.bLineTent || 0,
      pergolaTent: record.requirements?.pergolaTent || 0,
      roundTable: record.requirements?.roundTable || 0,
      longTent: record.requirements?.longTent || 0,
      chavaraiSeat: record.requirements?.chavaraiSeat || 0,
      luxeSeat: record.requirements?.luxeSeat || 0,
      metallicSeat: record.requirements?.metallicSeat || 0,
      glassCharger: record.requirements?.glassCharger || 0,
      plasticSeat: record.requirements?.plasticSeat || 0,
      banquetSeat: record.requirements?.banquetSeat || 0,
      crBackSeat: record.requirements?.crBackSeat || 0,
    });
    setEditingId(record.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async () => {
    if (isDeletingId) {
      await deleteRecord(isDeletingId);
      setIsDeletingId(null);
    }
  };

  const getTotalItems = (record: any) => {
    const req = record.requirements || {};
    return Object.values(req).reduce((acc: number, val: any) => acc + (Number(val) || 0), 0);
  };

  if (isLoading && records.length === 0) {
    return <PageLoader text="Loading customer records..." />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={onBack} className="rounded-full h-10 w-10" aria-label="Back to Event Management">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-foreground uppercase flex items-center gap-2">
              <ClipboardList className="h-8 w-8 text-primary" />
              Customer Data
            </h1>
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
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Inventory Specifications</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {[
                  { id: 'doubleTent', label: 'Double Tent' },
                  { id: 'singleTent', label: 'Single Tent' },
                  { id: 'gazeboTent', label: 'Gazebo Tent' },
                  { id: 'frameTent', label: 'Frame Tent' },
                  { id: 'bLineTent', label: 'B-Line Tent' },
                  { id: 'pergolaTent', label: 'Pergola Tent' },
                  { id: 'longTent', label: 'Long Tent' },
                  { id: 'roundTable', label: 'Round Table' },
                  { id: 'chavaraiSeat', label: 'Chavarai Seat' },
                  { id: 'luxeSeat', label: 'Luxe Seat' },
                  { id: 'metallicSeat', label: 'Metallic Seat' },
                  { id: 'glassCharger', label: 'Glass Charger' },
                  { id: 'plasticSeat', label: 'Plastic Seat' },
                  { id: 'banquetSeat', label: 'Banquet Seat' },
                  { id: 'crBackSeat', label: 'CR Back Seat' },
                ].map((item) => (
                  <div key={item.id} className="space-y-1.5">
                    <Label htmlFor={item.id} className="text-[9px] font-bold text-muted-foreground uppercase ml-1">{item.label}</Label>
                    <Input 
                      id={item.id}
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
              <Button type="submit" disabled={isSaving} className="w-full sm:w-auto h-12 px-12 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20">
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : (editingId ? 'Update Record' : 'Save Customer Data')}
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
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="flex gap-2">
              <Select value={selectedMonth.toString()} onValueChange={(val) => setSelectedMonth(val === 'all' ? 'all' : parseInt(val))}>
                <SelectTrigger className="w-[120px] h-10 font-bold rounded-xl bg-background/50 border-primary/10">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => (
                    <SelectItem key={m} value={i.toString()}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedYear.toString()} onValueChange={(val) => setSelectedYear(parseInt(val))}>
                <SelectTrigger className="w-[100px] h-10 font-bold rounded-xl bg-background/50 border-primary/10">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026].map(y => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by client or venue..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 font-bold rounded-xl bg-background/50 border-primary/10"
              />
            </div>
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
                      <TableCell className="font-bold text-xs">{record.event_date}</TableCell>
                      <TableCell className="font-black text-sm uppercase">{record.name}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-xs">{record.location}</span>
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
              Specifications for {viewingRecord?.name}
            </DialogDescription>
          </DialogHeader>
          
          {viewingRecord && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-muted/30 border border-primary/5">
                <div>
                  <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Date</p>
                  <p className="font-bold">{viewingRecord.event_date}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Location</p>
                  <p className="font-bold">{viewingRecord.location}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary border-b border-primary/10 pb-2">Inventory Breakdown</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-6 gap-x-4">
                  {[
                    { id: 'doubleTent', label: 'Double Tent' },
                    { id: 'singleTent', label: 'Single Tent' },
                    { id: 'gazeboTent', label: 'Gazebo Tent' },
                    { id: 'frameTent', label: 'Frame Tent' },
                    { id: 'bLineTent', label: 'B-Line Tent' },
                    { id: 'pergolaTent', label: 'Pergola Tent' },
                    { id: 'longTent', label: 'Long Tent' },
                    { id: 'roundTable', label: 'Round Table' },
                    { id: 'chavaraiSeat', label: 'Chavarai Seat' },
                    { id: 'luxeSeat', label: 'Luxe Seat' },
                    { id: 'metallicSeat', label: 'Metallic Seat' },
                    { id: 'glassCharger', label: 'Glass Charger' },
                    { id: 'plasticSeat', label: 'Plastic Seat' },
                    { id: 'banquetSeat', label: 'Banquet Seat' },
                    { id: 'crBackSeat', label: 'CR Back Seat' },
                  ].map((item) => {
                    const value = viewingRecord.requirements?.[item.id];
                    if (!value || value === 0) return null;
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
