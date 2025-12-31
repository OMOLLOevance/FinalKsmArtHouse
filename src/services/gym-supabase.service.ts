import { supabaseService } from './supabase.service';
import { z } from 'zod';
import { GymMember, GymFinance } from '@/types';

// Enhanced validation schemas
export const GymMemberCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phoneNumber: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  packageType: z.enum(['weekly', 'monthly', 'three-months']),
  amountPaid: z.number().min(0, 'Amount must be positive'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  status: z.enum(['active', 'expired']).default('active'),
});

export const GymFinanceCreateSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  description: z.string().min(1, 'Description is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  type: z.enum(['income', 'expense']),
});

export type CreateGymMemberRequest = z.infer<typeof GymMemberCreateSchema>;
export type CreateGymFinanceRequest = z.infer<typeof GymFinanceCreateSchema>;

class GymSupabaseService {
  // Members
  async getMembers(userId: string, isAdmin: boolean = false): Promise<GymMember[]> {
    const filters = isAdmin ? {} : { user_id: userId };
    
    const data = await supabaseService.query<any>({
      table: 'gym_members',
      select: '*',
      filters,
      orderBy: { column: 'created_at', ascending: false }
    });

    return data.map(this.mapDbMemberToFrontend);
  }

  async createMember(userId: string, memberData: CreateGymMemberRequest): Promise<GymMember> {
    // Validate input
    GymMemberCreateSchema.parse(memberData);

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
      payment_status: 'paid',
      notes: null
    };

    const result = await supabaseService.insert<any>('gym_members', dbMember);
    return this.mapDbMemberToFrontend(result);
  }

  async updateMember(userId: string, id: string, updates: Partial<CreateGymMemberRequest>): Promise<GymMember> {
    const dbUpdates: any = {};
    
    if (updates.name !== undefined) dbUpdates.member_name = updates.name;
    if (updates.phoneNumber !== undefined) dbUpdates.phone = updates.phoneNumber;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.packageType !== undefined) dbUpdates.membership_type = updates.packageType;
    if (updates.amountPaid !== undefined) dbUpdates.payment_amount = updates.amountPaid;
    if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate;
    if (updates.endDate !== undefined) dbUpdates.expiry_date = updates.endDate;
    if (updates.status !== undefined) dbUpdates.status = updates.status;

    const result = await supabaseService.update<any>('gym_members', id, dbUpdates, userId);
    return this.mapDbMemberToFrontend(result);
  }

  async deleteMember(userId: string, id: string): Promise<void> {
    await supabaseService.delete('gym_members', id, userId);
  }

  // Finances
  async getFinances(userId: string, isAdmin: boolean = false): Promise<GymFinance[]> {
    const filters = isAdmin ? {} : { user_id: userId };
    
    const data = await supabaseService.query<any>({
      table: 'gym_finances',
      select: '*',
      filters,
      orderBy: { column: 'transaction_date', ascending: false }
    });

    return data.map(this.mapDbFinanceToFrontend);
  }

  async createFinance(userId: string, financeData: CreateGymFinanceRequest): Promise<GymFinance> {
    // Validate input
    GymFinanceCreateSchema.parse(financeData);

    const dbFinance = {
      user_id: userId,
      transaction_date: financeData.date,
      description: financeData.description,
      amount: financeData.amount,
      transaction_type: financeData.type,
      payment_method: 'cash'
    };

    const result = await supabaseService.insert<any>('gym_finances', dbFinance);
    return this.mapDbFinanceToFrontend(result);
  }

  async updateFinance(userId: string, id: string, updates: Partial<CreateGymFinanceRequest>): Promise<GymFinance> {
    const dbUpdates: any = {};
    
    if (updates.date !== undefined) dbUpdates.transaction_date = updates.date;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
    if (updates.type !== undefined) dbUpdates.transaction_type = updates.type;

    const result = await supabaseService.update<any>('gym_finances', id, dbUpdates, userId);
    return this.mapDbFinanceToFrontend(result);
  }

  async deleteFinance(userId: string, id: string): Promise<void> {
    await supabaseService.delete('gym_finances', id, userId);
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

export const gymSupabaseService = new GymSupabaseService();