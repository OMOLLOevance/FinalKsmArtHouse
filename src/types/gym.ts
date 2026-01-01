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

export interface GymFinance {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  createdAt?: string;
}
