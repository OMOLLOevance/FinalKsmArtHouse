import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Plus, Search, FileText, Edit, Trash2, Printer, X, Loader, Database, ChevronDown, ChevronUp } from 'lucide-react';
import { useQuotations } from '@/hooks/useQuotations';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/utils/formatters';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

interface QuotationManagerProps {
  onBack: () => void;
}

interface QuotationItem {
  id: string;
  description: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  total: number;
  remarks: string;
}

interface QuotationSection {
  name: string;
  items: QuotationItem[];
}

interface Quotation {
  id: string;
  quotationNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  numberOfGuests: number;
  theme: string;
  eventDate: string;
  eventType: string;
  customEventType: string;
  quotationType: 'event' | 'food';
  sections: QuotationSection[];
  grandTotal: number;
  additionalCharges: {
    cateringLabour: number;
    serviceCharge: number;
    transport: number;
  };
  status: 'draft' | 'sent' | 'approved' | 'rejected';
  createdAt: string;
  notes: string;
}

const EVENT_TEMPLATE: QuotationSection[] = [
  { name: 'FRESH FLOWERS REQUIREMENTS', items: Array(13).fill(null).map((_, i) => ({ id: `flowers-${i}`, description: '', unit: '', unitPrice: 0, quantity: 0, total: 0, remarks: '' })) },
  { name: 'CHURCH CEREMONY AREA', items: Array(20).fill(null).map((_, i) => ({ id: `church-${i}`, description: '', unit: '', unitPrice: 0, quantity: 0, total: 0, remarks: '' })) },
  { name: 'VEHICLE DECORATION', items: Array(10).fill(null).map((_, i) => ({ id: `vehicle-${i}`, description: '', unit: '', unitPrice: 0, quantity: 0, total: 0, remarks: '' })) },
  { name: 'PARTICULARS RECEPTION AREA', items: Array(20).fill(null).map((_, i) => ({ id: `reception-${i}`, description: '', unit: '', unitPrice: 0, quantity: 0, total: 0, remarks: '' })) },
  { name: 'SOUND AND ENTERTAINMENT', items: Array(10).fill(null).map((_, i) => ({ id: `sound-${i}`, description: '', unit: '', unitPrice: 0, quantity: 0, total: 0, remarks: '' })) },
];

const FOOD_TEMPLATE: QuotationSection[] = [
  { name: 'PROTEINS', items: Array(10).fill(null).map((_, i) => ({ id: `protein-${i}`, description: '', unit: '', unitPrice: 0, quantity: 0, total: 0, remarks: '' })) },
  { name: 'CARBOHYDRATES', items: Array(10).fill(null).map((_, i) => ({ id: `carbs-${i}`, description: '', unit: '', unitPrice: 0, quantity: 0, total: 0, remarks: '' })) },
  { name: 'ADDITIVES', items: Array(15).fill(null).map((_, i) => ({ id: `additive-${i}`, description: '', unit: '', unitPrice: 0, quantity: 0, total: 0, remarks: '' })) },
  { name: 'VEGETABLES AND GROCERIES', items: Array(16).fill(null).map((_, i) => ({ id: `veg-${i}`, description: '', unit: '', unitPrice: 0, quantity: 0, total: 0, remarks: '' })) },
  { name: 'FRUITS IN SEASON', items: Array(6).fill(null).map((_, i) => ({ id: `fruit-${i}`, description: '', unit: '', unitPrice: 0, quantity: 0, total: 0, remarks: '' })) },
  { name: 'BEVERAGES', items: Array(6).fill(null).map((_, i) => ({ id: `bev-${i}`, description: '', unit: '', unitPrice: 0, quantity: 0, total: 0, remarks: '' })) },
  { name: 'WRAPPING AND WASHING ITEMS', items: Array(7).fill(null).map((_, i) => ({ id: `wrap-${i}`, description: '', unit: '', unitPrice: 0, quantity: 0, total: 0, remarks: '' })) },
  { name: 'ENERGY', items: Array(7).fill(null).map((_, i) => ({ id: `energy-${i}`, description: '', unit: '', unitPrice: 0, quantity: 0, total: 0, remarks: '' })) },
  { name: 'OTHERS', items: Array(5).fill(null).map((_, i) => ({ id: `other-${i}`, description: '', unit: '', unitPrice: 0, quantity: 0, total: 0, remarks: '' })) },
];

const QuotationManager: React.FC<QuotationManagerProps> = ({ onBack }) => {
  const { userId } = useAuth();
  const { quotations, loading, createQuotation, updateQuotation, deleteQuotation, fetchQuotations } = useQuotations();
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().substring(0, 10));
  const [viewMode, setViewMode] = useState<'all' | 'date'>('all');
  const [quotationType, setQuotationType] = useState<'event' | 'food'>('event');
  const [saving, setSaving] = useState(false);
  const [showDatabasePanel, setShowDatabasePanel] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    numberOfGuests: 0,
    theme: '',
    eventDate: '',
    eventType: '',
    customEventType: '',
    notes: '',
  });

  const [sections, setSections] = useState<QuotationSection[]>(EVENT_TEMPLATE);
  const [additionalCharges, setAdditionalCharges] = useState({
    cateringLabour: 0,
    serviceCharge: 0,
    transport: 0,
  });

  useEffect(() => {
    if (!editingQuotation) {
       setSections(quotationType === 'event' ? EVENT_TEMPLATE : FOOD_TEMPLATE);
    }
  }, [quotationType, editingQuotation]);

  const calculateGrandTotal = () => {
    const itemsTotal = sections.reduce((sum, section) => 
      sum + section.items.reduce((s, item) => s + item.total, 0), 0);
    if (quotationType === 'food') {
      return itemsTotal + (additionalCharges?.cateringLabour || 0) + (additionalCharges?.serviceCharge || 0) + (additionalCharges?.transport || 0);
    }
    return itemsTotal;
  };

  const handleItemChange = (sectionIndex: number, itemIndex: number, field: keyof QuotationItem, value: string | number) => {
    const newSections = JSON.parse(JSON.stringify(sections));
    const item = newSections[sectionIndex].items[itemIndex];

    if (field === 'unitPrice' || field === 'quantity') {
      item[field] = Number(value);
      item.total = item.unitPrice * item.quantity;
    } else {
      item[field] = value;
    }

    newSections[sectionIndex].items[itemIndex] = item;
    setSections(newSections);
  };

  const handleDeleteItem = (sectionIndex: number, itemIndex: number) => {
    const newSections = JSON.parse(JSON.stringify(sections));
    newSections[sectionIndex].items[itemIndex] = {
      id: newSections[sectionIndex].items[itemIndex].id,
      description: '',
      unit: '',
      unitPrice: 0,
      quantity: 0,
      total: 0,
      remarks: '',
    };
    setSections(newSections);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      toast.error('Session expired. Please log in.');
      return;
    }
    setSaving(true);

    const quotationData = {
      user_id: userId,
      customer_name: formData.customerName,
      customer_email: formData.customerEmail || null,
      customer_phone: formData.customerPhone || null,
      number_of_guests: Number(formData.numberOfGuests) || 0,
      theme: formData.theme || null,
      event_date: formData.eventDate || null,
      event_type: (formData.eventType === 'Other' ? formData.customEventType : formData.eventType) || null,
      custom_event_type: formData.customEventType || null,
      quotation_type: quotationType === 'event' ? 'Event/Decor' : 'Food/Catering',
      sections: sections.map(s => ({ name: s.name, items: s.items })),
      additional_charges: additionalCharges,
      notes: formData.notes || null,
      status: editingQuotation?.status || 'draft',
      total_amount: calculateGrandTotal(),
    };

    try {
      if (editingQuotation) {
        await updateQuotation(editingQuotation.id, quotationData);
        toast.success('Quotation updated successfully');
      } else {
        await createQuotation(quotationData);
        toast.success('Quotation saved successfully');
      }
      resetForm();
      setShowForm(false);
      await fetchQuotations();
    } catch (error: any) {
      logger.error('Failed to save quotation:', error);
      const msg = error.response?.data?.error || error.message || 'Unknown error';
      toast.error(`Failed to save: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      customerName: '', customerEmail: '', customerPhone: '',
      numberOfGuests: 0, theme: '', eventDate: '',
      eventType: '', customEventType: '', notes: '',
    });
    setQuotationType('event');
    setSections(EVENT_TEMPLATE);
    setAdditionalCharges({ cateringLabour: 0, serviceCharge: 0, transport: 0 });
    setEditingQuotation(null);
  };

  const handleEdit = (quotation: Quotation) => {
    setEditingQuotation(quotation);
    setFormData({
      customerName: quotation.customerName,
      customerEmail: quotation.customerEmail,
      customerPhone: quotation.customerPhone,
      numberOfGuests: quotation.numberOfGuests,
      theme: quotation.theme,
      eventDate: quotation.eventDate,
      eventType: quotation.customEventType ? 'Other' : quotation.eventType,
      customEventType: quotation.customEventType,
      notes: quotation.notes,
    });
    setQuotationType(quotation.quotationType);
    setSections(quotation.sections);
    setAdditionalCharges(quotation.additionalCharges);
    setShowForm(true);
  };

  const handleSyncDatabase = async () => {
    setIsSyncing(true);
    try {
      await fetchQuotations();
    } catch (error) {
      logger.error('Sync failed:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this quotation?')) {
      try {
        await deleteQuotation(id);
        await fetchQuotations();
      } catch (error) {
        logger.error('Delete failed:', error);
      }
    }
  };

  const handleUpdateStatus = async (id: string, status: Quotation['status']) => {
    try {
      await updateQuotation(id, { status });
      await fetchQuotations();
    } catch (error) {
      logger.error('Status update failed:', error);
    }
  };

  const filteredQuotations = useMemo(() => {
    if (!quotations) return [];
    return viewMode === 'date'
      ? quotations.filter(q => q.eventDate === selectedDate)
      : quotations.filter(q =>
          (q.customerName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (q.quotationNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase())
        );
  }, [quotations, viewMode, selectedDate, searchTerm]);

  if (showForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <h2 className="text-2xl font-bold">{editingQuotation ? 'Edit Quotation' : 'New Quotation'}</h2>
          </div>
          <Button onClick={() => setShowForm(false)} variant="outline">
            <FileText className="h-4 w-4 mr-2" /> View Saved
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="print:hidden">
            <CardHeader><CardTitle>Customer Information</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input placeholder="Customer Name" value={formData.customerName} onChange={(e) => setFormData({ ...formData, customerName: e.target.value })} required />
                <Input type="email" placeholder="Email" value={formData.customerEmail} onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })} required />
                <Input type="tel" placeholder="Phone" value={formData.customerPhone} onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })} required />
                <Input type="number" placeholder="Guests" value={formData.numberOfGuests || ''} onChange={(e) => setFormData({ ...formData, numberOfGuests: Number(e.target.value) })} required />
                <Input placeholder="Theme" value={formData.theme} onChange={(e) => setFormData({ ...formData, theme: e.target.value })} required />
                <Input type="date" value={formData.eventDate} onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })} required />
              </div>
            </CardContent>
          </Card>

          <Card className="print:shadow-none print:border-none">
            <CardHeader className="flex flex-row items-center justify-between print:hidden">
              <CardTitle>{quotationType === 'event' ? 'Event & Decor' : 'Food & Catering'}</CardTitle>
              <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4 mr-2" /> Print</Button>
            </CardHeader>
            <CardContent>
              <div className="hidden print:block mb-6 text-center border-b-4 border-primary pb-4">
                <h1 className="text-3xl font-bold">KISUMU ART HOUSE</h1>
                <p>Professional Event Management</p>
              </div>

              {sections.map((section, sIdx) => (
                <div key={sIdx} className="mb-10">
                  <div className="flex items-center justify-between border-b-2 border-primary/20 pb-2 mb-4">
                    <h4 className="text-sm font-black uppercase text-primary tracking-widest">{section.name}</h4>
                    <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded uppercase">
                      {section.items.filter(i => i.description).length} Items Configured
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 print:hidden">
                    {section.items.map((item, iIdx) => (
                      <Card key={iIdx} className={`overflow-hidden border-muted hover:border-primary/30 transition-all duration-300 ${item.description ? 'border-l-4 border-l-primary/40' : 'bg-muted/5 opacity-60'}`}>
                        <div className="p-3 space-y-3">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1">
                              <label className="text-[8px] font-black uppercase text-muted-foreground tracking-widest mb-1 block">Description</label>
                              <Input 
                                value={item.description} 
                                onChange={(e) => handleItemChange(sIdx, iIdx, 'description', e.target.value)} 
                                className="h-8 text-xs font-bold bg-background border-none shadow-none focus-visible:ring-1"
                                placeholder="Enter item description..."
                              />
                            </div>
                            <Button 
                              variant="ghost" 
                              size="xs" 
                              className="h-6 w-6 p-0 text-destructive/50 hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteItem(sIdx, iIdx)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <div className="space-y-0.5">
                              <label className="text-[8px] font-black uppercase text-muted-foreground tracking-tighter">Unit</label>
                              <Input 
                                value={item.unit} 
                                onChange={(e) => handleItemChange(sIdx, iIdx, 'unit', e.target.value)} 
                                className="h-7 text-[10px] text-center bg-muted/20 border-none shadow-none"
                                placeholder="e.g. PCS"
                              />
                            </div>
                            <div className="space-y-0.5">
                              <label className="text-[8px] font-black uppercase text-muted-foreground tracking-tighter">Price</label>
                              <Input 
                                type="number" 
                                value={item.unitPrice || ''} 
                                onChange={(e) => handleItemChange(sIdx, iIdx, 'unitPrice', e.target.value)} 
                                className="h-7 text-[10px] text-center bg-muted/20 border-none shadow-none font-bold"
                                placeholder="0"
                              />
                            </div>
                            <div className="space-y-0.5">
                              <label className="text-[8px] font-black uppercase text-muted-foreground tracking-tighter">Qty</label>
                              <Input 
                                type="number" 
                                value={item.quantity || ''} 
                                onChange={(e) => handleItemChange(sIdx, iIdx, 'quantity', e.target.value)} 
                                className="h-7 text-[10px] text-center bg-muted/20 border-none shadow-none font-bold"
                                placeholder="0"
                              />
                            </div>
                          </div>
                          
                          {item.total > 0 && (
                            <div className="flex justify-between items-center border-t pt-2 mt-1">
                              <span className="text-[9px] font-black text-muted-foreground uppercase">Subtotal</span>
                              <span className="text-xs font-black text-primary">{formatCurrency(item.total)}</span>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* Print-only Table view */}
                  <table className="min-w-full border-collapse hidden print:table">
                    <thead>
                      <tr className="bg-muted/50 border-b text-xs font-bold">
                        <th className="px-2 py-2 text-left">DESCRIPTION</th>
                        <th className="px-2 py-2 text-left w-20">UNIT</th>
                        <th className="px-2 py-2 text-right w-24">PRICE</th>
                        <th className="px-2 py-2 text-center w-16">QTY</th>
                        <th className="px-2 py-2 text-right w-24">TOTAL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {section.items.filter(i => i.description).map((item, iIdx) => (
                        <tr key={iIdx} className="text-xs">
                          <td className="px-2 py-1.5">{item.description}</td>
                          <td className="px-2 py-1.5">{item.unit}</td>
                          <td className="px-2 py-1.5 text-right font-mono">{item.unitPrice.toLocaleString()}</td>
                          <td className="px-2 py-1.5 text-center">{item.quantity}</td>
                          <td className="px-2 py-1.5 text-right font-bold font-mono">{item.total.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}

              <div className="mt-6 flex justify-end items-center border-t-2 border-primary pt-4">
                <span className="text-lg font-bold mr-4">GRAND TOTAL:</span>
                <span className="text-xl font-bold text-primary">{formatCurrency(calculateGrandTotal())}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="print:hidden">
            <CardFooter className="flex justify-end space-x-4 p-6">
              <Button variant="outline" type="button" onClick={resetForm}>Clear</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Quotation'}</Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>
          <h2 className="text-2xl font-bold tracking-tight">Quotations</h2>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowForm(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground"><Plus className="h-4 w-4 mr-2" /> New</Button>
          <Button onClick={handleSyncDatabase} variant="outline" disabled={isSyncing}><Database className="h-4 w-4 mr-2" /> Sync</Button>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredQuotations.map((q) => (
          <Card key={q.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold">{q.quotationNumber}</h3>
                    <Badge variant={q.status === 'approved' ? 'success' : 'outline'}>{q.status.toUpperCase()}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{q.customerName} - {q.eventType}</p>
                  <p className="font-bold text-primary">{formatCurrency(q.grandTotal)}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" onClick={() => handleEdit(q)}><Edit className="h-4 w-4 text-primary" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(q.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default QuotationManager;
