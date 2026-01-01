export interface Customer {
  id: string;
  name: string;
  contact: string;
  location: string;
  eventType: string;
  eventDate: string;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: 'deposit' | 'full' | 'pending';
  paymentMethod: 'cash' | 'bank' | 'mpesa';
  serviceStatus: 'pending' | 'served';
  notes: string;
  requirements?: Record<string, number>;
}
