'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ArrowLeft, Plus, Search, FileText, Edit, Trash2, Printer, X, Loader, Database, ChevronDown, ChevronUp, Sparkles, Download, FileDown, CheckCircle, Clock } from 'lucide-react';
import { useQuotations } from '@/hooks/useQuotations';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, ConfirmDialog } from '@/components/ui/Dialog';
import { formatCurrency } from '@/utils/formatters';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { StaffSelector } from '@/components/shared/StaffSelector';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import QuotationCard from './QuotationCard';

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
  { name: 'FRESH FLOWERS REQUIREMENTS', items: [{ id: 'flowers-0', description: '', unit: '', unitPrice: 0, quantity: 0, total: 0, remarks: '' }] },
  { name: 'CHURCH CEREMONY AREA', items: [{ id: 'church-0', description: '', unit: '', unitPrice: 0, quantity: 0, total: 0, remarks: '' }] },
  { name: 'VEHICLE DECORATION', items: [{ id: 'vehicle-0', description: '', unit: '', unitPrice: 0, quantity: 0, total: 0, remarks: '' }] },
  { name: 'PARTICULARS RECEPTION AREA', items: [{ id: 'reception-0', description: '', unit: '', unitPrice: 0, quantity: 0, total: 0, remarks: '' }] },
  { name: 'SOUND AND ENTERTAINMENT', items: [{ id: 'sound-0', description: '', unit: '', unitPrice: 0, quantity: 0, total: 0, remarks: '' }] },
  { name: 'CLEANING AND SANITATION', items: [{ id: 'cleaning-0', description: '', unit: '', unitPrice: 0, quantity: 0, total: 0, remarks: '' }] },
  { name: 'TRANSPORT', items: [{ id: 'transport-0', description: '', unit: '', unitPrice: 0, quantity: 0, total: 0, remarks: '' }] },
];

const FOOD_TEMPLATE: QuotationSection[] = [
  { name: 'PROTEINS', items: [{ id: 'protein-0', description: '', unit: '', unitPrice: 0, quantity: 0, total: 0, remarks: '' }] },
  { name: 'CARBOHYDRATES', items: [{ id: 'carbs-0', description: '', unit: '', unitPrice: 0, quantity: 0, total: 0, remarks: '' }] },
  { name: 'ADDITIVES', items: [{ id: 'additive-0', description: '', unit: '', unitPrice: 0, quantity: 0, total: 0, remarks: '' }] },
  { name: 'VEGETABLES AND GROCERIES', items: [{ id: 'veg-0', description: '', unit: '', unitPrice: 0, quantity: 0, total: 0, remarks: '' }] },
  { name: 'FRUITS IN SEASON', items: [{ id: 'fruit-0', description: '', unit: '', unitPrice: 0, quantity: 0, total: 0, remarks: '' }] },
  { name: 'BEVERAGES', items: [{ id: 'bev-0', description: '', unit: '', unitPrice: 0, quantity: 0, total: 0, remarks: '' }] },
  { name: 'WRAPPING AND WASHING ITEMS', items: [{ id: 'wrap-0', description: '', unit: '', unitPrice: 0, quantity: 0, total: 0, remarks: '' }] },
  { name: 'ENERGY', items: [{ id: 'energy-0', description: '', unit: '', unitPrice: 0, quantity: 0, total: 0, remarks: '' }] },
  { name: 'CATERING', items: [{ id: 'catering-0', description: '', unit: '', unitPrice: 0, quantity: 0, total: 0, remarks: '' }] },
  { name: 'OTHERS', items: [{ id: 'other-0', description: '', unit: '', unitPrice: 0, quantity: 0, total: 0, remarks: '' }] },
];

const QuotationManager: React.FC<QuotationManagerProps> = ({ onBack }) => {
  const { userId } = useAuth();
  const { isManager } = useRoleGuard();
  const { isOnline } = useNetworkStatus();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [filterUserId, setFilterUserId] = useState<string | null>(null);
  
  // Drive selectedMonth and selectedYear from URL search parameters
  const selectedMonthValue = searchParams.get('month') || 'all';
  const selectedMonth = selectedMonthValue === 'all' ? 'all' : parseInt(selectedMonthValue);
  const selectedYear = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

  const setSelectedMonth = (month: number | 'all') => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('month', month.toString());
    router.replace(`${pathname}?${params.toString()}`);
  };

  const setSelectedYear = (year: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('year', year.toString());
    router.replace(`${pathname}?${params.toString()}`);
  };

  const { quotations, loading, createQuotation, updateQuotation, deleteQuotation, fetchQuotations } = useQuotations(filterUserId, selectedMonth, selectedYear);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().substring(0, 10));
  const [viewMode, setViewMode] = useState<'all' | 'date'>('all');
  const [quotationType, setQuotationType] = useState<'event' | 'food'>('event');
  const [saving, setSaving] = useState(false);
  const [showDatabasePanel, setShowDatabasePanel] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Quotation | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

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
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

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

  const handlePrintIndividual = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    const originalTitle = document.title;
    document.title = `Quotation_${quotation.quotationNumber}_${quotation.customerName.replace(/\s+/g, '_')}`;
    
    setTimeout(() => {
      window.print();
      document.title = originalTitle;
    }, 200);
  };

  const handleAddItem = (sectionIndex: number) => {
    const newSections = JSON.parse(JSON.stringify(sections));
    const newId = `new-item-${Date.now()}`;
    newSections[sectionIndex].items.push({
      id: newId,
      description: '',
      unit: '',
      unitPrice: 0,
      quantity: 0,
      total: 0,
      remarks: '',
    });
    setSections(newSections);
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      toast.error('Please enter a category name');
      return;
    }
    
    const newSection: QuotationSection = {
      name: newCategoryName.toUpperCase(),
      items: [{
        id: `${newCategoryName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
        description: '',
        unit: '',
        unitPrice: 0,
        quantity: 0,
        total: 0,
        remarks: '',
      }]
    };
    
    setSections(prev => [...prev, newSection]);
    setNewCategoryName('');
    setShowAddCategoryDialog(false);
    toast.success(`Category "${newSection.name}" added successfully`);
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current || !selectedQuotation) {
      toast.error('Initialization failed: No active proposal selected.');
      return;
    }
    
    try {
      setIsGeneratingPDF(true);
      const loadingToast = toast.loading('Generating Professional Document...');
      
      const element = printRef.current;
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: element.offsetWidth,
        height: element.offsetHeight,
        scrollY: -window.scrollY,
        windowWidth: 1200
      });
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`KSM_PROPOSAL_${selectedQuotation.quotationNumber}.pdf`);
      
      toast.dismiss(loadingToast);
      toast.success('Document downloaded successfully');
    } catch (error) {
      logger.error('PDF generation failed:', error);
      toast.error('Digital generation failed. Please use "Send to Printer" -> "Save as PDF"');
    } finally {
      setIsGeneratingPDF(false);
    }
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
    setNewCategoryName('');
    setShowAddCategoryDialog(false);
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

  const handleDelete = (quotation: Quotation) => {
    setShowDeleteConfirm(quotation);
  };

  const confirmDelete = async () => {
    if (showDeleteConfirm) {
      try {
        await deleteQuotation(showDeleteConfirm.id);
        await fetchQuotations();
        toast.success('Quotation deleted successfully');
      } catch (error) {
        logger.error('Delete failed:', error);
        toast.error('Failed to delete quotation');
      } finally {
        setShowDeleteConfirm(null);
      }
    }
  };

  const handleUpdateStatus = async (id: string, status: Quotation['status']) => {
    try {
      if (status === 'approved') setApprovingId(id);
      await updateQuotation(id, { status });
      await fetchQuotations();
      if (status === 'approved') toast.success('Quotation Approved Successfully!');
    } catch (error) {
      logger.error('Status update failed:', error);
    } finally {
      setApprovingId(null);
    }
  };

  const getStatusPercentage = (status: Quotation['status']) => {
    switch (status) {
      case 'draft': return 25;
      case 'sent': return 60;
      case 'approved': return 100;
      case 'rejected': return 0;
      default: return 0;
    }
  };

  const getStatusColor = (status: Quotation['status']) => {
    switch (status) {
      case 'draft': return 'bg-slate-400';
      case 'sent': return 'bg-blue-500';
      case 'approved': return 'bg-green-500';
      case 'rejected': return 'bg-destructive';
      default: return 'bg-muted';
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
            <Button variant="outline" size="sm" onClick={onBack} aria-label="Back">
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
              <div className="flex items-center gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowAddCategoryDialog(true)}
                  className="h-8 text-xs font-bold"
                >
                  <Plus className="h-3 w-3 mr-1" /> Add Category
                </Button>
                <Button variant="outline" onClick={() => window.print()}>
                  <Printer className="h-4 w-4 mr-2" /> Print
                </Button>
              </div>
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
                    <div className="flex items-center gap-2">
                      <Button type="button" size="xs" variant="outline" onClick={() => handleAddItem(sIdx)} className="h-6 text-xs">
                        <Plus className="h-3 w-3 mr-1" />
                        Add New Item
                      </Button>
                      <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded uppercase">
                        {section.items.filter(i => i.description).length} Items Configured
                      </span>
                    </div>
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

        {/* Add Category Dialog */}
        <Dialog open={showAddCategoryDialog} onOpenChange={(open) => {
          setShowAddCategoryDialog(open);
          if (!open) setNewCategoryName('');
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Add New Category
              </DialogTitle>
              <DialogDescription>
                Create a custom category for your quotation items.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category Name</label>
                <Input
                  placeholder="e.g. LIGHTING EQUIPMENT, PHOTOGRAPHY"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newCategoryName.trim()) {
                      handleAddCategory();
                    }
                    if (e.key === 'Escape') {
                      setShowAddCategoryDialog(false);
                      setNewCategoryName('');
                    }
                  }}
                  className="uppercase font-medium"
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowAddCategoryDialog(false);
                  setNewCategoryName('');
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddCategory} 
                disabled={!newCategoryName.trim()}
              >
                <Plus className="h-4 w-4 mr-2" /> Add Category
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  const handleDirectPrint = () => {
    document.body.classList.add('is-printing');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('is-printing');
    }, 500);
  };

  return (
    <div className="space-y-6">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* 1. Reset Page and Body */
          @page {
            margin: 0;
            size: auto;
          }
          
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            height: auto !important;
            min-height: 100% !important;
          }

          /* 2. Hide everything except the portal content */
          body > :not([data-radix-portal]) {
            display: none !important;
          }

          /* 3. Reset Portal and Dialog Containers */
          [data-radix-portal], 
          [data-radix-portal] > div,
          div[role="dialog"] {
            display: block !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            transform: none !important;
          }

          /* 4. Hide all UI overhead */
          div[data-state="open"] > div:first-child,
          button,
          .print\:hidden,
          [data-radix-collection],
          .DialogHeader {
            display: none !important;
          }

          /* 5. Target the specific document area */
          #printable-quotation {
            display: block !important;
            width: 100% !important;
            padding: 1.5cm !important;
            margin: 0 !important;
            background: white !important;
          }

          /* 6. Ensure sharp black text */
          #printable-quotation * {
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}} />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center space-x-2">
          <Button type="button" variant="outline" size="sm" onClick={onBack} className="rounded-full h-10 px-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-semibold uppercase text-primary tracking-tight">Quotations</h1>
            <p className="text-muted-foreground italic text-sm">Price Proposals & Estimates</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Month & Year Filters */}
          <div className="flex items-center gap-2 bg-muted/20 p-1 rounded-xl border border-primary/10 h-10">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="bg-transparent border-none text-xs font-semibold uppercase focus:outline-none pr-4 pl-2 cursor-pointer hover:text-primary transition-colors"
            >
              <option value="all" className="bg-background text-foreground uppercase font-bold text-[10px]">All Months</option>
              {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((name, index) => (
                <option key={index} value={index + 1} className="bg-background text-foreground uppercase font-bold text-[10px]">{name}</option>
              ))}
            </select>
            
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="bg-transparent border-none text-xs font-semibold uppercase focus:outline-none pr-4 cursor-pointer hover:text-primary transition-colors"
            >
              {[selectedYear - 1, selectedYear, selectedYear + 1].map(year => (
                <option key={year} value={year} className="bg-background text-foreground uppercase font-bold text-[10px]">{year}</option>
              ))}
            </select>
          </div>
          
          {isManager() && (
            <div className="w-64">
              <StaffSelector 
                value={filterUserId} 
                onChange={setFilterUserId} 
                className="bg-background/50 backdrop-blur-sm"
              />
            </div>
          )}
          <Button type="button" onClick={() => setShowForm(true)} className="h-10 px-6 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 rounded-xl">
            <Plus className="h-4 w-4 mr-2" /> New Quotation
          </Button>
        </div>
      </div>

      <div className="grid gap-4 print:hidden">
        {filteredQuotations.map((q) => (
          <QuotationCard
            key={q.id}
            quotation={q}
            onView={(quotation) => { setSelectedQuotation(quotation); setShowViewDialog(true); }}
            onApprove={(quotation) => handleUpdateStatus(quotation.id, 'approved')}
            onMarkAsSent={(quotation) => handleUpdateStatus(quotation.id, 'sent')}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
        
        {filteredQuotations.length === 0 && (
          <div className="text-center py-20 bg-muted/5 border-2 border-dashed rounded-2xl">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-10" />
            <p className="text-lg font-bold opacity-40">No Quotations Found</p>
            <Button variant="link" onClick={() => setShowForm(true)}>Initialize your first proposal</Button>
          </div>
        )}
      </div>

      {/* Professional View/Print Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent id="printable-quotation-container" className="max-w-4xl max-h-[95vh] overflow-y-auto p-0 border-none shadow-2xl bg-slate-100">
          <DialogHeader className="p-6 border-b bg-white print:hidden">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-black uppercase text-primary tracking-tight">Proposal Preview</DialogTitle>
                <DialogDescription className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-50">Review client document before final export</DialogDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowViewDialog(false)} className="rounded-full" aria-label="Close Preview">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </DialogHeader>
          
          <div ref={printRef} id="printable-quotation" className="p-8 md:p-12 bg-white text-slate-900 mx-auto shadow-sm my-8">
            <div className="flex justify-between items-start border-b-4 border-primary pb-8 mb-10">
              <div className="space-y-2">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-12 h-12 bg-primary flex items-center justify-center rounded-xl">
                    <Sparkles className="text-white w-7 h-7" />
                  </div>
                  <h1 className="text-4xl font-black tracking-tighter text-primary">KSM.ART HOUSE</h1>
                </div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Premium Event Management & Decor</p>
                <div className="text-[10px] font-bold text-slate-400 space-y-0.5">
                  <p>Kisumu, Kenya</p>
                  <p>Contact: +254 7XX XXX XXX</p>
                  <p>Email: hello@ksmarthouse.com</p>
                </div>
              </div>
              <div className="text-right space-y-1">
                <Badge variant="outline" className="mb-4 border-primary/20 text-primary font-black uppercase tracking-widest text-[10px]">
                  PROPOSAL #{selectedQuotation?.quotationNumber}
                </Badge>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Date Issued</p>
                <p className="text-sm font-bold">{new Date(selectedQuotation?.createdAt || '').toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-12 mb-12">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-primary tracking-widest border-b pb-1">Client Details</h4>
                <div className="space-y-1">
                  <p className="text-xl font-black text-slate-800">{selectedQuotation?.customerName}</p>
                  <p className="text-sm text-slate-500 font-medium">{selectedQuotation?.customerEmail}</p>
                  <p className="text-sm text-slate-500 font-medium">{selectedQuotation?.customerPhone}</p>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-primary tracking-widest border-b pb-1">Event Specifications</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[9px] font-black uppercase text-slate-400">Event Date</p>
                    <p className="text-sm font-bold">{selectedQuotation?.eventDate}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-slate-400">Event Type</p>
                    <p className="text-sm font-bold">{selectedQuotation?.eventType}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-slate-400">Pax Count</p>
                    <p className="text-sm font-bold">{selectedQuotation?.numberOfGuests} Guests</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-slate-400">Theme</p>
                    <p className="text-sm font-bold">{selectedQuotation?.theme}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-10 mb-12">
              {selectedQuotation?.sections.map((section, sIdx) => (
                <div key={sIdx}>
                  <div className="bg-slate-50 p-2 border-l-4 border-primary mb-4">
                    <h4 className="text-[10px] font-black uppercase text-primary tracking-widest">{section.name}</h4>
                  </div>
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[9px] font-black uppercase text-slate-400 border-b">
                        <th className="py-2">Description</th>
                        <th className="py-2 w-20">Unit</th>
                        <th className="py-2 w-24 text-right">Unit Price</th>
                        <th className="py-2 w-16 text-center">Qty</th>
                        <th className="py-2 w-28 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {section.items.filter(i => i.description).map((item, iIdx) => (
                        <tr key={iIdx} className="text-xs text-slate-700">
                          <td className="py-3 font-medium">{item.description}</td>
                          <td className="py-3 uppercase text-[10px] font-bold text-slate-400">{item.unit}</td>
                          <td className="py-3 text-right font-mono">{item.unitPrice.toLocaleString()}</td>
                          <td className="py-3 text-center">{item.quantity}</td>
                          <td className="py-3 text-right font-black">{item.total.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>

            <div className="flex flex-col items-end space-y-3 pt-8 border-t-4 border-slate-100">
              <div className="flex justify-between w-64 text-sm text-slate-500">
                <span className="font-bold">Subtotal</span>
                <span>{formatCurrency(selectedQuotation?.grandTotal || 0)}</span>
              </div>
              <div className="flex justify-between w-64 text-2xl font-black text-primary border-t-2 border-primary/20 pt-3">
                <span className="tracking-tighter">TOTAL KSH</span>
                <span>{formatCurrency(selectedQuotation?.grandTotal || 0)}</span>
              </div>
            </div>

            <div className="mt-20 grid grid-cols-2 gap-20">
              <div className="border-t border-slate-300 pt-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-8">Client Acceptance</p>
                <div className="h-px w-full bg-slate-200 mb-2" />
                <p className="text-[10px] font-bold">Signature & Date</p>
              </div>
              <div className="border-t border-slate-300 pt-4 text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-8">Authorized Signature</p>
                <div className="h-px w-full bg-slate-200 mb-2" />
                <p className="text-[10px] font-bold">KSM.ART HOUSE Operations</p>
              </div>
            </div>
          </div>
          <div className="p-6 bg-slate-50 border-t flex justify-end gap-3 sticky bottom-0 print:hidden">
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>Close Preview</Button>
            <Button 
              onClick={handleDownloadPDF} 
              disabled={isGeneratingPDF}
              className="bg-slate-800 text-white hover:bg-slate-900 font-black uppercase tracking-widest text-[10px] h-11 px-8"
            >
              {isGeneratingPDF ? (
                <><Loader className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
              ) : (
                <><FileDown className="h-4 w-4 mr-2" /> Download High-Quality PDF</>
              )}
            </Button>
            <Button onClick={handleDirectPrint} className="bg-primary hover:bg-primary/90 font-black uppercase tracking-widest text-[10px] h-11 px-8">
              <Printer className="h-4 w-4 mr-2" /> Send to Printer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        onConfirm={confirmDelete}
        title="Delete Quotation"
        message={`Are you sure you want to delete quotation ${showDeleteConfirm?.quotationNumber}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};

export default QuotationManager;
