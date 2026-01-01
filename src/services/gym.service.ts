import { apiClient } from '@/lib/api-client';
import { z } from 'zod';
import { GymMember, GymFinance } from '@/types';
import { logger } from '@/lib/logger';

// Enhanced validation schemas
export const GymMemberSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phoneNumber: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  packageType: z.enum(['weekly', 'monthly', 'three-months']),
  amountPaid: z.number().min(0, 'Amount must be positive'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  status: z.enum(['active', 'expired']).default('active'),
});

export const GymFinanceSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  description: z.string().min(1, 'Description is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  type: z.enum(['income', 'expense']),
});

export type CreateGymMemberRequest = z.infer<typeof GymMemberSchema>;
export type CreateGymFinanceRequest = z.infer<typeof GymFinanceSchema>;

class GymService {
  // Members
  async getMembers(userId: string): Promise<GymMember[]> {
    try {
      const response = await apiClient.get<{data: any[]}>(`/api/gym?userId=${userId}`);
      return (response?.data || []).map(this.mapDbMemberToFrontend);
    } catch (error) {
      logger.error('GymService.getMembers failed:', error);
      return [];
    }
  }

  async createMember(userId: string, memberData: CreateGymMemberRequest): Promise<GymMember | null> {
    try {
      GymMemberSchema.parse(memberData);
      
      const dbMember = {
        user_id: userId,
        member_name: memberData.name,
        email: memberData.email || null,
        phone: memberData.phoneNumber || null,
        membership_type: memberData.packageType,
        start_date: memberData.startDate,
        expiry_date: memberData.endDate,
        status: memberData.status || 'active',
        payment_amount: memberData.amountPaid,
        payment_status: 'paid'
      };

      const response = await apiClient.post<{data: any}>('/api/gym', dbMember);
      return response?.data ? this.mapDbMemberToFrontend(response.data) : null;
    } catch (error) {
      logger.error('GymService.createMember failed:', error);
      throw error;
    }
  }

  async updateMember(userId: string, id: string, updates: Partial<CreateGymMemberRequest>): Promise<GymMember | null> {
    try {
      const dbUpdates: any = { id };
      
      if (updates.name !== undefined) dbUpdates.member_name = updates.name;
      if (updates.phoneNumber !== undefined) dbUpdates.phone = updates.phoneNumber;
      if (updates.email !== undefined) dbUpdates.email = updates.email;
      if (updates.packageType !== undefined) dbUpdates.membership_type = updates.packageType;
      if (updates.amountPaid !== undefined) dbUpdates.payment_amount = updates.amountPaid;
      if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate;
      if (updates.endDate !== undefined) dbUpdates.expiry_date = updates.endDate;
      if (updates.status !== undefined) dbUpdates.status = updates.status;

      const response = await apiClient.put<{data: any}>('/api/gym', dbUpdates);
      return response?.data ? this.mapDbMemberToFrontend(response.data) : null;
    } catch (error) {
      logger.error('GymService.updateMember failed:', error);
      throw error;
    }
  }

  async deleteMember(userId: string, id: string): Promise<void> {
    await apiClient.delete(`/api/gym?id=${id}`);
  }

  // Finances
  async getFinances(userId: string): Promise<GymFinance[]> {
    try {
      const response = await apiClient.get<{data: any[]}>(`/api/gym/finances?userId=${userId}`);
      return (response?.data || []).map(this.mapDbFinanceToFrontend);
    } catch (error) {
      logger.error('GymService.getFinances failed:', error);
      return [];
    }
  }

  async createFinance(userId: string, financeData: CreateGymFinanceRequest): Promise<GymFinance | null> {
    try {
      GymFinanceSchema.parse(financeData);

      const dbFinance = {
        user_id: userId,
        transaction_date: financeData.date,
        description: financeData.description,
        amount: financeData.amount,
        transaction_type: financeData.type,
        payment_method: 'cash'
      };

      const response = await apiClient.post<{data: any}>('/api/gym/finances', dbFinance);
      return response?.data ? this.mapDbFinanceToFrontend(response.data) : null;
    } catch (error) {
      logger.error('GymService.createFinance failed:', error);
      throw error;
    }
  }

  async updateFinance(userId: string, id: string, updates: Partial<CreateGymFinanceRequest>): Promise<GymFinance | null> {
    try {
      const dbUpdates: any = { id };
      
      if (updates.date !== undefined) dbUpdates.transaction_date = updates.date;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
      if (updates.type !== undefined) dbUpdates.transaction_type = updates.type;

      const response = await apiClient.put<{data: any}>('/api/gym/finances', dbUpdates);
      return response?.data ? this.mapDbFinanceToFrontend(response.data) : null;
    } catch (error) {
      logger.error('GymService.updateFinance failed:', error);
      throw error;
    }
  }

  async deleteFinance(userId: string, id: string): Promise<void> {
    await apiClient.delete(`/api/gym/finances?id=${id}`);
  }

  // Mapping functions
  private mapDbMemberToFrontend(dbMember: any): GymMember {
    return {
      id: dbMember.id,
      name: dbMember.member_name,
      phoneNumber: dbMember.phone,
      email: dbMember.email,
      packageType: dbMember.membership_type as 'weekly' | 'monthly' | 'three-months',
      amountPaid: Number(dbMember.payment_amount),
      startDate: dbMember.start_date,
      endDate: dbMember.expiry_date,
      status: dbMember.status as 'active' | 'expired',
      createdAt: dbMember.created_at
    };
  }

  private mapDbFinanceToFrontend(dbFinance: any): GymFinance {
    return {
      id: dbFinance.id,
      date: dbFinance.transaction_date,
      description: dbFinance.description,
      amount: Number(dbFinance.amount),
      type: (dbFinance.transaction_type === 'membership' || dbFinance.transaction_type === 'income') 
        ? 'income' as const 
        : 'expense' as const,
      createdAt: dbFinance.created_at
    };
  }
}

export const gymService = new GymService();
