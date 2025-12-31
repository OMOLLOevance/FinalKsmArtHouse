import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Search, FileText, Edit, Trash2, Printer, X, Loader, Database, ChevronDown, ChevronUp } from 'lucide-react';
import { useQuotations } from '@/hooks/useQuotations';
import { ensureAuthenticated } from '@/utils/authHelpers';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

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
  const { quotations: dbQuotations, loading, createQuotation, updateQuotation, deleteQuotation, fetchQuotations } = useQuotations();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [showForm, setShowForm] = useState(false); // Default to list view
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

  // Sync Supabase quotations with local state
  useEffect(() => {
    if (dbQuotations && dbQuotations.length > 0) {
      const mappedQuotations: Quotation[] = dbQuotations.map(q => ({
        id: q.id,
        quotationNumber: `QT-${q.id.slice(-6)}`,
        customerName: (q as any).customer_name,
        customerEmail: (q as any).customer_email,
        customerPhone: (q as any).customer_phone,
        numberOfGuests: (q as any).number_of_guests,
        theme: (q as any).theme,
        eventDate: (q as any).event_date,
        eventType: (q as any).event_type,
        customEventType: (q as any).custom_event_type,
        quotationType: (q as any).quotation_type === 'Event/Decor' ? 'event' as const : 'food' as const,
        sections: (q as any).sections || [],
        grandTotal: Number((q as any).total_amount),
        additionalCharges: (q as any).additional_charges || { cateringLabour: 0, serviceCharge: 0, transport: 0 },
        status: (q as any).status as 'draft' | 'sent' | 'approved' | 'rejected',
        createdAt: (q as any).created_at,
        notes: (q as any).notes,
      }));
      setQuotations(mappedQuotations);
    }
  }, [dbQuotations]);

  useEffect(() => {
    // Only reset sections if not editing or if type explicitly changed by user during creation
    if (!editingQuotation) {
       setSections(quotationType === 'event' ? EVENT_TEMPLATE : FOOD_TEMPLATE);
    }
  }, [quotationType, editingQuotation]);

  const calculateItemTotal = (unitPrice: number, quantity: number) => {
    return unitPrice * quantity;
  };

  const calculateSectionTotal = (items: QuotationItem[]) => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateGrandTotal = () => {
    const itemsTotal = sections.reduce((sum, section) => sum + calculateSectionTotal(section.items), 0);
    if (quotationType === 'food') {
      return itemsTotal + additionalCharges.cateringLabour + additionalCharges.serviceCharge + additionalCharges.transport;
    }
    return itemsTotal;
  };

  const handleItemChange = (sectionIndex: number, itemIndex: number, field: keyof QuotationItem, value: string | number) => {
    const newSections = [...sections];
    const item = { ...newSections[sectionIndex].items[itemIndex] };

    if (field === 'unitPrice' || field === 'quantity') {
      (item as any)[field] = Number(value);
      item.total = calculateItemTotal(item.unitPrice, item.quantity);
    } else {
      (item as any)[field] = value;
    }

    newSections[sectionIndex].items[itemIndex] = item;
    setSections(newSections);
  };

  const handleDeleteItem = (sectionIndex: number, itemIndex: number) => {
    const newSections = [...sections];
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
    setSaving(true);

    const quotationData = {
      customer_name: formData.customerName,
      customer_email: formData.customerEmail,
      customer_phone: formData.customerPhone,
      number_of_guests: formData.numberOfGuests,
      theme: formData.theme,
      event_date: formData.eventDate,
      event_type: formData.eventType === 'Other' ? formData.customEventType : formData.eventType,
      custom_event_type: formData.customEventType,
      quotation_type: quotationType === 'event' ? 'Event/Decor' : 'Food/Catering',
      sections: sections.map(s => ({ name: s.name, items: s.items })),
      additional_charges: additionalCharges,
      notes: formData.notes,
      status: editingQuotation?.status || 'draft' as const,
      total_amount: calculateGrandTotal(),
      user_id: '' // Will be set by hook
    };

    try {
      const currentUser = ensureAuthenticated();

      console.log('💾 Saving quotation to database...');

      if (editingQuotation) {
        const result = await updateQuotation(editingQuotation.id, quotationData);
        if (!result.success) {
          throw new Error(result.error || 'Failed to update quotation');
        }
        await fetchQuotations();
        console.log('✅ Quotation updated successfully in database');
        alert('✅ Quotation updated successfully in database!');
      } else {
        const newQuotation = await createQuotation(quotationData as any);
        await fetchQuotations();
        console.log('✅ Quotation saved successfully to database');
        alert(`✅ Quotation saved successfully to database!\n\nQuotation Number: QT-${newQuotation?.id?.slice(-6) || 'New'}`);
      }
      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error('❌ Error saving quotation to database:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`❌ Failed to save quotation to database!\n\nError: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
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
    setQuotationType('event'); // Reset to default
    setSections(EVENT_TEMPLATE);
    setAdditionalCharges({
      cateringLabour: 0,
      serviceCharge: 0,
      transport: 0,
    });
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
      console.log('💾 Syncing quotations from database...');
      await fetchQuotations();

      // Wait for state to update
      setTimeout(() => {
        const count = dbQuotations.length;
        alert(`✅ Successfully synced quotations from database!\n\nTotal: ${count} quotation(s) loaded`);
      }, 300);
    } catch (error: any) {
      console.error('❌ Error syncing quotations from database:', error);
      alert('❌ Failed to sync quotations from database: ' + error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this quotation?')) {
      try {
        await deleteQuotation(id);
        await fetchQuotations();
        alert('Quotation deleted successfully!');
      } catch (error) {
        console.error('Error deleting quotation:', error);
        alert('Failed to delete quotation. Please try again.');
      }
    }
  };

  const handleUpdateStatus = async (id: string, status: Quotation['status']) => {
    try {
      await updateQuotation(id, { status });
      await fetchQuotations();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getQuotationsForDate = (dateStr: string) => {
    return quotations.filter(q => q.eventDate === dateStr);
  };

  const getQuotationsCount = (dateStr: string) => {
    return getQuotationsForDate(dateStr).length;
  };

  const filteredQuotations = viewMode === 'date'
    ? getQuotationsForDate(selectedDate)
    : quotations.filter(q =>
        q.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.quotationNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );

  const getFilledSections = (quotation: Quotation) => {
    return quotation.sections
      .map(section => ({
        ...section,
        items: section.items.filter(item => item.description.trim() !== '')
      }))
      .filter(section => section.items.length > 0);
  };

  if (showForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={onBack} className="flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                {editingQuotation ? 'Edit Quotation' : 'Create New Quotation'}
              </h2>
            </div>
          </div>
          <Button
            onClick={() => setShowForm(false)}
            variant="outline"
          >
            <FileText className="h-4 w-4 mr-2" />
            View Saved
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="print:hidden">
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Customer Name *</label>
                  <Input value={formData.customerName} onChange={(e) => setFormData({ ...formData, customerName: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email *</label>
                  <Input type="email" value={formData.customerEmail} onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone *</label>
                  <Input type="tel" value={formData.customerPhone} onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Number of Guests *</label>
                  <Input type="number" min="1" value={formData.numberOfGuests || ''} onChange={(e) => setFormData({ ...formData, numberOfGuests: Number(e.target.value) })} required placeholder="e.g., 100" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Theme *</label>
                  <Input value={formData.theme} onChange={(e) => setFormData({ ...formData, theme: e.target.value })} required placeholder="e.g., Royal Blue" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Event Date *</label>
                  <Input type="date" value={formData.eventDate} onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })} required />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium">Event Type *</label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={formData.eventType} 
                    onChange={(e) => setFormData({ ...formData, eventType: e.target.value, customEventType: '' })} 
                    required
                  >
                    <option value="">Select event type</option>
                    <option value="Wedding">Wedding</option>
                    <option value="Birthday Party">Birthday Party</option>
                    <option value="Corporate Event">Corporate Event</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                {formData.eventType === 'Other' && (
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-medium">Specify Event Type *</label>
                    <Input value={formData.customEventType} onChange={(e) => setFormData({ ...formData, customEventType: e.target.value })} required placeholder="Enter your event type" />
                  </div>
                )}
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium">Quotation Type *</label>
                  <div className="flex gap-4">
                    <label className="flex items-center space-x-2">
                      <input type="radio" value="event" checked={quotationType === 'event'} onChange={(e) => setQuotationType(e.target.value as any)} />
                      <span>Event/Decor Quotation</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="radio" value="food" checked={quotationType === 'food'} onChange={(e) => setQuotationType(e.target.value as any)} />
                      <span>Food/Catering Quotation</span>
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quotation Tables Card */} 
          <Card className="print:shadow-none print:border-none">
            <CardHeader className="flex flex-row items-center justify-between print:hidden">
              <CardTitle>{quotationType === 'event' ? 'Event & Decoration Items' : 'Food & Catering Items'}</CardTitle>
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print Preview
              </Button>
            </CardHeader>
            <CardContent>
              {/* Print Header */} 
              <div className="hidden print:block mb-6">
                <div className="text-center border-b-4 border-yellow-500 pb-4 mb-4">
                  <h1 className="text-3xl font-bold uppercase">KISUMU ART HOUSE</h1>
                  <h2 className="text-xl font-semibold mt-1">WEDDING AND EVENTS</h2>
                  <p className="text-sm italic mt-2">CREATING LIFE FOR YOUR EVENTS</p>
                </div>
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold">QUOTATION</h3>
                  <p className="text-sm mt-2">Quotation #: QT-{Date.now().toString().slice(-6)}</p>
                  <p className="text-sm">Date: {new Date().toLocaleDateString()}</p>
                </div>
                <div className="mt-4 text-left border-t border-b py-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p><strong>Customer:</strong> {formData.customerName}</p>
                    <p><strong>Event Date:</strong> {formData.eventDate}</p>
                  </div>
                </div>
              </div>

              {sections.map((section, sectionIndex) => (
                <div key={sectionIndex} className="mb-8 break-inside-avoid">
                  <h4 className="text-sm font-bold bg-muted px-4 py-2 mb-2 uppercase border rounded">
                    {section.name}
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                      <thead>
                        <tr className="bg-muted/50 border-b">
                          <th className="px-2 py-2 text-left text-xs font-bold w-8 print:hidden">#</th>
                          <th className="px-2 py-2 text-left text-xs font-bold">DESCRIPTION</th>
                          <th className="px-2 py-2 text-left text-xs font-bold w-20">UNIT</th>
                          <th className="px-2 py-2 text-right text-xs font-bold w-24">PRICE</th>
                          <th className="px-2 py-2 text-center text-xs font-bold w-16">QTY</th>
                          <th className="px-2 py-2 text-right text-xs font-bold w-24">TOTAL</th>
                          <th className="px-2 py-2 text-left text-xs font-bold">REMARKS</th>
                          <th className="px-2 py-2 text-center w-8 print:hidden"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {section.items.map((item, itemIndex) => (
                          <tr key={item.id} className="hover:bg-muted/30">
                            <td className="px-2 py-1 text-xs text-muted-foreground print:hidden">{itemIndex + 1}</td>
                            <td className="px-2 py-1">
                              <Input 
                                value={item.description} 
                                onChange={(e) => handleItemChange(sectionIndex, itemIndex, 'description', e.target.value)} 
                                className="h-8 border-0 shadow-none focus-visible:ring-1 bg-transparent px-0 rounded-none print:text-xs"
                                placeholder="Description"
                              />
                            </td>
                            <td className="px-2 py-1">
                              <Input 
                                value={item.unit} 
                                onChange={(e) => handleItemChange(sectionIndex, itemIndex, 'unit', e.target.value)} 
                                className="h-8 border-0 shadow-none focus-visible:ring-1 bg-transparent px-0 rounded-none print:text-xs"
                                placeholder="Unit"
                              />
                            </td>
                            <td className="px-2 py-1">
                              <Input 
                                type="number" 
                                value={item.unitPrice || ''} 
                                onChange={(e) => handleItemChange(sectionIndex, itemIndex, 'unitPrice', e.target.value)} 
                                className="h-8 border-0 shadow-none focus-visible:ring-1 bg-transparent px-0 rounded-none text-right print:text-xs"
                                placeholder="0"
                              />
                            </td>
                            <td className="px-2 py-1">
                              <Input 
                                type="number" 
                                value={item.quantity || ''} 
                                onChange={(e) => handleItemChange(sectionIndex, itemIndex, 'quantity', e.target.value)} 
                                className="h-8 border-0 shadow-none focus-visible:ring-1 bg-transparent px-0 rounded-none text-center print:text-xs"
                                placeholder="0"
                              />
                            </td>
                            <td className="px-2 py-1 text-xs font-semibold text-right">{item.total.toLocaleString()}</td>
                            <td className="px-2 py-1">
                              <Input 
                                value={item.remarks} 
                                onChange={(e) => handleItemChange(sectionIndex, itemIndex, 'remarks', e.target.value)} 
                                className="h-8 border-0 shadow-none focus-visible:ring-1 bg-transparent px-0 rounded-none print:text-xs"
                                placeholder="Notes"
                              />
                            </td>
                            <td className="px-2 py-1 text-center print:hidden">
                              {item.description && (
                                <button onClick={() => handleDeleteItem(sectionIndex, itemIndex)} className="text-destructive hover:text-red-700">
                                  <X className="h-4 w-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-muted/20 font-bold">
                          <td colSpan={5} className="px-4 py-2 text-right text-xs print:col-span-4">SUBTOTAL:</td>
                          <td className="px-2 py-2 text-right text-xs">KSH {calculateSectionTotal(section.items).toLocaleString()}</td>
                          <td colSpan={2} className="print:hidden"></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}

              {/* Additional Charges */} 
              {quotationType === 'food' && (
                <div className="mt-6 pt-6 border-t break-inside-avoid">
                  <h4 className="text-sm font-bold mb-4 uppercase">Additional Charges</h4>
                  <div className="space-y-2 max-w-sm ml-auto">
                    <div className="flex justify-between items-center text-sm">
                      <label>Catering Labour:</label>
                      <Input 
                        type="number" 
                        value={additionalCharges.cateringLabour || ''} 
                        onChange={(e) => setAdditionalCharges({ ...additionalCharges, cateringLabour: Number(e.target.value) })} 
                        className="w-32 h-8 text-right"
                      />
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <label>Service Charge:</label>
                      <Input 
                        type="number" 
                        value={additionalCharges.serviceCharge || ''} 
                        onChange={(e) => setAdditionalCharges({ ...additionalCharges, serviceCharge: Number(e.target.value) })} 
                        className="w-32 h-8 text-right"
                      />
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <label>Transport:</label>
                      <Input 
                        type="number" 
                        value={additionalCharges.transport || ''} 
                        onChange={(e) => setAdditionalCharges({ ...additionalCharges, transport: Number(e.target.value) })} 
                        className="w-32 h-8 text-right"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Grand Total */} 
              <div className="mt-6 pt-4 border-t-2 border-black break-inside-avoid">
                <div className="flex justify-end items-center">
                  <h4 className="text-lg font-bold mr-4">GRAND TOTAL:</h4>
                  <span className="text-xl font-bold text-primary">KSH {calculateGrandTotal().toLocaleString()}</span>
                </div>
              </div>

              {/* Print Footer */} 
              <div className="hidden print:block mt-8 pt-4 border-t border-gray-300 text-center text-xs">
                <p><strong>Thank you for choosing Kisumu Art House!</strong></p>
                <p>Tel: 0720289497 | Email: ksm.arthouse@gmail.com</p>
              </div>
            </CardContent>
          </Card>

          <Card className="print:hidden">
            <CardHeader>
              <CardTitle>Additional Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea 
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Terms and conditions..."
              />
            </CardContent>
            <CardFooter className="flex justify-end space-x-4">
              <Button variant="outline" type="button" onClick={resetForm}>Clear Form</Button>
              <Button type="submit" disabled={saving || loading}>
                {(saving || loading) && <Loader className="h-4 w-4 mr-2 animate-spin" />}
                {saving ? 'Saving...' : 'Save Quotation'}
              </Button>
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
          <Button variant="outline" size="sm" onClick={onBack} className="flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Quotations</h2>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowForm(true)} className="bg-yellow-500 hover:bg-yellow-600 text-white">
            <Plus className="h-4 w-4 mr-2" />
            New Quotation
          </Button>
          <Button onClick={() => setShowForm(false)} variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            View Saved ({quotations.length})
          </Button>
        </div>
      </div>

      <Card className="bg-purple-50/50 border-purple-200">
        <CardHeader className="pb-2">
          <Button 
            variant="ghost" 
            className="w-full flex justify-between h-auto p-0 hover:bg-transparent"
            onClick={() => setShowDatabasePanel(!showDatabasePanel)}
          >
            <div className="flex items-center space-x-3 text-left">
              <div className="p-2 bg-purple-100 rounded-full text-purple-600">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-purple-900 text-lg">Save to Database & Sync</CardTitle>
                <CardDescription className="text-purple-700/80">Load all {quotations.length} quotations from Supabase</CardDescription>
              </div>
            </div>
            {showDatabasePanel ? <ChevronUp className="h-5 w-5 text-purple-600" /> : <ChevronDown className="h-5 w-5 text-purple-600" />}
          </Button>
        </CardHeader>
        {showDatabasePanel && (
          <CardContent className="pt-2">
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded mb-4">
              <p className="text-sm text-green-800">✅ This button loads all quotations from the cloud database to ensure you have the latest data.</p>
            </div>
            <Button 
              onClick={handleSyncDatabase} 
              disabled={isSyncing} 
              className="w-full h-12 text-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
            >
              {isSyncing ? (
                <>
                  <Loader className="h-5 w-5 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Database className="h-5 w-5 mr-2" />
                  Load {quotations.length} Quotations
                </>
              )}
            </Button>
          </CardContent>
        )}
      </Card>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Card className="flex-1 bg-blue-50/50 border-blue-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-blue-900">Select Date</p>
              <div className="flex items-center gap-2 mt-1">
                <Input 
                  type="date" 
                  value={selectedDate} 
                  onChange={(e) => { setSelectedDate(e.target.value); setViewMode('date'); }} 
                  className="bg-white border-blue-300"
                />
                <Button 
                  size="sm" 
                  variant={viewMode === 'all' ? 'default' : 'outline'} 
                  onClick={() => setViewMode('all')}
                >
                  View All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {viewMode === 'all' && (
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                placeholder="Search quotations..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="pl-9"
              />
            </div>
          </div>
        )}
      </div>

      {filteredQuotations.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No quotations found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredQuotations.map((quotation) => {
            const filledSections = getFilledSections(quotation);
            const totalItems = filledSections.reduce((sum, section) => sum + section.items.length, 0);

            return (
              <Card key={quotation.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-lg">{quotation.quotationNumber}</h3>
                        <Badge variant={quotation.quotationType === 'event' ? 'secondary' : 'outline'}>
                          {quotation.quotationType === 'event' ? 'EVENT' : 'FOOD'}
                        </Badge>
                        <Badge variant={
                          quotation.status === 'approved' ? 'success' : 
                          quotation.status === 'rejected' ? 'destructive' : 
                          quotation.status === 'sent' ? 'secondary' : 'outline'
                        }>
                          {quotation.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-sm text-muted-foreground">
                        <p><strong>Customer:</strong> {quotation.customerName}</p>
                        <p><strong>Event:</strong> {quotation.eventType} ({new Date(quotation.eventDate).toLocaleDateString()})</p>
                        <p><strong>Items:</strong> {totalItems} items</p>
                        <p className="text-foreground font-semibold">Total: KSH {quotation.grandTotal.toLocaleString()}</p>
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(quotation.id, 'sent')} disabled={quotation.status === 'sent'}>Sent</Button>
                        <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleUpdateStatus(quotation.id, 'approved')} disabled={quotation.status === 'approved'}>Approve</Button>
                        <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleUpdateStatus(quotation.id, 'rejected')} disabled={quotation.status === 'rejected'}>Reject</Button>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button size="icon" variant="ghost" onClick={() => handleEdit(quotation)}>
                        <Edit className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(quotation.id)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default QuotationManager;