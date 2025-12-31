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

// Database-aligned types for consistent schema
export interface CateringItem {
  id: string;
  user_id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  price_per_plate: number;
  min_order: number;
  description?: string;
  available: boolean;
  created_at: string;
  updated_at: string;
  // Legacy compatibility
  item?: string;
  unitPrice?: number;
  totalPrice?: number;
  notes?: string;
  eventBudget?: number;
  amountPaid?: number;
  paymentMethod?: 'cash' | 'mpesa' | 'bank';
  eventLocation?: string;
  paymentStatus?: 'deposit' | 'full';
  serviceStatus?: 'served' | 'not-served';
}

export interface DecorItem {
  id: string;
  user_id: string;
  name: string;
  category: string; // Maps to 'type' in UI
  quantity: number;
  rental_price: number;
  purchase_price?: number;
  condition?: string; // Maps to 'status' in UI
  notes?: string;
  created_at: string;
  updated_at: string;
  // Legacy compatibility
  type?: 'tent' | 'seat' | 'decoration';
  status?: 'in-store' | 'hired';
  price?: number;
  hiredDate?: string;
  returnDate?: string;
  client?: string;
}

export interface SanitationItem {
  id: string;
  user_id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  price: number;
  supplier?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Status fields
  status: 'in-store' | 'hired' | 'returned';
  hiredDate?: string;
  client?: string;
  damageStatus?: 'damaged' | 'not-damaged';
  dateReturned?: string;
  returnDate?: string;
  // Legacy compatibility
  type?: 'mobile' | 'equipment';
}

export interface EntertainmentItem {
  id: string;
  user_id: string;
  name: string;
  category: string; // Maps to 'type' in UI
  quantity_available: number; // Maps to 'quantity' in UI
  price: number;
  condition?: string;
  notes?: string;
  description?: string; // Add this field
  created_at: string;
  updated_at: string;
  // Legacy compatibility
  type?: 'sound' | 'lighting' | 'other';
  status?: 'in-store' | 'hired';
  quantity?: number;
}

export interface DJMCBooking {
  id: string;
  user_id: string;
  name: string;
  type: 'dj' | 'mc';
  currentEvent: string;
  nextEvent: string;
  contact: string;
  rate: number;
  eventName?: string;
  created_at?: string;
  updated_at?: string;
}

export interface GymFinance {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  createdAt?: string;
}

export interface GymMember {
  id: string;
  name: string;
  phoneNumber: string;
  email: string;
  packageType: 'weekly' | 'monthly' | 'three-months';
  amountPaid: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'expired';
  createdAt?: string;
}

export interface SaunaBooking {
  id: string;
  date: string;
  time: string;
  client: string;
  duration: number;
  amount: number;
  status: 'booked' | 'completed';
}

export interface SpaBooking {
  id: string;
  date: string;
  time: string;
  client: string;
  service: string;
  duration: number;
  amount: number;
  status: 'booked' | 'completed';
}

export interface SaunaSpaFinance {
  id: string;
  date: string;
  type: 'sauna-profit' | 'spa-profit' | 'expense';
  description: string;
  amount: number;
  category: 'sauna' | 'spa' | 'general';
}

export interface RestaurantSale {
  id: string;
  date: string;
  item: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  expenses?: number;
}

export interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'manager' | 'staff';
  createdAt: string;
  lastLogin?: string;
  resetToken?: string;
  resetTokenExpiry?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
}