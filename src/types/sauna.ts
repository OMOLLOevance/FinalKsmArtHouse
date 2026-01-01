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
