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
}

export interface CateringTypeInventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalValue: number;
  supplier?: string;
  lastUpdated: string;
}