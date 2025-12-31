import { useState, useCallback } from 'react';
import { Customer } from '../types';

export interface DecorItem {
  id: string;
  name: string;
  category: string;
  inStore: number;
  hired: number;
  damaged: number;
  price?: number;
}

export interface CustomerRequirement {
  customerId: string;
  customerName: string;
  items: { [itemName: string]: number };
  totalEstimate: number;
  createdAt: string;
  updatedAt: string;
}

// Safe utility functions
const safeNumber = (value: any): number => {
  if (value === null || value === undefined || value === '') return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

const safeString = (value: any): string => {
  if (value === null || value === undefined) return '';
  return String(value);
};

export const useDecorCustomerIntegration = () => {
  const [customers] = useState<Customer[]>([]);
  const [customerRequirements, setCustomerRequirements] = useState<CustomerRequirement[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerSelector, setShowCustomerSelector] = useState(false);
  const [pendingItem, setPendingItem] = useState<{ name: string; category: string } | null>(null);

  // Add item to customer requirements
  const addItemToCustomer = useCallback((customerId: string, itemName: string, category: string, quantity: number = 1) => {
    try {
      const customer = (customers || []).find(c => c && c.id === customerId);
      if (!customer) return false;

      setCustomerRequirements(prev => {
        const safePrev = prev || [];
        const existingReq = safePrev.find(req => req && req.customerId === customerId);
        
        if (existingReq) {
          // Update existing requirement
          const updatedReq = {
            ...existingReq,
            items: {
              ...(existingReq.items || {}),
              [itemName]: safeNumber((existingReq.items || {})[itemName]) + quantity
            },
            updatedAt: new Date().toISOString()
          };
          return safePrev.map(req => req && req.customerId === customerId ? updatedReq : req);
        } else {
          // Create new requirement
          const newReq: CustomerRequirement = {
            customerId,
            customerName: safeString(customer.name),
            items: { [itemName]: quantity },
            totalEstimate: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          return [...safePrev, newReq];
        }
      });

      return true;
    } catch (error) {
      console.error('Error adding item to customer:', error);
      return false;
    }
  }, [customers, setCustomerRequirements]);

  // Remove item from customer requirements
  const removeItemFromCustomer = useCallback((customerId: string, itemName: string) => {
    try {
      setCustomerRequirements(prev => {
        const safePrev = prev || [];
        return safePrev.map(req => {
          if (req && req.customerId === customerId) {
            const items = req.items || {};
            const { [itemName]: removed, ...remainingItems } = items;
            return {
              ...req,
              items: remainingItems,
              updatedAt: new Date().toISOString()
            };
          }
          return req;
        });
      });
    } catch (error) {
      console.error('Error removing item from customer:', error);
    }
  }, [setCustomerRequirements]);

  // Get customer requirements
  const getCustomerRequirements = useCallback((customerId: string): CustomerRequirement | null => {
    try {
      return (customerRequirements || []).find(req => req && req.customerId === customerId) || null;
    } catch (error) {
      console.error('Error getting customer requirements:', error);
      return null;
    }
  }, [customerRequirements]);

  // Handle item click from decor inventory
  const handleItemClick = useCallback((itemName: string, category: string) => {
    try {
      setPendingItem({ name: itemName, category });
      setShowCustomerSelector(true);
    } catch (error) {
      console.error('Error handling item click:', error);
    }
  }, []);

  // Select customer for item
  const selectCustomerForItem = useCallback((customerId: string) => {
    try {
      if (pendingItem) {
        const success = addItemToCustomer(customerId, pendingItem.name, pendingItem.category, 1);
        if (success) {
          setShowCustomerSelector(false);
          setPendingItem(null);
          // Show success message
          const customer = (customers || []).find(c => c && c.id === customerId);
          if (customer) {
            alert(`✅ "${pendingItem.name}" added to ${safeString(customer.name)}'s requirements`);
          }
        } else {
          alert('❌ Failed to add item to customer requirements');
        }
      }
    } catch (error) {
      console.error('Error selecting customer for item:', error);
      alert('❌ Error adding item to customer');
    }
  }, [pendingItem, addItemToCustomer, customers]);

  // Print customer requirements
  const printCustomerRequirements = useCallback((customerId: string) => {
    try {
      const customer = (customers || []).find(c => c && c.id === customerId);
      const requirements = getCustomerRequirements(customerId);
      
      if (!customer) {
        alert('Customer not found');
        return;
      }

      const decorItems = requirements?.items || {};
      const standardItems = customer.requirements || {};

      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Requirements - ${safeString(customer.name)}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
            .header h1 { color: #f59e0b; margin: 0; }
            .section { margin: 20px 0; }
            .section h3 { background: #f3f4f6; padding: 8px; border-left: 4px solid #f59e0b; }
            .items-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            .items-table th, .items-table td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            .items-table th { background: #f3f4f6; }
            .total { font-weight: bold; color: #059669; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>KSM.ART HOUSE</h1>
            <h2>Customer Requirements</h2>
          </div>
          
          <div class="section">
            <h3>Customer Information</h3>
            <p><strong>Name:</strong> ${safeString(customer.name)}</p>
            <p><strong>Contact:</strong> ${safeString(customer.contact)}</p>
            <p><strong>Event:</strong> ${safeString(customer.eventType)}</p>
            <p><strong>Date:</strong> ${safeString(customer.eventDate)}</p>
            <p><strong>Location:</strong> ${safeString(customer.location)}</p>
            <p><strong>Budget:</strong> KSH ${safeNumber(customer.totalAmount).toLocaleString()}</p>
          </div>

          <div class="section">
            <h3>Standard Requirements</h3>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Quantity</th>
                </tr>
              </thead>
              <tbody>
                ${Object.entries(standardItems || {})
                  .filter(([_, qty]) => safeNumber(qty) > 0)
                  .map(([item, qty]) => `<tr><td>${safeString(item)}</td><td>${safeNumber(qty)}</td></tr>`)
                  .join('')}
              </tbody>
            </table>
          </div>

          <div class="section">
            <h3>Decor Items Added</h3>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Quantity</th>
                </tr>
              </thead>
              <tbody>
                ${Object.entries(decorItems || {})
                  .filter(([_, qty]) => safeNumber(qty) > 0)
                  .map(([item, qty]) => `<tr><td>${safeString(item)}</td><td>${safeNumber(qty)}</td></tr>`)
                  .join('')}
              </tbody>
            </table>
          </div>

          <div class="section">
            <p><strong>Generated on:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Total Standard Items:</strong> ${Object.keys(standardItems || {}).length}</p>
            <p><strong>Total Decor Items:</strong> ${Object.keys(decorItems || {}).length}</p>
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
    } catch (error) {
      console.error('Error printing customer requirements:', error);
      alert('Error printing requirements. Please try again.');
    }
  }, [customers, getCustomerRequirements]);

  return {
    customers: customers || [],
    customerRequirements: customerRequirements || [],
    selectedCustomer,
    setSelectedCustomer,
    showCustomerSelector,
    setShowCustomerSelector,
    pendingItem,
    addItemToCustomer,
    removeItemFromCustomer,
    getCustomerRequirements,
    handleItemClick,
    selectCustomerForItem,
    printCustomerRequirements
  };
};