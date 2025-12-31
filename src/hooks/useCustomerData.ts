import { useState, useEffect, useCallback } from 'react';
import { Customer } from '../types';
import { useDataPersistence } from './useDataPersistence';

export interface CustomerRequirement {
  id: string;
  customerId: string;
  customerName: string;
  eventType: string;
  eventDate: string;
  location: string;
  requirements: {
    catering: string[];
    decor: string[];
    entertainment: string[];
    sanitation: string[];
    special: string[];
  };
  rentalItems: {
    doubleTent: number;
    singleTent: number;
    gazeboTent: number;
    aFrameTent: number;
    blineTent: number;
    perrolaTent: number;
    roundTable: number;
    longTable: number;
    bridalTable: number;
    chiavariSeats: number;
    luxeSeats: number;
    metalicSeats: number;
    glassCharger: number;
    plasticSeats: number;
    banquetSeats: number;
    crossbarSeats: number;
  };
  totalBudget: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export const useCustomerData = () => {
  const [customers, setCustomers] = useDataPersistence<Customer[]>('customers', []);
  const [customerRequirements, setCustomerRequirements] = useDataPersistence<CustomerRequirement[]>('customer-requirements', []);
  const [printQueue, setPrintQueue] = useDataPersistence<string[]>('print-queue', []);

  // Safe number conversion
  const safeNumber = (value: any): number => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  // Generate customer requirement document
  const generateRequirement = useCallback((customer: Customer): CustomerRequirement => {
    // Ensure rentalItems is always initialized
    const defaultRentalItems = {
      doubleTent: 0,
      singleTent: 0,
      gazeboTent: 0,
      aFrameTent: 0,
      blineTent: 0,
      perrolaTent: 0,
      roundTable: 0,
      longTable: 0,
      bridalTable: 0,
      chiavariSeats: 0,
      luxeSeats: 0,
      metalicSeats: 0,
      glassCharger: 0,
      plasticSeats: 0,
      banquetSeats: 0,
      crossbarSeats: 0
    };

    const requirement: CustomerRequirement = {
      id: `req_${Date.now()}`,
      customerId: customer.id,
      customerName: customer.name,
      eventType: customer.eventType,
      eventDate: customer.eventDate,
      location: customer.location,
      requirements: {
        catering: [],
        decor: [],
        entertainment: [],
        sanitation: [],
        special: []
      },
      rentalItems: defaultRentalItems,
      totalBudget: safeNumber(customer.totalAmount),
      notes: customer.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Auto-populate based on event type
    switch (customer.eventType.toLowerCase()) {
      case 'wedding':
        requirement.requirements.catering = ['Wedding cake', 'Main course', 'Beverages', 'Appetizers'];
        requirement.requirements.decor = ['Bridal tent', 'Chairs', 'Tables', 'Flowers'];
        requirement.requirements.entertainment = ['DJ', 'MC', 'Sound system'];
        requirement.requirements.sanitation = ['Mobile toilets', 'Hand washing stations'];
        break;
      case 'birthday':
        requirement.requirements.catering = ['Birthday cake', 'Snacks', 'Drinks'];
        requirement.requirements.decor = ['Birthday tent', 'Balloons', 'Chairs'];
        requirement.requirements.entertainment = ['DJ', 'Sound system'];
        break;
      case 'corporate':
        requirement.requirements.catering = ['Lunch', 'Tea/Coffee', 'Snacks'];
        requirement.requirements.decor = ['Corporate tent', 'Tables', 'Chairs'];
        requirement.requirements.entertainment = ['PA system', 'Microphones'];
        requirement.requirements.sanitation = ['Mobile toilets'];
        break;
      case 'traditional':
        requirement.requirements.catering = ['Traditional food', 'Local beverages', 'Ceremonial items'];
        requirement.requirements.decor = ['Traditional setup', 'Cultural decorations', 'Ceremonial tent'];
        requirement.requirements.entertainment = ['Traditional music', 'Cultural performances'];
        requirement.requirements.sanitation = ['Mobile toilets', 'Hand washing stations'];
        requirement.requirements.special = ['Cultural requirements', 'Traditional ceremonies'];
        break;
      default:
        requirement.requirements.catering = ['Food', 'Beverages'];
        requirement.requirements.decor = ['Tent', 'Chairs', 'Tables'];
        requirement.requirements.entertainment = ['Sound system'];
        requirement.requirements.sanitation = ['Mobile toilets'];
    }

    return requirement;
  }, []);

  // Print customer requirement
  const printCustomerRequirement = useCallback((customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return null;

    let requirement = customerRequirements.find(r => r.customerId === customerId);
    if (!requirement) {
      requirement = generateRequirement(customer);
      const newRequirements = [...customerRequirements, requirement!];
      setCustomerRequirements(newRequirements);
    }

    // Add to print queue
    const newPrintQueue = [...printQueue, requirement!.id];
    setPrintQueue(newPrintQueue);

    // Generate print content
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Customer Requirement - ${customer.name}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 10px; 
            font-size: 14px;
            line-height: 1.4;
          }
          .header { 
            text-align: center; 
            border-bottom: 2px solid #000; 
            padding-bottom: 10px; 
            margin-bottom: 20px;
          }
          .header h1 {
            color: #f59e0b;
            margin: 0;
            font-size: 24px;
          }
          .header h2 {
            margin: 5px 0;
            font-size: 18px;
          }
          .section { 
            margin: 15px 0; 
            page-break-inside: avoid;
          }
          .section h3 {
            background: #f3f4f6;
            padding: 8px;
            margin: 10px 0 5px 0;
            border-left: 4px solid #f59e0b;
            font-size: 16px;
          }
          .requirement-list { 
            margin-left: 20px; 
            margin-top: 10px;
          }
          .requirement-list li {
            margin: 5px 0;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin: 10px 0;
          }
          .info-item {
            padding: 8px;
            background: #f9fafb;
            border-radius: 4px;
          }
          .info-item strong {
            color: #374151;
          }
          .rental-table {
            width: 100%; 
            border-collapse: collapse; 
            margin: 10px 0;
            font-size: 12px;
          }
          .rental-table th, .rental-table td {
            border: 1px solid #ccc; 
            padding: 6px; 
            text-align: left;
          }
          .rental-table th {
            background: #f3f4f6;
            font-weight: bold;
          }
          .rental-table td:last-child {
            text-align: center;
            font-weight: bold;
          }
          .footer { 
            margin-top: 30px; 
            border-top: 1px solid #ccc; 
            padding-top: 10px; 
            text-align: center;
            font-size: 12px;
            color: #6b7280;
          }
          .currency {
            color: #059669;
            font-weight: bold;
          }
          .payment-status {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
          }
          .payment-full { background: #d1fae5; color: #065f46; }
          .payment-deposit { background: #fef3c7; color: #92400e; }
          .payment-pending { background: #fee2e2; color: #991b1b; }
          
          @media print {
            body { margin: 0; font-size: 12px; }
            .section { margin: 10px 0; }
            .header { margin-bottom: 15px; }
          }
          
          @media (max-width: 600px) {
            body { margin: 5px; font-size: 12px; }
            .info-grid { grid-template-columns: 1fr; }
            .rental-table { font-size: 10px; }
            .rental-table th, .rental-table td { padding: 4px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>KSM.ART HOUSE</h1>
          <h2>Customer Event Requirements</h2>
          <p style="margin: 5px 0; color: #6b7280;">Professional Event Management Services</p>
        </div>
        
        <div class="section">
          <h3>Customer Information</h3>
          <div class="info-grid">
            <div class="info-item">
              <strong>Customer Name:</strong><br>${customer.name}
            </div>
            <div class="info-item">
              <strong>Contact Number:</strong><br>${customer.contact}
            </div>
            <div class="info-item">
              <strong>Event Type:</strong><br>${customer.eventType.replace('-', ' ').toUpperCase()}
            </div>
            <div class="info-item">
              <strong>Event Date:</strong><br>${customer.eventDate}
            </div>
            <div class="info-item">
              <strong>Event Location:</strong><br>${customer.location}
            </div>
            <div class="info-item">
              <strong>Total Budget:</strong><br><span class="currency">KSH ${safeNumber(customer.totalAmount).toLocaleString()}</span>
            </div>
            <div class="info-item">
              <strong>Amount Paid:</strong><br><span class="currency">KSH ${safeNumber(customer.paidAmount).toLocaleString()}</span>
            </div>
            <div class="info-item">
              <strong>Payment Status:</strong><br>
              <span class="payment-status ${
                customer.paymentStatus === 'full' ? 'payment-full' :
                customer.paymentStatus === 'deposit' ? 'payment-deposit' : 'payment-pending'
              }">
                ${customer.paymentStatus === 'full' ? 'FULLY PAID' :
                  customer.paymentStatus === 'deposit' ? 'DEPOSIT PAID' : 'PENDING PAYMENT'}
              </span>
            </div>
            <div class="info-item">
              <strong>Payment Method:</strong><br>${customer.paymentMethod.toUpperCase()}
            </div>
            <div class="info-item">
              <strong>Balance Due:</strong><br><span class="currency">KSH ${(safeNumber(customer.totalAmount) - safeNumber(customer.paidAmount)).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div class="section">
          <h3>Catering Requirements</h3>
          <ul class="requirement-list">
            ${requirement.requirements.catering.map(item => `<li>${item}</li>`).join('')}
          </ul>
        </div>

        <div class="section">
          <h3>Decor Requirements</h3>
          <ul class="requirement-list">
            ${requirement.requirements.decor.map(item => `<li>${item}</li>`).join('')}
          </ul>
        </div>

        <div class="section">
          <h3>Entertainment Requirements</h3>
          <ul class="requirement-list">
            ${requirement.requirements.entertainment.map(item => `<li>${item}</li>`).join('')}
          </ul>
        </div>

        <div class="section">
          <h3>Sanitation Requirements</h3>
          <ul class="requirement-list">
            ${requirement.requirements.sanitation.map(item => `<li>${item}</li>`).join('')}
          </ul>
        </div>

        <div class="section">
          <h3>Rental Items</h3>
          <table class="rental-table">
            <thead>
              <tr>
                <th>Item Description</th>
                <th>Quantity Required</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(customer.requirements || {})
                .filter(([_, qty]) => qty > 0)
                .map(([item, qty]) => {
                  return `<tr><td>${item}</td><td>${safeNumber(qty)}</td></tr>`;
                }).join('')}
            </tbody>
          </table>
          ${Object.entries(customer.requirements || {}).filter(([_, qty]) => safeNumber(qty) > 0).length === 0 ? 
            '<p style="color: #6b7280; font-style: italic;">No specific rental items specified</p>' : ''}
        </div>

        ${requirement.requirements.special.length > 0 ? `
        <div class="section">
          <h3>Special Requirements</h3>
          <ul class="requirement-list">
            ${requirement.requirements.special.map(item => `<li>${item}</li>`).join('')}
          </ul>
        </div>
        ` : ''}

        <div class="section">
          <h3>Additional Notes</h3>
          <p>${customer.notes || 'No additional notes'}</p>
        </div>

        <div class="footer">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; text-align: left;">
            <div>
              <p><strong>Generated on:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Document ID:</strong> ${requirement.id}</p>
            </div>
            <div>
              <p><strong>KSM.ART HOUSE Management System</strong></p>
              <p><strong>Contact:</strong> +254 XXX XXX XXX</p>
            </div>
          </div>
          <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #e5e7eb;">
            <p style="font-weight: bold; color: #374151;">Thank you for choosing KSM.ART HOUSE for your event needs!</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Open print window
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }

    return requirement;
  }, [customers, customerRequirements, setCustomerRequirements, setPrintQueue]);

  return {
    customers,
    setCustomers,
    customerRequirements,
    setCustomerRequirements,
    printQueue,
    generateRequirement,
    printCustomerRequirement
  };
};