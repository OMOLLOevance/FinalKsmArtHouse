import { apiClient } from '@/lib/api-client';
import { z } from 'zod';
import { GymMember, GymFinance } from '@/types';

// Validation schemas
export const GymMemberSchema = z.object({
  name: z.string().min(1),
  phoneNumber: z.string().optional(),
  email: z.string().email().optional(),
  packageType: z.enum(['weekly', 'monthly', 'three-months']),
  amountPaid: z.number().min(0),
  startDate: z.string(),
  endDate: z.string(),
  status: z.enum(['active', 'expired']).optional(),
});

export const GymFinanceSchema = z.object({
  date: z.string(),
  description: z.string().min(1),
  amount: z.number(),
  type: z.enum(['income', 'expense']),
});

export type CreateGymMemberRequest = z.infer<typeof GymMemberSchema>;
export type CreateGymFinanceRequest = z.infer<typeof GymFinanceSchema>;

class GymService {
  // Members
  async getMembers(): Promise<GymMember[]> {
    return apiClient.get<GymMember[]>('/gym/members');
  }
  
  async createMember(data: CreateGymMemberRequest): Promise<GymMember> {
    GymMemberSchema.parse(data);
    return apiClient.post<GymMember>('/gym/members', data);
  }
  
  async updateMember(id: string, data: Partial<CreateGymMemberRequest>): Promise<GymMember> {
    return apiClient.put<GymMember>(`/gym/members/${id}`, data);
  }
  
  async deleteMember(id: string): Promise<void> {
    return apiClient.delete(`/gym/members/${id}`);
  }
  
  // Finances
  async getFinances(): Promise<GymFinance[]> {
    return apiClient.get<GymFinance[]>('/gym/finances');
  }
  
  async createFinance(data: CreateGymFinanceRequest): Promise<GymFinance> {
    GymFinanceSchema.parse(data);
    return apiClient.post<GymFinance>('/gym/finances', data);
  }
  
  async updateFinance(id: string, data: Partial<CreateGymFinanceRequest>): Promise<GymFinance> {
    return apiClient.put<GymFinance>(`/gym/finances/${id}`, data);
  }
  
  async deleteFinance(id: string): Promise<void> {
    return apiClient.delete(`/gym/finances/${id}`);
  }
}

export const gymService = new GymService();