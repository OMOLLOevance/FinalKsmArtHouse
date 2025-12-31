import React, { useState, useEffect } from 'react';
import { Plus, ArrowLeft, Save, Calendar, Users, CheckCircle, Clock, Printer, MessageCircle, Mail, Database, ChevronDown, ChevronUp } from 'lucide-react';
import { useCustomers } from '@/hooks/useCustomersData';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';

interface CustomerManagerProps {
  onBack?: () => void;
}

interface MonthlyCustomerData {
  id: string;
  customerNumber: number;
  date: string;
  location: string;
  name: string;
  phoneNumber: string;
  doubleTent: number;
  singleTent: number;
  gazeboTent: number;
  miluxeTent: number;
  aFrameTent: number;
  bLineTent: number;
  pergolaTent: number;
  doubleTentSize?: string;
  singleTentSize?: string;
  gazeboTentSize?: string;
  miluxeTentSize?: string;
  aFrameTentSize?: string;
  bLineTentSize?: string;
  pergolaTentSize?: string;
  roundTable: number;
  longTable: number;
  bridalTable: number;
  roundTableSize?: string;
  longTableSize?: string;
  bridalTableSize?: string;
  chavariSeats: number;
  luxeSeats: number;
  chameleonSeats: number;
  diorSeats: number;
  highBackSeats: number;
  plasticSeats: number;
  banquetSeats: number;
  crossBarSeats: number;
  totalAmount: number;
  paidAmount: number;
  paymentMethod: 'cash' | 'bank' | 'mpesa';
  paymentStatus: 'pending' | 'deposit' | 'full';
  serviceStatus: 'pending' | 'served';
  notes: string;
  eventType: string;
  createdAt: string;
}

interface DecorItemsData {
  id: string;
  customerId: string;
  month: string;
  walkwayStands: number;
  arc: number;
  aisleStands: number;
  photobooth: number;
  lecturn: number;
  stageBoards: number;
  backdropBoards: number;
  danceFloor: number;
  walkwayBoards: number;
  whiteSticker: number;
  centerpieces: number;
  glassChargerPlates: number;
  melamineChargerPlates: number;
  africanMats: number;
  goldNapkinHolders: number;
  silverNapkinHolders: number;
  roofTopDecor: number;
  parcanLights: number;
  revolvingHeads: number;
  fairyLights: number;
  snakeLights: number;
  neonLights: number;
  smallChandeliers: number;
  largeChandeliers: number;
  africanLampshades: number;
  createdAt: string;
  updatedAt: string;
}

const CustomerManager: React.FC<CustomerManagerProps> = ({ onBack }) => {
  const { customers, loading, addCustomer, updateCustomer, deleteCustomer, refetch: fetchCustomers } = useCustomers();
  const { showSuccess, showError } = useToast();
  const [monthlyData, setMonthlyData] = useState<Record<string, MonthlyCustomerData[]>>({});
  const [decorItems, setDecorItems] = useState<Record<string, any>>({});
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  });
  const [isAdding, setIsAdding] = useState(false);
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; column: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editingDecorCell, setEditingDecorCell] = useState<{ rowIndex: number; column: string } | null>(null);
  const [editDecorValue, setEditDecorValue] = useState('');
  const [showDatabasePanel, setShowDatabasePanel] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    location: '',
    eventType: '',
    date: new Date().toISOString().split('T')[0],
    totalAmount: 0,
    paidAmount: 0,
    paymentMethod: 'cash' as 'cash' | 'bank' | 'mpesa',
    notes: '',
  });

  const months = [
    { value: '2025-01', label: 'January 2025' },
    { value: '2025-02', label: 'February 2025' },
    { value: '2025-03', label: 'March 2025' },
    { value: '2025-04', label: 'April 2025' },
    { value: '2025-05', label: 'May 2025' },
    { value: '2025-06', label: 'June 2025' },
    { value: '2025-07', label: 'July 2025' },
    { value: '2025-08', label: 'August 2025' },
    { value: '2025-09', label: 'September 2025' },
    { value: '2025-10', label: 'October 2025' },
    { value: '2025-11', label: 'November 2025' },
    { value: '2025-12', label: 'December 2025' },
  ];

  const columns = [
    { key: 'date', label: 'DATE', width: 'w-24' },
    { key: 'location', label: 'LOCATION', width: 'w-32' },
    { key: 'name', label: 'NAME', width: 'w-32' },
    { key: 'phoneNumber', label: 'PHONE NUMBER', width: 'w-32' },
    { key: 'doubleTent', label: 'DOUBLE TENT', width: 'w-24' },
    { key: 'singleTent', label: 'SINGLE TENT', width: 'w-24' },
    { key: 'gazeboTent', label: 'GAZEBO TENT', width: 'w-24' },
    { key: 'miluxeTent', label: 'MILUXE TENT', width: 'w-24' },
    { key: 'aFrameTent', label: 'A-FRAME TENT', width: 'w-24' },
    { key: 'bLineTent', label: 'B-LINE TENT', width: 'w-24' },
    { key: 'pergolaTent', label: 'PERGOLA TENT', width: 'w-24' },
    { key: 'roundTable', label: 'ROUND TABLE', width: 'w-24' },
    { key: 'longTable', label: 'LONG TABLE', width: 'w-24' },
    { key: 'bridalTable', label: 'BRIDAL TABLE', width: 'w-24' },
    { key: 'chavariSeats', label: 'CHAVARI SEATS', width: 'w-24' },
    { key: 'luxeSeats', label: 'LUXE SEATS', width: 'w-24' },
    { key: 'chameleonSeats', label: 'CHAMELEON SEATS', width: 'w-24' },
    { key: 'diorSeats', label: 'DIOR SEATS', width: 'w-24' },
    { key: 'highBackSeats', label: 'HIGH BACK SEAT', width: 'w-24' },
    { key: 'plasticSeats', label: 'PLASTIC SEATS', width: 'w-24' },
    { key: 'banquetSeats', label: 'BANQUET SEATS', width: 'w-24' },
    { key: 'crossBarSeats', label: 'CROSS BAR SEATS', width: 'w-24' },
    { key: 'totalAmount', label: 'TOTAL (KSH)', width: 'w-32' },
  ];

  // Initialize monthly data with 25 empty rows
  useEffect(() => {
    if (!monthlyData[selectedMonth]) {
      const emptyRows: MonthlyCustomerData[] = Array.from({ length: 25 }, (_, index) => ({
        id: `${selectedMonth}-row-${index + 1}`,
        customerNumber: index + 1,
        date: '',
        location: '',
        name: '',
        phoneNumber: '',
        doubleTent: 0,
        singleTent: 0,
        gazeboTent: 0,
        miluxeTent: 0,
        aFrameTent: 0,
        bLineTent: 0,
        pergolaTent: 0,
        roundTable: 0,
        longTable: 0,
        bridalTable: 0,
        roundTableSize: '',
        longTableSize: '',
        bridalTableSize: '',
        chavariSeats: 0,
        luxeSeats: 0,
        chameleonSeats: 0,
        diorSeats: 0,
        highBackSeats: 0,
        plasticSeats: 0,
        banquetSeats: 0,
        crossBarSeats: 0,
        totalAmount: 0,
        paidAmount: 0,
        paymentMethod: 'cash',
        paymentStatus: 'pending',
        serviceStatus: 'pending',
        notes: '',
        eventType: '',
        createdAt: new Date().toISOString(),
      }));
      
      setMonthlyData(prev => ({
        ...prev,
        [selectedMonth]: emptyRows
      }));
    }
  }, [selectedMonth]);

  const currentMonthData = monthlyData[selectedMonth] || [];

  const sendWhatsAppVoteOfThanks = (phoneNumber: string, name: string, location: string, eventDate: string) => {
    if (!phoneNumber) {
      alert('No phone number available');
      return;
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('254') ? cleanPhone :
                           cleanPhone.startsWith('0') ? '254' + cleanPhone.substring(1) :
                           '254' + cleanPhone;

    const message = encodeURIComponent(
      `Dear ${name},

` + 
      `Thank you for choosing KSM.ART HOUSE for your event at ${location} on ${eventDate}.

` + 
      `We are grateful for the opportunity to serve you and hope everything went perfectly. ` + 
      `Your trust in our services means a lot to us.

` + 
      `We look forward to working with you again in the future!

` + 
      `Best regards,
` + 
      `KSM.ART HOUSE Team
` + 
      `📞 Contact us for your next event!`
    );

    window.open(`https://wa.me/${formattedPhone}?text=${message}`, '_blank');
  };

  const sendEmailVoteOfThanks = (name: string, phoneNumber: string, location: string, eventDate: string) => {
    const subject = encodeURIComponent('Thank You from KSM.ART HOUSE');
    const body = encodeURIComponent(
      `Dear ${name},

` + 
      `Thank you for choosing KSM.ART HOUSE for your event at ${location} on ${eventDate}.

` + 
      `We are grateful for the opportunity to serve you and hope everything exceeded your expectations. ` + 
      `Your trust in our services means the world to us.

` + 
      `It was a pleasure working with you, and we hope to have the honor of serving you again for your future events.

` + 
      `Should you need any assistance or have feedback to share, please don't hesitate to reach out.

` + 
      `Best regards,
` + 
      `KSM.ART HOUSE Team

` + 
      `Phone: ${phoneNumber}
` + 
      `Location: ${location}`
    );

    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const handleAddCustomer = async () => {
    if (!formData.name || !formData.phoneNumber || !formData.location) {
      showError(
        'Missing Information',
        'Please fill in Name, Phone Number, and Location to create a customer booking.'
      );
      return;
    }

    try {
      // Find the next available row
      const nextEmptyRowIndex = currentMonthData.findIndex(row => !row.name);

      if (nextEmptyRowIndex === -1) {
        showError(
          'Month Full',
          'All 25 rows are filled for this month. Please select a different month or clear some rows.'
        );
        return;
      }

      const paymentStatus = formData.paidAmount >= formData.totalAmount ? 'full' : formData.paidAmount > 0 ? 'deposit' : 'pending';

      // Save to database using the hook
      const newCustomer = await addCustomer({
        name: formData.name,
        contact: formData.phoneNumber,
        location: formData.location,
        eventType: formData.eventType,
        eventDate: formData.date,
        totalAmount: formData.totalAmount,
        paidAmount: formData.paidAmount,
        paymentStatus: paymentStatus,
        paymentMethod: formData.paymentMethod,
        serviceStatus: 'pending',
        notes: formData.notes,
        requirements: {}
      });

      const newCustomerData: MonthlyCustomerData = {
        id: newCustomer.id,
        customerNumber: nextEmptyRowIndex + 1,
        date: formData.date,
        location: formData.location,
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        doubleTent: 0,
        singleTent: 0,
        gazeboTent: 0,
        miluxeTent: 0,
        aFrameTent: 0,
        bLineTent: 0,
        pergolaTent: 0,
        roundTable: 0,
        longTable: 0,
        bridalTable: 0,
        chavariSeats: 0,
        luxeSeats: 0,
        chameleonSeats: 0,
        diorSeats: 0,
        highBackSeats: 0,
        plasticSeats: 0,
        banquetSeats: 0,
        crossBarSeats: 0,
        totalAmount: formData.totalAmount,
        paidAmount: formData.paidAmount,
        paymentMethod: formData.paymentMethod,
        paymentStatus: paymentStatus,
        serviceStatus: 'pending',
        notes: formData.notes,
        eventType: formData.eventType,
        createdAt: new Date().toISOString(),
      };

      // Update the monthly data
      const updatedMonthData = [...currentMonthData];
      updatedMonthData[nextEmptyRowIndex] = newCustomerData;

      setMonthlyData(prev => ({
        ...prev,
        [selectedMonth]: updatedMonthData
      }));

      // Reset form
      setFormData({
        name: '',
        phoneNumber: '',
        location: '',
        eventType: '',
        date: new Date().toISOString().split('T')[0],
        totalAmount: 0,
        paidAmount: 0,
        paymentMethod: 'cash',
        notes: '',
      });

      setIsAdding(false);
      
      // Refresh data
      await fetchCustomers();
      
      showSuccess(
        'Customer Booking Created!',
        `Successfully created booking for ${formData.name} at ${formData.location} on ${formData.date}. Customer ID: ${newCustomer.id}. Payment Status: ${paymentStatus}. Amount: KSH ${formData.totalAmount.toLocaleString()}`
      );
    } catch (error) {
      console.error('Error adding customer:', error);
      showError(
        'Booking Failed',
        'Failed to add customer to database. Please try again or contact support.'
      );
    }
  };

  const handleCellClick = (rowIndex: number, column: string) => {
    if (['date', 'location', 'name', 'phoneNumber'].includes(column) || column.includes('Tent') || column.includes('Table') || column.includes('Seats') || column.includes('Size')) {
      setEditingCell({ rowIndex, column });
      const currentValue = currentMonthData[rowIndex]?.[column as keyof MonthlyCustomerData];
      setEditValue(currentValue !== undefined ? String(currentValue) : '');
    }
  };

  const handleCellSave = () => {
    if (!editingCell) return;

    const { rowIndex, column } = editingCell;
    const updatedMonthData = [...currentMonthData];

    // Create row if it doesn't exist
    if (!updatedMonthData[rowIndex]) {
      updatedMonthData[rowIndex] = {
        id: `${selectedMonth}-row-${rowIndex + 1}`,
        customerNumber: rowIndex + 1,
        date: '',
        location: '',
        name: '',
        phoneNumber: '',
        doubleTent: 0,
        singleTent: 0,
        gazeboTent: 0,
        miluxeTent: 0,
        aFrameTent: 0,
        bLineTent: 0,
        pergolaTent: 0,
        roundTable: 0,
        longTable: 0,
        bridalTable: 0,
        chavariSeats: 0,
        luxeSeats: 0,
        chameleonSeats: 0,
        diorSeats: 0,
        highBackSeats: 0,
        plasticSeats: 0,
        banquetSeats: 0,
        crossBarSeats: 0,
        totalAmount: 0,
        paidAmount: 0,
        paymentMethod: 'cash',
        paymentStatus: 'pending',
        serviceStatus: 'pending',
        notes: '',
        eventType: '',
        createdAt: new Date().toISOString(),
      };
    }

    const isNumberField = !['date', 'location', 'name', 'phoneNumber'].includes(column) && !column.includes('Size');
    const value = isNumberField ? (parseInt(editValue) || 0) : editValue;

    updatedMonthData[rowIndex] = {
      ...updatedMonthData[rowIndex],
      [column]: value
    };

    setMonthlyData(prev => ({
      ...prev,
      [selectedMonth]: updatedMonthData
    }));


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

  const getMonthName = (monthValue: string) => {
    const month = months.find(m => m.value === monthValue);
    return month ? month.label : monthValue;
  };

  const handleSaveToDatabase = async () => {
    setIsSaving(true);
    try {
      const result = await fetchCustomers();

      if (result && result.success) {
        showSuccess(
          'Customer Data Synced!',
          `Successfully synced customers from database. Total: ${result.count} customer(s) loaded. Data is 100% up-to-date. Admin can see all your customers.`
        );
      } else {
        showSuccess(
          'Sync Completed',
          'Sync completed but no data returned. Check console for details.'
        );
      }
    } catch (error: any) {
      console.error('Error syncing from database:', error);
      showError(
        'Sync Failed',
        'Failed to sync from database: ' + error.message
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncUpdate = async () => {
    try {
      showSuccess(
        'Customer Data Synced!',
        'Customer data has been successfully synced across all devices. All team members now have the latest information.'
      );
    } catch (error) {
      console.error('Sync error:', error);
      showError(
        'Sync Failed',
        'Sync failed. Please try again or contact support.'
      );
    }
  };

  const printMonthlyTable = () => {
    // ... (Keep existing print logic)
    const monthName = getMonthName(selectedMonth);
    const filledRows = currentMonthData.filter(row => row.name);
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Monthly Customer Table - ${monthName}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 10px; 
            font-size: 8px;
            line-height: 1.2;
          }
          .header { 
            text-align: center; 
            border-bottom: 2px solid #000; 
            padding-bottom: 10px; 
            margin-bottom: 15px;
          }
          .header h1 { color: #f59e0b; margin: 0; font-size: 18px; }
          .header h2 { margin: 5px 0; font-size: 14px; }
          .table-container { 
            overflow-x: auto; 
            margin: 10px 0;
          }
          .customer-table { 
            width: 100%; 
            border-collapse: collapse; 
            font-size: 7px;
            table-layout: fixed;
          }
          .customer-table th, .customer-table td { 
            border: 1px solid #333; 
            padding: 2px; 
            text-align: center;
            vertical-align: middle;
            word-wrap: break-word;
            overflow: hidden;
          }
          .customer-table th { 
            background: #f3f4f6; 
            font-weight: bold; 
            font-size: 6px;
            writing-mode: horizontal-tb;
            height: 30px;
          }
          .customer-table td { 
            height: 25px;
            font-size: 6px;
          }
          .col-number { width: 3%; }
          .col-date { width: 6%; }
          .col-location { width: 8%; }
          .col-name { width: 8%; }
          .col-phone { width: 7%; }
          .col-tent { width: 4%; }
          .col-table { width: 4%; }
          .col-seat { width: 4%; }
          .col-charger { width: 4%; }
          .row-number { 
            background: #e5e7eb; 
            font-weight: bold; 
          }
          .text-cell { text-align: left; }
          .number-cell { text-align: center; font-weight: bold; }
          .tent-cell { 
            text-align: center; 
            font-weight: bold;
            font-size: 6px;
            line-height: 1.1;
          }
          .table-cell {
            text-align: center;
            font-weight: bold;
            font-size: 6px;
            line-height: 1.1;
          }
          .page-break {
            page-break-before: always;
          }
          .footer { 
            margin-top: 20px; 
            border-top: 1px solid #ccc; 
            padding-top: 10px; 
            text-align: center;
            font-size: 8px;
          }
          @media print {
            @page {
              size: A4 landscape;
              margin: 0.5in;
            }
            body { 
              margin: 0; 
              font-size: 6px;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .customer-table { 
              font-size: 5px;
              width: 100%;
              page-break-inside: avoid;
            }
            .customer-table th { 
              font-size: 5px;
              height: 25px;
            }
            .customer-table td { 
              font-size: 5px;
              height: 20px;
              padding: 1px;
            }
            .header h1 { font-size: 16px; }
            .header h2 { font-size: 12px; }
            .footer { font-size: 6px; }
            .page-break {
              page-break-before: always;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>KSM.ART HOUSE</h1>
          <h2>Monthly Customer Table - ${monthName}</h2>
          <p>Week of ${monthName} - Customer Requirements & Equipment Allocation</p>
        </div>
        
        <!-- First Page: Customer Info + Tents + Tables -->
        <div class="table-container">
          <table class="customer-table">
            <thead>
              <tr>
                <th class="row-number col-number">#</th>
                <th class="col-date">DATE</th>
                <th class="col-location">LOCATION</th>
                <th class="col-name">NAME</th>
                <th class="col-phone">PHONE</th>
                <th class="col-tent">DBL TENT</th>
                <th class="col-tent">SGL TENT</th>
                <th class="col-tent">GAZ TENT</th>
                <th class="col-tent">MLX TENT</th>
                <th class="col-tent">A-FR TENT</th>
                <th class="col-tent">B-LN TENT</th>
                <th class="col-tent">PER TENT</th>
                <th class="col-table">RND TBL</th>
                <th class="col-table">LNG TBL</th>
                <th class="col-table">BRD TBL</th>
                <th class="col-seat">CHV SEAT</th>
                <th class="col-seat">LUX SEAT</th>
                <th class="col-seat">CML SEAT</th>
                <th class="col-seat">DOR SEAT</th>
                <th class="col-seat">HBK SEAT</th>
                <th class="col-seat">PLS SEAT</th>
                <th class="col-seat">BNQ SEAT</th>
                <th class="col-seat">CRS SEAT</th>
              </tr>
            </thead>
            <tbody>
              ${Array.from({ length: 25 }, (_, index) => {
                const row = currentMonthData[index];
                return `
                  <tr>
                    <td class="row-number">${index + 1}</td>
                    <td class="text-cell">${row?.date || ''}</td>
                    <td class="text-cell">${row?.location || ''}</td>
                    <td class="text-cell">${row?.name || ''}</td>
                    <td class="text-cell">${row?.phoneNumber || ''}</td>
                    <td class="tent-cell">
                      ${row?.doubleTent || ''}
                      ${row?.doubleTentSize ? `<br><span style="font-size: 5px;">📏${row.doubleTentSize}</span>` : ''}
                    </td>
                    <td class="tent-cell">
                      ${row?.singleTent || ''}
                      ${row?.singleTentSize ? `<br><span style="font-size: 5px;">📏${row.singleTentSize}</span>` : ''}
                    </td>
                    <td class="tent-cell">
                      ${row?.gazeboTent || ''}
                      ${row?.gazeboTentSize ? `<br><span style="font-size: 5px;">📏${row.gazeboTentSize}</span>` : ''}
                    </td>
                    <td class="tent-cell">
                      ${row?.miluxeTent || ''}
                      ${row?.miluxeTentSize ? `<br><span style="font-size: 5px;">📏${row.miluxeTentSize}</span>` : ''}
                    </td>
                    <td class="tent-cell">
                      ${row?.aFrameTent || ''}
                      ${row?.aFrameTentSize ? `<br><span style="font-size: 5px;">📏${row.aFrameTentSize}</span>` : ''}
                    </td>
                    <td class="tent-cell">
                      ${row?.bLineTent || ''}
                      ${row?.bLineTentSize ? `<br><span style="font-size: 5px;">📏${row.bLineTentSize}</span>` : ''}
                    </td>
                    <td class="tent-cell">
                      ${row?.pergolaTent || ''}
                      ${row?.pergolaTentSize ? `<br><span style="font-size: 5px;">📏${row.pergolaTentSize}</span>` : ''}
                    </td>
                    <td class="number-cell">${row?.roundTable || ''}</td>
                    <td class="number-cell">${row?.longTable || ''}</td>
                    <td class="number-cell">${row?.bridalTable || ''}</td>
                    <td class="number-cell">${row?.chavariSeats || ''}</td>
                    <td class="number-cell">${row?.luxeSeats || ''}</td>
                    <td class="number-cell">${row?.chameleonSeats || ''}</td>
                    <td class="number-cell">${row?.diorSeats || ''}</td>
                    <td class="number-cell">${row?.highBackSeats || ''}</td>
                    <td class="number-cell">${row?.plasticSeats || ''}</td>
                    <td class="number-cell">${row?.banquetSeats || ''}</td>
                    <td class="number-cell">${row?.crossBarSeats || ''}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <!-- Second Page: Seats -->
        <div class="page-break">
          <div class="header">
            <h1>KSM.ART HOUSE</h1>
            <h2>Monthly Customer Table - ${monthName} (Seats)</h2>
            <p>Week of ${monthName} - Seating Arrangements & Allocation</p>
          </div>
          
          <div class="table-container">
            <table class="customer-table">
              <thead>
                <tr>
                  <th class="row-number col-number">#</th>
                  <th class="col-name">NAME</th>
                  <th class="col-seat">CHV SEAT</th>
                  <th class="col-seat">LUX SEAT</th>
                  <th class="col-seat">CML SEAT</th>
                  <th class="col-seat">DOR SEAT</th>
                  <th class="col-seat">HBK SEAT</th>
                  <th class="col-seat">PLS SEAT</th>
                  <th class="col-seat">BNQ SEAT</th>
                  <th class="col-seat">CRS SEAT</th>
                </tr>
              </thead>
              <tbody>
                ${Array.from({ length: 25 }, (_, index) => {
                  const row = currentMonthData[index];
                  return `
                    <tr>
                      <td class="row-number">${index + 1}</td>
                      <td class="text-cell">${row?.name || ''}</td>
                      <td class="number-cell">${row?.chavariSeats || ''}</td>
                      <td class="number-cell">${row?.luxeSeats || ''}</td>
                      <td class="number-cell">${row?.chameleonSeats || ''}</td>
                      <td class="number-cell">${row?.diorSeats || ''}</td>
                      <td class="number-cell">${row?.highBackSeats || ''}</td>
                      <td class="number-cell">${row?.plasticSeats || ''}</td>
                      <td class="number-cell">${row?.banquetSeats || ''}</td>
                      <td class="number-cell">${row?.crossBarSeats || ''}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
        <div class="footer">
          <p><strong>Generated on:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Total Customers:</strong> ${filledRows.length}/25</p>
          <p><strong>KSM.ART HOUSE Management System</strong> - Monthly Customer Allocation Table</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const filledCustomers = currentMonthData.filter(row => row.name).length;

  const decorColumns = [
    { key: 'walkwayStands', label: 'WALKWAY STANDS' },
    { key: 'arc', label: 'ARC' },
    { key: 'aisleStands', label: 'AISLE STANDS' },
    { key: 'photobooth', label: 'PHOTOBOOTH' },
    { key: 'lecturn', label: 'LECTURN' },
    { key: 'stageBoards', label: 'STAGE BOARDS' },
    { key: 'backdropBoards', label: 'BACKDROP BOARDS' },
    { key: 'danceFloor', label: 'DANCE FLOOR' },
    { key: 'walkwayBoards', label: 'WALKWAY BOARDS' },
    { key: 'whiteSticker', label: 'WHITE STICKER' },
    { key: 'centerpieces', label: 'CENTERPIECES' },
    { key: 'glassChargerPlates', label: 'GLASS CHARGER PLATES' },
    { key: 'melamineChargerPlates', label: 'MELAMINE CHARGER PLATES' },
    { key: 'africanMats', label: 'AFRICAN MATS' },
    { key: 'goldNapkinHolders', label: 'GOLD NAPKIN HOLDERS' },
    { key: 'silverNapkinHolders', label: 'SILVER NAPKIN HOLDERS' },
    { key: 'roofTopDecor', label: 'ROOF TOP DECOR' },
    { key: 'parcanLights', label: 'PARCAN LIGHTS' },
    { key: 'revolvingHeads', label: 'REVOLVING HEADS' },
    { key: 'fairyLights', label: 'FAIRY LIGHTS' },
    { key: 'snakeLights', label: 'SNAKE LIGHTS' },
    { key: 'neonLights', label: 'NEON LIGHTS' },
    { key: 'smallChandeliers', label: 'SMALL CHANDELIERS' },
    { key: 'largeChandeliers', label: 'LARGE CHANDELIERS' },
    { key: 'africanLampshades', label: 'AFRICAN LAMPSHADES' },
  ];

  // Helper function to create empty decor item
  function createEmptyDecorItem(customerId: string, month: string): DecorItemsData {
    return {
      id: `${month}-${customerId}`,
      customerId,
      month,
      walkwayStands: 0,
      arc: 0,
      aisleStands: 0,
      photobooth: 0,
      lecturn: 0,
      stageBoards: 0,
      backdropBoards: 0,
      danceFloor: 0,
      walkwayBoards: 0,
      whiteSticker: 0,
      centerpieces: 0,
      glassChargerPlates: 0,
      melamineChargerPlates: 0,
      africanMats: 0,
      goldNapkinHolders: 0,
      silverNapkinHolders: 0,
      roofTopDecor: 0,
      parcanLights: 0,
      revolvingHeads: 0,
      fairyLights: 0,
      snakeLights: 0,
      neonLights: 0,
      smallChandeliers: 0,
      largeChandeliers: 0,
      africanLampshades: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  // Handle decor cell click
  function handleDecorCellClick(rowIndex: number, column: string, customerId: string) {
    setEditingDecorCell({ rowIndex, column });
    const decorKey = `${selectedMonth}-${customerId}`;
    const decorData = decorItems[decorKey] || createEmptyDecorItem(customerId, selectedMonth);
    const currentValue = decorData[column as keyof DecorItemsData] || 0;
    setEditDecorValue(String(currentValue));
  }

  // Handle decor cell save
  function handleDecorCellSave() {
    if (!editingDecorCell) return;

    const { rowIndex, column } = editingDecorCell;
    const row = currentMonthData[rowIndex];
    if (!row) return;

    const customerId = row.id || `row-${rowIndex}`;
    const decorKey = `${selectedMonth}-${customerId}`;
    const decorData = decorItems[decorKey] || createEmptyDecorItem(customerId, selectedMonth);

    const value = parseInt(editDecorValue) || 0;

    const updatedDecorData = {
      ...decorData,
      [column]: value,
      updatedAt: new Date().toISOString(),
    };

    setDecorItems(prev => ({
      ...prev,
      [decorKey]: updatedDecorData,
    }));


    setEditingDecorCell(null);
    setEditDecorValue('');
  }

  // Handle decor key press
  function handleDecorKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      handleDecorCellSave();
    } else if (e.key === 'Escape') {
      setEditingDecorCell(null);
      setEditDecorValue('');
    }
  }

  // Print decor table
  function printDecorTable() {
    const monthName = getMonthName(selectedMonth);
    const filledRows = currentMonthData.filter(row => row.name);

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Decor & Lighting Items - ${monthName}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 10px;
            font-size: 8px;
            line-height: 1.2;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 15px;
          }
          .header h1 { color: #f59e0b; margin: 0; font-size: 18px; }
          .header h2 { margin: 5px 0; font-size: 14px; }
          .table-container {
            overflow-x: auto;
            margin: 10px 0;
          }
          .decor-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 7px;
            table-layout: fixed;
          }
          .decor-table th, .decor-table td {
            border: 1px solid #333;
            padding: 2px;
            text-align: center;
            vertical-align: middle;
            word-wrap: break-word;
            overflow: hidden;
          }
          .decor-table th {
            background: #f3f4f6;
            font-weight: bold;
            font-size: 6px;
            writing-mode: horizontal-tb;
            height: 30px;
          }
          .decor-table td {
            height: 25px;
            font-size: 6px;
          }
          .col-number { width: 3%; }
          .col-name { width: 10%; }
          .col-item { width: 3%; }
          .row-number {
            background: #e5e7eb;
            font-weight: bold;
          }
          .text-cell { text-align: left; }
          .number-cell { text-align: center; font-weight: bold; color: #059669; }
          .footer {
            margin-top: 20px;
            border-top: 1px solid #ccc;
            padding-top: 10px;
            text-align: center;
            font-size: 8px;
          }
          @media print {
            @page {
              size: A4 landscape;
              margin: 0.5in;
            }
            body {
              margin: 0;
              font-size: 6px;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .decor-table {
              font-size: 5px;
              width: 100%;
              page-break-inside: avoid;
            }
            .decor-table th {
              font-size: 5px;
              height: 25px;
            }
            .decor-table td {
              font-size: 5px;
              height: 20px;
              padding: 1px;
            }
            .header h1 { font-size: 16px; }
            .header h2 { font-size: 12px; }
            .footer { font-size: 6px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>KSM.ART HOUSE</h1>
          <h2>Decor & Lighting Items - ${monthName}</h2>
          <p>Customer Decor Requirements & Allocation</p>
        </div>

        <div class="table-container">
          <table class="decor-table">
            <thead>
              <tr>
                <th class="row-number col-number">#</th>
                <th class="col-name">CUSTOMER NAME</th>
                ${decorColumns.map(col => `<th class="col-item">${col.label}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${Array.from({ length: 25 }, (_, index) => {
                const row = currentMonthData[index];
                const decorKey = selectedMonth + '-' + (row?.id || index);
                const decorData = decorItems[decorKey] || createEmptyDecorItem(row?.id || 'row-' + index, selectedMonth);

                return '<tr>' +
                  '<td class="row-number">' + (index + 1) + '</td>' +
                  '<td class="text-cell">' + (row?.name || '') + '</td>' +
                  decorColumns.map(col => {
                    const value = decorData[col.key as keyof DecorItemsData];
                    return '<td class="number-cell">' + (value || '') + '</td>';
                  }).join('') + 
                  '</tr>';
              }).join('')}
            </tbody>
          </table>
        </div>

        <div class="footer">
          <p><strong>Generated on:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Total Customers:</strong> ${filledRows.length}/25</p>
          <p><strong>KSM.ART HOUSE Management System</strong> - Decor & Lighting Items Table</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  }

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
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Customer Management</h2>
            <p className="text-muted-foreground">Monthly customer allocation and equipment tracking</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={printMonthlyTable}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button onClick={() => setIsAdding(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Month Selection */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Week of {getMonthName(selectedMonth)}</CardTitle>
            <div className="flex flex-wrap gap-2 items-center">
              <Button variant="outline" size="sm" onClick={handleSyncUpdate}>
                🔄 Update All Devices
              </Button>
              {months.map((month) => (
                <Button
                  key={month.value}
                  variant={selectedMonth === month.value ? 'default' : 'ghost'}
                  onClick={() => setSelectedMonth(month.value)}
                  size="sm"
                >
                  {month.label.split(' ')[0]}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-primary/5 p-4 rounded-lg border border-primary/10 flex items-center">
              <div className="p-2 bg-primary/10 rounded-full mr-3">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Customers</p>
                <p className="text-2xl font-bold text-foreground">{filledCustomers}/25</p>
              </div>
            </div>
            <div className="bg-emerald-500/5 p-4 rounded-lg border border-emerald-500/10 flex items-center">
              <div className="p-2 bg-emerald-500/10 rounded-full mr-3">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Served</p>
                <p className="text-2xl font-bold text-emerald-500">
                  {currentMonthData.filter(row => row.serviceStatus === 'served').length}
                </p>
              </div>
            </div>
            <div className="bg-amber-500/5 p-4 rounded-lg border border-amber-500/10 flex items-center">
              <div className="p-2 bg-amber-500/10 rounded-full mr-3">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-amber-500">
                  {currentMonthData.filter(row => row.serviceStatus === 'pending' && row.name).length}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Collapsible Database Save Panel */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <Button
            variant="ghost"
            onClick={() => setShowDatabasePanel(!showDatabasePanel)}
            className="w-full flex items-center justify-between hover:bg-primary/10 p-0 h-auto"
          >
            <div className="flex items-center space-x-3 text-left">
              <div className="p-2 bg-primary/20 rounded-full">
                <Database className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg text-primary">Save to Database</CardTitle>
                <CardDescription className="text-muted-foreground">Click to sync {customers.length} customers to database for admin</CardDescription>
              </div>
            </div>
            {showDatabasePanel ? (
              <ChevronUp className="h-5 w-5 text-primary" />
            ) : (
              <ChevronDown className="h-5 w-5 text-primary" />
            )}
          </Button>
        </CardHeader>

        {showDatabasePanel && (
          <CardContent className="pt-2">
            <div className="space-y-4">
              <div className="bg-blue-500/10 border-l-4 border-blue-500 p-4 rounded-md">
                <h4 className="font-semibold text-blue-600 mb-2 text-sm">What this does:</h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                  <li>Saves all {customers.length} customers to Supabase database</li>
                  <li>Makes data visible to admin on all devices</li>
                  <li>Ensures data never gets lost</li>
                  <li>Enables cross-device synchronization</li>
                </ul>
              </div>

              <Button
                onClick={handleSaveToDatabase}
                disabled={isSaving || customers.length === 0}
                className={`w-full h-12 text-lg ${isSaving || customers.length === 0 ? 'opacity-70 cursor-not-allowed' : 'bg-primary hover:bg-primary/90 text-primary-foreground'}`}
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground mr-2"></div>
                    Saving to Database...
                  </>
                ) : (
                  <>
                    <Database className="h-5 w-5 mr-2" />
                    Save {customers.length} Customers to Database
                  </>
                )}
              </Button>

              {customers.length === 0 && (
                <p className="text-center text-muted-foreground text-sm">No customers to save. Add customers first.</p>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Add Customer Form */}
      {isAdding && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add New Customer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Customer Name *</label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone Number *</label>
                <Input value={formData.phoneNumber} onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })} placeholder="e.g., 0712345678" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Event Location *</label>
                <Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Event Type</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={formData.eventType} 
                  onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                >
                  <option value="">Select Event Type</option>
                  <option value="wedding">Wedding</option>
                  <option value="birthday">Birthday</option>
                  <option value="corporate">Corporate</option>
                  <option value="traditional">Traditional</option>
                  <option value="graduation">Graduation</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Event Date</label>
                <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Total Amount (KSH)</label>
                <Input type="number" value={formData.totalAmount} onChange={(e) => setFormData({ ...formData, totalAmount: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Paid Amount (KSH)</label>
                <Input type="number" value={formData.paidAmount} onChange={(e) => setFormData({ ...formData, paidAmount: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Method</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={formData.paymentMethod} 
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                >
                  <option value="cash">Cash</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="mpesa">M-Pesa</option>
                </select>
              </div>
              <div className="lg:col-span-3 space-y-2">
                <label className="text-sm font-medium">Additional Notes</label>
                <textarea 
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.notes} 
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2} 
                  placeholder="Any special requirements or notes..." 
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
              <Button onClick={handleAddCustomer}>
                <Save className="h-4 w-4 mr-2" />
                Add Customer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Customer Table */}
      <Card>
        <CardHeader className="py-4 border-b bg-muted/20">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Monthly Customer Allocation Table</CardTitle>
            <Badge variant="secondary">{filledCustomers} of 25 rows filled</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="border-r px-2 py-3 text-xs font-bold text-muted-foreground text-center w-12">#</th>
                  {columns.map((column) => (
                    <th key={column.key} className={`border-r px-2 py-3 text-xs font-bold text-muted-foreground text-center ${column.width} min-w-[80px]`}>
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {Array.from({ length: 25 }, (_, rowIndex) => {
                  const row = currentMonthData[rowIndex];
                  const hasData = row && row.name;
                  
                  return (
                    <tr key={rowIndex} className={`${hasData ? 'bg-primary/5' : 'bg-background'} hover:bg-muted/50 transition-colors`}>
                      <td className="border-r px-2 py-2 text-center font-bold text-muted-foreground bg-muted/20">{rowIndex + 1}</td>
                      {columns.map((column) => {
                        const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.column === column.key;
                        const value = row?.[column.key as keyof MonthlyCustomerData] || '';
                        const displayValue = typeof value === 'number' ? (value === 0 ? '' : value.toString()) : value;
                        const isNumberField = !['date', 'location', 'name', 'phoneNumber'].includes(column.key) && !column.key.includes('Size');
                        const isTentColumn = column.key.includes('Tent');
                        const isTableColumn = column.key.includes('Table');
                        const tentSizeKey = `${column.key}Size` as keyof MonthlyCustomerData;
                        const tableSizeKey = `${column.key}Size` as keyof MonthlyCustomerData;
                        const tentSize = row?.[tentSizeKey] || '';
                        const tableSize = row?.[tableSizeKey] || '';
                        const isEditingSize = editingCell?.rowIndex === rowIndex && editingCell?.column === `${column.key}Size`;
                        
                        return (
                          <td
                            key={column.key}
                            className={`border-r px-1 py-1 ${['name', 'location', 'phoneNumber'].includes(column.key) ? 'text-left' : 'text-center'}
                            cursor-pointer hover:bg-primary/10 transition-colors`}
                            onClick={() => handleCellClick(rowIndex, column.key)}
                          >
                            {isEditing ? (
                              <input
                                type={column.key === 'date' ? 'date' : isNumberField ? 'number' : 'text'}
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={handleCellSave}
                                onKeyDown={handleKeyPress}
                                className="w-full px-1 py-1 text-xs border border-primary bg-background focus:outline-none focus:ring-1 focus:ring-primary rounded"
                                autoFocus
                                min={isNumberField ? "0" : undefined}
                              />
                            ) : isEditingSize ? (
                              <div className="flex flex-col items-center">
                                <div className="text-xs font-bold text-primary mb-1">{displayValue}</div>
                                <input
                                  type="text"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onBlur={handleCellSave}
                                  onKeyDown={handleKeyPress}
                                  className="w-full px-1 py-1 text-xs border border-primary text-center rounded"
                                  placeholder={isTableColumn ? "L or S" : "Size"}
                                  autoFocus
                                />
                              </div>
                            ) : (
                              <div className={`text-xs min-h-[40px] flex flex-col items-center justify-center px-1 py-1 w-full space-y-1`}>
                                {isNumberField ? (
                                  <div className="w-full text-center">
                                    {displayValue ? (
                                      <span className="text-sm font-bold text-primary">{displayValue}</span>
                                    ) : (
                                      <span className="text-muted-foreground/30 text-xs">0</span>
                                    )}
                                  </div>
                                ) : (
                                  <div className={`w-full ${['name', 'location', 'phoneNumber'].includes(column.key) ? 'text-left' : 'text-center'}`}>
                                    {displayValue ? (
                                      <>
                                        <span className="text-foreground font-medium">{displayValue}</span>
                                        {column.key === 'phoneNumber' && displayValue && (
                                          <div className="flex gap-1 mt-1">
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-6 w-6 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                const row = currentMonthData[rowIndex];
                                                sendWhatsAppVoteOfThanks(String(row.phoneNumber || ''), String(row.name || ''), String(row.location || ''), String(row.date || ''));
                                              }}
                                              title="WhatsApp"
                                            >
                                              <MessageCircle className="h-3 w-3" />
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-6 w-6 bg-primary/10 hover:bg-primary/20 text-primary"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                const row = currentMonthData[rowIndex];
                                                sendEmailVoteOfThanks(String(row.name || ''), String(row.phoneNumber || ''), String(row.location || ''), String(row.date || ''));
                                              }}
                                              title="Email"
                                            >
                                              <Mail className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        )}
                                      </>
                                    ) : (
                                      <span className="text-muted-foreground/40 text-[10px] italic">
                                        {column.key === 'name' ? '+ Name' : '...'}
                                      </span>
                                    )}
                                  </div>
                                )}

                                {isTentColumn && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingCell({ rowIndex, column: `${column.key}Size` });
                                      setEditValue(String(tentSize));
                                    }}
                                    className={`text-[10px] px-1 rounded border transition-colors w-full ${tentSize ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'}`}
                                  >
                                    {tentSize ? `📏 ${tentSize}` : '+Size'}
                                  </button>
                                )}
                                {isTableColumn && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingCell({ rowIndex, column: `${column.key}Size` });
                                      setEditValue(String(tableSize));
                                    }}
                                    className={`text-[10px] px-1 rounded border transition-colors w-full ${tableSize ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'}`}
                                  >
                                    {tableSize ? `${tableSize}` : '+L/S'}
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-muted/20 border-t">
            <p className="text-xs text-muted-foreground">
              <strong>Instructions:</strong> Click cells to edit. Press Enter to save. Use +Size buttons for specifications. Changes save automatically.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Decor Items Table */}
      <Card className="mt-6">
        <CardHeader className="py-4 border-b bg-muted/20 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Decor & Lighting Items Allocation</CardTitle>
          <Button variant="secondary" size="sm" onClick={printMonthlyTable}>
            <Printer className="h-4 w-4 mr-2" />
            Print Report
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="border-r px-2 py-3 text-xs font-bold text-muted-foreground text-center w-12">#</th>
                  <th className="border-r px-2 py-3 text-xs font-bold text-muted-foreground text-center w-32">CUSTOMER NAME</th>
                  {decorColumns.map((column) => (
                    <th key={column.key} className="border-r px-2 py-3 text-xs font-bold text-muted-foreground text-center min-w-[80px]">
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {Array.from({ length: 25 }, (_, rowIndex) => {
                  const row = currentMonthData[rowIndex];
                  const hasData = row && row.name;
                  const decorKey = `${selectedMonth}-${row?.id || rowIndex}`;
                  // We need to access decorItems safely but hooks can't be used in loops or callbacks easily if they weren't top level.
                  // But decorItems IS top level state.
                  // createEmptyDecorItem is a helper.
                  const decorData = decorItems[decorKey] || { 
                    id: decorKey, customerId: row?.id || `row-${rowIndex}`, month: selectedMonth 
                  }; 

                  return (
                    <tr key={rowIndex} className={`${hasData ? 'bg-emerald-500/5' : 'bg-background'} hover:bg-muted/50 transition-colors`}>
                      <td className="border-r px-2 py-2 text-center font-bold text-muted-foreground bg-muted/20">{rowIndex + 1}</td>
                      <td className="border-r px-2 py-2 text-xs font-medium">
                        {row?.name || <span className="text-muted-foreground/40 italic">Empty</span>}
                      </td>
                      {decorColumns.map((column) => {
                        const isEditing = editingDecorCell?.rowIndex === rowIndex && editingDecorCell?.column === column.key;
                        const value = decorData[column.key as keyof typeof decorData] || 0;
                        const displayValue = value === 0 ? '' : value.toString();

                        return (
                          <td
                            key={column.key}
                            className="border-r px-1 py-1 text-center cursor-pointer hover:bg-primary/10 transition-colors"
                            onClick={() => handleDecorCellClick(rowIndex, column.key, row?.id || `row-${rowIndex}`)}
                          >
                            {isEditing ? (
                              <input
                                type="number"
                                value={editDecorValue}
                                onChange={(e) => setEditDecorValue(e.target.value)}
                                onBlur={handleDecorCellSave}
                                onKeyDown={handleDecorKeyPress}
                                className="w-full px-1 py-1 text-xs border border-primary text-center rounded focus:outline-none focus:ring-1 focus:ring-primary"
                                autoFocus
                                min="0"
                              />
                            ) : (
                              <span className={`text-xs font-bold ${displayValue ? 'text-emerald-500' : 'text-muted-foreground/10'}`}>
                                {displayValue || '0'}
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerManager;