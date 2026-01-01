export interface EventItem {
  id: string;
  user_id: string;
  name: string;
  category: string;
  quantity_available: number;
  price: number;
  unit: string;
  description?: string;
  status: 'available' | 'hired' | 'maintenance';
  created_at: string;
  updated_at: string;
}

export interface EntertainmentItem {
  id: string;
  user_id: string;
  name: string;
  category: string;
  quantity_available: number;
  price: number;
  condition?: string;
  notes?: string;
  description?: string;
  created_at: string;
  updated_at: string;
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

export interface DecorItem {
  id: string;
  user_id: string;
  name: string;
  category: string;
  quantity: number;
  rental_price: number;
  purchase_price?: number;
  condition?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
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
  status: 'in-store' | 'hired' | 'returned';
}